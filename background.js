// Enhanced Background Script for Website Blocker Extension
// Handles all features: blocking, temporary unlocks, whitelist, notifications, etc.

let unlockCheckInterval;
let currentBlockingState = false;

// Initialize extension
chrome.runtime.onStartup.addListener(() => {
    console.log('Extension starting up...');
    initializeExtension();
});

chrome.runtime.onInstalled.addListener(() => {
    console.log('Extension installed...');
    initializeExtension();
});

// Listen for storage changes
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local') {
        console.log('Storage changed:', changes);
        if (changes.blockedSites || changes.whitelistSites || changes.temporaryUnlocks) {
            console.log('Blocked sites, whitelist, or unlocks changed, updating DNR rules...');
            syncDNRRules();
        }
    }
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Message received:', request);
    
    try {
        switch (request.action) {
            case 'updateUnlocks':
                console.log('Updating unlocks from popup...');
                syncDNRRules();
                sendResponse({ success: true });
                return true;
            
            case 'getStats':
                chrome.storage.local.get(['blockStats', 'focusStats'], (result) => {
                    sendResponse(result);
                });
                return true;
            
            case 'addActivity':
                addActivity(request.data);
                sendResponse({ success: true });
                return true;
            
            case 'updateFocusStats':
                chrome.storage.local.get(['focusStats'], (result) => {
                    const focusStats = result.focusStats || {};
                    const today = new Date().toDateString();
                    focusStats[today] = request.score;
                    chrome.storage.local.set({ focusStats });
                    sendResponse({ success: true });
                });
                return true;
            
            case 'openExtension':
                chrome.action.openPopup();
                sendResponse({ success: true });
                return true;
            
            default:
                console.log('Unknown action:', request.action);
                sendResponse({ success: false, error: 'Unknown action' });
                return true;
        }
    } catch (error) {
        console.error('Error handling message:', error);
        sendResponse({ success: false, error: error.message });
        return true;
    }
});

// Initialize extension
function initializeExtension() {
    console.log('Initializing extension...');
    syncDNRRules();
    setupUnlockChecking();
    setupKeyboardShortcuts();
    setupContextMenu();
    
    // Test DNR rules after initialization
    setTimeout(() => {
        console.log('Testing DNR rules after initialization...');
        chrome.declarativeNetRequest.getDynamicRules((rules) => {
            console.log('Current DNR rules:', rules);
        });
    }, 2000);
}

// Sync declarativeNetRequest rules
function syncDNRRules() {
    chrome.storage.local.get(['blockedSites', 'whitelistSites', 'temporaryUnlocks'], (result) => {
        const blockedSites = result.blockedSites || [];
        const whitelistSites = result.whitelistSites || [];
        const temporaryUnlocks = result.temporaryUnlocks || [];
        
        console.log('Current data:', { blockedSites, whitelistSites, temporaryUnlocks });
        
        // Get currently active unlocks (not expired)
        const activeUnlocks = temporaryUnlocks.filter(unlock => {
            return Date.now() < unlock.endTime;
        });
        
        console.log('Active unlocks:', activeUnlocks);
        
        // Remove all previous dynamic rules
        const ruleIds = Array.from({length: 1000}, (_, i) => i + 1);
        
        if (blockedSites.length > 0) {
            // Create blocking rules (excluding whitelisted sites and temporarily unlocked sites)
            const sitesToBlock = blockedSites.filter(site => {
                const isWhitelisted = whitelistSites.includes(site);
                const isTemporarilyUnlocked = activeUnlocks.some(unlock => unlock.site === site);
                return !isWhitelisted && !isTemporarilyUnlocked;
            });
            
            const blockingRules = sitesToBlock.map((domain, idx) => ({
                id: idx + 1,
                priority: 1,
                action: { type: 'block' },
                condition: {
                    urlFilter: `||${domain}^`,
                    resourceTypes: ["main_frame"]
                }
            }));

            console.log('Creating blocking rules:', blockingRules);

            chrome.declarativeNetRequest.updateDynamicRules({
                removeRuleIds: ruleIds,
                addRules: blockingRules
            }, () => {
                console.log('DNR rules updated (blocking):', blockingRules);
                currentBlockingState = true;
            });
        } else {
            // Remove all blocking rules
            chrome.declarativeNetRequest.updateDynamicRules({
                removeRuleIds: ruleIds,
                addRules: []
            }, () => {
                console.log('DNR rules cleared (no sites to block)');
                currentBlockingState = false;
            });
        }
    });
}

