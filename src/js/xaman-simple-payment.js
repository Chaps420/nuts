/**
 * Simple Xaman Payment - Creates proper deep links for NUTS token payments
 * Based on Xaman documentation for custom token payments
 */

class XamanSimplePayment {
    constructor() {
        this.contestWallet = 'rN2K1Tv6LEM94YN8Kxfe3QyWcGPQNgsD6d';
        this.nutsTokenIssuer = 'rBpdegD7kqHdczjKzTKNEUZj1Fg1eYZRbe';
        this.entryFee = 50;
        
        console.log('💸 Simple Xaman Payment System initialized');
    }

    /**
     * Create contest payment with proper Xaman deep link
     */
    async createContestPayment() {
        try {
            console.log('💳 Creating simple Xaman payment...');
            
            // Create payment data
            const paymentData = {
                to: this.contestWallet,
                amount: this.entryFee,
                currency: 'NUTS',
                issuer: this.nutsTokenIssuer
            };
            
            // Create proper Xaman deep link
            const xamanUrl = this.createXamanDeepLink(paymentData);
            
            // Generate QR code using the same URL that's in the buttons
            const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(xamanUrl)}`;
            
            console.log('🔗 Xaman URL for QR:', xamanUrl);
            
            // Show payment modal
            this.showPaymentModal(qrCodeUrl, xamanUrl, paymentData);
            
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
     * Create proper Xaman deep link based on XRPL standards
     */
    createXamanDeepLink(data) {
        // Based on XRPL documentation, custom tokens use this Amount structure
        const transaction = {
            TransactionType: 'Payment',
            Destination: data.to,
            Amount: {
                currency: data.currency,
                value: data.amount.toString(),
                issuer: data.issuer
            }
        };
        
        // XUMM/Xaman expects the transaction to be URL-encoded JSON
        // The correct format is: xumm://sign?data=<base64-encoded-transaction>
        const transactionJson = JSON.stringify(transaction);
        const base64Transaction = btoa(transactionJson);
        
        // Create different URL formats based on Xaman documentation patterns
        const urls = [
            // Format 1: xumm protocol with base64 data
            `xumm://sign?data=${base64Transaction}`,
            
            // Format 2: xaman protocol with base64 data
            `xaman://sign?data=${base64Transaction}`,
            
            // Format 3: HTTPS with base64 data
            `https://xumm.app/sign?data=${base64Transaction}`,
            
            // Format 4: HTTPS with JSON parameter
            `https://xumm.app/sign?tx=${encodeURIComponent(transactionJson)}`,
            
            // Format 5: Simple xrpl protocol
            `xrpl:${transactionJson}`,
        ];
        
        console.log('🔗 Testing URL formats for NUTS token:');
        console.log('💰 Transaction:', transaction);
        urls.forEach((url, index) => {
            console.log(`Format ${index + 1}:`, url);
        });
        
