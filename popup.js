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
    let activeUnlocksUpdateTimer; // Timer for updating active unlocks display
    
    // Initialize
    checkPasswordProtection();
    
    // Cleanup timer when popup is closed
    window.addEventListener('beforeunload', () => {
        if (activeUnlocksUpdateTimer) {
            clearInterval(activeUnlocksUpdateTimer);
        }
    });
    
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
    
    // Password Protection Check
    function checkPasswordProtection() {
        chrome.storage.local.get(['settings'], (result) => {
            const settings = result.settings || {};
            if (settings.passwordProtection && settings.extensionPassword) {
                showPasswordPrompt();
            } else {
                initializeExtension();
            }
        });
    }
    
    function showPasswordPrompt() {
        // Hide all content and show password prompt
        document.querySelector('.container').style.display = 'none';
        
        // Create password prompt
        const passwordPrompt = document.createElement('div');
        passwordPrompt.id = 'passwordPrompt';
        passwordPrompt.innerHTML = `
            <div class="password-prompt">
                <div class="password-header">
                    <h2>🔒 Password Required</h2>
                    <p>Enter your password to access Website Blocker Pro</p>
                </div>
                <div class="password-form">
                    <input type="password" id="passwordInput" placeholder="Enter password" />
                    <button id="passwordSubmit">Unlock</button>
                </div>
                <div class="password-error" id="passwordError" style="display: none;">
                    Incorrect password. Please try again.
                </div>
            </div>
        `;
        
        document.body.appendChild(passwordPrompt);
        
        // Add event listeners
        const passwordInput = document.getElementById('passwordInput');
        const passwordSubmit = document.getElementById('passwordSubmit');
        const passwordError = document.getElementById('passwordError');
        
        passwordInput.focus();
        
        passwordSubmit.addEventListener('click', verifyPassword);
        passwordInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') verifyPassword();
        });
        
        function verifyPassword() {
            chrome.storage.local.get(['settings'], (result) => {
                const settings = result.settings || {};
                if (passwordInput.value === settings.extensionPassword) {
                    // Correct password - show extension
                    passwordPrompt.remove();
                    document.querySelector('.container').style.display = 'flex';
                    initializeExtension();
                } else {
                    // Wrong password
                    passwordError.style.display = 'block';
                    passwordInput.value = '';
                    passwordInput.focus();
                }
            });
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
        
        // Start active unlocks timer
        startActiveUnlocksTimer();
        
        // Add status indicator click handler
        setupStatusIndicatorClick();
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
                    updateStatusIndicator(); // Update status immediately
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
                updateStatusIndicator(); // Update status immediately
                addActivity(`Removed ${domain} from block list`);
                showNotification('Site removed from block list!', 'success');
            });
        });
    }
    
    function getCategoryIcon(category) {
        const categoryLower = category.toLowerCase();
        
        switch (categoryLower) {
            case 'social':
                return '📱';
            case 'gaming':
                return '🎮';
            case 'shopping':
                return '🛒';
            case 'entertainment':
                return '🎬';
            case 'news':
                return '📰';
            case 'development':
                return '💻';
            case 'communication':
                return '💬';
            case 'productivity':
                return '⚡';
            case 'education':
                return '📚';
            case 'finance':
                return '💰';
            case 'health':
                return '🏥';
            case 'travel':
                return '✈️';
            default:
                return '📌';
        }
    }
    
    function renderList(sites, categories = {}) {
        blockedList.innerHTML = '';
        sites.forEach(site => {
            const siteItem = document.createElement('div');
            siteItem.className = 'site-item';
            const category = categories[site] || 'other';
            
            // Get appropriate icon based on domain
            const icon = getSiteIcon(site);
            const categoryIcon = getCategoryIcon(category);
            
            siteItem.innerHTML = `
                <div class="site-info">
                    <div class="site-icon">
                        ${icon}
                    </div>
                    <div class="site-details">
                        <span class="site-name">
                            <span class="category-icon-inline">${categoryIcon}</span>
                            ${site}
                        </span>
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
        
        // Return high-quality logo URLs for popular websites
        if (domainLower.includes('google') || domainLower.includes('gmail')) {
            return `<img src="https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png" alt="Google" onerror="this.src='https://www.google.com/favicon.ico';" />`;
        }
        if (domainLower.includes('facebook')) {
            return `<img src="https://static.xx.fbcdn.net/rsrc.php/v3/y-/r/yXM3FgMdVNX.png" alt="Facebook" onerror="this.src='https://www.facebook.com/favicon.ico';" />`;
        }
        if (domainLower.includes('instagram')) {
            return `<img src="https://www.instagram.com/static/images/ico/favicon-200.png/ab6eff595bb1.png" alt="Instagram" onerror="this.src='https://www.instagram.com/favicon.ico';" />`;
        }
        if (domainLower.includes('twitter') || domainLower.includes('x.com')) {
            return `<img src="https://abs.twimg.com/responsive-web/client-web/icon-ios.b1fc727a.png" alt="Twitter" onerror="this.src='https://twitter.com/favicon.ico';" />`;
        }
        if (domainLower.includes('youtube')) {
            return `<img src="https://www.youtube.com/s/desktop/7c155e84/img/favicon_144x144.png" alt="YouTube" onerror="this.src='https://www.youtube.com/favicon.ico';" />`;
        }
        if (domainLower.includes('netflix')) {
            return `<img src="https://assets.nflxext.com/us/ffe/siteui/common/icons/iconNetflix.png" alt="Netflix" onerror="this.src='https://www.netflix.com/favicon.ico';" />`;
        }
        if (domainLower.includes('spotify')) {
            return `<img src="https://open.scdn.co/cdn/images/favicon.0f31d2ea.ico" alt="Spotify" onerror="this.src='https://www.spotify.com/favicon.ico';" />`;
        }
        if (domainLower.includes('reddit')) {
            return `<img src="https://www.redditstatic.com/desktop2x/img/favicon/android-icon-192x192.png" alt="Reddit" onerror="this.src='https://www.reddit.com/favicon.ico';" />`;
        }
        if (domainLower.includes('discord')) {
            return `<img src="https://assets-global.website-files.com/6257adef93867e50d84d30e2/636e0a6a49cf127bf92de1e2_icon_clyde_white_RGB.png" alt="Discord" onerror="this.src='https://discord.com/favicon.ico';" />`;
        }
        if (domainLower.includes('amazon')) {
            return `<img src="https://images-na.ssl-images-amazon.com/images/G/01/gc/designs/livepreview/amazon_dkblue_noto_email_v2016_us-main._CB468775337_.png" alt="Amazon" onerror="this.src='https://www.amazon.com/favicon.ico';" />`;
        }
        if (domainLower.includes('ebay')) {
            return `<img src="https://ir.ebaystatic.com/cr/v/c1/ebay-logo-1-1200x630-margin.png" alt="eBay" onerror="this.src='https://www.ebay.com/favicon.ico';" />`;
        }
        if (domainLower.includes('github')) {
            return `<img src="https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png" alt="GitHub" onerror="this.src='https://github.com/favicon.ico';" />`;
        }
        if (domainLower.includes('stackoverflow')) {
            return `<img src="https://cdn.sstatic.net/Sites/stackoverflow/Img/apple-touch-icon@2.png" alt="Stack Overflow" onerror="this.src='https://stackoverflow.com/favicon.ico';" />`;
        }
        if (domainLower.includes('linkedin')) {
            return `<img src="https://content.linkedin.com/content/dam/me/business/en-us/amp/brand-site/v2/bg/LI-Bug.svg.original.svg" alt="LinkedIn" onerror="this.src='https://www.linkedin.com/favicon.ico';" />`;
        }
        if (domainLower.includes('whatsapp')) {
            return `<img src="https://static.whatsapp.net/rsrc.php/v3/yP/r/rYZqPCBaG70.png" alt="WhatsApp" onerror="this.src='https://www.whatsapp.com/favicon.ico';" />`;
        }
        if (domainLower.includes('tiktok')) {
            return `<img src="https://sf16-va.tiktokcdn.com/obj/eden-va2/uhapnehs7nulqpaqj/TikTok_Logo_Without_Text.png" alt="TikTok" onerror="this.src='https://www.tiktok.com/favicon.ico';" />`;
        }
        if (domainLower.includes('snapchat')) {
            return `<img src="https://storage.googleapis.com/snap-inc/brand-guidelines/snapchat-ghost-logo.png" alt="Snapchat" onerror="this.src='https://www.snapchat.com/favicon.ico';" />`;
        }
        if (domainLower.includes('pinterest')) {
            return `<img src="https://about.pinterest.com/sites/default/files/2018-05/Pinterest_Logo_Red.png" alt="Pinterest" onerror="this.src='https://www.pinterest.com/favicon.ico';" />`;
        }
        if (domainLower.includes('twitch')) {
            return `<img src="https://assets.stickpng.com/images/580b57fcd9996e24bc43c540.png" alt="Twitch" onerror="this.src='https://www.twitch.tv/favicon.ico';" />`;
        }
        
        // For other domains, try to get their high-quality logo
        return `<img src="https://${domain}/apple-touch-icon.png" alt="${domain}" onerror="this.src='https://${domain}/favicon.ico';" />`;
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
                const siteCategory = categories[site] || 'other';
                const matchesCategory = !categoryFilter || siteCategory === categoryFilter;
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
                unlockDuration.value = '1';
                customDurationRow.style.display = 'none';
                customDurationInput.value = '';
                
                // Update active unlocks display
                updateActiveUnlocks();
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
                
                updateActiveUnlocks();
                updateStatusIndicator(); // Update status immediately
            });
        });
    }
    
    // Update active unlocks display and remove expired ones
    function updateActiveUnlocks() {
        chrome.storage.local.get(['temporaryUnlocks'], (result) => {
            let activeUnlocks = result.temporaryUnlocks || [];
            const now = Date.now();
            
            // Filter out expired unlocks
            const validUnlocks = activeUnlocks.filter(unlock => unlock.endTime > now);
            
            // If we removed any expired unlocks, update storage
            if (validUnlocks.length !== activeUnlocks.length) {
                const expiredUnlocks = activeUnlocks.filter(unlock => unlock.endTime <= now);
                chrome.storage.local.set({ temporaryUnlocks: validUnlocks }, () => {
                    console.log('Removed expired unlocks from storage');
                    
                    // Show notifications for expired unlocks
                    expiredUnlocks.forEach(unlock => {
                        addActivity(`${unlock.site} unlock expired`);
                    });
                    
                    // Update DNR rules to reflect the removed unlocks
                    chrome.storage.local.get(['blockedSites'], (blockResult) => {
                        syncDNRRules(blockResult.blockedSites || []);
                    });
                    
                    // Update status indicator when unlocks expire
                    updateStatusIndicator();
                });
            }
            
            // Update the display
            activeUnlocksList.innerHTML = '';
            
            if (validUnlocks.length === 0) {
                activeUnlocksList.innerHTML = '<p class="no-unlocks">No active unlocks</p>';
                return;
            }
            
            validUnlocks.forEach(unlock => {
                const timeLeft = Math.max(0, unlock.endTime - now);
                const minutesLeft = Math.ceil(timeLeft / (60 * 1000));
                
                const unlockItem = document.createElement('div');
                unlockItem.className = 'site-item';
                const siteIcon = getSiteIcon(unlock.site);
                unlockItem.innerHTML = `
                    <div class="site-info">
                    <div class="site-icon">
                        ${siteIcon}
                    </div>
                    <div class="site-details">
                        <span class="site-name">${unlock.site}</span>
                        <span class="site-category">${minutesLeft} min left</span>
                    </div>
                    </div>
                <button class="remove-btn" data-site="${unlock.site}">
                    <span class="remove-icon">×</span>
                </button>
                `;
                
                const removeBtn = unlockItem.querySelector('.remove-btn');
                removeBtn.addEventListener('click', () => removeUnlock(unlock.site));
                
                activeUnlocksList.appendChild(unlockItem);
            });
        });
    }
    
    // Start timer to update active unlocks display and status
    function startActiveUnlocksTimer() {
        // Clear existing timer
        if (activeUnlocksUpdateTimer) {
            clearInterval(activeUnlocksUpdateTimer);
        }
        
        // Update every minute
        activeUnlocksUpdateTimer = setInterval(() => {
            updateActiveUnlocks();
            updateStatusIndicator(); // Update status every minute
        }, 60000); // Update every minute
        
        // Also update immediately
        updateActiveUnlocks();
        updateStatusIndicator();
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
        
        // Start the active unlocks timer
        startActiveUnlocksTimer();
        
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
                extensionPassword.value = settings.extensionPassword || '';
            }
        });
    }
    
    function togglePasswordProtection() {
        const enabled = passwordProtection.checked;
        passwordSection.style.display = enabled ? 'block' : 'none';
        
        chrome.storage.local.get(['settings'], (result) => {
            const settings = result.settings || {};
            settings.passwordProtection = enabled;
            if (!enabled) {
                settings.extensionPassword = '';
                extensionPassword.value = '';
            }
            chrome.storage.local.set({ settings });
        });
    }
    
    // Save password when input changes
    extensionPassword.addEventListener('input', () => {
        if (passwordProtection.checked) {
            chrome.storage.local.get(['settings'], (result) => {
                const settings = result.settings || {};
                settings.extensionPassword = extensionPassword.value;
                chrome.storage.local.set({ settings });
            });
        }
    });
    
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
    
    // Enhanced Status Indicator
    function updateStatusIndicator() {
        chrome.storage.local.get(['blockedSites', 'temporaryUnlocks', 'blockStats'], (result) => {
            const blockedSites = result.blockedSites || [];
            const temporaryUnlocks = result.temporaryUnlocks || [];
            const blockStats = result.blockStats || {};
            
            const statusDot = document.querySelector('.status-dot');
            const statusText = document.querySelector('.status-text');
            
            // Get active unlocks (not expired)
            const activeUnlocks = temporaryUnlocks.filter(unlock => Date.now() < unlock.endTime);
            
            // Get today's block count
            const today = new Date().toDateString();
            const todayBlocks = blockStats[today] || 0;
            
            // Determine status based on conditions
            let status = {
                color: '#ff9800', // Default orange
                text: 'Inactive',
                details: ''
            };
            
            if (blockedSites.length === 0) {
                status = {
                    color: '#ff9800',
                    text: 'Inactive',
                    details: 'No sites blocked'
                };
            } else if (activeUnlocks.length > 0) {
                status = {
                    color: '#ffc107',
                    text: 'Warning',
                    details: `${activeUnlocks.length} unlock${activeUnlocks.length > 1 ? 's' : ''} active`
                };
            } else {
                status = {
                    color: '#4CAF50',
                    text: 'Active',
                    details: `${blockedSites.length} site${blockedSites.length > 1 ? 's' : ''} blocked`
                };
            }
            
            // Add today's blocks info if any
            if (todayBlocks > 0) {
                status.details += ` • ${todayBlocks} blocked today`;
            }
            
            // Update the UI
            statusDot.style.background = status.color;
            statusText.textContent = status.text;
            
            // Add tooltip with detailed information
            const statusIndicator = document.querySelector('.status-indicator');
            statusIndicator.title = status.details;
            
            // Add pulsing animation for warning status
            if (status.text === 'Warning') {
                statusDot.classList.add('pulse-warning');
            } else {
                statusDot.classList.remove('pulse-warning');
            }
            
            // Add glow effect for active status
            if (status.text === 'Active') {
                statusDot.classList.add('glow-active');
            } else {
                statusDot.classList.remove('glow-active');
            }
        });
    }
    
    // Status Indicator Click Handler
    function setupStatusIndicatorClick() {
        const statusIndicator = document.querySelector('.status-indicator');
        statusIndicator.addEventListener('click', () => {
            showDetailedStatus();
        });
        
        // Add cursor pointer to indicate it's clickable
        statusIndicator.style.cursor = 'pointer';
    }
    
    // Show detailed status information
    function showDetailedStatus() {
        chrome.storage.local.get(['blockedSites', 'temporaryUnlocks', 'blockStats', 'whitelistSites'], (result) => {
            const blockedSites = result.blockedSites || [];
            const temporaryUnlocks = result.temporaryUnlocks || [];
            const blockStats = result.blockStats || {};
            const whitelistSites = result.whitelistSites || [];
            
            // Get active unlocks
            const activeUnlocks = temporaryUnlocks.filter(unlock => Date.now() < unlock.endTime);
            
            // Get today's stats
            const today = new Date().toDateString();
            const todayBlocks = blockStats[today] || 0;
            
            // Calculate total blocks this week
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            let weeklyBlocks = 0;
            Object.keys(blockStats).forEach(date => {
                const blockDate = new Date(date);
                if (blockDate >= weekAgo) {
                    weeklyBlocks += blockStats[date] || 0;
                }
            });
            
            const details = `
🚫 Blocked Sites: ${blockedSites.length}
✅ Whitelisted Sites: ${whitelistSites.length}
🔓 Active Unlocks: ${activeUnlocks.length}
📊 Today's Blocks: ${todayBlocks}
📈 Weekly Blocks: ${weeklyBlocks}
            `.trim();
            
            showNotification(details, 'info');
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
