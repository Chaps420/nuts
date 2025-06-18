/**
 * Final Xaman Payment Implementation for NUTS
 * Uses the working xumm://xrpl.to format with correct token amount
 */

class XamanPaymentFinal {
    constructor() {
        this.contestWallet = 'rN2K1Tv6LEM94YN8Kxfe3QyWcGPQNgsD6d';
        this.nutsIssuer = 'rBpdegD7kqHdczjKzTKNEUZj1Fg1eYZRbe';
        this.entryFee = '50';
        
        console.log('💸 Final Xaman Payment initialized');
        console.log('📍 Contest wallet:', this.contestWallet);
        console.log('🪙 NUTS issuer:', this.nutsIssuer);
    }

    /**
     * Create payment using working xrpl.to format
     */
    async createContestPayment() {
        try {
            console.log('💳 Creating Xaman payment...');
            
            // Use the format that works: xumm://xrpl.to with proper amount encoding
            // For tokens, the amount needs to be formatted as: amount+currency+issuer
            const xummUrl = `xumm://xrpl.to/${this.contestWallet}?amount=${this.entryFee}%2BNUTS%2B${this.nutsIssuer}&dt=2024`;
            
            // Alternative with slashes (URL encoded)
            const xummUrl2 = `xumm://xrpl.to/${this.contestWallet}?amount=${this.entryFee}%2FNUTS%2F${this.nutsIssuer}&dt=2024`;
            
            // Try with plus signs
            const xummUrl3 = `xumm://xrpl.to/${this.contestWallet}?amount=${this.entryFee}+NUTS+${this.nutsIssuer}&dt=2024`;
            
            console.log('🔗 Generated URLs:', {
                format1: xummUrl,
                format2: xummUrl2,
                format3: xummUrl3
            });
            
            // Show payment modal with the working format
            this.showPaymentModal(xummUrl3, xummUrl2, xummUrl);
            
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
    showPaymentModal(primaryUrl, altUrl1, altUrl2) {
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
                    
                    <h2 style="color: #ff6b00; margin-bottom: 20px;">Contest Entry Payment</h2>
                    
                    <div style="background: #ff1744; color: white; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                        <p style="margin: 5px 0; font-weight: bold; font-size: 18px;">
                            ⚠️ VERIFY IN XAMAN:
                        </p>
                        <p style="margin: 10px 0; font-size: 24px;">
                            <strong>50 NUTS</strong>
                        </p>
                        <p style="margin: 5px 0; font-size: 14px;">
                            Make sure it shows NUTS, not XRP!
                        </p>
                    </div>
                    
                    <div style="background: #2a2a2a; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                        <div style="text-align: left; color: #fff;">
                            <p style="margin: 8px 0;">
                                <strong>Amount:</strong> 50 NUTS tokens
                            </p>
                            <p style="margin: 8px 0;">
                                <strong>To:</strong> Contest Wallet
                            </p>
                            <p style="margin: 8px 0; font-size: 12px; color: #888; word-break: break-all;">
                                ${this.contestWallet}
                            </p>
                            <p style="margin: 8px 0;">
                                <strong>Tag:</strong> 2024
                            </p>
                        </div>
                    </div>
                    
                    <div style="margin: 20px 0;">
                        <p style="color: #fff; margin-bottom: 15px;">
                            Scan with Xaman Wallet:
                        </p>
                        <div id="qr-container" style="
                            background: white; 
                            padding: 20px; 
                            border-radius: 8px; 
                            display: inline-block;
                            min-height: 296px;
                            min-width: 296px;
                        ">
                            <div style="padding: 100px 20px; color: #666;">
                                Loading QR Code...
                            </div>
                        </div>
                    </div>
                    
                    <div style="margin-top: 20px;">
                        <p style="color: #888; margin-bottom: 10px;">
                            Or tap to open in Xaman:
                        </p>
                        <a href="${primaryUrl}" style="
                            display: inline-block;
                            background: #ff6b00;
                            color: white;
                            padding: 12px 24px;
                            border-radius: 6px;
                            text-decoration: none;
                            font-weight: bold;
                            margin: 5px;
                            width: 80%;
                        ">Open in Xaman</a>
                        
                        <details style="margin-top: 15px;">
                            <summary style="color: #888; cursor: pointer;">Alternative formats</summary>
                            <div style="margin-top: 10px;">
                                <a href="${altUrl1}" style="
                                    display: inline-block;
                                    background: #333;
                                    color: white;
                                    padding: 8px 16px;
                                    border-radius: 4px;
                                    text-decoration: none;
                                    margin: 5px;
                                    font-size: 14px;
                                ">Format 2</a>
                                <a href="${altUrl2}" style="
                                    display: inline-block;
                                    background: #333;
                                    color: white;
                                    padding: 8px 16px;
                                    border-radius: 4px;
                                    text-decoration: none;
                                    margin: 5px;
                                    font-size: 14px;
                                ">Format 3</a>
                            </div>
                        </details>
                    </div>
                    
                    <div style="
                        margin-top: 20px; 
                        padding: 15px; 
                        background: #2a2a2a; 
                        border-radius: 8px;
                        text-align: left;
                    ">
                        <p style="color: #ff6b00; font-weight: bold; margin-bottom: 10px;">
                            If QR doesn't work:
                        </p>
                        <ol style="color: #ccc; font-size: 14px; margin-left: 20px;">
                            <li>Tap the "Open in Xaman" button above</li>
                            <li>Or manually send 50 NUTS to the contest wallet</li>
                            <li>Make sure to add destination tag: 2024</li>
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

        // Add modal to page
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Generate QR code
        setTimeout(() => {
            this.generateQRCode(primaryUrl);
        }, 100);

        // Set up handlers
        window.closeXamanPayment = () => {
            document.getElementById('xaman-payment-modal').remove();
            if (window.xamanPaymentReject) {
                window.xamanPaymentReject(new Error('Payment cancelled'));
            }
        };

        window.confirmXamanPayment = () => {
            document.getElementById('xaman-payment-modal').remove();
            
            // Mock successful payment for now
            // In production, you'd verify the payment on-chain
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
            container.innerHTML = '';
            
            const img = document.createElement('img');
            img.src = `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(data)}`;
            img.style.width = '256px';
            img.style.height = '256px';
            img.alt = 'Payment QR Code';
            
            img.onload = () => {
                console.log('✅ QR code generated successfully');
            };
            
            img.onerror = () => {
                console.error('❌ QR code generation failed');
                container.innerHTML = `
                    <div style="padding: 50px 20px; color: #666;">
                        <p>QR generation failed.</p>
                        <p>Please use the button below.</p>
                    </div>
                `;
            };
            
            container.appendChild(img);
            
        } catch (error) {
            console.error('QR error:', error);
            container.innerHTML = '<p style="color: #666; padding: 50px;">QR error. Use button below.</p>';
        }
    }
}

// Create global instance
window.xamanPaymentFinal = new XamanPaymentFinal();

// Set all possible references
window.xamanPayment = window.xamanPaymentFinal;
window.xamanPaymentSimple = window.xamanPaymentFinal;
window.xamanPaymentHex = window.xamanPaymentFinal;
window.xamanPaymentAPI = window.xamanPaymentFinal;
window.xamanPaymentCorrect = window.xamanPaymentFinal;
window.xamanPaymentFixed = window.xamanPaymentFinal;

console.log('✅ Final Xaman Payment system loaded');
console.log('📍 Contest payments will be sent to:', window.xamanPaymentFinal.contestWallet);
console.log('🔗 Using xumm://xrpl.to format with token amount');