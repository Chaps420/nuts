/**
 * Xaman OAuth2 Web Integration for NUTS Sports Pick'em
 * Based on the existing xaman_firebase_auth package
 * Provides browser-compatible OAuth2 flow
 */

class XamanOAuth2Integration {
    constructor() {
        this.config = window.config?.firebase || {};
        this.xamanConfig = window.config?.xumm || {};
        this.clientId = this.xamanConfig.oauthClientId;
        this.redirectUri = this.xamanConfig.oauth?.redirectUri || window.location.origin + '/daily-contest.html';
        this.authUrl = this.xamanConfig.oauth?.authorizationUrl || 'https://oauth2.xumm.app/auth';
        this.functionUrl = `https://${this.config.projectId}.cloudfunctions.net/xamanAuth`;
        
        console.log('🔐 Xaman OAuth2 Integration initialized');
    }

    /**
     * Start OAuth2 flow
     */
    startOAuth2Flow() {
        try {
            console.log('🚀 Starting Xaman OAuth2 flow...');
            
            // Generate state parameter for security
            const state = this.generateState();
            localStorage.setItem('xaman_oauth_state', state);

            // Build authorization URL
            const authUrl = new URL(this.authUrl);
            authUrl.searchParams.append('client_id', this.clientId);
            authUrl.searchParams.append('redirect_uri', this.redirectUri);
            authUrl.searchParams.append('response_type', 'code');
            authUrl.searchParams.append('scope', 'openid profile email wallet:read');
            authUrl.searchParams.append('state', state);

            console.log('🌐 Redirecting to:', authUrl.toString());
            
            // Redirect to Xaman OAuth2
            window.location.href = authUrl.toString();
            
        } catch (error) {
            console.error('❌ OAuth2 flow start failed:', error);
            throw error;
        }
    }

    /**
     * Handle OAuth2 callback
     */
    async handleOAuth2Callback() {
        try {
            console.log('🔄 Handling OAuth2 callback...');
            
            const urlParams = new URLSearchParams(window.location.search);
            const code = urlParams.get('code');
            const state = urlParams.get('state');
            const error = urlParams.get('error');

            // Check for errors
            if (error) {
                throw new Error(`OAuth2 error: ${error}`);
            }

            // Validate state parameter
            const savedState = localStorage.getItem('xaman_oauth_state');
            if (!state || state !== savedState) {
                throw new Error('Invalid state parameter');
            }

            // Clean up state
            localStorage.removeItem('xaman_oauth_state');

            if (!code) {
                throw new Error('No authorization code received');
            }

            console.log('✅ Authorization code received, exchanging for token...');
            
            // Exchange code for Firebase token
            const result = await this.exchangeCodeForToken(code);
            
            return result;
            
        } catch (error) {
            console.error('❌ OAuth2 callback handling failed:', error);
            throw error;
        }
    }

    /**
     * Exchange authorization code for Firebase custom token
     */
    async exchangeCodeForToken(authorizationCode) {
        try {
            console.log('🔄 Exchanging authorization code for Firebase token...');
            
            // Use our Cloud Function to handle the exchange
            const response = await fetch(`${this.functionUrl}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    authorizationCode: authorizationCode,
                    redirectUri: this.redirectUri
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Token exchange failed');
            }

            const data = await response.json();
            
            console.log('✅ Firebase token received');
            
            // Sign in to Firebase with custom token
            await firebase.auth().signInWithCustomToken(data.firebaseToken);
            
            console.log('✅ Firebase authentication successful');
            
            return {
                success: true,
                user: firebase.auth().currentUser,
                xrplAddress: data.xamanAccount,
                uid: data.uid
            };
            
        } catch (error) {
            console.error('❌ Token exchange failed:', error);
            throw error;
        }
    }

    /**
     * Check if current URL is an OAuth callback
     */
    static isOAuthCallback() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.has('code') || urlParams.has('error');
    }

    /**
     * Generate secure state parameter
     */
    generateState() {
        const array = new Uint32Array(8);
        crypto.getRandomValues(array);
        return Array.from(array, dec => ('0' + dec.toString(16)).substr(-2)).join('');
    }

    /**
     * Get current Firebase user's XRPL address
     */
    async getCurrentXrplAddress() {
        const user = firebase.auth().currentUser;
        if (!user) return null;

        try {
            const idTokenResult = await user.getIdTokenResult();
            return idTokenResult.claims.xrplAddress || null;
        } catch (error) {
            console.error('❌ Failed to get XRPL address:', error);
            return null;
        }
    }

    /**
     * Sign out from Firebase and clear tokens
     */
    async signOut() {
        try {
            await firebase.auth().signOut();
            localStorage.removeItem('xaman_oauth_state');
            console.log('✅ Successfully signed out');
        } catch (error) {
            console.error('❌ Sign out failed:', error);
            throw error;
        }
    }
}

// Create global instance
window.xamanOAuth2 = new XamanOAuth2Integration();

// Auto-handle OAuth callback on page load
document.addEventListener('DOMContentLoaded', async () => {
    if (XamanOAuth2Integration.isOAuthCallback()) {
        try {
            console.log('🔄 OAuth2 callback detected, processing...');
            
            const result = await window.xamanOAuth2.handleOAuth2Callback();
            
            if (result.success) {
                console.log('✅ OAuth2 authentication successful');
                
                // Dispatch success event
                window.dispatchEvent(new CustomEvent('xamanOAuth2Success', {
                    detail: {
                        user: result.user,
                        xrplAddress: result.xrplAddress,
                        uid: result.uid
                    }
                }));
                
                // Clean up URL
                const cleanUrl = window.location.origin + window.location.pathname;
                window.history.replaceState({}, document.title, cleanUrl);
            }
            
        } catch (error) {
            console.error('❌ OAuth2 callback processing failed:', error);
            
            // Dispatch error event
            window.dispatchEvent(new CustomEvent('xamanOAuth2Error', {
                detail: { error: error.message }
            }));
        }
    }
});

console.log('🔐 Xaman OAuth2 Web Integration loaded');
