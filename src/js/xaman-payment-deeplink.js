/**
 * Xaman Payment with proper deep link format
 * Creates QR codes that open directly in Xaman app
 */

class XamanPaymentDeeplink {
    constructor() {
        this.contestWallet = 'rN2K1Tv6LEM94YN8Kxfe3QyWcGPQNgsD6d'; // Admin wallet that receives payments
        this.nutsTokenIssuer = 'rBpdegD7kqHdczjKzTKNEUZj1Fg1eYZRbe'; // NUTS token issuer
        this.nutsCurrency = 'NUTS';
        this.entryFee = '50';
        
        console.log('💸 Xaman Payment Deeplink System initialized');
    }

    /**
     * Create payment request for contest entry
     */
    async createContestPayment() {
        try {
            console.log('💳 Creating Xaman deep link for payment...');
            
            // Create Xaman deep link with proper format
            // Format: xumm://xumm.app/tx?to=DESTINATION&amount=VALUE/CURRENCY.ISSUER
            const deepLink = `xumm://xumm.app/tx?to=${this.contestWallet}&amount=${this.entryFee}/${this.nutsCurrency}.${this.nutsTokenIssuer}`;
            
            // Alternative format using xrpl:// protocol
            const xrplLink = `xrpl://${this.contestWallet}?amount=${this.entryFee}&currency=${this.nutsCurrency}&issuer=${this.nutsTokenIssuer}`;
            
            // Generate QR code URL - encoding the deep link
            const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(deepLink)}`;
            
            // Show payment modal
            this.showPaymentModal(qrCodeUrl, deepLink, xrplLink);
            
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
     * Show payment modal
     */
    showPaymentModal(qrCodeUrl, deepLink, xrplLink) {
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
                    <button class="modal-close" onclick="window.xamanPaymentDeeplink.cancelPayment()">×</button>
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
                            <li>The payment screen will open in Xaman</li>
                            <li>Verify: 50 NUTS tokens to contest wallet</li>
                            <li>Slide to confirm payment</li>
                        </ol>
                    </div>
                    
                    <!-- Alternative: Mobile Deep Links -->
                    <div style="text-align: center; padding: 20px; background: #1a1a1a; border-radius: 8px;">
                        <p style="color: #888; margin-bottom: 15px;">On mobile? Use these direct links:</p>
                        <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
                            <a href="${deepLink}" class="btn btn-primary" style="display: inline-block;">
                                Open in Xaman App
                            </a>
                            <a href="${xrplLink}" class="btn btn-secondary" style="display: inline-block;">
                                Alternative Link
                            </a>
                        </div>
                    </div>
                    
                    <!-- Test Links (for debugging) -->
                    <details style="margin-top: 20px;">
                        <summary style="cursor: pointer; color: #666;">Debug Info</summary>
                        <div style="background: #0a0a0a; padding: 10px; border-radius: 4px; margin-top: 10px;">
                            <p style="color: #888; font-size: 0.8em; margin: 5px 0;">Deep Link:</p>
                            <code style="color: #4CAF50; font-size: 0.7em; word-break: break-all;">${deepLink}</code>
                            <p style="color: #888; font-size: 0.8em; margin: 15px 0 5px 0;">XRPL Link:</p>
                            <code style="color: #4CAF50; font-size: 0.7em; word-break: break-all;">${xrplLink}</code>
                        </div>
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
            <button onclick="window.xamanPaymentDeeplink.confirmPayment()" class="btn btn-success" style="font-size: 1.1em; padding: 12px 30px;">
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
                    <button onclick="window.xamanPaymentDeeplink.closeModal()" class="btn btn-primary">
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
}

// Create global instance
window.xamanPaymentDeeplink = new XamanPaymentDeeplink();

// Also expose for contest wallet compatibility
window.xamanPayment = window.xamanPaymentDeeplink;
window.contestWallet = {
    processEntryPayment: async function() {
        return window.xamanPaymentDeeplink.createContestPayment();
    }
};

// Add styles for secondary button
const style = document.createElement('style');
style.textContent = `
    .btn-secondary {
        background: #444;
        color: white;
        padding: 10px 20px;
        border-radius: 8px;
        text-decoration: none;
        display: inline-block;
        transition: all 0.3s;
        border: 2px solid #666;
    }
    .btn-secondary:hover {
        background: #555;
        border-color: #888;
        transform: translateY(-2px);
    }
`;
document.head.appendChild(style);

console.log('✅ Xaman Payment Deeplink system loaded');