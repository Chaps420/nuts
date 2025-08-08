/**
 * Xaman Payment with proper XUMM API integration
 * Creates payment requests that properly pre-populate NUTS token amounts
 */

class XamanAPIPayment {
    constructor() {
        this.apiKey = window.config?.xumm?.apiKey || '5ae8e69a-1b48-4f80-b5bb-20ae099e6f2f';
        this.apiSecret = window.config?.xumm?.apiSecret || '6b5d2831-aa58-4b5b-9b72-fe0f65de3e5c';
        this.apiUrl = 'https://xumm.app/api/v1/platform/payload';
        this.contestWallet = 'rN2K1Tv6LEM94YN8Kxfe3QyWcGPQNgsD6d';
        this.nutsTokenIssuer = 'rBpdegD7kqHdczjKzTKNEUZj1Fg1eYZRbe';
        this.entryFee = 50;
        
        console.log('💸 Xaman API Payment System initialized');
    }

    /**
     * Create payment request using Firebase Cloud Function
     */
    async createContestPayment() {
        try {
            console.log('💳 Creating XUMM payment via Firebase...');
            
            // Check if Firebase is available
            if (!window.firebaseIntegration || !window.firebaseIntegration.functions) {
                console.log('🔄 Firebase not available, using fallback method...');
                return this.createFallbackPayment();
            }

            // Create payment request using Firebase Cloud Function
            const createNutsPayment = window.firebaseIntegration.functions.httpsCallable('createNutsPayment');
            
            const paymentData = {
                userWallet: 'USER_WALLET_ADDRESS', // This will be filled by user in Xaman
                amount: this.entryFee,
                destination: this.contestWallet,
                memo: 'Contest Entry - Daily Pick\'em',
                returnUrl: window.location.href
            };

            console.log('📡 Calling Firebase function with data:', paymentData);
            const result = await createNutsPayment(paymentData);
            
            if (!result.data || !result.data.success) {
                throw new Error('Failed to create payment request');
            }

            const payloadData = result.data;
            console.log('✅ Firebase payment created:', payloadData);

            // Show payment modal with QR code
            this.showPaymentModal(payloadData);

            // Monitor payment status
            this.monitorPaymentStatus(payloadData.uuid);

            return new Promise((resolve, reject) => {
                window.xamanPaymentResolve = resolve;
                window.xamanPaymentReject = reject;
            });

        } catch (error) {
            console.error('❌ Firebase payment creation failed:', error);
            console.log('🔄 Falling back to simple payment method...');
            return this.createFallbackPayment();
        }
    }

    /**
     * Fallback payment method - deploy the Firebase function and use it
     */
    async createFallbackPayment() {
        try {
            console.log('💳 Creating fallback payment - deploying Firebase functions...');
            
            // For now, show instructions to deploy Firebase functions
            this.showDeploymentInstructions();
            
            throw new Error('Firebase Cloud Functions need to be deployed for XUMM integration');

        } catch (error) {
            console.error('❌ Fallback payment creation failed:', error);
            throw error;
        }
    }

    /**
     * Show deployment instructions
     */
    showDeploymentInstructions() {
        const modal = document.createElement('div');
        modal.id = 'deployment-modal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 700px;">
                <div class="modal-header">
                    <h3>🚀 Firebase Functions Required</h3>
                    <button class="modal-close" onclick="document.getElementById('deployment-modal').remove()">×</button>
                </div>
                <div class="modal-body">
                    <div style="background: #252525; padding: 25px; border-radius: 12px; margin-bottom: 25px;">
                        <h4 style="color: #4CAF50; margin-bottom: 20px;">XUMM Payment Integration</h4>
                        <p style="color: #ccc; line-height: 1.6; margin-bottom: 20px;">
                            To properly pre-populate NUTS token amounts in Xaman, we need to deploy the Firebase Cloud Functions 
                            that handle the XUMM API integration.
                        </p>
                        
                        <h5 style="color: #ffa500; margin: 20px 0 10px 0;">Required Steps:</h5>
                        <ol style="color: #ccc; line-height: 1.8; margin: 0; padding-left: 20px;">
                            <li>Deploy Firebase Cloud Functions</li>
                            <li>Configure XUMM API credentials</li>
                            <li>Test the payment flow</li>
                        </ol>
                        
                        <div style="background: #1a1a1a; padding: 15px; border-radius: 8px; margin-top: 20px;">
                            <code style="color: #4CAF50; font-family: monospace;">
                                firebase deploy --only functions --project nuts-sports-pickem
                            </code>
                        </div>
                    </div>
                    
                    <div style="text-align: center;">
                        <button onclick="document.getElementById('deployment-modal').remove()" class="btn btn-primary">
                            OK - Will Deploy Functions
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.style.display = 'flex';
    }

