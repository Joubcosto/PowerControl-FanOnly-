import json
import os
import shutil
import ssl
import stat
import subprocess
import tempfile
import urllib.request

import decky
from config import API_URL, logger

PACKAGE_NAME = "FanControlFork"


def recursive_chmod(path, perms):
    for dirpath, dirnames, filenames in os.walk(path):
        current_perms = os.stat(dirpath).st_mode
        os.chmod(dirpath, current_perms | perms)
        for filename in filenames:
            os.chmod(os.path.join(dirpath, filename), current_perms | perms)


def _fetch_release_json():
    gcontext = ssl.SSLContext()
    request = urllib.request.Request(
        API_URL, headers={"User-Agent": PACKAGE_NAME}
    )
    with urllib.request.urlopen(request, context=gcontext, timeout=15) as response:
        return json.load(response)


def _select_asset_url(json_data):
    """Prefer the .tar.gz asset, fall back to .zip."""
    assets = json_data.get("assets") or []
    for ext in (".tar.gz", ".zip"):
        for asset in assets:
            url = asset.get("browser_download_url", "")
            if url.endswith(ext):
                return url
    raise Exception("No .tar.gz or .zip asset found in latest release")


def update_latest():
    plugin_dir = decky.DECKY_PLUGIN_DIR
    work_dir = tempfile.mkdtemp(prefix=f"{PACKAGE_NAME}_ota_")

    try:
        # 1. Download (old plugin is untouched if this fails)
        downloaded_filepath = download_latest_build(work_dir)

        # 2. Extract into a temp directory
        extract_dir = os.path.join(work_dir, "extract")
        logger.info(f"extracting ota file to {extract_dir}")
        shutil.unpack_archive(
            downloaded_filepath,
            extract_dir,
            format="gztar" if downloaded_filepath.endswith(".tar.gz") else "zip",
        )

        new_plugin_src = os.path.join(extract_dir, PACKAGE_NAME)
        if not os.path.isfile(os.path.join(new_plugin_src, "main.py")):
            raise Exception(f"invalid archive: {PACKAGE_NAME}/main.py not found")

        # 3. Replace the installed plugin (keeps the installed folder name)
        logger.info(f"replacing plugin in {plugin_dir}")
        recursive_chmod(plugin_dir, stat.S_IWUSR)
        shutil.rmtree(plugin_dir)
        shutil.copytree(new_plugin_src, plugin_dir)
    except Exception as e:
        logger.error(f"ota error: {e}", exc_info=True)
        shutil.rmtree(work_dir, ignore_errors=True)
        return False

    shutil.rmtree(work_dir, ignore_errors=True)

    # 4. Restart Decky to load the new version
    logger.info("restarting plugin_loader")
    result = subprocess.run(
        "systemctl restart plugin_loader.service",
        shell=True,
        check=True,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        env=get_env(),
    )
    logger.info(result.stdout)
    return True


def download_latest_build(target_dir: str):
    gcontext = ssl.SSLContext()
    json_data = _fetch_release_json()
    download_url = _select_asset_url(json_data)

    logger.info(f"downloading {download_url}")

    if download_url.endswith(".zip"):
        file_path = os.path.join(target_dir, f"{PACKAGE_NAME}.zip")
    else:
        file_path = os.path.join(target_dir, f"{PACKAGE_NAME}.tar.gz")

    request = urllib.request.Request(
        download_url, headers={"User-Agent": PACKAGE_NAME}
    )
    with (
        urllib.request.urlopen(request, context=gcontext, timeout=60) as response,
        open(file_path, "wb") as output_file,
    ):
        output_file.write(response.read())

    return file_path


def get_version():
    return f"{decky.DECKY_PLUGIN_VERSION}"


def get_latest_version():
    json_data = _fetch_release_json()

    tag = json_data.get("tag_name")
    # if tag is a v* tag, remove the v
    if tag.startswith("v"):
        tag = tag[1:]
    return tag


def get_env():
    env = os.environ.copy()
    env["LD_LIBRARY_PATH"] = ""
    return env
