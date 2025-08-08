/**
 * Xaman Wallet Integration
 * Simplified client-side implementation without direct API calls
 */

class XamanWallet {
    constructor() {
        this.connected = false;
        this.account = null;
        this.websocket = null;
        this.connectionTimeout = null;
        
        // Generate a unique identifier for this session
        this.sessionId = 'nuts-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        
        console.log('🔗 Xaman Wallet initialized');
    }

    /**
     * Connect wallet using Xaman universal link
     */
    async connect() {
        try {
            console.log('🔗 Starting Xaman wallet connection...');
            
            // Check if already connected
            if (this.connected && this.account) {
                console.log('✅ Already connected:', this.account);
                return { account: this.account, network: 'mainnet' };
            }
            
            // Create a sign-in request
            const signInRequest = {
                TransactionType: 'SignIn'
            };
            
            // Generate QR code data
            const qrData = this.generateQRData(signInRequest);
            
            // Show QR modal
            this.showQRModal(qrData);
            
            // Start listening for connection
            return new Promise((resolve, reject) => {
                this.connectionResolver = resolve;
                this.connectionRejector = reject;
                
                // Set timeout
                this.connectionTimeout = setTimeout(() => {
                    this.hideQRModal();
                    reject(new Error('Connection timeout'));
                }, 300000); // 5 minutes
            });
            
        } catch (error) {
            console.error('❌ Xaman connection error:', error);
            throw error;
        }
    }

    /**
     * Generate QR code data for Xaman
     */
    generateQRData(request) {
        // Create a unique identifier for this request
        const uuid = 'req-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        
        // For client-side, we'll use Xaman's universal link format
        const xamanLink = `https://xumm.app/sign/${uuid}`;
        
        // Store request data locally
        localStorage.setItem(`xaman_request_${uuid}`, JSON.stringify({
            request,
            created: new Date().toISOString(),
            sessionId: this.sessionId
        }));
        
        return {
            uuid,
            link: xamanLink,
            qr: this.generateQRCode(xamanLink)
        };
    }

    /**
     * Generate QR code SVG
     */
    generateQRCode(data) {
        // For now, return a placeholder. In production, use a QR library
        return `data:image/svg+xml;base64,${btoa(`
            <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
                <rect width="200" height="200" fill="white"/>
                <text x="100" y="100" text-anchor="middle" font-family="Arial" font-size="14">
                    Xaman QR Code
                </text>
                <text x="100" y="120" text-anchor="middle" font-family="Arial" font-size="10">
                    ${data.substring(0, 20)}...
                </text>
            </svg>
        `)}`;
    }

    /**
     * Show QR modal
     */
    showQRModal(qrData) {
        // Remove existing modal if any
        this.hideQRModal();
        
        const modal = document.createElement('div');
        modal.id = 'xaman-qr-modal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content qr-modal">
                <div class="modal-header">
                    <h3>🔗 Connect with Xaman</h3>
                    <button class="modal-close" onclick="window.xamanWallet.cancelConnection()">×</button>
                </div>
                <div class="modal-body">
                    <div class="qr-container">
                        <img src="${qrData.qr}" alt="Xaman QR Code" style="width: 250px; height: 250px;">
                    </div>
                    <div class="qr-instructions">
                        <h4>Scan with Xaman App</h4>
                        <ol>
                            <li>Open the Xaman app on your phone</li>
                            <li>Tap the scan button (QR icon)</li>
                            <li>Scan this QR code</li>
                            <li>Approve the sign-in request</li>
                        </ol>
                    </div>
                    <div class="qr-divider">
                        <span>OR</span>
                    </div>
                    <div class="deeplink-section">
                        <a href="${qrData.link}" class="btn btn-primary" target="_blank">
                            Open in Xaman App
                        </a>
                        <p class="deeplink-note">Click if you have Xaman installed on this device</p>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.style.display = 'flex';
    }

    /**
     * Hide QR modal
     */
    hideQRModal() {
        const modal = document.getElementById('xaman-qr-modal');
        if (modal) {
            modal.remove();
        }
    }

    /**
     * Cancel connection
     */
    cancelConnection() {
        this.hideQRModal();
        if (this.connectionTimeout) {
            clearTimeout(this.connectionTimeout);
        }
        if (this.connectionRejector) {
            this.connectionRejector(new Error('Connection cancelled'));
        }
    }


    /**
     * Handle successful connection
     */
    handleConnection(data) {
        console.log('✅ Xaman connected:', data);
        
        this.connected = true;
        this.account = data.account;
        
        // Clear timeout
        if (this.connectionTimeout) {
            clearTimeout(this.connectionTimeout);
        }
        
        // Hide modal
        this.hideQRModal();
        
        // Store connection
        localStorage.setItem('xaman_wallet', JSON.stringify({
            account: data.account,
            connected: true,
            timestamp: new Date().toISOString()
        }));
        
        // Resolve promise
        if (this.connectionResolver) {
            this.connectionResolver({
                account: data.account,
                network: data.network || 'mainnet'
            });
        }
        
        // Dispatch event
        window.dispatchEvent(new CustomEvent('xaman:connected', {
            detail: { account: data.account }
        }));
    }

    /**
     * Disconnect wallet
     */
    disconnect() {
        this.connected = false;
        this.account = null;
        localStorage.removeItem('xaman_wallet');
        
        window.dispatchEvent(new CustomEvent('xaman:disconnected'));
    }

    /**
     * Check if wallet is connected
     */
    isConnected() {
        return this.connected;
    }

    /**
     * Get connected account
     */
    getAccount() {
        return this.account;
    }

    /**
     * Restore session from localStorage
     */
    restoreSession() {
        const stored = localStorage.getItem('xaman_wallet');
        if (stored) {
            try {
                const data = JSON.parse(stored);
                // Check if session is less than 24 hours old
                const age = Date.now() - new Date(data.timestamp).getTime();
                if (age < 24 * 60 * 60 * 1000) {
                    this.connected = true;
                    this.account = data.account;
                    return true;
                }
            } catch (e) {
                console.error('Failed to restore session:', e);
            }
        }
        return false;
    }
}

// Create global instance
window.xamanWallet = new XamanWallet();

// Auto-restore session
window.xamanWallet.restoreSession();

console.log('✅ Xaman Wallet module loaded');