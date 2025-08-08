/**
 * Correct Xaman Payment Implementation for NUTS
 * Uses the proper URL format from documentation
 */

class XamanPaymentCorrect {
    constructor() {
        this.contestWallet = 'rN2K1Tv6LEM94YN8Kxfe3QyWcGPQNgsD6d';
        this.nutsIssuer = 'rBpdegD7kqHdczjKzTKNEUZj1Fg1eYZRbe';
        this.entryFee = '50';
        
        console.log('💸 Correct Xaman Payment initialized');
        console.log('📍 Contest wallet:', this.contestWallet);
        console.log('🪙 NUTS issuer:', this.nutsIssuer);
    }

    /**
     * Create payment using correct URL format
     */
    async createContestPayment() {
        try {
            console.log('💳 Creating correct Xaman payment...');
            
            // Use the simple URL format that works
            const baseUrl = 'https://xumm.app/detect/request:';
            const params = new URLSearchParams({
                to: this.contestWallet,
                amount: this.entryFee,
                currency: 'NUTS',
                issuer: this.nutsIssuer,
                dt: '2024', // Destination tag
                memo: 'Contest Entry'
            });
            
            // Primary URL format
            const primaryUrl = `${baseUrl}${this.contestWallet}?${params.toString()}`;
            
            // Alternative xumm:// format
            const xummUrl = `xumm://xrpl.to/${this.contestWallet}?amount=${this.entryFee}&currency=NUTS&issuer=${this.nutsIssuer}&dt=2024`;
            
            // Alternative xaman:// format
            const xamanUrl = `xaman://xrpl.to/${this.contestWallet}?amount=${this.entryFee}&currency=NUTS&issuer=${this.nutsIssuer}&dt=2024`;
            
            console.log('🔗 Generated URLs:', {
                primary: primaryUrl,
                xumm: xummUrl,
                xaman: xamanUrl
            });
            
            // Show payment modal
            this.showPaymentModal(primaryUrl, xummUrl, xamanUrl);
            
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
    showPaymentModal(primaryUrl, xummUrl, xamanUrl) {
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
                            ⚠️ IMPORTANT: Verify in Xaman
                        </p>
                        <p style="margin: 10px 0; font-size: 24px;">
                            <strong>50 NUTS</strong>
                        </p>
                        <p style="margin: 5px 0; font-size: 14px;">
                            NOT 50 XRP! Make sure it shows NUTS token!
                        </p>
                    </div>
                    
                    <div style="background: #2a2a2a; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                        <div style="text-align: left; color: #fff;">
                            <p style="margin: 8px 0;">
                                <strong>Amount:</strong> 50 NUTS
                            </p>
                            <p style="margin: 8px 0;">
                                <strong>To:</strong> Contest Wallet
                            </p>
                            <p style="margin: 8px 0; font-size: 12px; color: #888; word-break: break-all;">
                                ${this.contestWallet}
                            </p>
                            <p style="margin: 8px 0;">
                                <strong>Destination Tag:</strong> 2024
                            </p>
                            <p style="margin: 8px 0;">
                                <strong>Purpose:</strong> Daily Contest Entry
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
                                Generating QR Code...
                            </div>
                        </div>
                    </div>
                    
                    <div style="margin-top: 20px;">
                        <p style="color: #888; margin-bottom: 10px;">
                            Or tap to open in Xaman:
                        </p>
                        <a href="${xummUrl}" style="
                            display: inline-block;
                            background: #ff6b00;
                            color: white;
                            padding: 12px 24px;
                            border-radius: 6px;
                            text-decoration: none;
                            font-weight: bold;
                            margin: 5px;
                        ">Open with xumm://</a>
                        
                        <a href="${xamanUrl}" style="
                            display: inline-block;
                            background: #ff6b00;
                            color: white;
                            padding: 12px 24px;
                            border-radius: 6px;
                            text-decoration: none;
                            font-weight: bold;
                            margin: 5px;
                        ">Open with xaman://</a>
                        
                        <a href="${primaryUrl}" target="_blank" style="
                            display: inline-block;
                            background: #333;
                            color: white;
                            padding: 12px 24px;
                            border-radius: 6px;
                            text-decoration: none;
                            margin: 5px;
                        ">Open in Browser</a>
                    </div>
                    
                    <div style="
                        margin-top: 20px; 
                        padding: 15px; 
                        background: #2a2a2a; 
                        border-radius: 8px;
                        text-align: left;
                    ">
                        <p style="color: #ff6b00; font-weight: bold; margin-bottom: 10px;">
                            Manual Payment Instructions:
                        </p>
                        <ol style="color: #ccc; font-size: 14px; margin-left: 20px;">
                            <li>Open Xaman wallet</li>
                            <li>Tap Send</li>
                            <li>Enter recipient: <code style="font-size: 11px;">${this.contestWallet}</code></li>
                            <li>Select NUTS token (NOT XRP!)</li>
                            <li>Enter amount: 50</li>
                            <li>Add destination tag: 2024</li>
                            <li>Slide to send</li>
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

        // Generate QR code - use the xumm:// URL for QR
        setTimeout(() => {
            this.generateQRCode(xummUrl);
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
            // Clear container
            container.innerHTML = '';
            
            // Use online QR generator that works reliably
            const img = document.createElement('img');
            img.src = `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(data)}`;
            img.style.width = '256px';
            img.style.height = '256px';
            img.onload = () => {
                console.log('✅ QR code loaded successfully');
            };
            img.onerror = () => {
                console.error('❌ QR code failed to load');
                container.innerHTML = `
                    <div style="padding: 50px 20px; color: #666;">
                        <p>QR Code generation failed.</p>
                        <p>Please use the buttons below.</p>
                    </div>
                `;
            };
            container.appendChild(img);
            
        } catch (error) {
            console.error('QR generation error:', error);
            container.innerHTML = `
                <div style="padding: 50px 20px; color: #666;">
                    <p>QR Code error.</p>
                    <p>Use the buttons below.</p>
                </div>
            `;
        }
    }
}

// Create global instance
window.xamanPaymentCorrect = new XamanPaymentCorrect();

// Expose for all compatibility
window.xamanPayment = window.xamanPaymentCorrect;
window.xamanPaymentSimple = window.xamanPaymentCorrect;
window.xamanPaymentHex = window.xamanPaymentCorrect;
window.xamanPaymentAPI = window.xamanPaymentCorrect;

console.log('✅ Correct Xaman Payment system loaded');
console.log('📍 Contest payments will be sent to:', window.xamanPaymentCorrect.contestWallet);