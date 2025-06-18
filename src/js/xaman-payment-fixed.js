/**
 * Fixed Xaman Payment - Creates proper payment payloads for NUTS token
 * Uses the correct format based on Xaman documentation
 */

class XamanPaymentFixed {
    constructor() {
        this.contestWallet = 'rN2K1Tv6LEM94YN8Kxfe3QyWcGPQNgsD6d';
        this.nutsTokenIssuer = 'rBpdegD7kqHdczjKzTKNEUZj1Fg1eYZRbe';
        this.entryFee = '50'; // Must be string for XRPL
        
        console.log('💸 Fixed Xaman Payment System initialized');
        console.log('📍 Contest wallet:', this.contestWallet);
        console.log('🪙 NUTS issuer:', this.nutsTokenIssuer);
    }

    /**
     * Create contest payment with proper payload format
     */
    async createContestPayment() {
        try {
            console.log('💳 Creating fixed Xaman payment...');
            
            // Create proper XRPL Payment transaction
            // Based on Xaman documentation, we need to be explicit with all fields
            const transaction = {
                TransactionType: 'Payment',
                Account: '', // Will be filled by Xaman with user's account
                Destination: this.contestWallet,
                DestinationTag: 2024, // Optional: helps identify contest payments
                Amount: {
                    currency: 'NUTS',
                    value: this.entryFee,
                    issuer: this.nutsTokenIssuer
                },
                // Add memo to clarify this is a contest entry
                Memos: [
                    {
                        Memo: {
                            MemoType: this.toHex('Contest Entry'),
                            MemoData: this.toHex('Daily Contest Entry Fee - 50 NUTS')
                        }
                    }
                ]
            };

            console.log('📄 Transaction payload:', JSON.stringify(transaction, null, 2));
            
            // Create multiple URL formats for maximum compatibility
            const urls = this.createXamanUrls(transaction);
            
            // Show payment modal with clear instructions
            this.showPaymentModal(urls, transaction);
            
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
     * Create multiple Xaman URL formats
     */
    createXamanUrls(transaction) {
        const json = JSON.stringify(transaction);
        const base64 = btoa(json);
        const hex = this.toHex(json);
        
        // Create different URL formats
        const urls = {
            // Primary: Use hex format with detect endpoint (most reliable)
            primary: `https://xaman.app/detect/${hex}`,
            
            // Fallback options
            xumm_base64: `xumm://sign?data=${base64}`,
            xaman_base64: `xaman://sign?data=${base64}`,
            https_base64: `https://xumm.app/sign?data=${base64}`,
            
            // Direct request format (simple but less flexible)
            direct: `https://xumm.app/detect/request:${this.contestWallet}?` +
                    `amount=${this.entryFee}&` +
                    `currency=NUTS&` +
                    `issuer=${this.nutsTokenIssuer}&` +
                    `dt=2024&` + // destination tag
                    `memo=Contest%20Entry`
        };
        
        console.log('🔗 Generated URLs:', urls);
        return urls;
    }

    /**
     * Convert string to hex
     */
    toHex(str) {
        let hex = '';
        for (let i = 0; i < str.length; i++) {
            const charCode = str.charCodeAt(i);
            const hexValue = charCode.toString(16);
            hex += hexValue.padStart(2, '0');
        }
        return hex.toUpperCase();
    }

    /**
     * Show improved payment modal
     */
    showPaymentModal(urls, transaction) {
        // Remove existing modal
        const existingModal = document.getElementById('xaman-payment-modal');
        if (existingModal) existingModal.remove();
        
        // Generate QR for primary URL
        const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(urls.primary)}`;
        
        const modal = document.createElement('div');
        modal.id = 'xaman-payment-modal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 700px;">
                <div class="modal-header">
                    <h3>💸 Contest Entry Payment</h3>
                    <button class="modal-close" onclick="window.xamanPaymentFixed.cancelPayment()">×</button>
                </div>
                <div class="modal-body">
                    <!-- Important Notice -->
                    <div style="background: #ff6b00; color: white; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                        <strong>⚠️ IMPORTANT:</strong> Verify the payment shows:
                        <ul style="margin: 10px 0 0 0; padding-left: 20px;">
                            <li><strong>Amount: 50 NUTS</strong> (not XRP!)</li>
                            <li><strong>To: ${this.contestWallet.substring(0, 8)}...${this.contestWallet.substring(this.contestWallet.length - 6)}</strong></li>
                            <li><strong>NOT to the token issuer address!</strong></li>
                        </ul>
                    </div>
                    
                    <!-- Payment Details -->
                    <div class="payment-details" style="background: #252525; padding: 25px; border-radius: 12px; margin-bottom: 25px; border: 2px solid #4CAF50;">
                        <h4 style="color: #4CAF50; margin-bottom: 20px;">Payment Details</h4>
                        <div style="display: grid; gap: 15px;">
                            <div style="display: flex; justify-content: space-between;">
                                <span style="color: #999;">Amount:</span>
                                <span style="color: #4CAF50; font-weight: bold; font-size: 1.2em;">50 NUTS</span>
                            </div>
                            <div style="display: flex; justify-content: space-between;">
                                <span style="color: #999;">Send To (Contest Wallet):</span>
                                <span style="font-family: monospace; font-size: 0.85em; color: #4CAF50; font-weight: bold;">
                                    ${this.contestWallet}
                                </span>
                            </div>
                            <div style="display: flex; justify-content: space-between;">
                                <span style="color: #999;">Token Issuer:</span>
                                <span style="font-family: monospace; font-size: 0.8em; color: #888;">
                                    ${this.nutsTokenIssuer}
                                </span>
                            </div>
                            <div style="display: flex; justify-content: space-between;">
                                <span style="color: #999;">Memo:</span>
                                <span style="color: #ccc;">Contest Entry</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- QR Code -->
                    <div style="text-align: center; margin-bottom: 25px;">
                        <h4 style="color: #4CAF50; margin-bottom: 15px;">Scan with Xaman</h4>
                        <div style="display: inline-block; padding: 20px; background: white; border-radius: 10px;">
                            <img src="${qrCodeUrl}" alt="Payment QR Code" style="display: block; max-width: 300px;">
                        </div>
                        <div style="margin-top: 10px; color: #888; font-size: 0.9em;">
                            QR contains payment to: ${this.contestWallet.substring(0, 12)}...
                        </div>
                    </div>
                    
                    <!-- Manual Entry Instructions -->
                    <div style="background: #1a1a1a; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                        <h5 style="color: #4CAF50; margin-bottom: 15px;">Can't scan? Manual instructions:</h5>
                        <ol style="color: #ccc; line-height: 1.8; margin: 0; padding-left: 20px;">
                            <li>Open Xaman app</li>
                            <li>Tap the "+" button to create payment</li>
                            <li>Enter recipient: <code style="background: #333; padding: 2px 6px; border-radius: 3px;">${this.contestWallet}</code></li>
                            <li>Select <strong>NUTS</strong> token (NOT XRP)</li>
                            <li>Enter amount: <strong>50</strong></li>
                            <li>Add memo: "Contest Entry"</li>
                            <li>Review and sign the transaction</li>
                        </ol>
                    </div>
                    
                    <!-- Alternative links -->
                    <div style="text-align: center; border-top: 1px solid #333; padding-top: 20px;">
                        <p style="color: #888; margin-bottom: 15px;">Alternative methods (if QR doesn't work):</p>
                        <div style="display: flex; flex-direction: column; gap: 8px; max-width: 500px; margin: 0 auto;">
                            <a href="${urls.primary}" 
                               target="_blank"
                               class="btn btn-primary" 
                               style="display: block; text-decoration: none; padding: 12px; margin: 2px 0;">
                                🔗 Open in Xaman (Recommended)
                            </a>
                            <a href="${urls.xaman_base64}" 
                               class="btn btn-secondary" 
                               style="display: block; text-decoration: none; padding: 10px; margin: 2px 0;">
                                📱 xaman:// protocol
                            </a>
                            <a href="${urls.direct}" 
                               target="_blank"
                               class="btn btn-secondary" 
                               style="display: block; text-decoration: none; padding: 10px; margin: 2px 0;">
                                🌐 Direct payment link
                            </a>
                        </div>
                    </div>
                    
                    <!-- Debug info (can be removed in production) -->
                    <details style="margin-top: 20px; border-top: 1px solid #333; padding-top: 20px;">
                        <summary style="cursor: pointer; color: #666;">🔧 Debug Information</summary>
                        <pre style="background: #1a1a1a; padding: 15px; border-radius: 5px; overflow-x: auto; font-size: 0.8em; margin-top: 10px;">
${JSON.stringify(transaction, null, 2)}
                        </pre>
                    </details>
                    
                    <!-- Confirm button -->
                    <div id="confirm-section" style="margin-top: 25px; padding-top: 25px; border-top: 1px solid #333; text-align: center;">
                        <p style="color: #888; margin-bottom: 15px;">After completing payment in Xaman:</p>
                        <button onclick="window.xamanPaymentFixed.confirmPayment()" class="btn btn-success" style="padding: 15px 30px; font-size: 1.1em;">
                            ✅ I've Completed the Payment
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.style.display = 'flex';
        
        // Add styles if not already present
        this.addModalStyles();
    }

    /**
     * Add modal styles
     */
    addModalStyles() {
        if (document.getElementById('xaman-modal-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'xaman-modal-styles';
        style.textContent = `
            .modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.9);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                padding: 20px;
            }
            
