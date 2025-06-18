/**
 * Environment Configuration
 * Detects environment and provides appropriate configuration
 */

(function() {
    // Detect environment based on hostname
    const hostname = window.location.hostname;
    const isDevelopment = hostname === 'localhost' || hostname === '127.0.0.1';
    const isGitHubPages = hostname.includes('github.io');
    const isProduction = !isDevelopment && !isGitHubPages;
    
    // Firebase Functions URLs
    const FIREBASE_PROJECT_ID = 'nuts-sports-pickem';
    const FIREBASE_REGION = 'us-central1';
    const FIREBASE_FUNCTIONS_URL = isProduction 
        ? `https://${FIREBASE_REGION}-${FIREBASE_PROJECT_ID}.cloudfunctions.net`
        : `http://localhost:5001/${FIREBASE_PROJECT_ID}/${FIREBASE_REGION}`; // Emulator URL
    
    // API Endpoints
    const API_ENDPOINTS = {
        development: {
            createNutsPayment: 'http://localhost:3001/create-nuts-payment',
            payloadStatus: 'http://localhost:3001/payload-status',
            baseUrl: 'http://localhost:3001'
        },
        production: {
            createNutsPayment: `${FIREBASE_FUNCTIONS_URL}/createNutsPayment`,
            payloadStatus: `${FIREBASE_FUNCTIONS_URL}/checkXummPayment`,
            baseUrl: FIREBASE_FUNCTIONS_URL
        }
    };
    
    // Current environment configuration
    const currentEnv = isDevelopment ? 'development' : 'production';
    const endpoints = API_ENDPOINTS[currentEnv];
    
    // Override for GitHub Pages to use Firebase Functions
    if (isGitHubPages) {
        endpoints.createNutsPayment = `${FIREBASE_FUNCTIONS_URL}/createNutsPayment`;
        endpoints.payloadStatus = `${FIREBASE_FUNCTIONS_URL}/payloadStatus`;
        endpoints.baseUrl = FIREBASE_FUNCTIONS_URL;
    }
    
    // Export configuration
    window.ENV_CONFIG = {
        environment: currentEnv,
        isDevelopment: isDevelopment,
        isProduction: isProduction,
        isGitHubPages: isGitHubPages,
        
        // API Endpoints
        api: {
            createNutsPayment: endpoints.createNutsPayment,
            payloadStatus: endpoints.payloadStatus,
            baseUrl: endpoints.baseUrl
        },
        
        // Firebase configuration (remains the same)
        firebase: window.config.firebase,
        
        // XRPL configuration (remains the same)
        xrpl: window.config.xrpl,
        
        // Contest configuration (remains the same)
        contest: window.config.contest,
        
        // GitHub Pages specific settings
        gitHubPages: {
            baseUrl: isGitHubPages ? `/${window.location.pathname.split('/')[1]}` : '',
            customDomain: null // Set this if using custom domain
        }
    };
    
    // Helper function to get API endpoint
    window.getApiEndpoint = function(endpoint) {
        return window.ENV_CONFIG.api[endpoint] || window.ENV_CONFIG.api.baseUrl + '/' + endpoint;
    };
    
    // Helper function to get asset URL (for GitHub Pages compatibility)
    window.getAssetUrl = function(path) {
        if (window.ENV_CONFIG.isGitHubPages && window.ENV_CONFIG.gitHubPages.baseUrl) {
            return window.ENV_CONFIG.gitHubPages.baseUrl + path;
        }
        return path;
    };
    
    console.log('🌍 Environment Configuration:', {
        environment: window.ENV_CONFIG.environment,
        apiBaseUrl: window.ENV_CONFIG.api.baseUrl,
        hostname: hostname
    });
})();