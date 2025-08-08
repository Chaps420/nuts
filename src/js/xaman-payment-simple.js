/**
 * Simplified Xaman Payment for NUTS Contest
 * Uses the simplest possible format for maximum compatibility
 */

class XamanPaymentSimple {
    constructor() {
        this.contestWallet = 'rN2K1Tv6LEM94YN8Kxfe3QyWcGPQNgsD6d';
        this.nutsIssuer = 'rBpdegD7kqHdczjKzTKNEUZj1Fg1eYZRbe';
        this.entryFee = '50';
        // Use hex-encoded currency code for NUTS
        this.currencyCode = '4E7574730000000000000000000000000000000000';
        
        console.log('💸 Simple Xaman Payment System initialized');
        console.log('📍 Contest wallet:', this.contestWallet);
        console.log('🪙 NUTS issuer:', this.nutsIssuer);
        console.log('🔤 Currency code:', this.currencyCode);
    }

    /**
     * Create simple payment request
     */
    async createContestPayment() {
        try {
            console.log('💳 Creating simple Xaman payment...');
            
            // Use the simplest xumm:// URL format
            // Format: xumm://xrpl.to/{destination}?amount={value}&currency={code}&issuer={issuer}
            const simpleUrl = `xumm://xrpl.to/${this.contestWallet}?amount=${this.entryFee}&currency=NUTS&issuer=${this.nutsIssuer}&dt=2024`;
            
            // Alternative format using xaman://
            const xamanUrl = `xaman://xrpl.to/${this.contestWallet}?amount=${this.entryFee}&currency=NUTS&issuer=${this.nutsIssuer}&dt=2024`;
            
            // Web-based fallback
            const webUrl = `https://xumm.app/detect/request:${this.contestWallet}?amount=${this.entryFee}&currency=NUTS&issuer=${this.nutsIssuer}&dt=2024&memo=Contest%20Entry`;
            
            console.log('🔗 Generated URLs:', {
                simple: simpleUrl,
                xaman: xamanUrl,
                web: webUrl
            });
            
            // Show payment modal
            this.showPaymentModal(simpleUrl, xamanUrl, webUrl);
            
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
     * Show simple payment modal
     */
    showPaymentModal(simpleUrl, xamanUrl, webUrl) {
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
                    
                    <h2 style="color: #ff6b00; margin-bottom: 20px;">Complete Payment</h2>
                    
                    <div style="background: #2a2a2a; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                        <p style="color: #fff; margin: 10px 0; font-size: 18px;">
                            <strong>Amount:</strong> 50 NUTS
                        </p>
                        <p style="color: #fff; margin: 10px 0;">
                            <strong>To:</strong> ${this.contestWallet}
                        </p>
                        <p style="color: #888; font-size: 14px; margin-top: 10px;">
                            Contest Entry Fee
                        </p>
                    </div>
                    
                    <div style="margin: 20px 0;">
                        <p style="color: #fff; margin-bottom: 15px;">Scan with Xaman Wallet:</p>
                        <div id="qr-container" style="background: white; padding: 20px; border-radius: 8px; display: inline-block;">
                            <!-- QR Code will be inserted here -->
                        </div>
                    </div>
                    
                    <div style="margin-top: 20px;">
                        <p style="color: #888; margin-bottom: 10px;">Or click to open in Xaman:</p>
                        <a href="${simpleUrl}" style="
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
                    
                    <div style="margin-top: 20px; padding: 15px; background: #2a2a2a; border-radius: 8px;">
                        <p style="color: #ff6b00; font-weight: bold; margin-bottom: 10px;">
                            ⚠️ Important: Make sure payment shows "50 NUTS" not "50 XRP"
                        </p>
                        <p style="color: #888; font-size: 14px;">
                            If the QR code doesn't work, try the buttons above or manually send 50 NUTS to the contest wallet.
                        </p>
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

        // Add modal to page
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Generate QR code
        this.generateQRCode(simpleUrl);

        // Set up handlers
        window.closeXamanPayment = () => {
            document.getElementById('xaman-payment-modal').remove();
            if (window.xamanPaymentReject) {
                window.xamanPaymentReject(new Error('Payment cancelled'));
            }
        };

        window.confirmXamanPayment = () => {
            // In a real implementation, you would verify the payment on-chain
            // For now, we'll trust the user
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
window.xamanPaymentSimple = new XamanPaymentSimple();

// Also expose for compatibility
window.xamanPayment = window.xamanPaymentSimple;

console.log('✅ Simple Xaman Payment system loaded');
console.log('📍 Contest payments will be sent to:', window.xamanPaymentSimple.contestWallet);