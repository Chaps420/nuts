/**
 * Xaman Payment using XUMM SDK
 * Creates proper XUMM payloads that open directly in Xaman app
 */

class XamanPaymentSDK {
    constructor() {
        this.apiKey = '14242c23-a236-43bd-9126-6490cbd4001d';
        this.contestWallet = 'rN2K1Tv6LEM94YN8Kxfe3QyWcGPQNgsD6d';
        this.nutsTokenIssuer = 'rBpdegD7kqHdczjKzTKNEUZj1Fg1eYZRbe';
        this.entryFee = '50';
        this.sdk = null;
        this.currentPayload = null;
        
        console.log('💸 Xaman Payment SDK System initializing...');
        this.initializeSDK();
    }

    /**
     * Initialize XUMM SDK
     */
    async initializeSDK() {
        try {
            // Check if XUMM SDK is already loaded
            if (typeof window.XummSdk !== 'undefined') {
                this.sdk = new window.XummSdk(this.apiKey);
                console.log('✅ XUMM SDK initialized successfully');
                return;
            }

            // Load XUMM SDK dynamically
            const script = document.createElement('script');
            script.src = 'https://xumm.app/assets/cdn/xumm-sdk-browser.min.js';
            script.onload = () => {
                this.sdk = new window.XummSdk(this.apiKey);
                console.log('✅ XUMM SDK loaded and initialized');
            };
            script.onerror = () => {
                console.error('❌ Failed to load XUMM SDK');
            };
            document.head.appendChild(script);
        } catch (error) {
            console.error('❌ SDK initialization error:', error);
        }
    }

    /**
     * Create payment request for contest entry
     */
    async createContestPayment() {
        try {
            console.log('💳 Creating XUMM payment payload...');
            
            // Ensure SDK is loaded
            if (!this.sdk) {
                await this.waitForSDK();
            }

            // Create the payment payload
            const payload = await this.sdk.payload.create({
                TransactionType: 'Payment',
                Destination: this.contestWallet,
                Amount: {
                    currency: 'NUTS',
                    value: this.entryFee,
                    issuer: this.nutsTokenIssuer
                },
                Memos: [
                    {
                        Memo: {
                            MemoType: this.stringToHex('Contest Entry'),
                            MemoData: this.stringToHex(JSON.stringify({
                                contest: 'daily',
                                date: new Date().toISOString().split('T')[0],
                                timestamp: Date.now()
                            }))
                        }
                    }
                ]
            });

            console.log('📱 Payload created:', payload);
            this.currentPayload = payload;

            // Show payment modal with QR code and options
            this.showPaymentModal(payload);
            
            // Subscribe to payload updates
            const subscription = await this.sdk.payload.subscribe(payload.uuid, (event) => {
                console.log('📡 Payload event:', event);
                
                if (event.data.signed === true) {
                    console.log('✅ Transaction signed!');
                    this.onPaymentSuccess(event.data);
                    return event.data;
                }
                
                if (event.data.signed === false) {
                    console.log('❌ Transaction rejected');
                    this.onPaymentRejected();
                }
            });

            // Return promise that resolves when payment is complete
            return new Promise((resolve, reject) => {
                window.xamanPaymentResolve = resolve;
                window.xamanPaymentReject = reject;
            });
            
        } catch (error) {
            console.error('❌ Payment creation failed:', error);
            this.showError('Failed to create payment request. Please try again.');
            throw error;
        }
    }

    /**
     * Wait for SDK to be loaded
     */
    async waitForSDK() {
        let attempts = 0;
        while (!this.sdk && attempts < 20) {
            await new Promise(resolve => setTimeout(resolve, 250));
            attempts++;
        }
        if (!this.sdk) {
            throw new Error('XUMM SDK failed to load');
        }
    }

