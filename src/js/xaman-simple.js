/**
 * Simple Xaman Integration using Web API
 * This avoids SDK complexity and uses the XUMM Web API directly
 */

class XamanSimple {
    constructor() {
        this.apiKey = window.config?.xumm?.apiKey || '14242c23-a236-43bd-9126-6490cbd4001d';
        this.apiSecret = window.config?.xumm?.apiSecret || '6b5d2831-aa58-4b5b-9b72-fe0f65de3e5c';
        this.connected = false;
        this.account = null;
        
        console.log('🔗 Xaman Simple Integration initialized');
    }

    /**
     * Connect wallet by creating a sign-in request
     */
    async connect() {
        try {
            console.log('🔄 Creating Xaman sign-in request...');
            
            // Create sign-in payload
            const payload = {
                txjson: {
                    TransactionType: 'SignIn'
                }
            };
            
            // Make request to XUMM API via proxy to avoid CORS
            const response = await this.createPayload(payload);
            
            if (response && response.uuid) {
                console.log('📱 Sign request created:', response.uuid);
                
                // Open sign request in new window
                if (response.next && response.next.always) {
                    window.open(response.next.always, '_blank');
                }
                
                // Show QR code modal
                this.showSignInModal(response);
                
                // Poll for result
                const result = await this.waitForPayloadResult(response.uuid);
                
                if (result && result.signed) {
                    this.handleConnection({
                        account: result.response.account,
                        network: result.response.network_type || 'MAINNET'
                    });
                    
                    return {
                        success: true,
                        account: result.response.account
                    };
                }
            }
            
            throw new Error('Failed to create sign request');
            
        } catch (error) {
            console.error('❌ Connection failed:', error);
            // Fallback to manual entry
            this.showManualEntryModal();
            throw error;
        }
    }

    /**
     * Create XUMM payload via proxy or direct if possible
     */
    async createPayload(payload) {
        try {
            // First try Firebase function if available
            if (window.firebaseIntegration && window.firebaseIntegration.functions) {
                console.log('🔥 Using Firebase function for XUMM API');
                const createXummPayload = window.firebaseIntegration.functions.httpsCallable('createXummPayload');
                const result = await createXummPayload(payload);
                return result.data;
            }
        } catch (error) {
            console.log('⚠️ Firebase function not available:', error.message);
        }
        
        // Fallback to displaying instructions
        console.log('📋 Showing manual connection instructions');
        return null;
    }

    /**
     * Wait for payload to be signed
     */
    async waitForPayloadResult(uuid) {
        // In a real implementation, this would poll the server
        // For now, we'll use manual confirmation
        return new Promise((resolve) => {
            // User will manually confirm after signing
            window.xamanPayloadResolve = resolve;
        });
    }

    /**
     * Show sign-in modal with QR code
     */
    showSignInModal(response) {
        const modal = document.createElement('div');
        modal.id = 'xaman-signin-modal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>🔗 Connect Xaman Wallet</h3>
                    <button class="modal-close" onclick="document.getElementById('xaman-signin-modal').remove()">×</button>
                </div>
                <div class="modal-body">
                    <div class="connection-options">
                        <div class="option-card">
                            <h4>📱 Mobile App</h4>
                            <p>1. Open Xaman app</p>
                            <p>2. Tap the scan button</p>
                            <p>3. Scan QR or enter request ID</p>
                            ${response ? `
                                <div class="request-id">
                                    <strong>Request ID:</strong> ${response.uuid || 'Pending...'}
                                </div>
                            ` : ''}
                        </div>
                        
                        <div class="option-card">
                            <h4>🌐 Web Sign-In</h4>
                            ${response && response.next ? `
                                <a href="${response.next.always}" target="_blank" class="btn btn-primary">
                                    Open in Xaman
                                </a>
                            ` : ''}
                            <p class="help-text">Opens xumm.app in new tab</p>
                        </div>
                        
                        <div class="option-card">
                            <h4>✍️ Manual Entry</h4>
                            <button onclick="window.xamanWallet.showManualEntryModal()" class="btn btn-secondary">
                                Enter Wallet Address
                            </button>
                            <p class="help-text">For testing purposes</p>
                        </div>
                    </div>
                    
                    <div class="modal-footer">
                        <button onclick="window.xamanWallet.confirmConnection()" class="btn btn-success" style="display: none;" id="confirm-connection">
                            I've Signed In - Continue
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.style.display = 'flex';
        
        // Show confirm button after a delay
        setTimeout(() => {
            const confirmBtn = document.getElementById('confirm-connection');
            if (confirmBtn) confirmBtn.style.display = 'block';
        }, 3000);
    }