    /**
     * Show payment modal with XUMM QR code
     */
    showPaymentModal(payloadData) {
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
                    <button class="modal-close" onclick="window.xamanAPIPayment.cancelPayment()">×</button>
                </div>
                <div class="modal-body">
                    <!-- Payment Details -->
                    <div class="payment-details" style="background: #252525; padding: 25px; border-radius: 12px; margin-bottom: 25px; border: 2px solid #4CAF50;">
                        <h4 style="color: #4CAF50; margin-bottom: 20px; font-size: 1.3em;">Payment Details</h4>
                        <div style="display: grid; gap: 15px;">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <span style="color: #999; font-size: 1.1em;">Amount:</span>
                                <span style="color: #4CAF50; font-weight: bold; font-size: 1.3em;">50 $NUTS</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <span style="color: #999;">Contest:</span>
                                <span style="color: #fff;">Daily Pick'em</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <span style="color: #999;">To:</span>
                                <span style="font-family: monospace; font-size: 0.85em; color: #ccc;" title="${this.contestWallet}">
                                    ${this.contestWallet.substring(0, 10)}...${this.contestWallet.substring(-8)}
                                </span>
                            </div>
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <span style="color: #999;">Token:</span>
                                <span style="color: #ccc;">$NUTS (${this.nutsTokenIssuer.substring(0, 8)}...)</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- QR Code Section -->
                    <div class="qr-section" style="text-align: center; margin-bottom: 25px;">
                        <h4 style="color: #4CAF50; margin-bottom: 20px;">Scan with Xaman Wallet</h4>
                        <div class="qr-container" style="display: inline-block; padding: 20px; background: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.3);">
                            <img src="${payloadData.refs.qr_png}" alt="Payment QR Code" style="display: block; max-width: 300px;">
                        </div>
                    </div>
                    
                    <!-- Instructions -->
                    <div class="instructions" style="background: #1a1a1a; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                        <h5 style="color: #4CAF50; margin-bottom: 15px;">How to Pay:</h5>
                        <ol style="color: #ccc; line-height: 1.8; margin: 0; padding-left: 20px;">
                            <li>Open <strong>Xaman</strong> app on your phone</li>
                            <li>Tap the <strong>Scan</strong> button (QR icon)</li>
                            <li>Scan this QR code</li>
                            <li>Verify the amount shows <strong>50 NUTS</strong></li>
                            <li>Slide to confirm payment</li>
                        </ol>
                    </div>
                    
                    <!-- Alternative Options -->
                    <div style="text-align: center; padding-top: 20px; border-top: 1px solid #333;">
                        <p style="color: #888; margin-bottom: 15px;">Can't scan the QR code?</p>
                        <a href="${payloadData.next.always}" target="_blank" class="btn btn-primary" style="display: inline-block;">
                            Open in Xaman App
                        </a>
                    </div>
                    
                    <!-- Status Section -->
                    <div id="payment-status" style="margin-top: 20px; padding: 15px; border-radius: 8px; text-align: center;">
                        <div class="spinner"></div>
                        <p style="margin-top: 10px; color: #888;">Waiting for payment...</p>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.style.display = 'flex';
    }

