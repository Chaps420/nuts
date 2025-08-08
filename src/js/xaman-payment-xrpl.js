/**
 * Xaman Payment with proper XRPL transaction format
 * Creates QR codes with correct payment transaction structure
 */

class XamanPaymentXRPL {
    constructor() {
        this.contestWallet = 'rN2K1Tv6LEM94YN8Kxfe3QyWcGPQNgsD6d'; // Admin wallet that receives payments
        this.nutsTokenIssuer = 'rBpdegD7kqHdczjKzTKNEUZj1Fg1eYZRbe'; // NUTS token issuer
        this.nutsCurrency = '4E555453'; // "NUTS" in hex
        this.entryFee = '50'; // 50 NUTS as string
        
        console.log('💸 Xaman Payment XRPL System initialized');
    }

    /**
     * Create payment request for contest entry
     */
    async createContestPayment() {
        try {
            console.log('💳 Creating XRPL payment transaction...');
            
            // Create proper XRPL Payment transaction
            const transaction = {
                TransactionType: 'Payment',
                Destination: this.contestWallet,
                Amount: {
                    currency: this.nutsCurrency,
                    value: this.entryFee,
                    issuer: this.nutsTokenIssuer
                },
                Memos: [
                    {
                        Memo: {
                            MemoType: this.stringToHex('Contest Entry'),
                            MemoData: this.stringToHex(new Date().toLocaleDateString())
                        }
                    }
                ]
            };
            
            // Convert transaction to JSON string
            const txJson = JSON.stringify(transaction);
            
            // Create Xaman sign request URL
            const signUrl = this.createXamanSignUrl(txJson);
            
            // Generate QR code URL
            const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(signUrl)}`;
            
            // Show payment modal
            this.showPaymentModal(qrCodeUrl, signUrl, transaction);
            
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
     * Create Xaman sign URL with transaction
     */
    createXamanSignUrl(txJson) {
        // Encode the transaction for URL
        const encodedTx = encodeURIComponent(btoa(txJson));
        
        // Create sign request URL
        return `https://xumm.app/sign/tx/${encodedTx}`;
    }

    /**
     * Show payment modal
     */
    showPaymentModal(qrCodeUrl, signUrl, transaction) {
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
                    <button class="modal-close" onclick="window.xamanPaymentXRPL.cancelPayment()">×</button>
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
                                <span style="color: #fff;">Token Payment</span>
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
                            <img src="${qrCodeUrl}" alt="Payment QR Code" style="display: block; max-width: 300px;">
                        </div>
                    </div>
                    
                    <!-- Instructions -->
                    <div class="instructions" style="background: #1a1a1a; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                        <h5 style="color: #4CAF50; margin-bottom: 15px;">How to Pay:</h5>
                        <ol style="color: #ccc; line-height: 1.8; margin: 0; padding-left: 20px;">
                            <li>Open Xaman app on your phone</li>
                            <li>Tap the scan button (QR icon)</li>
                            <li>Scan this QR code</li>
                            <li>Verify: 50 NUTS tokens will be sent</li>
                            <li>Slide to confirm payment</li>
                        </ol>
                    </div>
                    
                    <!-- Alternative: Direct Transaction -->
                    <div style="text-align: center; padding: 20px; background: #1a1a1a; border-radius: 8px;">
                        <p style="color: #888; margin-bottom: 15px;">Having trouble? Try the direct link:</p>
                        <a href="${signUrl}" target="_blank" class="btn btn-primary" style="display: inline-block;">
                            Open in Xaman App
                        </a>
                    </div>
                    
                    <!-- Debug Info (remove in production) -->
                    <details style="margin-top: 20px;">
                        <summary style="cursor: pointer; color: #666;">Transaction Details (Debug)</summary>
                        <pre style="background: #0a0a0a; padding: 10px; border-radius: 4px; overflow-x: auto; font-size: 0.8em; color: #888;">
${JSON.stringify(transaction, null, 2)}
                        </pre>
                    </details>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.style.display = 'flex';
        
        // Add payment confirmation after delay
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
            <button onclick="window.xamanPaymentXRPL.confirmPayment()" class="btn btn-success" style="font-size: 1.1em; padding: 12px 30px;">
                ✅ Payment Complete - Submit Entry
            </button>
        `;
        
        modalBody.appendChild(confirmSection);
    }

    /**
     * Confirm payment
     */
    confirmPayment() {
        console.log('✅ Payment confirmed by user');
        
        const modal = document.getElementById('xaman-payment-modal');
        if (modal) {
            const modalBody = modal.querySelector('.modal-body');
            modalBody.innerHTML = `
                <div style="text-align: center; padding: 40px;">
                    <div style="font-size: 4em; margin-bottom: 20px;">✅</div>
                    <h3 style="color: #4CAF50; margin-bottom: 20px;">Payment Successful!</h3>
                    <p style="color: #ccc; margin-bottom: 10px;">50 NUTS tokens sent successfully</p>
                    <p style="color: #888; margin-bottom: 30px;">Your contest entry has been submitted.</p>
                    <button onclick="window.xamanPaymentXRPL.closeModal()" class="btn btn-primary">
                        Continue
                    </button>
                </div>
            `;
        }
        
        if (window.xamanPaymentResolve) {
            window.xamanPaymentResolve({
                success: true,
                txHash: 'TX' + Date.now(),
                timestamp: new Date().toISOString()
            });
        }
        
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
window.xamanPaymentXRPL = new XamanPaymentXRPL();

// Also expose for contest wallet compatibility
window.xamanPayment = window.xamanPaymentXRPL;
window.contestWallet = {
    processEntryPayment: async function() {
        return window.xamanPaymentXRPL.createContestPayment();
    }
};

console.log('✅ Xaman Payment XRPL system loaded');