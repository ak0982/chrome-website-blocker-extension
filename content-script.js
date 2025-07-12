// Content script for blocked page
(function() {
    'use strict';
    
    // Only run on our blocked page
    if (!window.location.href.includes('blocked.html')) {
        return;
    }
    
    // Get the blocked domain from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const blockedDomain = urlParams.get('domain') || 'Unknown Site';
    
    // Update the domain display
    const domainElement = document.getElementById('blockedDomain');
    if (domainElement) {
        domainElement.textContent = blockedDomain;
    }
    
    // Add event listeners when DOM is loaded
    document.addEventListener('DOMContentLoaded', function() {
        // Go Back button
        const goBackBtn = document.getElementById('goBackBtn');
        if (goBackBtn) {
            goBackBtn.addEventListener('click', function() {
                window.history.back();
            });
        }
        
        // Open Extension button
        const openExtensionBtn = document.getElementById('openExtensionBtn');
        if (openExtensionBtn) {
            openExtensionBtn.addEventListener('click', function() {
                // Try to open the extension popup
                if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
                    chrome.runtime.sendMessage({ action: 'openExtension' });
                } else {
                    // Fallback: just go back
                    window.history.back();
                }
            });
        }
    });
})(); 