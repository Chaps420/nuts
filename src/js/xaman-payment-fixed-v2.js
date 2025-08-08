/**
 * Fixed Xaman Payment Implementation
 * Ensures proper loading and availability of payment functions
 */

(function() {
    'use strict';
    
    class XamanPaymentFixed {
        constructor() {
            this.contestWallet = 'rN2K1Tv6LEM94YN8Kxfe3QyWcGPQNgsD6d';
            this.nutsIssuer = 'rBpdegD7kqHdczjKzTKNEUZj1Fg1eYZRbe';
            this.entryFee = '50';
            this.isInitialized = true;
            
            console.log('💸 Xaman Payment Fixed v2 initialized');
            console.log('📍 Contest wallet:', this.contestWallet);
            console.log('🪙 NUTS issuer:', this.nutsIssuer);
        }

        /**
         * Create payment using multiple fallback methods
         */
        async createContestPayment() {
            try {
                console.log('💳 Creating Xaman payment (Fixed v2)...');
                
                // Method 1: Try server-based payment if available
                if (await this.isServerAvailable()) {
                    console.log('🌐 Using server-based payment...');
                    return await this.createServerPayment();
                }
                
                // Method 2: Use direct Xaman URL
                console.log('📱 Using direct Xaman URL...');
                return await this.createDirectPayment();
                
            } catch (error) {
                console.error('❌ Payment creation failed:', error);
                throw error;
            }
        }

        /**
         * Check if server is available
         */
        async isServerAvailable() {
            try {
                const response = await fetch('http://localhost:3001/health', {
                    method: 'GET',
                    mode: 'cors',
                    timeout: 2000
                });
                return response.ok;
            } catch (error) {
                console.log('ℹ️ Server not available, using direct method');
                return false;
            }
        }

        /**
         * Create payment via server
         */
        async createServerPayment() {
            try {
                const response = await fetch('http://localhost:3001/create-nuts-payment', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        amount: 50,
                        memo: 'Contest Entry'
                    })
                });

                if (!response.ok) {
                    throw new Error(`Server error: ${response.status}`);
                }

                const data = await response.json();
                console.log('✅ Server payment created:', data.uuid);

                // Show QR modal with server data
                this.showServerPaymentModal(data);

                // Return promise that resolves when payment is complete
                return new Promise((resolve, reject) => {
                    window.xamanPaymentResolve = resolve;
                    window.xamanPaymentReject = reject;

                    // Poll for payment status if websocket URL provided
                    if (data.websocket_status) {
                        this.pollPaymentStatus(data.uuid);
                    }
                });

            } catch (error) {
                console.error('Server payment failed:', error);
                // Fallback to direct method
                return this.createDirectPayment();
            }
        }

        /**
         * Create direct payment URL
         */
        async createDirectPayment() {
            // Use the working xumm://xrpl.to format
            const xamanUrl = `xumm://xrpl.to/${this.contestWallet}?amount=${this.entryFee}+NUTS+${this.nutsIssuer}&dt=2024`;
            
            console.log('🔗 Direct payment URL:', xamanUrl);
            
            // Show payment modal
            this.showPaymentModal(xamanUrl);
            
            // Return promise that resolves when payment is made
            return new Promise((resolve, reject) => {
                window.xamanPaymentResolve = resolve;
                window.xamanPaymentReject = reject;
            });
        }

        /**
         * Show payment modal for server-based payment
         */
        showServerPaymentModal(paymentData) {
            const modalHtml = `
                <div id="xaman-payment-modal" style="
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0,0,0,0.9);
                    z-index: 10000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                ">
                    <div style="
                        background: #1a1a1a;
                        border-radius: 12px;
                        padding: 30px;
                        max-width: 500px;
                        width: 100%;
                        text-align: center;
                        position: relative;
                        border: 2px solid #ff6b00;
                    ">
                        <button onclick="window.closeXamanPayment()" style="
                            position: absolute;
                            top: 10px;
                            right: 10px;
                            background: none;
                            border: none;
                            color: #fff;
                            font-size: 24px;
                            cursor: pointer;
                        ">×</button>
                        
                        <h2 style="color: #ff6b00; margin-bottom: 20px;">Contest Entry Payment</h2>
                        
                        <div style="background: #ff6b00; color: white; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                            <p style="margin: 5px 0; font-weight: bold;">⚠️ VERIFY IN XAMAN:</p>
                            <p style="margin: 5px 0; font-size: 20px;"><strong>50 NUTS</strong></p>
                            <p style="margin: 5px 0; font-size: 12px;">(NOT 50 XRP!)</p>
                        </div>
                        
                        <div style="margin: 20px 0;">
                            <p style="color: #fff; margin-bottom: 15px;">Scan with Xaman:</p>
                            <div style="background: white; padding: 20px; border-radius: 8px; display: inline-block;">
                                <img src="${paymentData.qr_png}" style="width: 256px; height: 256px;" alt="QR Code">
                            </div>
                        </div>
                        
                        <div style="margin-top: 20px;">
                            <a href="${paymentData.next.always}" target="_blank" style="
                                display: inline-block;
                                background: #ff6b00;
                                color: white;
                                padding: 12px 24px;
                                border-radius: 6px;
                                text-decoration: none;
                                font-weight: bold;
                                width: 90%;
                            ">Open in Xaman</a>
                        </div>
                        
                        <p style="color: #888; margin-top: 20px; font-size: 14px;">
                            Payment ID: ${paymentData.uuid}
                        </p>
                    </div>
                </div>
            `;

            document.body.insertAdjacentHTML('beforeend', modalHtml);
            this.setupModalHandlers();
        }

        /**
         * Show payment modal for direct payment
         */
        showPaymentModal(xamanUrl) {
            // Remove existing modal
            const existingModal = document.getElementById('xaman-payment-modal');
            if (existingModal) {
                existingModal.remove();
            }

            const modalHtml = `
                <div id="xaman-payment-modal" style="
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0,0,0,0.9);
                    z-index: 10000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                ">
                    <div style="
                        background: #1a1a1a;
                        border-radius: 12px;
                        padding: 30px;
                        max-width: 500px;
                        width: 100%;
                        text-align: center;
                        position: relative;
                        border: 2px solid #ff6b00;
                    ">
                        <button onclick="window.closeXamanPayment()" style="
                            position: absolute;
                            top: 10px;
                            right: 10px;
                            background: none;
                            border: none;
                            color: #fff;
                            font-size: 24px;
                            cursor: pointer;
                        ">×</button>
                        
                        <h2 style="color: #ff6b00; margin-bottom: 20px;">Contest Entry Payment</h2>
                        
                        <div style="background: #ff6b00; color: white; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                            <p style="margin: 5px 0; font-weight: bold;">⚠️ VERIFY IN XAMAN:</p>
                            <p style="margin: 5px 0; font-size: 20px;"><strong>50 NUTS</strong></p>
                            <p style="margin: 5px 0; font-size: 12px;">(NOT 50 XRP!)</p>
                        </div>
                        
                        <div style="background: #2a2a2a; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                            <p style="color: #fff; margin-bottom: 10px;">Payment Details:</p>
                            <table style="width: 100%; color: #ccc; font-size: 14px;">
                                <tr>
                                    <td style="text-align: right; padding: 5px;">Amount:</td>
                                    <td style="text-align: left; padding: 5px; font-weight: bold;">50 NUTS</td>
                                </tr>
                                <tr>
                                    <td style="text-align: right; padding: 5px;">To:</td>
                                    <td style="text-align: left; padding: 5px; font-family: monospace; font-size: 11px;">
                                        ${this.contestWallet}
                                    </td>
                                </tr>
                                <tr>
                                    <td style="text-align: right; padding: 5px;">Tag:</td>
                                    <td style="text-align: left; padding: 5px;">2024</td>
                                </tr>
                            </table>
                        </div>
                        
                        <div style="margin-top: 20px;">
                            <a href="${xamanUrl}" style="
                                display: inline-block;
                                background: #ff6b00;
                                color: white;
                                padding: 15px 30px;
                                border-radius: 6px;
                                text-decoration: none;
                                font-weight: bold;
                                font-size: 18px;
                                width: 90%;
                            ">🚀 Open in Xaman</a>
                        </div>
                        
                        <div style="margin-top: 20px; text-align: left;">
                            <p style="color: #ff6b00; font-weight: bold; margin-bottom: 10px;">
                                Manual Payment Instructions:
                            </p>
                            <ol style="color: #888; font-size: 14px; margin-left: 20px;">
                                <li>Open Xaman wallet</li>
                                <li>Tap the send button</li>
                                <li>Send <strong style="color: #ff6b00;">50 NUTS</strong> to the contest wallet</li>
                                <li>Add destination tag: <strong>2024</strong></li>
                                <li>Complete the payment</li>
                            </ol>
                        </div>
                        
                        <button onclick="window.confirmXamanPayment()" style="
                            background: #28a745;
                            color: white;
                            border: none;
                            padding: 12px 24px;
                            border-radius: 6px;
                            font-size: 16px;
                            cursor: pointer;
                            margin-top: 20px;
                            width: 100%;
                        ">I've Completed the Payment</button>
                    </div>
                </div>
            `;

            document.body.insertAdjacentHTML('beforeend', modalHtml);
            this.setupModalHandlers();
        }

        /**
         * Set up modal event handlers
         */
        setupModalHandlers() {
            window.closeXamanPayment = () => {
                const modal = document.getElementById('xaman-payment-modal');
                if (modal) modal.remove();
                if (window.xamanPaymentReject) {
                    window.xamanPaymentReject(new Error('Payment cancelled'));
                }
            };

            window.confirmXamanPayment = () => {
                const modal = document.getElementById('xaman-payment-modal');
                if (modal) modal.remove();
                
                // Mock successful payment for demo
                const mockResult = {
                    success: true,
                    txHash: 'DEMO_TX_' + Date.now(),
                    timestamp: new Date().toISOString()
                };
                
                if (window.xamanPaymentResolve) {
                    window.xamanPaymentResolve(mockResult);
                }
            };
        }

        /**
         * Poll payment status (for server-based payments)
         */
        async pollPaymentStatus(uuid) {
            const maxAttempts = 60; // 5 minutes
            let attempts = 0;

            const checkStatus = async () => {
                try {
                    const response = await fetch(`http://localhost:3001/check-payment/${uuid}`);
                    const data = await response.json();

                    if (data.signed) {
                        console.log('✅ Payment signed!');
                        const modal = document.getElementById('xaman-payment-modal');
                        if (modal) modal.remove();
                        
                        if (window.xamanPaymentResolve) {
                            window.xamanPaymentResolve({
                                success: true,
                                txHash: data.txid,
                                account: data.account
                            });
                        }
                        return;
                    }

                    if (data.cancelled || data.expired) {
                        throw new Error('Payment cancelled or expired');
                    }

                    // Continue polling
                    attempts++;
                    if (attempts < maxAttempts) {
                        setTimeout(checkStatus, 5000); // Check every 5 seconds
                    } else {
                        throw new Error('Payment timeout');
                    }

                } catch (error) {
                    console.error('Status check error:', error);
                    const modal = document.getElementById('xaman-payment-modal');
                    if (modal) modal.remove();
                    
                    if (window.xamanPaymentReject) {
                        window.xamanPaymentReject(error);
                    }
                }
            };

            // Start polling after 3 seconds
            setTimeout(checkStatus, 3000);
        }
    }

    // Create and expose the payment instance
    const paymentInstance = new XamanPaymentFixed();
    
    // Expose to global scope with multiple references
    window.xamanPayment = paymentInstance;
    window.xamanPaymentFixed = paymentInstance;
    window.xamanPaymentFinal = paymentInstance;
    window.xamanPaymentSimple = paymentInstance;
    window.xamanPaymentAPI = paymentInstance;
    
    // Log success
    console.log('✅ Xaman Payment Fixed v2 loaded successfully');
    console.log('🔍 Available as: window.xamanPayment (and other variants)');
    console.log('📍 Contest wallet:', paymentInstance.contestWallet);
    
})();