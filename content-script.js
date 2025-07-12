// Content script for blocked page
(function() {
    'use strict';
    
    // Only run on our blocked page
    if (!window.location.href.includes('blocked.html')) {
        return;
    }
    
    // Motivational quotes array
    const motivationalQuotes = [
        {
            title: "🎯 Stay Focused!",
            quote: "The difference between successful people and really successful people is that really successful people say 'no' to almost everything.",
            author: "Warren Buffett"
        },
        {
            title: "💪 Build Discipline!",
            quote: "Discipline is choosing between what you want now and what you want most.",
            author: "Abraham Lincoln"
        },
        {
            title: "🚀 Chase Your Dreams!",
            quote: "The future belongs to those who believe in the beauty of their dreams.",
            author: "Eleanor Roosevelt"
        },
        {
            title: "⭐ Be Extraordinary!",
            quote: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
            author: "Winston Churchill"
        },
        {
            title: "🎯 Master Your Time!",
            quote: "Time is more valuable than money. You can get more money, but you cannot get more time.",
            author: "Jim Rohn"
        },
        {
            title: "🌟 You've Got This!",
            quote: "The only way to do great work is to love what you do. If you haven't found it yet, keep looking. Don't settle.",
            author: "Steve Jobs"
        },
        {
            title: "🔥 Stay Strong!",
            quote: "Strength does not come from the physical capacity. It comes from an indomitable will.",
            author: "Mahatma Gandhi"
        },
        {
            title: "🎯 Focus on Growth!",
            quote: "The only person you are destined to become is the person you decide to be.",
            author: "Ralph Waldo Emerson"
        },
        {
            title: "💎 You're Precious!",
            quote: "Your time is limited, don't waste it living someone else's life.",
            author: "Steve Jobs"
        },
        {
            title: "🚀 Keep Moving!",
            quote: "The journey of a thousand miles begins with one step.",
            author: "Lao Tzu"
        },
        {
            title: "🎯 Stay Committed!",
            quote: "Commitment is what transforms a promise into reality.",
            author: "Abraham Lincoln"
        },
        {
            title: "🌟 Believe in Yourself!",
            quote: "The only limit to our realization of tomorrow will be our doubts of today.",
            author: "Franklin D. Roosevelt"
        },
        {
            title: "💪 Build Habits!",
            quote: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.",
            author: "Aristotle"
        },
        {
            title: "🎯 Choose Wisely!",
            quote: "Every choice you make has an end result.",
            author: "Zig Ziglar"
        },
        {
            title: "🌟 You're Amazing!",
            quote: "The greatest glory in living lies not in never falling, but in rising every time we fall.",
            author: "Nelson Mandela"
        }
    ];
    
    // Get the blocked domain from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const blockedDomain = urlParams.get('domain') || 'Unknown Site';
    
    // Update the domain display
    const domainElement = document.getElementById('blockedDomain');
    if (domainElement) {
        domainElement.textContent = blockedDomain;
    }
    
    // Function to get a random motivational quote
    function getRandomQuote() {
        const randomIndex = Math.floor(Math.random() * motivationalQuotes.length);
        return motivationalQuotes[randomIndex];
    }
    
    // Function to update motivational content
    function updateMotivationalContent() {
        const quote = getRandomQuote();
        
        const titleElement = document.getElementById('motivationalTitle');
        const quoteElement = document.getElementById('motivationalQuote');
        const authorElement = document.getElementById('quoteAuthor');
        
        if (titleElement) titleElement.textContent = quote.title;
        if (quoteElement) quoteElement.textContent = quote.quote;
        if (authorElement) authorElement.textContent = `— ${quote.author}`;
    }
    
    // Function to update focus statistics
    function updateFocusStats() {
        // Get stats from storage
        chrome.storage.local.get(['blockStats', 'focusStats'], (result) => {
            const blockStats = result.blockStats || {};
            const focusStats = result.focusStats || {};
            
            // Get today's blocks
            const today = new Date().toDateString();
            const todayBlocks = blockStats[today] || 0;
            
            // Calculate time saved (estimate 5 minutes per block)
            const timeSaved = todayBlocks * 5;
            
            // Calculate focus score based on blocks today
            let focusScore = 0;
            if (todayBlocks > 0) {
                focusScore = Math.min(100, Math.floor((todayBlocks / 10) * 100));
            }
            
            // Update DOM elements
            const blocksTodayElement = document.getElementById('blocksToday');
            const timeSavedElement = document.getElementById('timeSaved');
            const focusScoreElement = document.getElementById('focusScore');
            
            if (blocksTodayElement) blocksTodayElement.textContent = todayBlocks;
            if (timeSavedElement) timeSavedElement.textContent = timeSaved;
            if (focusScoreElement) focusScoreElement.textContent = `${focusScore}%`;
        });
    }
    
    // Add event listeners when DOM is loaded
    document.addEventListener('DOMContentLoaded', function() {
        // Update motivational content
        updateMotivationalContent();
        
        // Update focus statistics
        updateFocusStats();
        
        // Add some interactivity - change quote on click
        const motivationalSection = document.querySelector('.motivational');
        if (motivationalSection) {
            motivationalSection.addEventListener('click', function() {
                updateMotivationalContent();
            });
        }
        
        // Add subtle animation to stats
        const statItems = document.querySelectorAll('.stat-item');
        statItems.forEach((item, index) => {
            setTimeout(() => {
                item.style.opacity = '0';
                item.style.transform = 'translateY(20px)';
                item.style.transition = 'all 0.5s ease';
                
                setTimeout(() => {
                    item.style.opacity = '1';
                    item.style.transform = 'translateY(0)';
                }, 100);
            }, index * 200);
        });
    });
    
    // Listen for storage changes to update stats
    if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.onChanged.addListener((changes, namespace) => {
            if (namespace === 'local' && (changes.blockStats || changes.focusStats)) {
                updateFocusStats();
            }
        });
    }
})(); 