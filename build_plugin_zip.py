#!/usr/bin/env python3
import os
import zipfile

plugin_name = "PowerControl"
zip_filename = f"{plugin_name}.zip"

items_to_copy = [
    "dist",
    "py_modules",
    "main.py",
    "plugin.json",
    "package.json",
    "LICENSE",
    "README.md",
]

if os.path.exists(zip_filename):
    os.remove(zip_filename)

with zipfile.ZipFile(zip_filename, "w", zipfile.ZIP_DEFLATED) as zf:
    for item in items_to_copy:
        if os.path.isdir(item):
            for root, dirs, files in os.walk(item):
                dirs[:] = [d for d in dirs if d != "__pycache__"]
                for file in files:
                    if file.endswith(".pyc") or file.endswith(".map"):
                        continue
                    full_path = os.path.join(root, file)
                    rel_path = os.path.relpath(full_path, ".")
                    arcname = os.path.join(plugin_name, rel_path)
                    zf.write(full_path, arcname)
        elif os.path.isfile(item):
            arcname = os.path.join(plugin_name, item)
            zf.write(item, arcname)

size_kb = os.path.getsize(zip_filename) / 1024
print(f"Archive créée avec succès : {zip_filename} ({size_kb:.1f} KB)")
