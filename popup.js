// Enhanced Website Blocker Extension - All Features
document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const domainInput = document.getElementById('domainInput');
    const addBtn = document.getElementById('addBtn');
    const blockedList = document.getElementById('blockedList');
    const debugDiv = document.getElementById('debug');
    const categorySelect = document.getElementById('categorySelect');
    const categoryFilter = document.getElementById('categoryFilter');
    const searchInput = document.getElementById('searchInput');
    
    // Tab Management
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    // Temporary Unlock Elements
    const unlockSiteSelect = document.getElementById('unlockSiteSelect');
    const unlockDuration = document.getElementById('unlockDuration');
    const customDurationRow = document.getElementById('customDurationRow');
    const customDurationInput = document.getElementById('customDurationInput');
    const unlockSiteBtn = document.getElementById('unlockSiteBtn');
    const activeUnlocksList = document.getElementById('activeUnlocksList');
    const unlockHistoryList = document.getElementById('unlockHistoryList');
    
    // Whitelist Elements
    const whitelistInput = document.getElementById('whitelistInput');
    const addWhitelistBtn = document.getElementById('addWhitelistBtn');
    const whitelistList = document.getElementById('whitelistList');
    
    // Categories Elements
    const newCategoryInput = document.getElementById('newCategoryInput');
    const addCategoryBtn = document.getElementById('addCategoryBtn');
    const categoryList = document.getElementById('categoryList');
    
    // Dashboard Elements
    const todayBlocks = document.getElementById('todayBlocks');
    const timeSaved = document.getElementById('timeSaved');
    const focusScore = document.getElementById('focusScore');
    const timerDisplay = document.getElementById('timerDisplay');
    const startTimer = document.getElementById('startTimer');
    const pauseTimer = document.getElementById('pauseTimer');
    const resetTimer = document.getElementById('resetTimer');
    const recentActivity = document.getElementById('recentActivity');
    
    // Settings Elements
    const notificationsEnabled = document.getElementById('notificationsEnabled');
    const passwordProtection = document.getElementById('passwordProtection');
    const passwordSection = document.getElementById('passwordSection');
    const extensionPassword = document.getElementById('extensionPassword');
    const exportData = document.getElementById('exportData');
    const importData = document.getElementById('importData');
    const importFile = document.getElementById('importFile');
    
    // Debug Elements
    const testDNR = document.getElementById('testDNR');
    
    // Global Variables
    let timerInterval;
    let timerRunning = false;
    let timerTime = 25 * 60; // 25 minutes in seconds
    let focusMode = false;
    
    // Initialize
    initializeExtension();
    
    // Tab Management
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;
            switchTab(tabName);
        });
    });
    
    function switchTab(tabName) {
        tabBtns.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        document.getElementById(tabName).classList.add('active');
        
        // Load tab-specific data
        if (tabName === 'dashboard') {
            loadDashboardData();
        } else if (tabName === 'unlock') {
            loadUnlockData();
        }
    }
    
    // Initialize Extension
    function initializeExtension() {
        loadSites();
        loadWhitelist();
        loadCategories();
        loadSettings();
        setupEventListeners();
        updateStatusIndicator();
    }
    
    // Event Listeners
    function setupEventListeners() {
        // Blocking
        addBtn.addEventListener('click', addSite);
        domainInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') addSite();
        });
        
        // Search and Filter
        searchInput.addEventListener('input', filterSites);
        categoryFilter.addEventListener('change', filterSites);
        
        // Temporary Unlock
        unlockDuration.addEventListener('change', toggleCustomDuration);
        unlockSiteBtn.addEventListener('click', unlockSite);
        customDurationInput.addEventListener('input', validateCustomDuration);
        
        // Whitelist
        addWhitelistBtn.addEventListener('click', addWhitelistSite);
        whitelistInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') addWhitelistSite();
        });
        
        // Categories
        addCategoryBtn.addEventListener('click', addCategory);
        
        // Dashboard
        startTimer.addEventListener('click', startFocusTimer);
        pauseTimer.addEventListener('click', pauseFocusTimer);
        resetTimer.addEventListener('click', resetFocusTimer);
        
        // Settings
        passwordProtection.addEventListener('change', togglePasswordProtection);
        exportData.addEventListener('click', exportExtensionData);
        importData.addEventListener('click', () => importFile.click());
        importFile.addEventListener('change', importExtensionData);
        
        // Debug
        testDNR.addEventListener('click', testDNRRules);
    }
    
    // Domain Normalization
    function normalizeDomain(domain) {
        try {
            domain = domain.trim().toLowerCase();
            if (domain.startsWith('http://') || domain.startsWith('https://')) {
                domain = new URL(domain).hostname;
            }
            domain = domain.replace(/^www\./, '');
            domain = domain.split('/')[0];
            return domain;
        } catch (e) {
            return '';
        }
    }
    
    // Site Management
    function addSite() {
        const domain = normalizeDomain(domainInput.value);
        const category = categorySelect.value || 'other';
        
        if (!domain) return;
        
        console.log('Adding site to block:', domain);
        
        chrome.storage.local.get(['blockedSites', 'siteCategories'], (result) => {
            let sites = result.blockedSites || [];
            let categories = result.siteCategories || {};
            
            if (!sites.includes(domain)) {
                sites.push(domain);
                categories[domain] = category;
                
                console.log('Updated sites list:', sites);
                
                chrome.storage.local.set({ 
                    blockedSites: sites, 
                    siteCategories: categories 
                }, () => {
                    console.log('Storage updated, syncing DNR rules...');
                    syncDNRRules(sites);
                    loadSites();
                    addActivity(`Added ${domain} to block list`);
                    showNotification('Site added to block list!', 'success');
                });
            } else {
                console.log('Site already in block list:', domain);
                showNotification('Site already in block list!', 'warning');
            }
            domainInput.value = '';
            categorySelect.value = '';
        });
    }
    
    function removeSite(domain) {
        chrome.storage.local.get(['blockedSites', 'siteCategories'], (result) => {
            let sites = (result.blockedSites || []).filter(site => site !== domain);
            let categories = result.siteCategories || {};
            delete categories[domain];
            
            chrome.storage.local.set({ 
                blockedSites: sites, 
                siteCategories: categories 
            }, () => {
                syncDNRRules(sites);
                loadSites();
                addActivity(`Removed ${domain} from block list`);
                showNotification('Site removed from block list!', 'success');
            });
        });
    }
    
    function renderList(sites, categories = {}) {
        blockedList.innerHTML = '';
        sites.forEach(site => {
            const siteItem = document.createElement('div');
            siteItem.className = 'site-item';
            const category = categories[site] || 'other';
            
            // Get appropriate icon based on domain
            const icon = getSiteIcon(site);
            
            siteItem.innerHTML = `
                <div class="site-info">
                    <div class="site-icon">${icon}</div>
                    <div class="site-details">
                        <span class="site-name">${site}</span>
                        <span class="site-category">${category}</span>
                    </div>
                </div>
                <button class="remove-btn" data-site="${site}">
                    <span class="remove-icon">×</span>
                </button>
            `;
            
            // Add event listener for remove button
            const removeBtn = siteItem.querySelector('.remove-btn');
            removeBtn.addEventListener('click', () => removeSite(site));
            
            blockedList.appendChild(siteItem);
        });
    }
    
    function getSiteIcon(domain) {
        const domainLower = domain.toLowerCase();
        if (domainLower.includes('google') || domainLower.includes('gmail')) return '🌐';
        if (domainLower.includes('facebook') || domainLower.includes('instagram') || domainLower.includes('twitter')) return '📱';
        if (domainLower.includes('youtube') || domainLower.includes('netflix') || domainLower.includes('spotify')) return '🎬';
        if (domainLower.includes('reddit') || domainLower.includes('discord')) return '🎮';
        if (domainLower.includes('amazon') || domainLower.includes('ebay')) return '🛒';
        if (domainLower.includes('github') || domainLower.includes('stackoverflow')) return '💻';
        return '🌐';
    }
    
    function loadSites() {
        chrome.storage.local.get(['blockedSites', 'siteCategories'], (result) => {
            renderList(result.blockedSites || [], result.siteCategories || {});
        });
    }
    
    function filterSites() {
        const searchTerm = searchInput.value.toLowerCase();
        const categoryFilter = document.getElementById('categoryFilter').value;
        
        chrome.storage.local.get(['blockedSites', 'siteCategories'], (result) => {
            let sites = result.blockedSites || [];
            let categories = result.siteCategories || {};
            
            let filteredSites = sites.filter(site => {
                const matchesSearch = site.toLowerCase().includes(searchTerm);
                const matchesCategory = !categoryFilter || categories[site] === categoryFilter;
                return matchesSearch && matchesCategory;
            });
            
            renderList(filteredSites, categories);
        });
    }
    
    // Temporary Unlock Management
    function toggleCustomDuration() {
        if (unlockDuration.value === 'custom') {
            customDurationRow.style.display = 'block';
            customDurationInput.focus();
        } else {
            customDurationRow.style.display = 'none';
        }
    }
    
    function validateCustomDuration() {
        const value = parseInt(customDurationInput.value);
        if (value < 1) {
            customDurationInput.value = 1;
        } else if (value > 10080) { // 7 days max
            customDurationInput.value = 10080;
        }
    }
    
    function unlockSite() {
        const selectedSite = unlockSiteSelect.value;
        if (!selectedSite) {
            showNotification('Please select a site to unlock!', 'warning');
            return;
        }
        
        let durationMinutes;
        if (unlockDuration.value === 'custom') {
            durationMinutes = parseInt(customDurationInput.value);
            if (!durationMinutes || durationMinutes < 1) {
                showNotification('Please enter a valid duration!', 'error');
                return;
            }
        } else {
            durationMinutes = parseInt(unlockDuration.value);
        }
        
        const unlockData = {
            site: selectedSite,
            startTime: Date.now(),
            durationMinutes: durationMinutes,
            endTime: Date.now() + (durationMinutes * 60 * 1000)
        };
        
        chrome.storage.local.get(['temporaryUnlocks', 'unlockHistory'], (result) => {
            let activeUnlocks = result.temporaryUnlocks || [];
            let unlockHistory = result.unlockHistory || [];
            
            // Check if site is already unlocked
            const existingUnlock = activeUnlocks.find(unlock => unlock.site === selectedSite);
            if (existingUnlock) {
                showNotification(`${selectedSite} is already unlocked!`, 'warning');
                return;
            }
            
            // Add to active unlocks
            activeUnlocks.push(unlockData);
            
            // Add to history
            unlockHistory.unshift({
                ...unlockData,
                action: 'unlocked'
            });
            
            // Keep only last 50 history entries
            if (unlockHistory.length > 50) {
                unlockHistory = unlockHistory.slice(0, 50);
            }
            
            chrome.storage.local.set({ 
                temporaryUnlocks: activeUnlocks, 
                unlockHistory: unlockHistory 
            }, () => {
                addActivity(`Temporarily unlocked ${selectedSite} for ${durationMinutes} minutes`);
                showNotification(`${selectedSite} unlocked for ${durationMinutes} minutes!`, 'success');
                
                // Update DNR rules to reflect the new unlock
                chrome.storage.local.get(['blockedSites'], (blockResult) => {
                    syncDNRRules(blockResult.blockedSites || []);
                });
                
                // Update status indicator
                updateStatusIndicator();
                
                // Reset form
                unlockSiteSelect.value = '';
                unlockDuration.value = '60';
                customDurationRow.style.display = 'none';
                customDurationInput.value = '';
                
                // Reload unlock data
                loadUnlockData();
            });
        });
    }
    
    function removeUnlock(site) {
        chrome.storage.local.get(['temporaryUnlocks'], (result) => {
            let activeUnlocks = result.temporaryUnlocks || [];
            activeUnlocks = activeUnlocks.filter(unlock => unlock.site !== site);
            
            chrome.storage.local.set({ temporaryUnlocks: activeUnlocks }, () => {
                addActivity(`Removed unlock for ${site}`);
                showNotification(`${site} is now blocked again!`, 'info');
                
                // Update DNR rules to reflect the removed unlock
                chrome.storage.local.get(['blockedSites'], (blockResult) => {
                    syncDNRRules(blockResult.blockedSites || []);
                });
                
                loadUnlockData();
            });
        });
    }
    
    function loadUnlockData() {
        // Load blocked sites for dropdown
        chrome.storage.local.get(['blockedSites'], (result) => {
            const blockedSites = result.blockedSites || [];
            unlockSiteSelect.innerHTML = '<option value="">Choose a blocked site...</option>';
            blockedSites.forEach(site => {
                const option = document.createElement('option');
                option.value = site;
                option.textContent = site;
                unlockSiteSelect.appendChild(option);
            });
        });
        
        // Load active unlocks
        chrome.storage.local.get(['temporaryUnlocks'], (result) => {
            const activeUnlocks = result.temporaryUnlocks || [];
            activeUnlocksList.innerHTML = '';
            
            if (activeUnlocks.length === 0) {
                activeUnlocksList.innerHTML = '<p class="no-unlocks">No active unlocks</p>';
                return;
            }
            
            activeUnlocks.forEach(unlock => {
                const timeLeft = Math.max(0, unlock.endTime - Date.now());
                const minutesLeft = Math.ceil(timeLeft / (60 * 1000));
                
                const unlockItem = document.createElement('div');
                unlockItem.className = 'unlock-item';
                unlockItem.innerHTML = `
                    <div class="unlock-info">
                        <span class="unlock-site">${unlock.site}</span>
                        <span class="unlock-time">${minutesLeft} min left</span>
                    </div>
                    <button class="remove-unlock-btn" data-site="${unlock.site}">Remove</button>
                `;
                
                const removeBtn = unlockItem.querySelector('.remove-unlock-btn');
                removeBtn.addEventListener('click', () => removeUnlock(unlock.site));
                
                activeUnlocksList.appendChild(unlockItem);
            });
        });
        
        // Load unlock history
        chrome.storage.local.get(['unlockHistory'], (result) => {
            const unlockHistory = result.unlockHistory || [];
            unlockHistoryList.innerHTML = '';
            
            if (unlockHistory.length === 0) {
                unlockHistoryList.innerHTML = '<p class="no-history">No unlock history</p>';
                return;
            }
            
            unlockHistory.slice(0, 10).forEach(entry => {
                const historyItem = document.createElement('div');
                historyItem.className = 'history-item';
                
                // Safe date formatting
                let dateStr = 'Unknown';
                try {
                    const date = new Date(entry.startTime);
                    if (!isNaN(date.getTime())) {
                        dateStr = date.toLocaleString();
                    }
                } catch (e) {
                    console.error('Date formatting error:', e);
                }
                
                const duration = entry.durationMinutes;
                
                historyItem.innerHTML = `
                    <div class="history-info">
                        <span class="history-site">${entry.site}</span>
                        <span class="history-details">${duration} min • ${dateStr}</span>
                    </div>
                `;
                
                unlockHistoryList.appendChild(historyItem);
            });
        });
    }
    
    // Whitelist Management
    function addWhitelistSite() {
        const domain = normalizeDomain(whitelistInput.value);
        if (!domain) return;
        
        chrome.storage.local.get(['whitelistSites'], (result) => {
            let whitelist = result.whitelistSites || [];
            if (!whitelist.includes(domain)) {
                whitelist.push(domain);
                chrome.storage.local.set({ whitelistSites: whitelist }, () => {
                    loadWhitelist();
                    addActivity(`Added ${domain} to whitelist`);
                    showNotification('Site added to whitelist!', 'success');
                    
                    // Update DNR rules to reflect the new whitelist
                    chrome.storage.local.get(['blockedSites'], (blockResult) => {
                        syncDNRRules(blockResult.blockedSites || []);
                    });
                });
            }
            whitelistInput.value = '';
        });
    }
    
    function removeWhitelistSite(domain) {
        chrome.storage.local.get(['whitelistSites'], (result) => {
            let whitelist = (result.whitelistSites || []).filter(site => site !== domain);
            chrome.storage.local.set({ whitelistSites: whitelist }, () => {
                loadWhitelist();
                addActivity(`Removed ${domain} from whitelist`);
                showNotification('Site removed from whitelist!', 'success');
                
                // Update DNR rules to reflect the removed whitelist
                chrome.storage.local.get(['blockedSites'], (blockResult) => {
                    syncDNRRules(blockResult.blockedSites || []);
                });
            });
        });
    }
    
    function loadWhitelist() {
        chrome.storage.local.get(['whitelistSites'], (result) => {
            const whitelist = result.whitelistSites || [];
            whitelistList.innerHTML = '';
            whitelist.forEach(site => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <span>${site}</span>
                    <button class="removeBtn" data-site="${site}">Remove</button>
                `;
                
                // Add event listener for remove button
                const removeBtn = li.querySelector('.removeBtn');
                removeBtn.addEventListener('click', () => removeWhitelistSite(site));
                
                whitelistList.appendChild(li);
            });
        });
    }
    
    // Categories Management
    function addCategory() {
        const categoryName = newCategoryInput.value.trim();
        if (!categoryName) return;
        
        chrome.storage.local.get(['customCategories'], (result) => {
            let categories = result.customCategories || [];
            if (!categories.includes(categoryName)) {
                categories.push(categoryName);
                chrome.storage.local.set({ customCategories: categories }, () => {
                    loadCategories();
                    addActivity(`Added category: ${categoryName}`);
                    showNotification('Category added!', 'success');
                });
            }
            newCategoryInput.value = '';
        });
    }
    
    function removeCategory(category) {
        chrome.storage.local.get(['customCategories'], (result) => {
            let categories = result.customCategories || [];
            categories = categories.filter(c => c !== category);
            chrome.storage.local.set({ customCategories: categories }, () => {
                loadCategories();
                addActivity(`Removed category: ${category}`);
                showNotification('Category removed!', 'success');
            });
        });
    }
    
    function loadCategories() {
        chrome.storage.local.get(['customCategories'], (result) => {
            const categories = result.customCategories || [];
            categoryList.innerHTML = '';
            categories.forEach(category => {
                const div = document.createElement('div');
                div.className = 'category-item';
                div.innerHTML = `
                    <span>${category}</span>
                    <button class="removeBtn" data-category="${category}">Remove</button>
                `;
                
                // Add event listener for remove button
                const removeBtn = div.querySelector('.removeBtn');
                removeBtn.addEventListener('click', () => removeCategory(category));
                
                categoryList.appendChild(div);
            });
        });
    }
    
    // Dashboard Management
    function loadDashboardData() {
        chrome.storage.local.get(['blockStats', 'focusStats'], (result) => {
            const blockStats = result.blockStats || {};
            const focusStats = result.focusStats || {};
            
            const today = new Date().toDateString();
            const todayBlocks = blockStats[today] || 0;
            const timeSaved = todayBlocks * 5; // Assume 5 minutes per block
            const focusScore = focusStats[today] || 0;
            
            document.getElementById('todayBlocks').textContent = todayBlocks;
            document.getElementById('timeSaved').textContent = `${timeSaved} min`;
            document.getElementById('focusScore').textContent = `${focusScore}%`;
        });
        
        loadRecentActivity();
    }
    
    function loadRecentActivity() {
        chrome.storage.local.get(['activityLog'], (result) => {
            const activities = result.activityLog || [];
            recentActivity.innerHTML = '';
            
            activities.slice(-5).reverse().forEach(activity => {
                const div = document.createElement('div');
                div.className = 'activity-item';
                
                // Safe time formatting
                let timeStr = 'Unknown';
                try {
                    const date = new Date(activity.timestamp);
                    if (!isNaN(date.getTime())) {
                        timeStr = date.toLocaleTimeString();
                    }
                } catch (e) {
                    console.error('Time formatting error:', e);
                }
                
                div.innerHTML = `
                    <span>${activity.action}</span>
                    <span>${timeStr}</span>
                `;
                recentActivity.appendChild(div);
            });
        });
    }
    
    // Focus Timer
    function startFocusTimer() {
        if (!timerRunning) {
            timerRunning = true;
            timerInterval = setInterval(() => {
                timerTime--;
                updateTimerDisplay();
                if (timerTime <= 0) {
                    clearInterval(timerInterval);
                    timerRunning = false;
                    addActivity('Focus session completed');
                    showNotification('Focus session completed! Great job!', 'success');
                    chrome.notifications.create({
                        type: 'basic',
                        iconUrl: 'icon128.png',
                        title: 'Focus Session Complete!',
                        message: 'Great job! Your focus session is complete.'
                    });
                }
            }, 1000);
            addActivity('Started focus timer');
            showNotification('Focus timer started!', 'success');
        }
    }
    
    function pauseFocusTimer() {
        if (timerRunning) {
            clearInterval(timerInterval);
            timerRunning = false;
            addActivity('Paused focus timer');
            showNotification('Focus timer paused!', 'info');
        }
    }
    
    function resetFocusTimer() {
        clearInterval(timerInterval);
        timerRunning = false;
        timerTime = 25 * 60;
        updateTimerDisplay();
        addActivity('Reset focus timer');
        showNotification('Focus timer reset!', 'info');
    }
    
    function updateTimerDisplay() {
        const minutes = Math.floor(timerTime / 60);
        const seconds = timerTime % 60;
        timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    // Settings Management
    function loadSettings() {
        chrome.storage.local.get(['settings'], (result) => {
            const settings = result.settings || {};
            notificationsEnabled.checked = settings.notifications !== false;
            passwordProtection.checked = settings.passwordProtection || false;
            if (settings.passwordProtection) {
                passwordSection.style.display = 'block';
            }
        });
    }
    
    function togglePasswordProtection() {
        const enabled = passwordProtection.checked;
        passwordSection.style.display = enabled ? 'block' : 'none';
        
        chrome.storage.local.get(['settings'], (result) => {
            const settings = result.settings || {};
            settings.passwordProtection = enabled;
            chrome.storage.local.set({ settings });
        });
    }
    
    function exportExtensionData() {
        chrome.storage.local.get(null, (data) => {
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'website-blocker-data.json';
            a.click();
            URL.revokeObjectURL(url);
            addActivity('Exported extension data');
            showNotification('Data exported successfully!', 'success');
        });
    }
    
    function importExtensionData(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    chrome.storage.local.set(data, () => {
                        initializeExtension();
                        addActivity('Imported extension data');
                        showNotification('Data imported successfully!', 'success');
                    });
                } catch (error) {
                    console.error('Import failed:', error);
                    showNotification('Import failed! Invalid file format.', 'error');
                }
            };
            reader.readAsText(file);
        }
    }
    
    // Notification System
    function showNotification(message, type = 'info') {
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notification => notification.remove());
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${message}</span>
                <button class="notification-close">&times;</button>
            </div>
        `;
        
        // Add to page
        document.body.appendChild(notification);
        
        // Show notification
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        // Auto-hide after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }, 3000);
        
        // Close button functionality
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        });
    }
    
    // Activity Logging
    function addActivity(action) {
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
            
            chrome.storage.local.set({ activityLog: activities });
        });
    }
    
    // Status Indicator
    function updateStatusIndicator() {
        chrome.storage.local.get(['blockedSites'], (result) => {
            const hasBlockedSites = (result.blockedSites || []).length > 0;
            
            const statusDot = document.querySelector('.status-dot');
            const statusText = document.querySelector('.status-text');
            
            if (hasBlockedSites) {
                statusDot.style.background = '#4CAF50';
                statusText.textContent = 'Active';
            } else {
                statusDot.style.background = '#ff9800';
                statusText.textContent = 'Inactive';
            }
        });
    }
    
    // DNR Rules Management
    function syncDNRRules(sites) {
        console.log('syncDNRRules called with sites:', sites);
        
        // Get current whitelist and temporary unlocks
        chrome.storage.local.get(['whitelistSites', 'temporaryUnlocks'], (result) => {
            const whitelistSites = result.whitelistSites || [];
            const temporaryUnlocks = result.temporaryUnlocks || [];
            
            console.log('Current whitelist:', whitelistSites);
            console.log('Current temporary unlocks:', temporaryUnlocks);
            
            // Get currently active unlocks (not expired)
            const activeUnlocks = temporaryUnlocks.filter(unlock => Date.now() < unlock.endTime);
            console.log('Active unlocks:', activeUnlocks);
            
            // Filter out whitelisted and temporarily unlocked sites
            const sitesToBlock = sites.filter(site => {
                const isWhitelisted = whitelistSites.includes(site);
                const isTemporarilyUnlocked = activeUnlocks.some(unlock => unlock.site === site);
                const shouldBlock = !isWhitelisted && !isTemporarilyUnlocked;
                console.log(`Site ${site}: whitelisted=${isWhitelisted}, unlocked=${isTemporarilyUnlocked}, shouldBlock=${shouldBlock}`);
                return shouldBlock;
            });
            
            console.log('Sites to block:', sitesToBlock);
            
            const ruleIds = Array.from({length: 1000}, (_, i) => i + 1);
            const newRules = sitesToBlock.map((domain, idx) => ({
                id: idx + 1,
                priority: 1,
                action: { type: 'block' },
                condition: {
                    urlFilter: `||${domain}^`,
                    resourceTypes: ["main_frame"]
                }
            }));

            console.log('Creating DNR rules:', newRules);

            chrome.declarativeNetRequest.updateDynamicRules({
                removeRuleIds: ruleIds,
                addRules: newRules
            }, () => {
                console.log('DNR rules updated successfully:', newRules);
                showNotification(`Updated DNR rules: ${newRules.length} sites blocked`, 'info');
                
                // Verify the rules were applied
                chrome.declarativeNetRequest.getDynamicRules((rules) => {
                    console.log('Current DNR rules after update:', rules);
                });
            });
        });
    }
    
    // Debug function to test DNR rules
    function testDNRRules() {
        chrome.storage.local.get(['blockedSites', 'whitelistSites', 'temporaryUnlocks'], (result) => {
            const debugInfo = `
                Blocked Sites: ${(result.blockedSites || []).join(', ') || 'None'}
                Whitelist Sites: ${(result.whitelistSites || []).join(', ') || 'None'}
                Active Unlocks: ${(result.temporaryUnlocks || []).filter(u => Date.now() < u.endTime).map(u => u.site).join(', ') || 'None'}
            `;
            console.log('Debug Info:', debugInfo);
            showNotification('Check console for debug info', 'info');
            
            // Also sync DNR rules
            syncDNRRules(result.blockedSites || []);
        });
    }
});
