// Blocked page functionality
document.addEventListener('DOMContentLoaded', function() {
    // Get the blocked domain from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const blockedDomain = urlParams.get('domain') || 'Unknown Site';
    
    document.getElementById('blockedDomain').textContent = blockedDomain;
    
    // Go Back button
    document.getElementById('goBackBtn').addEventListener('click', function() {
        window.history.back();
    });
    
    // Open Extension button
    document.getElementById('openExtensionBtn').addEventListener('click', function() {
        // Try to open the extension popup
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
            chrome.runtime.sendMessage({ action: 'openExtension' });
        } else {
            // Fallback: just go back
            window.history.back();
        }
    });
}); 