    /**
     * Show payment modal
     */
    showPaymentModal(payload) {
        // Remove any existing modal
        const existingModal = document.getElementById('xaman-payment-modal');
        if (existingModal) existingModal.remove();
        
        const modal = document.createElement('div');
        modal.id = 'xaman-payment-modal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 600px;">
                <div class="modal-header">
                    <h3>💸 Contest Entry Payment</h3>
                    <button class="modal-close" onclick="window.xamanPaymentSDK.cancelPayment()">×</button>
                </div>
                <div class="modal-body">
                    <!-- Payment Details -->
                    <div class="payment-details" style="background: #252525; padding: 25px; border-radius: 12px; margin-bottom: 25px; border: 2px solid #4CAF50;">
                        <h4 style="color: #4CAF50; margin-bottom: 20px; font-size: 1.3em;">Payment Details</h4>
                        <div style="display: grid; gap: 15px;">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <span style="color: #999; font-size: 1.1em;">Amount:</span>
                                <span style="color: #4CAF50; font-weight: bold; font-size: 1.3em;">50 NUTS</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <span style="color: #999;">Type:</span>
                                <span style="color: #fff;">Contest Entry Payment</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <span style="color: #999;">To:</span>
                                <span style="font-family: monospace; font-size: 0.85em; color: #ccc;" title="${this.contestWallet}">
                                    ${this.contestWallet.substring(0, 10)}...${this.contestWallet.substring(-8)}
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- QR Code Section -->
                    <div class="qr-section" style="text-align: center; margin-bottom: 25px;">
                        <h4 style="color: #4CAF50; margin-bottom: 20px;">Scan with Xaman Wallet</h4>
                        <div class="qr-container" style="display: inline-block; padding: 20px; background: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.3);">
                            <img src="${payload.refs.qr_png}" alt="Payment QR Code" style="display: block; max-width: 300px;">
                        </div>
                    </div>
                    
                    <!-- Instructions -->
                    <div class="instructions" style="background: #1a1a1a; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                        <h5 style="color: #4CAF50; margin-bottom: 15px;">How to Pay:</h5>
                        <ol style="color: #ccc; line-height: 1.8; margin: 0; padding-left: 20px;">
                            <li>Open Xaman app on your phone</li>
                            <li>Tap the scan button (QR icon)</li>
                            <li>Scan this QR code</li>
                            <li>Review: You'll see <strong>50 NUTS</strong> payment</li>
                            <li>Slide to confirm the transaction</li>
                        </ol>
                    </div>
                    
                    <!-- Mobile Button -->
                    <div style="text-align: center; padding: 20px; background: #1a1a1a; border-radius: 8px;">
                        <p style="color: #888; margin-bottom: 15px;">On mobile? Open directly in Xaman:</p>
                        <button onclick="window.xamanPaymentSDK.openInApp()" class="btn btn-primary" style="font-size: 1.1em; padding: 12px 30px;">
                            Open in Xaman App
                        </button>
                    </div>
                    
                    <!-- Status -->
                    <div id="payment-status" style="margin-top: 20px; padding: 15px; background: #1a1a1a; border-radius: 8px; text-align: center;">
                        <div class="spinner" style="display: inline-block; margin-right: 10px;"></div>
                        <span style="color: #888;">Waiting for payment confirmation...</span>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.style.display = 'flex';
    }

    /**
     * Open payment in Xaman app
     */
    openInApp() {
        if (this.currentPayload && this.currentPayload.next && this.currentPayload.next.always) {
            window.open(this.currentPayload.next.always, '_blank');
        }
    }

    /**
     * Handle successful payment
     */
    onPaymentSuccess(data) {
        console.log('✅ Payment successful:', data);
        
        // Update modal to show success
        const modal = document.getElementById('xaman-payment-modal');
        if (modal) {
            const modalBody = modal.querySelector('.modal-body');
            modalBody.innerHTML = `
                <div style="text-align: center; padding: 40px;">
                    <div style="font-size: 4em; margin-bottom: 20px;">✅</div>
                    <h3 style="color: #4CAF50; margin-bottom: 20px;">Payment Successful!</h3>
                    <p style="color: #ccc; margin-bottom: 10px;">50 NUTS tokens sent successfully</p>
                    <p style="color: #888; margin-bottom: 20px;">Transaction Hash:</p>
                    <p style="font-family: monospace; font-size: 0.8em; color: #4CAF50; word-break: break-all;">
                        ${data.txid || 'Processing...'}
                    </p>
                    <button onclick="window.xamanPaymentSDK.closeModal()" class="btn btn-primary" style="margin-top: 20px;">
                        Continue
                    </button>
                </div>
            `;
        }
        
        // Resolve the payment promise
        if (window.xamanPaymentResolve) {
            window.xamanPaymentResolve({
                success: true,
                txHash: data.txid,
                payload: data,
                timestamp: new Date().toISOString()
            });
        }
        
        // Auto close after 3 seconds
        setTimeout(() => this.closeModal(), 3000);
    }

    /**
     * Handle rejected payment
     */
    onPaymentRejected() {
        console.log('❌ Payment rejected');
        this.showError('Payment was rejected. Please try again.');
        
        if (window.xamanPaymentReject) {
            window.xamanPaymentReject(new Error('Payment rejected by user'));
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        const statusEl = document.getElementById('payment-status');
        if (statusEl) {
            statusEl.innerHTML = `
                <div style="color: #ff4444;">
                    <strong>Error:</strong> ${message}
                </div>
            `;
        }
    }

    /**
     * Cancel payment
     */
    cancelPayment() {
        console.log('❌ Payment cancelled by user');
        this.closeModal();
        
        if (window.xamanPaymentReject) {
            window.xamanPaymentReject(new Error('Payment cancelled by user'));
        }
    }

    /**
     * Close modal
     */
    closeModal() {
        const modal = document.getElementById('xaman-payment-modal');
        if (modal) modal.remove();
        
        // Clean up
        this.currentPayload = null;
        delete window.xamanPaymentResolve;
        delete window.xamanPaymentReject;
    }

    /**
     * Convert string to hex
     */
    stringToHex(str) {
        let hex = '';
        for (let i = 0; i < str.length; i++) {
            hex += str.charCodeAt(i).toString(16).padStart(2, '0');
        }
        return hex.toUpperCase();
    }
}

// Create global instance
window.xamanPaymentSDK = new XamanPaymentSDK();

// Also expose for contest wallet compatibility
window.xamanPayment = window.xamanPaymentSDK;
window.contestWallet = {
    processEntryPayment: async function() {
        return window.xamanPaymentSDK.createContestPayment();
    }
};

// Add spinner styles
const style = document.createElement('style');
style.textContent = `
    .spinner {
        display: inline-block;
        width: 20px;
        height: 20px;
        border: 3px solid rgba(76, 175, 80, 0.3);
        border-radius: 50%;
        border-top-color: #4CAF50;
        animation: spin 1s ease-in-out infinite;
    }
    
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);

console.log('✅ Xaman Payment SDK system loaded');