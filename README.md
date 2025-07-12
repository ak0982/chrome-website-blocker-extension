# Chrome Website Blocker Extension

A powerful Chrome extension that allows users to block access to specific websites with advanced features like temporary unlocking, whitelist management, categories, focus timer, and comprehensive blocking controls. Built with Manifest V3, this extension provides a modern, user-friendly interface to manage website access and productivity.

## 🚀 Features

### Core Blocking Features
- **Easy Website Blocking**: Add websites to your block list with a simple interface
- **Persistent Blocking**: Websites remain blocked even after page refresh or direct navigation
- **Real-time Updates**: Changes to blocked sites take effect immediately
- **Smart Domain Handling**: Automatically normalizes and validates domain inputs

### Advanced Features
- **Temporary Unlock**: Temporarily unlock blocked sites for specified durations
- **Whitelist Management**: Create exceptions for specific sites that should never be blocked
- **Category Organization**: Organize blocked sites into custom categories
- **Dashboard Analytics**: Track blocking statistics and usage patterns
- **Focus Timer**: Built-in Pomodoro timer for productivity sessions
- **Smart Notifications**: Get notified about schedule changes and unlock expirations
- **Import/Export**: Backup and restore your blocking configurations
- **Password Protection**: Secure your extension settings with a password
- **Context Menu Integration**: Right-click to quickly block/unblock sites
- **Keyboard Shortcuts**: Quick access to extension features

### User Experience
- **Modern UI**: Clean, responsive interface with tabbed navigation
- **Cross-platform**: Works on all platforms where Chrome is available
- **Privacy-focused**: All data is stored locally in your browser
- **No CSP Issues**: Properly implemented without Content Security Policy violations