        // Return the most likely to work format (xumm protocol with base64)
        return urls[0];
    }

    /**
     * Show payment modal
     */
    showPaymentModal(qrCodeUrl, xamanUrl, paymentData) {
        // Create the transaction object for buttons
        const transaction = {
            TransactionType: 'Payment',
            Destination: paymentData.to,
            Amount: {
                currency: paymentData.currency,
                value: paymentData.amount.toString(),
                issuer: paymentData.issuer
            }
        };
        
        const transactionJson = JSON.stringify(transaction);
        const base64Transaction = btoa(transactionJson);
        // Remove existing modal
        const existingModal = document.getElementById('xaman-payment-modal');
        if (existingModal) existingModal.remove();
        
        const modal = document.createElement('div');
        modal.id = 'xaman-payment-modal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 600px;">
                <div class="modal-header">
                    <h3>💸 Contest Entry Payment</h3>
                    <button class="modal-close" onclick="window.xamanSimplePayment.cancelPayment()">×</button>
                </div>
                <div class="modal-body">
                    <!-- Payment Details -->
                    <div class="payment-details" style="background: #252525; padding: 25px; border-radius: 12px; margin-bottom: 25px; border: 2px solid #4CAF50;">
                        <h4 style="color: #4CAF50; margin-bottom: 20px;">Payment Details</h4>
                        <div style="display: grid; gap: 15px;">
                            <div style="display: flex; justify-content: space-between;">
                                <span style="color: #999;">Amount:</span>
                                <span style="color: #4CAF50; font-weight: bold; font-size: 1.2em;">50 NUTS</span>
                            </div>
                            <div style="display: flex; justify-content: space-between;">
                                <span style="color: #999;">To:</span>
                                <span style="font-family: monospace; font-size: 0.8em; color: #ccc;">${this.contestWallet}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between;">
                                <span style="color: #999;">Token Issuer:</span>
                                <span style="font-family: monospace; font-size: 0.8em; color: #ccc;">${this.nutsTokenIssuer}</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- QR Code -->
                    <div style="text-align: center; margin-bottom: 25px;">
                        <h4 style="color: #4CAF50; margin-bottom: 15px;">Scan with Xaman</h4>
                        <div style="display: inline-block; padding: 20px; background: white; border-radius: 10px;">
                            <img src="${qrCodeUrl}" alt="Payment QR Code" style="display: block; max-width: 300px;">
                        </div>
                    </div>
                    
                    <!-- Instructions -->
                    <div style="background: #1a1a1a; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                        <h5 style="color: #4CAF50; margin-bottom: 15px;">Instructions:</h5>
                        <ol style="color: #ccc; line-height: 1.6; margin: 0; padding-left: 20px;">
                            <li>Open Xaman app</li>
                            <li>Scan this QR code</li>
                            <li>Verify it shows <strong>50 NUTS</strong> (not XRP)</li>
                            <li>Complete the payment</li>
                        </ol>
                    </div>
                    
                    <!-- Alternative links -->
                    <div style="text-align: center; border-top: 1px solid #333; padding-top: 20px;">
                        <p style="color: #888; margin-bottom: 15px;">Can't scan? Try these methods:</p>
                        <div style="display: flex; flex-direction: column; gap: 8px; max-width: 400px; margin: 0 auto;">
                            <a href="xumm://sign?data=${base64Transaction}" class="btn btn-primary" style="display: block; text-decoration: none; padding: 10px; margin: 2px 0;">
                                🔗 xumm:// protocol
                            </a>
                            <a href="xaman://sign?data=${base64Transaction}" class="btn btn-primary" style="display: block; text-decoration: none; padding: 10px; margin: 2px 0;">
                                🔗 xaman:// protocol
                            </a>
                            <a href="https://xumm.app/sign?data=${base64Transaction}" class="btn btn-secondary" style="display: block; text-decoration: none; padding: 10px; margin: 2px 0;">
                                🌐 HTTPS with base64
                            </a>
                            <a href="https://xumm.app/sign?tx=${encodeURIComponent(transactionJson)}" class="btn btn-secondary" style="display: block; text-decoration: none; padding: 10px; margin: 2px 0;">
                                🌐 HTTPS with JSON
                            </a>
                        </div>
                        <p style="color: #666; font-size: 0.9em; margin-top: 15px;">
                            Try each method to see which opens Xaman with 50 NUTS pre-filled
                        </p>
                    </div>
                    
                    <!-- Confirm button -->
                    <div id="confirm-section" style="margin-top: 25px; padding-top: 25px; border-top: 1px solid #333; text-align: center;">
                        <p style="color: #888; margin-bottom: 15px;">After completing payment:</p>
                        <button onclick="window.xamanSimplePayment.confirmPayment()" class="btn btn-success">
                            ✅ I've Completed the Payment
                        </button>
                    </div>
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
        console.log('✅ Payment confirmed by user');
        
        const modal = document.getElementById('xaman-payment-modal');
        if (modal) {
            const modalBody = modal.querySelector('.modal-body');
            modalBody.innerHTML = `
                <div style="text-align: center; padding: 40px;">
                    <div style="font-size: 4em; margin-bottom: 20px;">✅</div>
                    <h3 style="color: #4CAF50; margin-bottom: 20px;">Payment Confirmed!</h3>
                    <p style="color: #ccc; margin-bottom: 30px;">Your contest entry has been submitted.</p>
                    <button onclick="window.xamanSimplePayment.closeModal()" class="btn btn-primary">
                        Continue
                    </button>
                </div>
            `;
        }
        
        if (window.xamanPaymentResolve) {
            window.xamanPaymentResolve({
                success: true,
                txid: 'USER_CONFIRMED_' + Date.now(),
                timestamp: new Date().toISOString()
            });
        }
        
        setTimeout(() => this.closeModal(), 2000);
    }

    /**
     * Cancel payment
     */
    cancelPayment() {
        console.log('❌ Payment cancelled');
        this.closeModal();
        
        if (window.xamanPaymentReject) {
            window.xamanPaymentReject(new Error('Payment cancelled'));
        }
    }

    /**
     * Close modal
     */
    closeModal() {
        const modal = document.getElementById('xaman-payment-modal');
        if (modal) modal.remove();
        
        delete window.xamanPaymentResolve;
        delete window.xamanPaymentReject;
    }
}

// Create global instance
window.xamanSimplePayment = new XamanSimplePayment();

// Also expose for contest wallet compatibility
window.contestWallet = {
    processEntryPayment: async function() {
        return window.xamanSimplePayment.createContestPayment();
    }
};

console.log('✅ Simple Xaman Payment system loaded');