    /**
     * Monitor payment status via WebSocket
     */
    async monitorPaymentStatus(uuid) {
        try {
            // Check payment status periodically
            const checkStatus = async () => {
                const response = await fetch(`https://xumm.app/api/v1/platform/payload/${uuid}`, {
                    method: 'GET',
                    headers: {
                        'X-API-Key': this.apiKey,
                        'X-API-Secret': this.apiSecret
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    
                    if (data.meta.resolved) {
                        if (data.meta.signed) {
                            console.log('✅ Payment signed!');
                            this.paymentSuccess(data);
                        } else if (data.meta.cancelled) {
                            console.log('❌ Payment cancelled');
                            this.paymentCancelled();
                        }
                        return true; // Stop checking
                    }
                }
                return false; // Continue checking
            };

            // Check every 2 seconds
            const interval = setInterval(async () => {
                const resolved = await checkStatus();
                if (resolved) {
                    clearInterval(interval);
                }
            }, 2000);

            // Stop checking after 5 minutes
            setTimeout(() => {
                clearInterval(interval);
                this.paymentExpired();
            }, 300000);

        } catch (error) {
            console.error('❌ Error monitoring payment:', error);
        }
    }

    /**
     * Handle successful payment
     */
    paymentSuccess(data) {
        console.log('✅ Payment successful:', data);
        
        const modal = document.getElementById('xaman-payment-modal');
        if (modal) {
            const modalBody = modal.querySelector('.modal-body');
            modalBody.innerHTML = `
                <div style="text-align: center; padding: 40px;">
                    <div style="font-size: 4em; margin-bottom: 20px;">✅</div>
                    <h3 style="color: #4CAF50; margin-bottom: 20px;">Payment Successful!</h3>
                    <p style="color: #ccc; margin-bottom: 30px;">Your contest entry has been submitted.</p>
                    <p style="color: #888; font-size: 0.9em; margin-bottom: 20px;">Transaction: ${data.response?.txid || 'Processing...'}</p>
                    <button onclick="window.xamanAPIPayment.closeModal()" class="btn btn-primary">
                        Continue
                    </button>
                </div>
            `;
        }
        
        if (window.xamanPaymentResolve) {
            window.xamanPaymentResolve({
                success: true,
                txid: data.response?.txid,
                timestamp: new Date().toISOString()
            });
        }
        
        setTimeout(() => this.closeModal(), 3000);
    }

    /**
     * Handle cancelled payment
     */
    paymentCancelled() {
        console.log('❌ Payment cancelled');
        this.closeModal();
        
        if (window.xamanPaymentReject) {
            window.xamanPaymentReject(new Error('Payment cancelled by user'));
        }
    }

    /**
     * Handle expired payment
     */
    paymentExpired() {
        console.log('⏰ Payment expired');
        this.closeModal();
        
        if (window.xamanPaymentReject) {
            window.xamanPaymentReject(new Error('Payment expired'));
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
        delete window.xamanPaymentResolve;
        delete window.xamanPaymentReject;
    }

    /**
     * Build Xaman payment URL with proper NUTS token details
     */
    buildXamanPaymentUrl(data) {
        // Create the transaction object with NUTS token details
        const tx = {
            TransactionType: 'Payment',
            Destination: data.to,
            Amount: {
                currency: data.currency,
                value: String(data.amount),
                issuer: data.issuer
            }
        };
        
        // Create the full payload for Xaman
        const payload = {
            txjson: tx,
            options: {
                submit: true,
                expire: 300
            }
        };
        
        // Encode the payload as base64 for the URL
        const encodedPayload = btoa(JSON.stringify(payload));
        
        // Build the Xaman URL with the encoded payload
        const xamanUrl = `https://xumm.app/sign/${encodedPayload}`;
        
        console.log('📱 Xaman URL created for NUTS payment');
        console.log('📍 Destination:', data.to);
        console.log('💰 Amount:', data.amount, data.currency);
        console.log('🪙 Token issuer:', data.issuer);
        
        return xamanUrl;
    }

    /**
     * Add payment confirmation button for fallback method
     */
    addPaymentConfirmButton() {
        const modal = document.getElementById('xaman-payment-modal');
        if (!modal) return;
        
        const modalBody = modal.querySelector('.modal-body');
        if (!modalBody || modalBody.querySelector('#payment-confirm-section')) return;
        
        const confirmSection = document.createElement('div');
        confirmSection.id = 'payment-confirm-section';
        confirmSection.style.cssText = 'margin-top: 25px; padding-top: 25px; border-top: 1px solid #333; text-align: center;';
        confirmSection.innerHTML = `
            <p style="color: #888; margin-bottom: 15px;">After completing payment in Xaman:</p>
            <button onclick="window.xamanAPIPayment.confirmPayment()" class="btn btn-success" style="font-size: 1.1em; padding: 12px 30px;">
                ✅ Payment Complete - Submit Entry
            </button>
        `;
        
        modalBody.appendChild(confirmSection);
    }

    /**
     * Manual payment confirmation for fallback method
     */
    confirmPayment() {
        console.log('✅ Payment confirmed by user (fallback method)');
        
        // Show success state
        const modal = document.getElementById('xaman-payment-modal');
        if (modal) {
            const modalBody = modal.querySelector('.modal-body');
            modalBody.innerHTML = `
                <div style="text-align: center; padding: 40px;">
                    <div style="font-size: 4em; margin-bottom: 20px;">✅</div>
                    <h3 style="color: #4CAF50; margin-bottom: 20px;">Payment Confirmed!</h3>
                    <p style="color: #ccc; margin-bottom: 30px;">Your contest entry has been submitted.</p>
                    <button onclick="window.xamanAPIPayment.closeModal()" class="btn btn-primary">
                        Continue
                    </button>
                </div>
            `;
        }
        
        // Resolve the payment promise
        if (window.xamanPaymentResolve) {
            window.xamanPaymentResolve({
                success: true,
                txid: 'MANUAL_CONFIRM_' + Date.now(),
                timestamp: new Date().toISOString()
            });
        }
        
        // Auto close after 2 seconds
        setTimeout(() => this.closeModal(), 2000);
    }

    /**
     * Convert string to hex
     */
    stringToHex(str) {
        let hex = '';
        for (let i = 0; i < str.length; i++) {
            const charCode = str.charCodeAt(i);
            const hexValue = charCode.toString(16).toUpperCase();
            hex += hexValue.padStart(2, '0');
        }
        return hex;
    }
}

// Create global instance
window.xamanAPIPayment = new XamanAPIPayment();

// Also expose for contest wallet
window.contestWallet = {
    processEntryPayment: async function() {
        return window.xamanAPIPayment.createContestPayment();
    }
};

console.log('✅ Xaman API Payment system loaded');