    /**
     * Show manual entry modal
     */
    showManualEntryModal() {
        const existingModal = document.getElementById('xaman-signin-modal');
        if (existingModal) existingModal.remove();
        
        const modal = document.createElement('div');
        modal.id = 'xaman-manual-modal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>📝 Enter Wallet Address</h3>
                    <button class="modal-close" onclick="document.getElementById('xaman-manual-modal').remove()">×</button>
                </div>
                <div class="modal-body">
                    <p>Enter your XRPL wallet address to continue:</p>
                    <input type="text" id="wallet-address-input" placeholder="r..." class="form-input" style="width: 100%; padding: 10px; margin: 10px 0;">
                    <button onclick="window.xamanWallet.submitManualAddress()" class="btn btn-primary">
                        Connect Wallet
                    </button>
                    <p class="help-text" style="margin-top: 10px; color: #888;">
                        Your address starts with 'r' and is about 34 characters long
                    </p>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.style.display = 'flex';
        
        // Focus input
        setTimeout(() => {
            const input = document.getElementById('wallet-address-input');
            if (input) input.focus();
        }, 100);
    }

    /**
     * Submit manual address
     */
    submitManualAddress() {
        const input = document.getElementById('wallet-address-input');
        const address = input?.value?.trim();
        
        if (address && address.startsWith('r') && address.length > 20) {
            const modal = document.getElementById('xaman-manual-modal');
            if (modal) modal.remove();
            
            this.handleConnection({
                account: address,
                network: 'MAINNET'
            });
        } else {
            alert('Please enter a valid XRPL address');
        }
    }

    /**
     * Confirm connection after manual sign-in
     */
    confirmConnection() {
        const modal = document.getElementById('xaman-signin-modal');
        if (modal) modal.remove();
        
        // Prompt for wallet address
        this.showManualEntryModal();
    }

    /**
     * Handle successful connection
     */
    handleConnection(data) {
        this.connected = true;
        this.account = data.account;
        
        console.log('✅ Wallet connected:', data.account);
        
        // Close any open modals
        const modals = document.querySelectorAll('#xaman-signin-modal, #xaman-manual-modal');
        modals.forEach(modal => modal.remove());
        
        // Dispatch event
        window.dispatchEvent(new CustomEvent('xaman:connected', {
            detail: { account: data.account, network: data.network }
        }));
    }

    /**
     * Create payment request
     */
    async createPaymentRequest(amount, destination) {
        try {
            console.log('💸 Creating payment request...');
            
            // Create payment URL
            const paymentData = {
                to: destination,
                amount: amount,
                currency: 'NUTS',
                issuer: 'rGzx83BVoqTYbGn7tiVAnFw7cbxjin13jL'
            };
            
            // Generate XUMM payment link
            const params = new URLSearchParams({
                to: paymentData.to,
                amount: `${paymentData.amount}/${paymentData.currency}+${paymentData.issuer}`,
                memo: 'Contest Entry'
            });
            
            const paymentUrl = `https://xumm.app/tx?${params.toString()}`;
            
            // Open payment in new window
            window.open(paymentUrl, '_blank');
            
            // Show confirmation modal
            this.showPaymentConfirmModal(amount);
            
            return new Promise((resolve) => {
                window.xamanPaymentResolve = resolve;
            });
            
        } catch (error) {
            console.error('❌ Payment request failed:', error);
            throw error;
        }
    }

    /**
     * Show payment confirmation modal
     */
    showPaymentConfirmModal(amount) {
        const modal = document.createElement('div');
        modal.id = 'xaman-payment-modal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>💸 Complete Payment</h3>
                    <button class="modal-close" onclick="window.xamanWallet.cancelPayment()">×</button>
                </div>
                <div class="modal-body">
                    <div class="payment-info">
                        <p><strong>Amount:</strong> ${amount} $NUTS</p>
                        <p><strong>Purpose:</strong> Contest Entry</p>
                    </div>
                    <p>Complete the payment in your Xaman app, then click confirm:</p>
                    <button onclick="window.xamanWallet.confirmPayment()" class="btn btn-success">
                        Payment Completed
                    </button>
                    <button onclick="window.xamanWallet.cancelPayment()" class="btn btn-secondary">
                        Cancel
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.style.display = 'flex';
    }

    /**
     * Confirm payment completion
     */
    confirmPayment() {
        const modal = document.getElementById('xaman-payment-modal');
        if (modal) modal.remove();
        
        if (window.xamanPaymentResolve) {
            window.xamanPaymentResolve({
                success: true,
                signed: true,
                txHash: 'TX' + Date.now() // Mock transaction hash
            });
        }
    }

    /**
     * Cancel payment
     */
    cancelPayment() {
        const modal = document.getElementById('xaman-payment-modal');
        if (modal) modal.remove();
        
        if (window.xamanPaymentResolve) {
            window.xamanPaymentResolve({
                success: false,
                signed: false
            });
        }
    }

    /**
     * Disconnect wallet
     */
    disconnect() {
        this.connected = false;
        this.account = null;
        
        window.dispatchEvent(new CustomEvent('xaman:disconnected'));
    }

    /**
     * Check if connected
     */
    isConnected() {
        return this.connected && this.account !== null;
    }

    /**
     * Get account
     */
    getAccount() {
        return this.account;
    }
}

// Replace xamanWallet with simple implementation
window.xamanWallet = new XamanSimple();

console.log('✅ Xaman Simple Integration loaded');