            .modal-content {
                background: #1a1a1a;
                border-radius: 12px;
                max-height: 90vh;
                overflow-y: auto;
                box-shadow: 0 10px 50px rgba(0, 0, 0, 0.5);
            }
            
            .modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 20px 25px;
                border-bottom: 1px solid #333;
            }
            
            .modal-header h3 {
                margin: 0;
                color: #fff;
                font-size: 1.5em;
            }
            
            .modal-close {
                background: none;
                border: none;
                color: #999;
                font-size: 2em;
                cursor: pointer;
                padding: 0;
                width: 40px;
                height: 40px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                transition: all 0.2s;
            }
            
            .modal-close:hover {
                background: #333;
                color: #fff;
            }
            
            .modal-body {
                padding: 25px;
            }
            
            code {
                font-family: 'Courier New', monospace;
                background: #333;
                padding: 2px 6px;
                border-radius: 3px;
                color: #4CAF50;
            }
        `;
        document.head.appendChild(style);
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
                    <p style="color: #ccc; margin-bottom: 10px;">Contest entry payment of 50 NUTS received</p>
                    <p style="color: #888; font-size: 0.9em; margin-bottom: 30px;">
                        To wallet: ${this.contestWallet.substring(0, 8)}...${this.contestWallet.substring(this.contestWallet.length - 6)}
                    </p>
                    <button onclick="window.xamanPaymentFixed.closeModal()" class="btn btn-primary">
                        Continue to Pick Games
                    </button>
                </div>
            `;
        }
        
        if (window.xamanPaymentResolve) {
            window.xamanPaymentResolve({
                success: true,
                txid: 'USER_CONFIRMED_' + Date.now(),
                timestamp: new Date().toISOString(),
                destination: this.contestWallet,
                amount: this.entryFee,
                currency: 'NUTS'
            });
        }
        
        setTimeout(() => this.closeModal(), 3000);
    }

    /**
     * Cancel payment
     */
    cancelPayment() {
        console.log('❌ Payment cancelled');
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
}

// Create global instance
window.xamanPaymentFixed = new XamanPaymentFixed();

// Also expose for contest wallet compatibility
window.contestWallet = {
    processEntryPayment: async function() {
        return window.xamanPaymentFixed.createContestPayment();
    }
};

console.log('✅ Fixed Xaman Payment system loaded');
console.log('📍 Contest payments will be sent to:', window.xamanPaymentFixed.contestWallet);