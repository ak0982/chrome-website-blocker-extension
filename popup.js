// Handles popup logic for Website Blocker Extension
// Now updates declarativeNetRequest rules for Manifest V3

document.addEventListener('DOMContentLoaded', () => {
  const domainInput = document.getElementById('domainInput');
  const addBtn = document.getElementById('addBtn');
  const blockedList = document.getElementById('blockedList');
  const debugDiv = document.getElementById('debug');

  function normalizeDomain(domain) {
    // Remove protocol, www., path, and trim
    try {
      domain = domain.trim().toLowerCase();
      if (domain.startsWith('http://') || domain.startsWith('https://')) {
        domain = new URL(domain).hostname;
      }
      domain = domain.replace(/^www\./, '');
      // Remove any path/query/fragment
      domain = domain.split('/')[0];
      return domain;
    } catch (e) {
      return '';
    }
  }

  function renderList(sites) {
    blockedList.innerHTML = '';
    sites.forEach(site => {
      const li = document.createElement('li');
      li.textContent = site;
      const removeBtn = document.createElement('button');
      removeBtn.textContent = 'Remove';
      removeBtn.className = 'removeBtn';
      removeBtn.onclick = () => removeSite(site);
      li.appendChild(removeBtn);
      blockedList.appendChild(li);
    });
  }

  function loadSites() {
    chrome.storage.local.get(['blockedSites'], (result) => {
      renderList(result.blockedSites || []);
    });
  }

  function showDNRRules() {
    if (!chrome.declarativeNetRequest) {
      debugDiv.textContent = 'DNR API not available.';
      return;
    }
    chrome.declarativeNetRequest.getDynamicRules((rules) => {
      debugDiv.textContent = 'Current DNR rules: ' + JSON.stringify(rules, null, 2);
      console.log('Current DNR rules:', rules);
    });
  }

  function syncDNRRules(sites) {
    // Remove all previous dynamic rules in our range (1-1000)
    const ruleIds = Array.from({length: 1000}, (_, i) => i + 1);
    chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: ruleIds,
      addRules: sites.map((domain, idx) => ({
        id: idx + 1,
        priority: 1,
        action: { type: 'block' },
        condition: {
          urlFilter: `||${domain}^`,
          resourceTypes: ["main_frame"]
        }
      }))
    }, showDNRRules);
  }

  function addSite() {
    const domain = normalizeDomain(domainInput.value);
    if (!domain) return;
    chrome.storage.local.get(['blockedSites'], (result) => {
      let sites = result.blockedSites || [];
      if (!sites.includes(domain)) {
        sites.push(domain);
        chrome.storage.local.set({ blockedSites: sites }, () => {
          syncDNRRules(sites);
          loadSites();
        });
      }
      domainInput.value = '';
    });
  }

  function removeSite(domain) {
    chrome.storage.local.get(['blockedSites'], (result) => {
      let sites = (result.blockedSites || []).filter(site => site !== domain);
      chrome.storage.local.set({ blockedSites: sites }, () => {
        syncDNRRules(sites);
        loadSites();
      });
    });
  }

  addBtn.addEventListener('click', addSite);
  domainInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addSite();
  });

  // On load, sync rules to match storage
  chrome.storage.local.get(['blockedSites'], (result) => {
    syncDNRRules(result.blockedSites || []);
    loadSites();
    showDNRRules();
  });
}); 