// Setup unlock checking interval
function setupUnlockChecking() {
    if (unlockCheckInterval) {
        clearInterval(unlockCheckInterval);
    }
    
    // Check for expired unlocks every minute
    unlockCheckInterval = setInterval(() => {
        console.log('Checking for expired unlocks...');
        checkAndRemoveExpiredUnlocks();
    }, 60000); // Check every minute
    
    // Check immediately
    checkAndRemoveExpiredUnlocks();
}

// Check and remove expired unlocks
function checkAndRemoveExpiredUnlocks() {
    chrome.storage.local.get(['temporaryUnlocks'], (result) => {
        const temporaryUnlocks = result.temporaryUnlocks || [];
        const now = Date.now();
        
        // Filter out expired unlocks
        const activeUnlocks = temporaryUnlocks.filter(unlock => now < unlock.endTime);
        const expiredUnlocks = temporaryUnlocks.filter(unlock => now >= unlock.endTime);
        
        if (expiredUnlocks.length > 0) {
            console.log('Found expired unlocks:', expiredUnlocks);
            
            // Update storage with only active unlocks
            chrome.storage.local.set({ temporaryUnlocks: activeUnlocks }, () => {
                console.log('Removed expired unlocks, active unlocks:', activeUnlocks);
                
                // Update blocking rules
                syncDNRRules();
                
                // Show notifications for expired unlocks
                expiredUnlocks.forEach(unlock => {
                    chrome.notifications.create({
                        type: 'basic',
                        iconUrl: 'icon128.png',
                        title: 'Unlock Expired',
                        message: `${unlock.site} is now blocked again!`
                    });
                    addActivity(`${unlock.site} unlock expired`);
                });
            });
        }
    });
}

// Handle navigation events
chrome.webNavigation.onBeforeNavigate.addListener((details) => {
    if (details.frameId === 0) { // Main frame only
        console.log('Navigation detected:', details.url);
        handleNavigation(details.url, details.tabId);
    }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
        console.log('Tab updated:', tab.url);
        handleNavigation(tab.url, tabId);
    }
});

function handleNavigation(url, tabId) {
    chrome.storage.local.get(['blockedSites', 'whitelistSites', 'temporaryUnlocks', 'blockStats'], (result) => {
        const blockedSites = result.blockedSites || [];
        const whitelistSites = result.whitelistSites || [];
        const temporaryUnlocks = result.temporaryUnlocks || [];
        const blockStats = result.blockStats || {};
        
        console.log('Handling navigation:', { url, blockedSites, whitelistSites, temporaryUnlocks });
        
                 const urlObj = new URL(url);
         const domain = urlObj.hostname.replace(/^www\./, '');
         
         console.log('Checking domain:', domain);
         
         // Get currently active unlocks (not expired)
         const activeUnlocks = temporaryUnlocks.filter(unlock => Date.now() < unlock.endTime);
         
         // Check if domain is blocked and not temporarily unlocked
         const isBlocked = blockedSites.includes(domain);
         const isWhitelisted = whitelistSites.includes(domain);
         const isTemporarilyUnlocked = activeUnlocks.some(unlock => unlock.site === domain);
         
         console.log('Domain status:', { domain, isBlocked, isWhitelisted, isTemporarilyUnlocked });
         
         if (isBlocked && !isWhitelisted && !isTemporarilyUnlocked) {
             console.log('Blocking domain:', domain);
            
            // Block the site
            chrome.tabs.update(tabId, {
                url: chrome.runtime.getURL('blocked.html') + '?domain=' + encodeURIComponent(domain)
            });
            
            // Update statistics
            const today = new Date().toDateString();
            blockStats[today] = (blockStats[today] || 0) + 1;
            chrome.storage.local.set({ blockStats });
            
            // Add to activity log
            addActivity(`Blocked access to ${domain}`);
            
            // Show notification if enabled
            chrome.storage.local.get(['settings'], (settingsResult) => {
                const settings = settingsResult.settings || {};
                if (settings.notifications !== false) {
                    chrome.notifications.create({
                        type: 'basic',
                        iconUrl: 'icon128.png',
                        title: 'Website Blocked',
                        message: `${domain} has been blocked according to your settings.`
                    });
                }
            });
        } else {
            console.log('Domain not blocked or whitelisted:', domain);
        }
    });
}