## 📋 Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Features in Detail](#features-in-detail)
- [Architecture](#architecture)
- [Code Structure](#code-structure)
- [Technical Flow](#technical-flow)
- [API Reference](#api-reference)
- [Troubleshooting](#troubleshooting)
- [Development History](#development-history)
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

### Basic Blocking
1. Click the extension icon in your Chrome toolbar
2. Go to the **Block Sites** tab
3. Enter the domain name (e.g., `facebook.com`, `youtube.com`)
4. Click **Add** or press Enter
5. The website will be immediately blocked

### Temporary Unlock
1. Go to the **Temporary Unlock** tab
2. Select sites from your blocked list
3. Choose unlock duration (15 min, 30 min, 1 hour, 2 hours, 4 hours, 8 hours, or custom)
4. Click **Unlock Selected Sites**
5. Sites will be temporarily accessible for the specified duration

### Whitelist Management
1. Go to the **Whitelist** tab
2. Add domains that should never be blocked
3. These sites will remain accessible even when in blocked categories

### Categories
1. Go to the **Categories** tab
2. Create custom categories (e.g., "Social Media", "Entertainment")
3. Assign blocked sites to categories for better organization

### Focus Timer
1. Go to the **Focus Timer** tab
2. Set work duration and break duration
3. Start the timer for productivity sessions
4. Get notifications when sessions end

### Dashboard
1. Go to the **Dashboard** tab
2. View blocking statistics and usage patterns
3. Monitor temporary unlocks and their status

## 🎯 Features in Detail

### Temporary Unlock System
- **Duration Options**: 15 min, 30 min, 1 hour, 2 hours, 4 hours, 8 hours, or custom time
- **Active Unlocks**: View currently active temporary unlocks
- **Unlock History**: Track past temporary unlocks
- **Auto-expiration**: Unlocks automatically expire and sites are re-blocked
- **Multiple Sites**: Unlock multiple sites simultaneously

### Whitelist System
- **Permanent Exceptions**: Sites in whitelist are never blocked
- **Easy Management**: Add/remove sites from whitelist
- **Priority Over Blocking**: Whitelist takes precedence over all blocking rules

### Category Management
- **Custom Categories**: Create unlimited custom categories
- **Site Organization**: Assign sites to multiple categories
- **Bulk Operations**: Add/remove multiple sites to/from categories
- **Category-based Blocking**: Block entire categories at once

### Focus Timer
- **Pomodoro Technique**: Work/break cycle timer
- **Customizable Durations**: Set custom work and break periods
- **Notifications**: Get notified when sessions end
- **Productivity Tracking**: Monitor focus session statistics

### Import/Export
- **Backup Configuration**: Export all settings, blocked sites, and categories
- **Restore Settings**: Import previous configurations
- **Cross-device Sync**: Share configurations between devices
- **JSON Format**: Human-readable export format

### Password Protection
- **Secure Access**: Protect extension settings with password
- **Optional Feature**: Can be enabled/disabled
- **Local Storage**: Password stored securely in browser

### Context Menu Integration
- **Right-click Blocking**: Block sites directly from context menu
- **Quick Actions**: Fast access to common functions
- **Site Information**: View blocking status of current site

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
├── content-script.js     # Content script for blocked page
├── styles.css            # Styling for popup and blocked page
├── icon*.png             # Extension icons (16, 32, 48, 64, 96, 128, 192, 256, 512px)
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
  - `notifications`: For user notifications
  - `contextMenus`: For right-click menu integration
  - `tabs`: For tab management
  - `scripting`: For content script injection
- **Host Permissions**: `<all_urls>` to access all websites
- **Background Script**: Service worker for persistent functionality
- **Content Scripts**: For blocked page functionality
- **Web Accessible Resources**: For blocked page assets

### 2. background.js (Service Worker)
The core blocking logic that runs in the background:

#### Key Functions:
- **`syncDNRRules()`**: Synchronizes declarativeNetRequest rules with stored blocked sites, whitelist, and temporary unlocks
- **`checkTemporaryUnlocks()`**: Manages temporary unlock expiration
- **`handleNotifications()`**: Manages user notifications
- **`setupContextMenus()`**: Creates right-click menu options
- **`handleKeyboardShortcuts()`**: Processes keyboard shortcuts

#### Event Listeners:
- `chrome.runtime.onStartup`: Initialize rules when browser starts
- `chrome.runtime.onInstalled`: Initialize rules when extension is installed
- `chrome.storage.onChanged`: Update rules when storage changes
- `chrome.tabs.onUpdated`: Handle page refreshes and navigation
- `chrome.webNavigation.onBeforeNavigate`: Intercept navigation attempts
- `chrome.alarms.onAlarm`: Handle scheduled tasks (unlock expiration)

### 3. popup.js (Popup Interface)
Handles the user interface and interactions:

#### Key Functions:
- **`normalizeDomain()`**: Cleans and validates domain input
- **`renderBlockedSites()`**: Displays the current blocked sites list
- **`renderTemporaryUnlocks()`**: Shows active temporary unlocks
- **`renderWhitelist()`**: Displays whitelist sites
- **`renderCategories()`**: Shows category management
- **`renderDashboard()`**: Displays analytics and statistics
- **`renderFocusTimer()`**: Manages focus timer functionality
- **`addSite()`**: Adds a new site to the block list
- **`removeSite()`**: Removes a site from the block list
- **`temporaryUnlock()`**: Creates temporary unlocks
- **`syncDNRRules()`**: Updates declarativeNetRequest rules

#### Tab Management:
- **Block Sites**: Core blocking functionality
- **Temporary Unlock**: Temporary access management
- **Whitelist**: Exception management
- **Categories**: Organization system
- **Dashboard**: Analytics and statistics
- **Focus Timer**: Productivity timer
- **Settings**: Configuration options

### 4. popup.html & styles.css
- **Tabbed Interface**: Modern tab-based navigation
- **Responsive Design**: Works on different screen sizes
- **Modern Styling**: Clean, professional appearance
- **Interactive Elements**: Hover effects and animations
- **Form Validation**: Real-time input validation

### 5. blocked.html & content-script.js
- **Custom Block Page**: Professional blocked site page
- **Content Script**: Handles blocked page functionality
- **No CSP Issues**: Properly implemented without inline scripts
- **User Information**: Clear messaging about blocked access

## 🔄 Technical Flow

### 1. Extension Initialization
```
Extension Loads → background.js starts → syncDNRRules() → Load all data from storage → Create DNR rules → Setup context menus
```

### 2. Adding a Website
```
User enters domain → normalizeDomain() → Validate input → Save to chrome.storage → syncDNRRules() → Update DNR rules → Website blocked
```

### 3. Temporary Unlock Process
```
User selects sites → Choose duration → Save unlock data → syncDNRRules() → Update DNR rules → Sites temporarily accessible → Auto-expire after duration
```

### 4. Blocking a Website Access
```
User navigates to blocked site → chrome.webNavigation.onBeforeNavigate → Check if domain in blocked list → Check whitelist → Check temporary unlocks → Redirect to blocked.html if blocked
```

### 5. Page Refresh Handling
```
User refreshes blocked page → chrome.tabs.onUpdated → Check if domain in blocked list → Check whitelist → Check temporary unlocks → Redirect to blocked.html if blocked
```

### 6. Temporary Unlock Expiration
```
Unlock expires → chrome.alarms.onAlarm → Remove expired unlock → syncDNRRules() → Update DNR rules → Site re-blocked
```

## 🔌 API Reference

### Chrome APIs Used

#### chrome.storage.local
- **Purpose**: Persistent local storage for all extension data
- **Data Stored**:
  - Blocked sites list
  - Whitelist sites
  - Temporary unlocks
  - Categories
  - Settings and preferences
  - Dashboard statistics

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

#### chrome.notifications
- **Purpose**: Show user notifications
- **Methods Used**:
  - `create()`: Display notifications
  - `clear()`: Remove notifications

#### chrome.contextMenus
- **Purpose**: Create right-click menu options
- **Methods Used**:
  - `create()`: Add menu items
  - `onClicked`: Handle menu clicks

#### chrome.alarms
- **Purpose**: Schedule tasks (unlock expiration)
- **Methods Used**:
  - `create()`: Schedule alarms
  - `onAlarm`: Handle alarm events

## 🛠️ Troubleshooting

### Common Issues

#### Extension Not Blocking Sites
1. Check if the extension is enabled in `chrome://extensions/`
2. Verify the domain format (should be like `facebook.com`, not `https://facebook.com`)
3. Check browser console for errors
4. Try refreshing the extension
5. Verify whitelist doesn't contain the site

#### Temporary Unlocks Not Working
1. Check if the unlock is still active (not expired)
2. Verify the site is in the blocked list
3. Check browser console for errors
4. Try refreshing the extension

#### CSP Errors
1. All inline scripts have been removed
2. Content scripts are properly injected
3. No inline event handlers in HTML
4. All JavaScript is external

#### Sites Still Accessible After Adding
1. Ensure the domain is correctly formatted
2. Check if the site is in the whitelist
3. Check if there's an active temporary unlock
4. Try navigating directly to the site (not from bookmarks)
5. Clear browser cache and try again

#### Extension Not Loading
1. Verify all files are present in the extension directory
2. Check manifest.json for syntax errors
3. Ensure Chrome is updated to a recent version
4. Try reloading the extension

### Debug Mode
The extension includes comprehensive logging. Check the browser console for:
- DNR rule synchronization status
- Temporary unlock management
- Storage operations
- Error messages and debugging information

## 📈 Development History

### Version 1.0 - Basic Blocking
- Initial implementation with basic website blocking
- Manifest V3 compliance
- DeclarativeNetRequest integration
- Persistent blocking across page refreshes

### Version 2.0 - Advanced Features
- **Temporary Unlock System**: Time-based unlocking with multiple duration options
- **Whitelist Management**: Permanent exceptions for trusted sites
- **Category Organization**: Custom categories for better site management
- **Dashboard Analytics**: Usage statistics and blocking patterns
- **Focus Timer**: Built-in Pomodoro timer for productivity
- **Smart Notifications**: User notifications for various events
- **Import/Export**: Backup and restore functionality
- **Password Protection**: Secure access to extension settings
- **Context Menu Integration**: Right-click quick actions
- **Keyboard Shortcuts**: Fast access to features

### Version 2.1 - Technical Improvements
- **CSP Compliance**: Removed all inline scripts and event handlers
- **Content Script Architecture**: Proper separation of concerns
- **Error Handling**: Comprehensive error handling and logging
- **Message Passing**: Robust communication between components
- **Storage Optimization**: Efficient data storage and retrieval
- **UI/UX Enhancements**: Modern, responsive interface
- **Icon Set**: High-quality, multi-size icon collection

### Technical Fixes Implemented
- **Inline Script Removal**: Eliminated CSP violations
- **Event Listener Migration**: Replaced inline onclick handlers
- **Content Script Injection**: Proper script loading via manifest
- **Date Formatting**: Safe date handling with error catching
- **Message Port Management**: Robust message passing
- **Storage Operations**: Error-handled storage operations
- **DNR Rule Synchronization**: Proper rule management with whitelist and unlocks

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
- Ensure CSP compliance
- Handle errors gracefully

### Testing Checklist
- [ ] Basic blocking functionality
- [ ] Temporary unlock system
- [ ] Whitelist management
- [ ] Category operations
- [ ] Focus timer functionality
- [ ] Import/export features
- [ ] Context menu integration
- [ ] Notification system
- [ ] Error handling
- [ ] CSP compliance

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Chrome Extension Manifest V3 documentation
- DeclarativeNetRequest API documentation
- Chrome Extension development community
- All contributors and testers

---

**Note**: This extension is designed for productivity and self-control. Use responsibly and respect website terms of service.
