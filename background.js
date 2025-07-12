// Background script for Website Blocker Extension
// Handles declarativeNetRequest rules and content script injection

// Initialize rules when extension loads
chrome.runtime.onStartup.addListener(() => {
  syncDNRRules();
});

chrome.runtime.onInstalled.addListener(() => {
  syncDNRRules();
});

// Listen for storage changes to update rules
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.blockedSites) {
    syncDNRRules();
  }
});

// Sync declarativeNetRequest rules with stored blocked sites
function syncDNRRules() {
  chrome.storage.local.get(['blockedSites'], (result) => {
    const sites = result.blockedSites || [];
    
    // Remove all previous dynamic rules in our range (1-1000)
    const ruleIds = Array.from({length: 1000}, (_, i) => i + 1);
    
    // Create new rules for each blocked site
    const newRules = sites.map((domain, idx) => ({
      id: idx + 1,
      priority: 1,
      action: { type: 'block' },
      condition: {
        urlFilter: `||${domain}^`,
        resourceTypes: ["main_frame"]
      }
    }));

    chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: ruleIds,
      addRules: newRules
    }, () => {
      console.log('DNR rules updated:', newRules);
    });
  });
}

// Inject content script to handle page refreshes and navigation
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    chrome.storage.local.get(['blockedSites'], (result) => {
      const sites = result.blockedSites || [];
      const url = new URL(tab.url);
      const domain = url.hostname.replace(/^www\./, '');
      
      if (sites.includes(domain)) {
        // Redirect to blocked page
        chrome.tabs.update(tabId, {
          url: chrome.runtime.getURL('blocked.html')
        });
      }
    });
  }
});

// Handle navigation events
chrome.webNavigation.onBeforeNavigate.addListener((details) => {
  if (details.frameId === 0) { // Main frame only
    chrome.storage.local.get(['blockedSites'], (result) => {
      const sites = result.blockedSites || [];
      const url = new URL(details.url);
      const domain = url.hostname.replace(/^www\./, '');
      
      if (sites.includes(domain)) {
        // Cancel the navigation and redirect to blocked page
        chrome.tabs.update(details.tabId, {
          url: chrome.runtime.getURL('blocked.html')
        });
      }
    });
  }
});
