/**
 * Xaman Payment with Hex-Encoded NUTS Currency Code
 * Uses proper XRPL format with hex-encoded currency for NUTS token
 */

class XamanPaymentHex {
    constructor() {
        this.contestWallet = 'rN2K1Tv6LEM94YN8Kxfe3QyWcGPQNgsD6d';
        this.nutsIssuer = 'rBpdegD7kqHdczjKzTKNEUZj1Fg1eYZRbe';
        this.entryFee = '50';
        // NUTS hex-encoded and padded to 40 characters
        this.currencyHex = '4E7574730000000000000000000000000000000000';
        
        console.log('💸 Xaman Payment with Hex Currency initialized');
        console.log('📍 Contest wallet:', this.contestWallet);
        console.log('🪙 NUTS issuer:', this.nutsIssuer);
        console.log('🔤 Currency hex:', this.currencyHex);
    }

    /**
     * Create payment with proper XRPL transaction format
     */
    async createContestPayment() {
        try {
            console.log('💳 Creating Xaman payment with hex currency...');
            
            // Create XRPL transaction object
            const transaction = {
                TransactionType: "Payment",
                Destination: this.contestWallet,
                Amount: {
                    currency: this.currencyHex,
                    value: this.entryFee,
                    issuer: this.nutsIssuer
                },
                DestinationTag: 2024
            };
            
            console.log('📄 Transaction:', JSON.stringify(transaction, null, 2));
            
            // Convert to JSON string
            const txJson = JSON.stringify(transaction);
            
            // Convert to base64
            const base64Tx = btoa(txJson);
            
            // Create Xaman URLs
            const xamanUrl = `xaman://sign/${base64Tx}`;
            const xummUrl = `xumm://sign/${base64Tx}`;
            const webUrl = `https://xumm.app/sign/${base64Tx}`;
            
            console.log('🔗 Generated URLs:', {
                xaman: xamanUrl,
                xumm: xummUrl,
                web: webUrl
            });
            
            // Show payment modal
            this.showPaymentModal(transaction, xamanUrl, xummUrl, webUrl);
            
            // Return promise that resolves when payment is made
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
     * Show payment modal with QR code
     */
    showPaymentModal(transaction, xamanUrl, xummUrl, webUrl) {
        // Remove existing modal
        const existingModal = document.getElementById('xaman-payment-modal');
        if (existingModal) {
            existingModal.remove();
        }

        // Create modal HTML
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
                    
                    <h2 style="color: #ff6b00; margin-bottom: 20px;">Complete Contest Payment</h2>
                    
                    <div style="background: #ff6b00; color: white; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                        <p style="margin: 5px 0; font-weight: bold;">⚠️ IMPORTANT: Make sure payment shows:</p>
                        <p style="margin: 5px 0; font-size: 20px;"><strong>50 NUTS</strong> (not XRP!)</p>
                    </div>
                    
                    <div style="background: #2a2a2a; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                        <p style="color: #fff; margin: 10px 0; font-size: 18px;">
                            <strong>Amount:</strong> 50 NUTS
                        </p>
                        <p style="color: #fff; margin: 10px 0; font-size: 14px;">
                            <strong>To:</strong> ${this.contestWallet}
                        </p>
                        <p style="color: #888; font-size: 12px; margin-top: 10px;">
                            Tag: 2024 (Contest Entry)
                        </p>
                    </div>
                    
                    <div style="margin: 20px 0;">
                        <p style="color: #fff; margin-bottom: 15px;">Scan with Xaman Wallet:</p>
                        <div id="qr-container" style="background: white; padding: 20px; border-radius: 8px; display: inline-block;">
                            <!-- QR Code will be inserted here -->
                        </div>
                    </div>
                    
                    <div style="margin-top: 20px;">
                        <p style="color: #888; margin-bottom: 10px;">Or tap to open:</p>
                        <a href="${xamanUrl}" style="
                            display: inline-block;
                            background: #ff6b00;
                            color: white;
                            padding: 12px 24px;
                            border-radius: 6px;
                            text-decoration: none;
                            font-weight: bold;
                            margin: 5px;
                        ">Open in Xaman</a>
                        
                        <a href="${webUrl}" target="_blank" style="
                            display: inline-block;
                            background: #333;
                            color: white;
                            padding: 12px 24px;
                            border-radius: 6px;
                            text-decoration: none;
                            margin: 5px;
                        ">Open in Browser</a>
                    </div>
                    
                    <details style="margin-top: 20px; text-align: left;">
                        <summary style="color: #888; cursor: pointer;">Transaction Details</summary>
                        <pre style="background: #000; color: #0f0; padding: 10px; border-radius: 4px; overflow-x: auto; font-size: 11px; margin-top: 10px;">${JSON.stringify(transaction, null, 2)}</pre>
                    </details>
                    
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

        // Add modal to page
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Generate QR code
        this.generateQRCode(xamanUrl);

        // Set up handlers
        window.closeXamanPayment = () => {
            document.getElementById('xaman-payment-modal').remove();
            if (window.xamanPaymentReject) {
                window.xamanPaymentReject(new Error('Payment cancelled'));
            }
        };

        window.confirmXamanPayment = () => {
            // In a real implementation, you would verify the payment on-chain
            document.getElementById('xaman-payment-modal').remove();
            
            // Simulate successful payment
            const mockResult = {
                success: true,
                txid: 'MOCK_TX_' + Date.now(),
                timestamp: new Date().toISOString()
            };
            
            if (window.xamanPaymentResolve) {
                window.xamanPaymentResolve(mockResult);
            }
        };
    }

    /**
     * Generate QR code
     */
    async generateQRCode(data) {
        const container = document.getElementById('qr-container');
        if (!container) return;

        try {
            // Use QRCode library if available
            if (typeof QRCode !== 'undefined') {
                new QRCode(container, {
                    text: data,
                    width: 256,
                    height: 256,
                    colorDark: '#000000',
                    colorLight: '#ffffff',
                    correctLevel: QRCode.CorrectLevel.M
                });
            } else {
                // Fallback to online QR generator
                const img = document.createElement('img');
                img.src = `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(data)}`;
                img.style.width = '256px';
                img.style.height = '256px';
                container.appendChild(img);
            }
        } catch (error) {
            console.error('QR generation failed:', error);
            container.innerHTML = '<p style="color: #333;">QR Code generation failed. Please use the buttons below.</p>';
        }
    }
}

// Create global instance
window.xamanPaymentHex = new XamanPaymentHex();

// Also expose for compatibility
window.xamanPayment = window.xamanPaymentHex;
window.xamanPaymentSimple = window.xamanPaymentHex;

console.log('✅ Xaman Payment with Hex Currency loaded');
console.log('📍 Contest payments will be sent to:', window.xamanPaymentHex.contestWallet);