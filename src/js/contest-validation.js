/**
 * Contest Entry Validation Utilities
 * Provides common validation functions for all contest types
 */

// Twitter handle validation
window.validateTwitterHandle = function(twitterHandle) {
    if (!twitterHandle || twitterHandle.trim() === '') {
        return {
            valid: false,
            error: 'Twitter handle is required to submit an entry.'
        };
    }
    
    const handle = twitterHandle.trim();
    
    // Remove @ if present
    const cleanHandle = handle.startsWith('@') ? handle.substring(1) : handle;
    
    // Basic validation - Twitter handles are 1-15 characters, alphanumeric + underscore
    if (cleanHandle.length < 1 || cleanHandle.length > 15) {
        return {
            valid: false,
            error: 'Twitter handle must be 1-15 characters long.'
        };
    }
    
    if (!/^[A-Za-z0-9_]+$/.test(cleanHandle)) {
        return {
            valid: false,
            error: 'Twitter handle can only contain letters, numbers, and underscores.'
        };
    }
    
    return {
        valid: true,
        handle: '@' + cleanHandle
    };
};

// Add validation to existing contest entry functions
window.addTwitterValidationToContest = function() {
    console.log('🐦 Adding Twitter validation to contest entry...');
    
    // Find the original contest entry handler
    const originalSubmitEntry = window.submitContestEntry;
    
    if (originalSubmitEntry) {
        // Override with validation
        window.submitContestEntry = function() {
            console.log('🔍 Validating Twitter handle before contest entry...');
            
            // Find Twitter input field (different IDs for different contests)
            const twitterInput = document.getElementById('twitter-handle') || 
                                document.querySelector('input[placeholder*="twitter"]') ||
                                document.querySelector('input[placeholder*="@"]');
            
            if (twitterInput) {
                const validation = window.validateTwitterHandle(twitterInput.value);
                
                if (!validation.valid) {
                    alert(validation.error);
                    twitterInput.focus();
                    return;
                }
                
                // Update input with clean handle
                twitterInput.value = validation.handle;
            }
            
            // Call original function
            return originalSubmitEntry.apply(this, arguments);
        };
    }
};

// Initialize validation when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Small delay to ensure other scripts load first
    setTimeout(() => {
        window.addTwitterValidationToContest();
    }, 1000);
});

console.log('✅ Contest validation utilities loaded');
