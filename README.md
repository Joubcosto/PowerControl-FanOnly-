<div align="center">

# 🌀 FanControlFork

**A lightweight Decky Loader plugin dedicated exclusively to fan control and custom fan curves for handheld gaming PCs.**

[![Decky Loader](https://img.shields.io/badge/Decky-Loader-informational.svg?logo=steam)](https://github.com/SteamDeckHomebrew/decky-loader)
[![License: BSD-3-Clause](https://img.shields.io/badge/License-BSD--3--Clause-blue.svg)](https://opensource.org/licenses/BSD-3-Clause)
[![Platform: Handhelds](https://img.shields.io/badge/Platform-SteamOS%20%7C%20Linux%20%7C%20Bazzite-blueviolet.svg)](#supported-devices)
[![GitHub Release](https://img.shields.io/github/v/release/Joubcosto/PowerControl-FanOnly-?color=brightgreen)](https://github.com/Joubcosto/PowerControl-FanOnly-/releases)

<br/>

<img src="./assets/screenshot.jpg" alt="FanControlFork Screenshot" width="320"/>

</div>

---

## 📖 Overview

**FanControlFork** is a specialized fork of the popular [PowerControl](https://github.com/mengmeet/PowerControl) plugin for [Decky Loader](https://github.com/SteamDeckHomebrew/decky-loader).

While the original plugin combined CPU, GPU, TDP, and fan controls into a large suite, modern handheld operating systems (SteamOS, Bazzite, ChimeraOS) already manage TDP natively or have dedicated plugins like SimpleDeckyTDP.

This fork strips away all unnecessary CPU/GPU/TDP controls and invasive Quick Access Menu (QAM) hooks, leaving a **fast, streamlined, rock-solid plugin focused 100% on fan speed management and custom fan curves**.

---

## ✨ Why Choose This Fork?

| Feature | Original PowerControl | FanControlFork |
| :--- | :---: | :---: |
| **Fan Curve Control** | ✅ | ✅ |
| **Manual & Auto Fan Modes** | ✅ | ✅ |
| **Per-Game & AC/Battery Profiles** | ✅ | ✅ |
| **QAM SteamOS Patches** | ⚠️ Invasive (breaks on SteamOS updates) | 🛡️ **Removed** (100% stable & future-proof) |
| **Conflicts with Native TDP / SimpleDeckyTDP** | ⚠️ Frequent conflicts | 🛡️ **Zero conflicts** |
| **Footprint & Background Bloat** | ⚠️ Heavy (~3000+ extra lines, native binaries) | ⚡ **Ultra-lightweight** |

### Key Benefits:
- 🚀 **Faster Startup & Response**: Minimal footprint and instant loading inside Decky.
- 🛡️ **Update Immunity**: No monkey-patching of SteamOS's Quick Access Menu, meaning SteamOS client updates will not break your interface.
- 🎯 **No Redundancy**: Use your favorite TDP manager (or SteamOS native sliders) without duplicate or conflicting controls.

---

## 🚀 Features

- 📈 **Custom Visual Fan Curves**: Set multi-point curves matching temperature thresholds to exact fan speeds (PWM %).
- 🎚️ **Manual Fixed Speed**: Set a direct, constant fan percentage whenever required.
- ⚙️ **Automatic Hardware Mode**: Instantly revert fan management to OEM BIOS / EC default behavior.
- 🎮 **Per-Game Profiles**: Automatically switch to your custom fan curve when launching a specific title.
- 🔌 **AC / Battery Profiles**: Define separate cooling behaviors depending on whether your device is plugged in or on battery.
- 📊 **Live Hardware Telemetry**: Real-time display of fan RPM, percentage, and current thermal readings (CPU/GPU).

---

## 🎮 Supported Devices

Works via Embedded Controller (EC) direct access and Linux kernel `hwmon` drivers across a wide variety of handhelds:

- **Steam Deck** (LCD & OLED)
- **ASUS**: ROG Ally, ROG Ally X
- **GPD**: Win 3, Win 4, Win 5, Win Max 2, Win Mini
- **AYANEO**: AYANEO 2, Air, Air Plus, Geek, etc.
- **OneXPlayer**: OneXPlayer Mini, OneXPlayer 2, Fly, etc.
- **AOKZOE**: A1, etc.
- **MSI**: MSI Claw (via EC / WMI drivers)

---

## 📥 Installation

### Method 1: Automatic Script (Recommended)

Open a terminal or run in Desktop mode:

```bash
curl -L https://raw.githubusercontent.com/Joubcosto/PowerControl-FanOnly-/main/install.sh | sh
```

To install a specific version tag:

```bash
curl -L https://raw.githubusercontent.com/Joubcosto/PowerControl-FanOnly-/main/install.sh | VERSION_TAG=1.0.0 sh
```

### Method 2: Manual Installation via Release

1. Make sure [Decky Loader](https://github.com/SteamDeckHomebrew/decky-loader) is installed.
2. Download `FanControlFork.tar.gz` (or `FanControlFork.zip`) from the [Latest Release](https://github.com/Joubcosto/PowerControl-FanOnly-/releases/latest).
3. Ensure plugin directory write permissions:
   ```bash
   sudo chmod -R +w ${HOME}/homebrew/plugins
   ```
4. Extract the folder into `${HOME}/homebrew/plugins/FanControlFork`.
5. Restart the Decky service:
   ```bash
   sudo systemctl restart plugin_loader.service
   ```

---

## 🛠️ Building from Source

To build and package the plugin locally:

```bash
# Clone the repository
git clone https://github.com/Joubcosto/PowerControl-FanOnly-.git
cd PowerControl-FanOnly-

# Install frontend dependencies
pnpm install

# Build distribution bundle
pnpm run build

# Package into Decky plugin zip
pnpm run zip
```

---

## 🔍 Troubleshooting & Logs

If your fan does not respond or temperatures fail to read:

1. **Check plugin logs:**
   ```bash
   cat $HOME/homebrew/logs/FanControlFork/*
   ```
2. **Permissions:**
   Certain distributions (e.g. CachyOS, Bazzite) or kernel updates may require verifying EC / hwmon access rights.
3. **Restart Decky Loader:**
   ```bash
   sudo systemctl restart plugin_loader.service
   ```

---

## 📜 Attribution & Credits

- Upstream [PowerControl](https://github.com/mengmeet/PowerControl) created by **mengmeet** and contributors (**aarron-lee**, **yxx**).
- Maintained and focused on fan control by **[Joubcosto](https://github.com/Joubcosto)**.
- Thanks to the [Decky Loader](https://github.com/SteamDeckHomebrew/decky-loader) team for the plugin framework.

---

## 📄 License

This project is licensed under the [BSD-3-Clause License](LICENSE).
