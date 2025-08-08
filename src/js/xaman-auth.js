/**
 * Xaman OAuth2/OpenID Connect Authentication Module
 * Implements secure user login for NUTS contest entry
 * Based on: https://docs.xaman.dev/environments/identity-oauth2-openid
 */

class XamanAuth {
    constructor() {
        this.clientId = null;
        this.redirectUri = null;
        this.scope = 'openid profile email wallet:read';
        this.state = null;
        this.codeVerifier = null;
        this.user = null;
        this.isAuthenticated = false;
        this.accessToken = null;
        this.idToken = null;
        
        console.log('🔐 Xaman OAuth2 Auth module initialized');
        this.init();
    }

    async init() {
        try {
            // Load configuration
            this.loadConfig();
            
            // Check for returning OAuth callback
            await this.handleOAuthCallback();
            
            // Check existing session
            await this.checkExistingSession();
            
            console.log('✅ Xaman Auth initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize Xaman Auth:', error);
        }
    }

    loadConfig() {
        // In production, these would come from environment variables
        this.clientId = window.config?.xumm?.oauthClientId || 'your-xaman-client-id';
        this.redirectUri = window.location.origin + '/daily-contest.html';
        
        console.log('📋 Xaman OAuth Config loaded:', {
            clientId: this.clientId,
            redirectUri: this.redirectUri,
            scope: this.scope
        });
    }

    // Generate PKCE (Proof Key for Code Exchange) for security
    generatePKCE() {
        // Generate code verifier (43-128 characters)
        const codeVerifier = this.generateRandomString(128);
        
        // Generate code challenge (SHA256 hash of verifier, base64url encoded)
        return crypto.subtle.digest('SHA-256', new TextEncoder().encode(codeVerifier))
            .then(hashBuffer => {
                const codeChallenge = this.base64urlEncode(new Uint8Array(hashBuffer));
                return { codeVerifier, codeChallenge };
            });
    }

