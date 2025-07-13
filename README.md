# Chrome Website Blocker Extension

A powerful Chrome extension that allows users to block access to specific websites. Built with Manifest V3, this extension provides a user-friendly interface to manage blocked sites and ensures websites remain blocked even after page refreshes and direct navigation.

## 🚀 Features

- **Easy Website Blocking**: Add websites to your block list with a simple interface
- **Persistent Blocking**: Websites remain blocked even after page refresh or direct navigation
- **Real-time Updates**: Changes to blocked sites take effect immediately
- **User-friendly Interface**: Clean, intuitive popup interface
- **Cross-platform**: Works on all platforms where Chrome is available
- **Privacy-focused**: All data is stored locally in your browser

## 📋 Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Architecture](#architecture)
- [Code Structure](#code-structure)
- [Technical Flow](#technical-flow)
- [API Reference](#api-reference)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## 🔧 Installation

### Method 1: Load Unpacked (Development)
1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable **Developer mode** (toggle in top right)
4. Click **Load unpacked**
5. Select the `website-blocker-extension` folder
6. The extension icon should appear in your Chrome toolbar

### Method 2: Chrome Web Store (Future)
*This extension will be available on the Chrome Web Store soon*

## 📖 Usage

### Adding a Website to Block
1. Click the extension icon in your Chrome toolbar
2. Enter the domain name (e.g., `facebook.com`, `youtube.com`)
3. Click **Add** or press Enter
4. The website will be immediately blocked

### Removing a Website from Block List
1. Click the extension icon
2. Find the website in the blocked list
3. Click **Remove** next to the website
4. The website will be immediately unblocked

### What Happens When a Site is Blocked
- Direct navigation to the blocked site will redirect to a block page
- Page refreshes on blocked sites will redirect to the block page
- The site will be completely inaccessible until removed from the block list

## 🏗️ Architecture

### Manifest V3 Compliance
This extension is built using Chrome's Manifest V3, which provides:
- Better security through service workers
- Improved performance
- Enhanced privacy protection
- Modern Chrome extension standards

### Core Components

```
website-blocker-extension/
├── manifest.json          # Extension configuration
├── background.js          # Service worker (background script)
├── popup.html            # Extension popup interface
├── popup.js              # Popup logic and UI interactions
├── blocked.html          # Blocked page template
├── styles.css            # Styling for popup and blocked page
├── icon*.png             # Extension icons (16, 32, 48, 128px)
└── README.md             # This file
```

## 📁 Code Structure

### 1. manifest.json
The extension's configuration file that defines:
- **Permissions**: Required Chrome APIs
  - `storage`: For saving blocked sites locally
  - `declarativeNetRequest`: For blocking network requests
  - `declarativeNetRequestWithHostAccess`: For host-specific blocking
  - `webNavigation`: For intercepting navigation events
- **Host Permissions**: `<all_urls>` to access all websites
- **Background Script**: Service worker for persistent functionality
- **Action**: Popup interface configuration

### 2. background.js (Service Worker)
The core blocking logic that runs in the background:

#### Key Functions:
- **`syncDNRRules()`**: Synchronizes declarativeNetRequest rules with stored blocked sites
- **Event Listeners**:
  - `chrome.runtime.onStartup`: Initialize rules when browser starts
  - `chrome.runtime.onInstalled`: Initialize rules when extension is installed
  - `chrome.storage.onChanged`: Update rules when storage changes
  - `chrome.tabs.onUpdated`: Handle page refreshes and navigation
  - `chrome.webNavigation.onBeforeNavigate`: Intercept navigation attempts

#### DeclarativeNetRequest Rules:
```javascript
{
  id: idx + 1,
  priority: 1,
  action: { type: 'block' },
  condition: {
    urlFilter: `||${domain}^`,
    resourceTypes: ["main_frame"]
  }
}
```

### 3. popup.js (Popup Interface)
Handles the user interface and interactions:

#### Key Functions:
- **`normalizeDomain()`**: Cleans and validates domain input
- **`renderList()`**: Displays the current blocked sites list
- **`addSite()`**: Adds a new site to the block list
- **`removeSite()`**: Removes a site from the block list
- **`syncDNRRules()`**: Updates declarativeNetRequest rules

#### Domain Normalization:
- Removes protocols (http://, https://)
- Removes www. prefix
- Converts to lowercase
- Removes paths, queries, and fragments

### 4. popup.html & styles.css
- Clean, responsive user interface
- Modern styling with hover effects
- Mobile-friendly design

### 5. blocked.html
- Custom block page shown when accessing blocked sites
- Informs users that the site is blocked
- Provides instructions on how to unblock

## �� Technical Flow

### 1. Extension Initialization
```
Extension Loads → background.js starts → syncDNRRules() → Load blocked sites from storage → Create DNR rules
```

### 2. Adding a Website
```
User enters domain → normalizeDomain() → Validate input → Save to chrome.storage → syncDNRRules() → Update DNR rules → Website blocked
```

### 3. Blocking a Website Access
```
User navigates to blocked site → chrome.webNavigation.onBeforeNavigate → Check if domain in blocked list → Redirect to blocked.html
```

### 4. Page Refresh Handling
```
User refreshes blocked page → chrome.tabs.onUpdated → Check if domain in blocked list → Redirect to blocked.html
```

### 5. Removing a Website
```
User clicks Remove → Remove from chrome.storage → syncDNRRules() → Update DNR rules → Website unblocked
```

## 🔌 API Reference

### Chrome APIs Used

#### chrome.storage.local
- **Purpose**: Persistent local storage for blocked sites
- **Methods Used**:
  - `get()`: Retrieve blocked sites list
  - `set()`: Save blocked sites list
  - `onChanged`: Listen for storage changes

#### chrome.declarativeNetRequest
- **Purpose**: Block network requests at the browser level
- **Methods Used**:
  - `updateDynamicRules()`: Add/remove blocking rules
  - `getDynamicRules()`: Retrieve current rules

#### chrome.webNavigation
- **Purpose**: Intercept and control navigation events
- **Events Used**:
  - `onBeforeNavigate`: Intercept navigation attempts

#### chrome.tabs
- **Purpose**: Control browser tabs
- **Methods Used**:
  - `update()`: Redirect tabs to blocked page
- **Events Used**:
  - `onUpdated`: Detect page load completion

## 🛠️ Troubleshooting

### Common Issues

#### Extension Not Blocking Sites
1. Check if the extension is enabled in `chrome://extensions/`
2. Verify the domain format (should be like `facebook.com`, not `https://facebook.com`)
3. Check browser console for errors
4. Try refreshing the extension

#### Sites Still Accessible After Adding
1. Ensure the domain is correctly formatted
2. Check if the site is in the blocked list
3. Try navigating directly to the site (not from bookmarks)
4. Clear browser cache and try again

#### Extension Not Loading
1. Verify all files are present in the extension directory
2. Check manifest.json for syntax errors
3. Ensure Chrome is updated to a recent version
4. Try reloading the extension

### Debug Mode
The extension includes debug information in the popup. Click the extension icon to see:
- Current declarativeNetRequest rules
- Storage status
- Error messages

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

### Code Style
- Use consistent indentation (2 spaces)
- Follow JavaScript ES6+ standards
- Add comments for complex logic
- Test on multiple Chrome versions

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with Chrome Extension Manifest V3
- Uses Chrome's declarativeNetRequest API for efficient blocking
- Inspired by the need for simple, effective website blocking

---

**Note**: This extension is for personal use and productivity enhancement. Please respect website terms of service and use responsibly.
