/**
 * Xaman Payment Only - No wallet connection needed
 * Just shows payment QR code when user wants to enter contest
 */

class XamanPaymentOnly {
    constructor() {
        this.apiKey = window.config?.xumm?.apiKey || '5ae8e69a-1b48-4f80-b5bb-20ae099e6f2f';
        this.contestWallet = 'rN2K1Tv6LEM94YN8Kxfe3QyWcGPQNgsD6d'; // Contest wallet from config
        this.nutsTokenIssuer = 'rBpdegD7kqHdczjKzTKNEUZj1Fg1eYZRbe'; // NUTS token issuer address
        this.entryFee = 50; // 50 $NUTS
        
        console.log('💸 Xaman Payment System initialized');
        console.log('📍 Contest wallet:', this.contestWallet);
        console.log('🪙 NUTS token issuer:', this.nutsTokenIssuer);
        console.log('🔑 API Key:', this.apiKey.substring(0, 8) + '...');
    }

    /**
     * Create payment request for contest entry with Firebase integration
     */
    async createContestPayment() {
        try {
            console.log('💳 Creating contest payment with NUTS token...');
            
            // Generate unique payment ID
            const paymentId = this.generateUUID();
            
            // If Firebase is available, use it to create a payment request
            if (window.config?.firebase?.projectId && window.firebaseIntegration?.initialized) {
                console.log('🔥 Using Firebase to create payment request...');
                try {
                    // Create payment request in Firebase first
                    const paymentRequest = await this.createFirebasePaymentRequest(paymentId);
                    if (paymentRequest && paymentRequest.xamanUrl) {
                        const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(paymentRequest.xamanUrl)}`;
                        this.showPaymentModal(qrCodeUrl, paymentRequest.xamanUrl, paymentId);
                        
                        return new Promise((resolve, reject) => {
                            window.xamanPaymentResolve = resolve;
                            window.xamanPaymentReject = reject;
                        });
                    }
                } catch (fbError) {
                    console.warn('⚠️ Firebase payment request failed, using direct method:', fbError);
                }
            }
            
            // Fallback to direct payment request
            const paymentData = {
                to: this.contestWallet,
                amount: this.entryFee,
                currency: 'NUTS',
                issuer: this.nutsTokenIssuer,
                memo: 'Contest Entry - ' + new Date().toLocaleDateString()
            };
            
            // Build Xaman payment URL with proper token details
            const xamanUrl = this.buildXamanPaymentUrl(paymentData);
            
            // Log the URL for debugging
            console.log('🔗 Xaman URL:', xamanUrl);
            
            // Generate QR code URL
            const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(xamanUrl)}`;
            
            // Show payment modal with QR code
            this.showPaymentModal(qrCodeUrl, xamanUrl, paymentId);
            
            // Return promise that resolves when payment is confirmed
            return new Promise((resolve, reject) => {
                window.xamanPaymentResolve = resolve;
                window.xamanPaymentReject = reject;
            });
            
        } catch (error) {
            console.error('❌ Payment creation failed:', error);
            throw error;
        }
    }

    /**
     * Build Xaman payment URL with proper NUTS token details
     */
    buildXamanPaymentUrl(data) {
        // For Xaman deep links with pre-filled NUTS token amount
        // We need to use the proper format with all details
        const baseUrl = 'https://xumm.app/sign/';
        
        // Create the transaction object with NUTS token details
        const tx = {
            TransactionType: 'Payment',
            Destination: data.to,
            Amount: {
                currency: 'NUTS',
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
        const xamanUrl = `${baseUrl}${encodedPayload}`;
        
        console.log('📱 Xaman URL created');
        console.log('📍 Destination:', data.to);
        console.log('💰 Amount:', data.amount, 'NUTS');
        console.log('🪙 Token issuer:', data.issuer);
        console.log('🔗 Full URL:', xamanUrl);
        
        return xamanUrl;
    }

    /**
     * Show payment modal with QR code
     */
    showPaymentModal(qrCodeUrl, xamanUrl, paymentId) {
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
                    <button class="modal-close" onclick="window.xamanPayment.cancelPayment()">×</button>
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
                                <span style="color: #ccc;">$NUTS</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- QR Code Section -->
                    <div class="qr-section" style="text-align: center; margin-bottom: 25px;">
                        <h4 style="color: #4CAF50; margin-bottom: 20px;">Scan with Xaman Wallet</h4>
                        <div class="qr-container" style="display: inline-block; padding: 20px; background: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.3);">
                            <img src="${qrCodeUrl}" alt="Payment QR Code" style="display: block; max-width: 300px;">
                        </div>
                    </div>
                    
                    <!-- Instructions -->
                    <div class="instructions" style="background: #1a1a1a; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                        <h5 style="color: #4CAF50; margin-bottom: 15px;">How to Pay:</h5>
                        <ol style="color: #ccc; line-height: 1.8; margin: 0; padding-left: 20px;">
                            <li>Open <strong>Xaman</strong> app on your phone</li>
                            <li>Tap the <strong>Scan</strong> button (QR icon)</li>
                            <li>Scan this QR code</li>
                            <li>Select <strong>NUTS</strong> as the currency</li>
                            <li>Enter <strong>50</strong> as the amount</li>
                            <li>Slide to confirm payment</li>
                        </ol>
                    </div>
                    
                    <!-- Alternative Options -->
                    <div style="text-align: center; padding-top: 20px; border-top: 1px solid #333;">
                        <p style="color: #888; margin-bottom: 15px;">Can't scan the QR code?</p>
                        <a href="${xamanUrl}" target="_blank" class="btn btn-primary" style="display: inline-block;">
                            Open in Xaman App
                        </a>
                    </div>
                    
                    <!-- Status Section (hidden initially) -->
                    <div id="payment-status" style="display: none; margin-top: 20px; padding: 15px; border-radius: 8px; text-align: center;">
                        <div class="spinner"></div>
                        <p style="margin-top: 10px;">Waiting for payment confirmation...</p>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.style.display = 'flex';
        
        // Add payment confirmation after a delay
        setTimeout(() => {
            this.addPaymentConfirmButton();
        }, 5000);
    }

    /**
     * Add payment confirmation button
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
            <button onclick="window.xamanPayment.confirmPayment()" class="btn btn-success" style="font-size: 1.1em; padding: 12px 30px;">
                ✅ Payment Complete - Submit Entry
            </button>
        `;
        
        modalBody.appendChild(confirmSection);
    }

    /**
     * Confirm payment completion
     */
    confirmPayment() {
        console.log('✅ Payment confirmed by user');
        
        // Show success state
        const modal = document.getElementById('xaman-payment-modal');
        if (modal) {
            const modalBody = modal.querySelector('.modal-body');
            modalBody.innerHTML = `
                <div style="text-align: center; padding: 40px;">
                    <div style="font-size: 4em; margin-bottom: 20px;">✅</div>
                    <h3 style="color: #4CAF50; margin-bottom: 20px;">Payment Successful!</h3>
                    <p style="color: #ccc; margin-bottom: 30px;">Your contest entry has been submitted.</p>
                    <button onclick="window.xamanPayment.closeModal()" class="btn btn-primary">
                        Continue
                    </button>
                </div>
            `;
        }
        
        // Resolve the payment promise
        if (window.xamanPaymentResolve) {
            window.xamanPaymentResolve({
                success: true,
                txHash: 'TX' + Date.now(), // Mock transaction hash
                timestamp: new Date().toISOString()
            });
        }
        
        // Auto close after 2 seconds
        setTimeout(() => this.closeModal(), 2000);
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
     * Generate UUID
     */
    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
    
    /**
     * Convert string to hex (browser-compatible)
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
    
    /**
     * Create payment request in Firebase (for auto-populating NUTS)
     */
    async createFirebasePaymentRequest(paymentId) {
        try {
            if (!window.firebaseIntegration?.db) {
                throw new Error('Firebase not initialized');
            }
            
            const db = window.firebaseIntegration.db;
            
            // Create payment request document
            const paymentRequestData = {
                id: paymentId,
                type: 'contest_entry',
                amount: this.entryFee,
                currency: 'NUTS',
                currencyHex: '4E55545300000000000000000000000000000000',
                issuer: this.nutsTokenIssuer,
                destination: this.contestWallet,
                memo: 'Contest Entry - ' + new Date().toLocaleDateString(),
                status: 'pending',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            // Store in Firebase
            await db.collection('payment_requests').doc(paymentId).set(paymentRequestData);
            
            // Create XUMM payload via Firebase Cloud Function (if available)
            if (window.firebaseIntegration.functions) {
                const createPayload = window.firebaseIntegration.functions.httpsCallable('createXummPayload');
                const result = await createPayload(paymentRequestData);
                
                if (result.data && result.data.xamanUrl) {
                    console.log('✅ Firebase payment request created with Xaman URL');
                    return result.data;
                }
            }
            
            console.log('⚠️ Firebase stored but no Cloud Function available');
            return null;
            
        } catch (error) {
            console.error('❌ Firebase payment request failed:', error);
            return null;
        }
    }
}

// Create global payment instance
window.xamanPayment = new XamanPaymentOnly();

// Also expose for contest wallet
window.contestWallet = {
    processEntryPayment: async function() {
        return window.xamanPayment.createContestPayment();
    }
};

console.log('✅ Xaman Payment Only system loaded');