    generateRandomString(length) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    base64urlEncode(buffer) {
        return btoa(String.fromCharCode(...buffer))
            .replace(/=/g, '')
            .replace(/\\+/g, '-')
            .replace(/\\//g, '_');
    }

    async startLogin() {
        try {
            console.log('🔐 Starting Xaman OAuth2 login flow...');
            
            // Generate PKCE parameters
            const { codeVerifier, codeChallenge } = await this.generatePKCE();
            this.codeVerifier = codeVerifier;
            
            // Generate state parameter for security
            this.state = this.generateRandomString(32);
            
            // Store parameters for callback verification
            sessionStorage.setItem('oauth_state', this.state);
            sessionStorage.setItem('oauth_code_verifier', this.codeVerifier);
            
            // Build authorization URL
            const authUrl = this.buildAuthorizationUrl(codeChallenge);
            
            console.log('🌐 Redirecting to Xaman authorization...', authUrl);
            
            // Redirect to Xaman authorization
            window.location.href = authUrl;
            
        } catch (error) {
            console.error('❌ Login initiation failed:', error);
            throw new Error('Failed to start login process: ' + error.message);
        }
    }

    buildAuthorizationUrl(codeChallenge) {
        const params = new URLSearchParams({
            response_type: 'code',
            client_id: this.clientId,
            redirect_uri: this.redirectUri,
            scope: this.scope,
            state: this.state,
            code_challenge: codeChallenge,
            code_challenge_method: 'S256',
            // Optional: specify UI preferences
            ui_locales: 'en',
            prompt: 'login' // Force login screen
        });

        return `https://oauth2.xumm.app/auth?${params.toString()}`;
    }

    async handleOAuthCallback() {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const error = urlParams.get('error');

        if (error) {
            console.error('❌ OAuth error:', error);
            this.showError('Login failed: ' + error);
            return;
        }

        if (code && state) {
            console.log('🔄 Processing OAuth callback...');
            
            try {
                // Verify state parameter
                const storedState = sessionStorage.getItem('oauth_state');
                if (state !== storedState) {
                    throw new Error('Invalid state parameter - possible CSRF attack');
                }

                // Exchange code for tokens
                await this.exchangeCodeForTokens(code);
                
                // Clean up URL
                window.history.replaceState({}, document.title, window.location.pathname);
                
                console.log('✅ OAuth callback processed successfully');
                
            } catch (error) {
                console.error('❌ OAuth callback processing failed:', error);
                this.showError('Login callback failed: ' + error.message);
            }
        }
    }

    async exchangeCodeForTokens(code) {
        try {
            const codeVerifier = sessionStorage.getItem('oauth_code_verifier');
            if (!codeVerifier) {
                throw new Error('Code verifier not found');
            }

            const tokenData = {
                grant_type: 'authorization_code',
                client_id: this.clientId,
                code: code,
                redirect_uri: this.redirectUri,
                code_verifier: codeVerifier
            };

            console.log('🔄 Exchanging authorization code for tokens...');

            // In production, this would make actual API call to Xaman token endpoint
            const response = await this.simulateTokenExchange(tokenData);
            
            if (response.access_token) {
                this.accessToken = response.access_token;
                this.idToken = response.id_token;
                
                // Get user profile
                await this.getUserProfile();
                
                // Store session
                this.storeSession();
                
                // Clean up temporary storage
                sessionStorage.removeItem('oauth_state');
                sessionStorage.removeItem('oauth_code_verifier');
                
                console.log('✅ Token exchange successful');
                this.onLoginSuccess();
                
            } else {
                throw new Error('Invalid token response');
            }

        } catch (error) {
            console.error('❌ Token exchange failed:', error);
            throw error;
        }
    }

    async simulateTokenExchange(tokenData) {
        // Simulate API call to Xaman token endpoint
        // In production: POST https://oauth2.xumm.app/token
        console.log('🧪 Simulating token exchange for demo...');
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        return {
            access_token: 'demo_access_token_' + Date.now(),
            id_token: 'demo_id_token_' + Date.now(),
            token_type: 'Bearer',
            expires_in: 3600,
            scope: this.scope
        };
    }

    async getUserProfile() {
        try {
            console.log('👤 Fetching user profile...');
            
            // In production: GET https://oauth2.xumm.app/userinfo
            const userProfile = await this.simulateUserProfile();
            
            this.user = userProfile;
            this.isAuthenticated = true;
            
            console.log('✅ User profile loaded:', this.user);
            
        } catch (error) {
            console.error('❌ Failed to fetch user profile:', error);
            throw error;
        }
    }

    async simulateUserProfile() {
        // Simulate API call to get user profile
        await new Promise(resolve => setTimeout(resolve, 500));
        
        return {
            sub: 'xaman_user_' + Date.now(),
            name: 'Demo Xaman User',
            email: 'demo@xaman.app',
            picture: 'https://via.placeholder.com/100x100?text=XU',
            wallet_address: 'rN7n7otQiEC3eDqL5RcFELw1VE74Ts6c1',
            preferred_username: 'xaman_user',
            email_verified: true,
            updated_at: Date.now()
        };
    }

    storeSession() {
        const sessionData = {
            user: this.user,
            accessToken: this.accessToken,
            idToken: this.idToken,
            isAuthenticated: this.isAuthenticated,
            timestamp: Date.now(),
            expiresAt: Date.now() + (3600 * 1000) // 1 hour
        };

        localStorage.setItem('xaman_auth_session', JSON.stringify(sessionData));
        console.log('💾 Session stored');
    }

    async checkExistingSession() {
        try {
            const sessionData = JSON.parse(localStorage.getItem('xaman_auth_session') || '{}');
            
            if (sessionData.isAuthenticated && sessionData.expiresAt > Date.now()) {
                // Session is valid
                this.user = sessionData.user;
                this.accessToken = sessionData.accessToken;
                this.idToken = sessionData.idToken;
                this.isAuthenticated = true;
                
                console.log('✅ Valid session restored:', this.user);
                this.onLoginSuccess();
                
            } else {
                console.log('ℹ️ No valid session found');
                this.logout(false); // Clean up expired session
            }
            
        } catch (error) {
            console.error('❌ Session check failed:', error);
            this.logout(false);
        }
    }

    logout(showMessage = true) {
        console.log('🚪 Logging out...');
        
        // Clear all auth data
        this.user = null;
        this.isAuthenticated = false;
        this.accessToken = null;
        this.idToken = null;
        
        // Clear stored session
        localStorage.removeItem('xaman_auth_session');
        sessionStorage.removeItem('oauth_state');
        sessionStorage.removeItem('oauth_code_verifier');
        
        // Update UI
        this.onLogout();
        
        if (showMessage) {
            this.showSuccess('Logged out successfully');
        }
        
        console.log('✅ Logout complete');
    }

    onLoginSuccess() {
        // Emit login event
        window.dispatchEvent(new CustomEvent('xamanLoginSuccess', {
            detail: this.user
        }));
        
        // Update UI
        this.updateAuthUI();
        
        this.showSuccess(`Welcome back, ${this.user.name}! 🎉`);
    }

    onLogout() {
        // Emit logout event
        window.dispatchEvent(new CustomEvent('xamanLogout'));
        
        // Update UI
        this.updateAuthUI();
    }    updateAuthUI() {
        // Only update user info display, not login/logout buttons
        // The wallet connection UI is handled by the contest manager
        const userInfo = document.getElementById('user-info');
        const enterContestBtn = document.getElementById('enter-contest-btn');

        if (this.isAuthenticated) {
            // User is logged in - enable contest entry
            if (enterContestBtn && !enterContestBtn.textContent.includes('Contest Entered')) {
                enterContestBtn.disabled = false;
                enterContestBtn.innerHTML = '<span>Enter Contest (50 $NUTS)</span><div class="btn-glow"></div>';
            }
            
        } else {
            // User is not logged in - disable contest entry
            if (enterContestBtn && !enterContestBtn.textContent.includes('Contest Entered')) {
                enterContestBtn.disabled = true;
                enterContestBtn.innerHTML = '<span>Connect Wallet to Enter Contest</span><div class="btn-glow"></div>';
            }
        }
    }

    getUserWalletAddress() {
        return this.isAuthenticated ? this.user.wallet_address : null;
    }

    isUserAuthenticated() {
        return this.isAuthenticated;
    }

    getUserInfo() {
        return this.user;
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            max-width: 400px;
            font-family: 'Inter', sans-serif;
        `;
        
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <span>${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" style="
                    background: none;
                    border: none;
                    color: white;
                    cursor: pointer;
                    font-size: 18px;
                    margin-left: auto;
                ">×</button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }
}

// Global instance
window.xamanAuth = new XamanAuth();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = XamanAuth;
}
