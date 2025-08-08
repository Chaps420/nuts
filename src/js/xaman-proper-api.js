/**
 * Proper Xaman Payment using XUMM API Server
 * This creates real XUMM payloads that properly pre-populate NUTS tokens
 */

class XamanProperAPI {
    constructor() {
        this.serverUrl = 'http://localhost:3001';
        this.contestWallet = 'rN2K1Tv6LEM94YN8Kxfe3QyWcGPQNgsD6d';
        this.nutsTokenIssuer = 'rBpdegD7kqHdczjKzTKNEUZj1Fg1eYZRbe';
        this.entryFee = 50;
        
        console.log('💸 Proper Xaman API Payment System initialized');
        console.log('🔗 Server URL:', this.serverUrl);
    }

    /**
     * Create contest payment using proper XUMM API
     */
    async createContestPayment() {
        try {
            console.log('💳 Creating proper XUMM payment request...');
            
            // Call our XUMM server to create the payload
            const response = await fetch(`${this.serverUrl}/create-nuts-payment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    amount: this.entryFee,
                    memo: 'Contest Entry - Daily Pick\'em'
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`Server error: ${response.status} - ${errorData.error || 'Unknown error'}`);
            }

            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.error || 'Failed to create payment');
            }

            console.log('✅ XUMM payload created:', result);

            // Show payment modal with real XUMM QR code
            this.showPaymentModal(result);

            // Monitor payment status
            this.monitorPaymentStatus(result.uuid);

            return new Promise((resolve, reject) => {
                window.xamanPaymentResolve = resolve;
                window.xamanPaymentReject = reject;
            });

        } catch (error) {
            console.error('❌ Payment creation failed:', error);
            
            // Show error modal
            this.showErrorModal(error.message);
            throw error;
        }
    }

    /**
     * Show payment modal with real XUMM QR code
     */
    showPaymentModal(payloadData) {
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
                    <button class="modal-close" onclick="window.xamanProperAPI.cancelPayment()">×</button>
                </div>
                <div class="modal-body">
                    <!-- Payment Details -->
                    <div class="payment-details" style="background: #252525; padding: 25px; border-radius: 12px; margin-bottom: 25px; border: 2px solid #4CAF50;">
                        <h4 style="color: #4CAF50; margin-bottom: 20px;">Official XUMM Payment Request</h4>
                        <div style="display: grid; gap: 15px;">
                            <div style="display: flex; justify-content: space-between;">
                                <span style="color: #999;">Amount:</span>
                                <span style="color: #4CAF50; font-weight: bold; font-size: 1.3em;">50 NUTS</span>
                            </div>
                            <div style="display: flex; justify-content: space-between;">
                                <span style="color: #999;">To:</span>
                                <span style="font-family: monospace; font-size: 0.8em; color: #ccc;">${this.contestWallet}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between;">
                                <span style="color: #999;">Token Issuer:</span>
                                <span style="font-family: monospace; font-size: 0.8em; color: #ccc;">${this.nutsTokenIssuer}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between;">
                                <span style="color: #999;">Payload ID:</span>
                                <span style="font-family: monospace; font-size: 0.8em; color: #ccc;">${payloadData.uuid}</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- QR Code Section -->
                    <div style="text-align: center; margin-bottom: 25px;">
                        <h4 style="color: #4CAF50; margin-bottom: 15px;">Official XUMM QR Code</h4>
                        <div style="display: inline-block; padding: 20px; background: white; border-radius: 10px;">
                            <img src="${payloadData.qr_png}" alt="XUMM Payment QR Code" style="display: block; max-width: 300px;">
                        </div>
                        <p style="color: #4CAF50; margin-top: 10px; font-weight: bold;">
                            ✅ This QR code will show 50 NUTS in Xaman
                        </p>
                    </div>
                    
                    <!-- Instructions -->
                    <div style="background: #1a1a1a; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                        <h5 style="color: #4CAF50; margin-bottom: 15px;">How to Pay:</h5>
                        <ol style="color: #ccc; line-height: 1.6; margin: 0; padding-left: 20px;">
                            <li>Open <strong>Xaman</strong> app on your phone</li>
                            <li>Tap the <strong>Scan</strong> button</li>
                            <li>Scan the QR code above</li>
                            <li>Verify it shows <strong>50 NUTS</strong> (not XRP)</li>
                            <li>Slide to confirm the payment</li>
                        </ol>
                    </div>
                    
                    <!-- Alternative Options -->
                    <div style="text-align: center; border-top: 1px solid #333; padding-top: 20px;">
                        <p style="color: #888; margin-bottom: 15px;">Can't scan the QR code?</p>
                        <a href="${payloadData.next.always}" target="_blank" class="btn btn-primary" style="display: inline-block; text-decoration: none; padding: 12px 24px;">
                            Open in Xaman App
                        </a>
                    </div>
                    
                    <!-- Status Section -->
                    <div id="payment-status" style="margin-top: 20px; padding: 15px; border-radius: 8px; text-align: center; background: #1a1a1a;">
                        <div style="display: inline-block; width: 20px; height: 20px; border: 2px solid #4CAF50; border-top: 2px solid transparent; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                        <p style="margin-top: 10px; color: #888;">Waiting for payment confirmation...</p>
                    </div>
                </div>
            </div>
            
            <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        `;
        
        document.body.appendChild(modal);
        modal.style.display = 'flex';
    }

    /**
     * Show error modal
     */
    showErrorModal(errorMessage) {
        const modal = document.createElement('div');
        modal.id = 'xaman-error-modal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header">
                    <h3>❌ Payment Error</h3>
                    <button class="modal-close" onclick="document.getElementById('xaman-error-modal').remove()">×</button>
                </div>
                <div class="modal-body">
                    <div style="text-align: center; padding: 20px;">
                        <div style="font-size: 3em; margin-bottom: 20px;">⚠️</div>
                        <h4 style="color: #ff4444; margin-bottom: 15px;">Unable to Create Payment</h4>
                        <p style="color: #ccc; margin-bottom: 20px;">${errorMessage}</p>
                        <button onclick="document.getElementById('xaman-error-modal').remove()" class="btn btn-primary">
                            OK
                        </button>
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
    async monitorPaymentStatus(uuid) {
        const checkInterval = 2000; // Check every 2 seconds
        const maxChecks = 150; // Stop after 5 minutes (150 * 2 seconds)
        let checks = 0;

        const checkStatus = async () => {
            try {
                checks++;
                
                const response = await fetch(`${this.serverUrl}/check-payment/${uuid}`);
                const result = await response.json();

                if (result.success && result.resolved) {
                    if (result.signed) {
                        console.log('✅ Payment completed!', result);
                        this.paymentSuccess(result);
                    } else if (result.cancelled) {
                        console.log('❌ Payment cancelled');
                        this.paymentCancelled();
                    } else if (result.expired) {
                        console.log('⏰ Payment expired');
                        this.paymentExpired();
                    }
                    return true; // Stop checking
                }

                if (checks >= maxChecks) {
                    console.log('⏰ Payment monitoring timeout');
                    this.paymentExpired();
                    return true; // Stop checking
                }

                return false; // Continue checking
                
            } catch (error) {
                console.error('❌ Error checking payment status:', error);
                return false; // Continue checking
            }
        };

        // Start monitoring
        const monitor = setInterval(async () => {
            const shouldStop = await checkStatus();
            if (shouldStop) {
                clearInterval(monitor);
            }
        }, checkInterval);
    }

    /**
     * Handle successful payment
     */
    paymentSuccess(data) {
        const modal = document.getElementById('xaman-payment-modal');
        if (modal) {
            const modalBody = modal.querySelector('.modal-body');
            modalBody.innerHTML = `
                <div style="text-align: center; padding: 40px;">
                    <div style="font-size: 4em; margin-bottom: 20px;">✅</div>
                    <h3 style="color: #4CAF50; margin-bottom: 20px;">Payment Successful!</h3>
                    <p style="color: #ccc; margin-bottom: 20px;">Your contest entry has been confirmed on the XRPL.</p>
                    <p style="color: #888; font-size: 0.9em; margin-bottom: 30px;">Transaction: ${data.txid || 'Processing...'}</p>
                    <button onclick="window.xamanProperAPI.closeModal()" class="btn btn-primary">
                        Continue to Contest
                    </button>
                </div>
            `;
        }
        
        if (window.xamanPaymentResolve) {
            window.xamanPaymentResolve({
                success: true,
                txid: data.txid,
                timestamp: new Date().toISOString()
            });
        }
        
        setTimeout(() => this.closeModal(), 3000);
    }

    /**
     * Handle cancelled payment
     */
    paymentCancelled() {
        this.closeModal();
        if (window.xamanPaymentReject) {
            window.xamanPaymentReject(new Error('Payment cancelled by user'));
        }
    }

    /**
     * Handle expired payment
     */
    paymentExpired() {
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
        
        delete window.xamanPaymentResolve;
        delete window.xamanPaymentReject;
    }
}

// Create global instance
window.xamanProperAPI = new XamanProperAPI();

// Also expose for contest wallet compatibility
window.contestWallet = {
    processEntryPayment: async function() {
        return window.xamanProperAPI.createContestPayment();
    }
};

console.log('✅ Proper Xaman API Payment system loaded');