// Activity logging
function addActivity(action) {
    try {
        chrome.storage.local.get(['activityLog'], (result) => {
            const activities = result.activityLog || [];
            activities.push({
                action,
                timestamp: Date.now()
            });
            
            // Keep only last 100 activities
            if (activities.length > 100) {
                activities.splice(0, activities.length - 100);
            }
            
            chrome.storage.local.set({ activityLog: activities }, () => {
                if (chrome.runtime.lastError) {
                    console.error('Error saving activity:', chrome.runtime.lastError);
                }
            });
        });
    } catch (error) {
        console.error('Error adding activity:', error);
    }
}

// Keyboard shortcuts
function setupKeyboardShortcuts() {
    chrome.commands.onCommand.addListener((command) => {
        console.log('Command received:', command);
        switch (command) {
            case 'toggle-extension':
                toggleExtension();
                break;
            case 'quick-add-site':
                openQuickAdd();
                break;
        }
    });
}

function toggleExtension() {
    chrome.storage.local.get(['settings'], (result) => {
        const settings = result.settings || {};
        settings.extensionEnabled = !settings.extensionEnabled;
        chrome.storage.local.set({ settings }, () => {
            if (settings.extensionEnabled) {
                syncDNRRules();
            } else {
                chrome.declarativeNetRequest.updateDynamicRules({
                    removeRuleIds: Array.from({length: 1000}, (_, i) => i + 1)
                });
            }
        });
    });
}

function openQuickAdd() {
    chrome.tabs.create({
        url: chrome.runtime.getURL('popup.html')
    });
}

// Context menu
function setupContextMenu() {
    chrome.contextMenus.removeAll(() => {
        // Add a short delay to ensure removal before creation
        setTimeout(() => {
            try {
                chrome.contextMenus.create({
                    id: 'blockSite',
                    title: 'Block this site',
                    contexts: ['page']
                });
            } catch (e) {
                if (chrome.runtime.lastError && chrome.runtime.lastError.message.includes('duplicate id')) {
                    // Ignore duplicate ID error
                    console.warn('Context menu with id blockSite already exists.');
                } else {
                    throw e;
                }
            }
            try {
                chrome.contextMenus.create({
                    id: 'whitelistSite',
                    title: 'Whitelist this site',
                    contexts: ['page']
                });
            } catch (e) {
                if (chrome.runtime.lastError && chrome.runtime.lastError.message.includes('duplicate id')) {
                    // Ignore duplicate ID error
                    console.warn('Context menu with id whitelistSite already exists.');
                } else {
                    throw e;
                }
            }
        }, 100);
    });
}

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'blockSite') {
        const domain = new URL(tab.url).hostname.replace(/^www\./, '');
        addSiteToBlockList(domain);
    } else if (info.menuItemId === 'whitelistSite') {
        const domain = new URL(tab.url).hostname.replace(/^www\./, '');
        addSiteToWhitelist(domain);
    }
});

function addSiteToBlockList(domain) {
    chrome.storage.local.get(['blockedSites'], (result) => {
        let sites = result.blockedSites || [];
        if (!sites.includes(domain)) {
            sites.push(domain);
            chrome.storage.local.set({ blockedSites: sites }, () => {
                syncDNRRules();
                addActivity(`Added ${domain} via context menu`);
            });
        }
    });
}

function addSiteToWhitelist(domain) {
    chrome.storage.local.get(['whitelistSites'], (result) => {
        let sites = result.whitelistSites || [];
        if (!sites.includes(domain)) {
            sites.push(domain);
            chrome.storage.local.set({ whitelistSites: sites }, () => {
                syncDNRRules();
                addActivity(`Added ${domain} to whitelist via context menu`);
            });
        }
    });
}



// Periodic cleanup
setInterval(() => {
    // Clean up old activity logs (older than 30 days)
    chrome.storage.local.get(['activityLog'], (result) => {
        const activities = result.activityLog || [];
        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
        const filteredActivities = activities.filter(activity => 
            activity.timestamp > thirtyDaysAgo
        );
        
        if (filteredActivities.length !== activities.length) {
            chrome.storage.local.set({ activityLog: filteredActivities });
        }
    });
}, 24 * 60 * 60 * 1000); // Run daily
