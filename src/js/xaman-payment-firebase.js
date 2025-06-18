/**
 * Xaman Payment with Firebase Backend
 * Uses Firebase Cloud Functions to create proper XUMM payloads
 */

class XamanPaymentFirebase {
    constructor() {
        this.contestWallet = 'rN2K1Tv6LEM94YN8Kxfe3QyWcGPQNgsD6d';
        this.currentPayload = null;
        this.websocket = null;
        
        console.log('💸 Xaman Payment Firebase System initialized');
    }

    /**
     * Create payment request for contest entry
     */
    async createContestPayment() {
        try {
            console.log('💳 Creating contest payment via Firebase...');
            
            // Check if Firebase is initialized
            if (!window.firebase || !window.firebase.functions) {
                throw new Error('Firebase not initialized');
            }

            // Get user's wallet address (if available)
            const userWallet = window.walletManager?.address || '';
            
            // Call Firebase function to create XUMM payload
            const createPayment = firebase.functions().httpsCallable('createXummPayment');
            const result = await createPayment({
                userWallet: userWallet,
                returnUrl: window.location.href
            });
            
            console.log('📱 XUMM Payload created:', result.data);
            this.currentPayload = result.data;
            
            // Show payment modal with QR code
            this.showPaymentModal(result.data);
            
            // Start monitoring payment status
            this.monitorPaymentStatus(result.data.uuid);
            
            // Return promise that resolves when payment is confirmed
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
     * Show payment modal with XUMM QR code
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
                    <button class="modal-close" onclick="window.xamanPaymentFirebase.cancelPayment()">×</button>
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
                                    ${this.contestWallet.substring(0, 12)}...${this.contestWallet.substring(-8)}
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- QR Code Section -->
                    <div class="qr-section" style="text-align: center; margin-bottom: 25px;">
                        <h4 style="color: #4CAF50; margin-bottom: 20px;">Scan with Xaman Wallet</h4>
                        <div class="qr-container" style="display: inline-block; padding: 20px; background: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.3);">
                            <img src="${payload.qr_png}" alt="Payment QR Code" style="display: block; max-width: 300px;">
                        </div>
                    </div>
                    
                    <!-- Instructions -->
                    <div class="instructions" style="background: #1a1a1a; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                        <h5 style="color: #4CAF50; margin-bottom: 15px;">How to Pay:</h5>
                        <ol style="color: #ccc; line-height: 1.8; margin: 0; padding-left: 20px;">
                            <li>Open <strong>Xaman</strong> app on your phone</li>
                            <li>Tap the <strong>Scan</strong> button (QR icon)</li>
                            <li>Scan this QR code</li>
                            <li>Review: <strong>50 NUTS</strong> will be shown</li>
                            <li>Slide to confirm the transaction</li>
                        </ol>
                    </div>
                    
                    <!-- Mobile Button -->
                    <div style="text-align: center; padding: 20px; background: #1a1a1a; border-radius: 8px;">
                        <p style="color: #888; margin-bottom: 15px;">On mobile? Open directly in Xaman:</p>
                        <a href="${payload.next.always}" target="_blank" class="btn btn-primary" style="display: inline-block;">
                            Open in Xaman App
                        </a>
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
     * Monitor payment status
     */
    async monitorPaymentStatus(payloadId) {
        console.log('👀 Monitoring payment status for:', payloadId);
        
        // Poll for status updates
        const checkStatus = async () => {
            try {
                const checkPayment = firebase.functions().httpsCallable('checkXummPayment');
                const result = await checkPayment({ payloadId });
                
                console.log('📊 Payment status:', result.data);
                
                if (result.data.signed) {
                    console.log('✅ Payment signed!');
                    this.onPaymentSuccess(result.data);
                    return true;
                } else if (result.data.cancelled || result.data.expired) {
                    console.log('❌ Payment cancelled or expired');
                    this.onPaymentCancelled();
                    return true;
                }
                
                return false;
            } catch (error) {
                console.error('Error checking status:', error);
                return false;
            }
        };
        
        // Check immediately
        const immediate = await checkStatus();
        if (immediate) return;
        
        // Then poll every 2 seconds
        this.statusInterval = setInterval(async () => {
            const done = await checkStatus();
            if (done && this.statusInterval) {
                clearInterval(this.statusInterval);
                this.statusInterval = null;
            }
        }, 2000);
        
        // Stop polling after 5 minutes
        setTimeout(() => {
            if (this.statusInterval) {
                clearInterval(this.statusInterval);
                this.statusInterval = null;
                this.onPaymentTimeout();
            }
        }, 300000);
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
                    <button onclick="window.xamanPaymentFirebase.closeModal()" class="btn btn-primary" style="margin-top: 20px;">
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
     * Handle cancelled payment
     */
    onPaymentCancelled() {
        console.log('❌ Payment cancelled');
        this.showError('Payment was cancelled. Please try again.');
        
        if (window.xamanPaymentReject) {
            window.xamanPaymentReject(new Error('Payment cancelled by user'));
        }
    }

    /**
     * Handle payment timeout
     */
    onPaymentTimeout() {
        console.log('⏱️ Payment timeout');
        this.showError('Payment request expired. Please try again.');
        
        if (window.xamanPaymentReject) {
            window.xamanPaymentReject(new Error('Payment timeout'));
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
        
        // Clear status interval
        if (this.statusInterval) {
            clearInterval(this.statusInterval);
            this.statusInterval = null;
        }
        
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
        if (this.statusInterval) {
            clearInterval(this.statusInterval);
            this.statusInterval = null;
        }
        delete window.xamanPaymentResolve;
        delete window.xamanPaymentReject;
    }
}

// Create global instance
window.xamanPaymentFirebase = new XamanPaymentFirebase();

// Also expose for contest wallet compatibility
window.xamanPayment = window.xamanPaymentFirebase;
window.contestWallet = {
    processEntryPayment: async function() {
        return window.xamanPaymentFirebase.createContestPayment();
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

console.log('✅ Xaman Payment Firebase system loaded');