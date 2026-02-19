
<div align="center">

# 🚫 No YouTube Shorts
**Take back your feed. A distraction-free YouTube experience.**

![Version](https://img.shields.io/badge/version-1.2.0-blue?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)
![Privacy](https://img.shields.io/badge/privacy-100%25-success?style=flat-square)

</div>

---

## 🚀 Overview

**No YouTube Shorts** is a lightweight, privacy-focused Chrome Extension that automatically removes Shorts from your browsing experience. It hides Shorts shelves, tabs, and navigation buttons, and **redirects any Shorts link** to the standard video player.

Now with **Channel Whitelisting** so you can support your favorite creators while blocking the noise.

---

## ✨ Key Features

### �️ Smart Blocking
- **Automatic Redirection**: Any `/shorts/` link instantly opens in the normal player.
- **Feed Cleanup**: Hides "Shorts" shelves, carousel items, and search result cards.
- **UI de-clutter**: Removes the "Shorts" tab from channel pages and the sidebar button.

### ⚙️ Power User Tools (v1.2.0)
- **✅ Channel Whitelist**: Allow specific channels (e.g., `@MKBHD`, `@LinusTechTips`) to show Shorts in your feed.
- **⚡ Instant Redirect Mode**: Optional "Beta" mode using Chrome's native network engine for **zero-lag redirects** (bypasses whitelist for redirects).
- **🖱️ Context Menu**: Right-click any Short to **"Open as Regular Video"**.
- **📊 Stats Dashboard**: See how many distractions you've avoided.

---

## 📦 Installation

1.  **Clone or Download** this repository.
    ```bash
    git clone https://github.com/Weedant/no-shorts.git
    ```
2.  Open Chrome and navigate to `chrome://extensions`.
3.  Enable **Developer mode** (toggle in the top right).
4.  Click **Load unpacked**.
5.  Select the `no-shorts` folder you just downloaded.

---

## 🔧 Configuration

Click the extension icon 🚫 to:
- **Toggle** the extension On/Off without uninstalling.
- View **Stats** (redirects & days active).
- Open **Settings ⚙️** to manage your Whitelist & Instant Mode.

---

## 🔒 Privacy

**No data is collected.**
- No analytics.
- No tracking.
- All settings (whitelist, stats) are stored locally on your device (`chrome.storage.local`).

---

## 📜 License

MIT License © [Weedant](https://github.com/Weedant)