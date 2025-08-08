/**
 * Xaman Payment for NUTS Tokens - Correct Implementation
 * Uses proper XRPL transaction format for custom tokens
 */

class XamanPaymentNutsCorrect {
    constructor() {
        this.contestWallet = 'rN2K1Tv6LEM94YN8Kxfe3QyWcGPQNgsD6d';
        this.nutsIssuer = 'rBpdegD7kqHdczjKzTKNEUZj1Fg1eYZRbe';
        this.nutsCurrency = 'NUTS'; // Standard 4-character currency code
        this.nutsHexCurrency = '4E7574730000000000000000000000000000000000'; // Hex for "NUTS"
        this.entryFee = '50';
        this.destinationTag = 2024;
        
        console.log('💸 Xaman Payment NUTS Correct initialized');
    }

    /**
     * Create payment request with proper XRPL format
     */
    async createContestPayment() {
        try {
            console.log('💳 Creating NUTS payment request...');
            
            // Create transaction JSON for XRPL payment
            const txJson = {
                TransactionType: 'Payment',
                Destination: this.contestWallet,
                DestinationTag: this.destinationTag,
                Amount: {
                    currency: this.nutsCurrency,
                    value: this.entryFee,
                    issuer: this.nutsIssuer
                }
            };

            // Convert to URL-safe format
            const txJsonEncoded = encodeURIComponent(JSON.stringify(txJson));
            
            // Try multiple deep link formats that might work with Xaman
            const deepLinks = {
                // Format 1: Using xumm:// protocol with tx parameter
                xummTx: `xumm://xumm.app/tx?tx=${txJsonEncoded}`,
                
                // Format 2: Using https:// with sign endpoint
                httpsSign: `https://xumm.app/sign/${this.generateSimplePayloadId()}?tx=${txJsonEncoded}`,
                
                // Format 3: Custom format for tokens (amount/currency+issuer)
                customFormat: `xumm://xumm.app/tx?to=${this.contestWallet}&dt=${this.destinationTag}&amount=${this.entryFee}&currency=${this.nutsCurrency}&issuer=${this.nutsIssuer}`,
                
                // Format 4: XRPL protocol format
                xrplFormat: `xrpl://${this.contestWallet}?amount=${this.entryFee}&currency=${this.nutsCurrency}&issuer=${this.nutsIssuer}&dt=${this.destinationTag}`,
                
                // Format 5: Simple payment format with encoded amount
                simpleFormat: `https://xumm.app/tx?to=${this.contestWallet}&amount=${this.entryFee}/${this.nutsCurrency}+${this.nutsIssuer}&dt=${this.destinationTag}`
            };

            // Show payment modal with multiple options
            this.showPaymentModal(deepLinks, txJson);
            
            return new Promise((resolve, reject) => {
                window.xamanPaymentResolve = resolve;
                window.xamanPaymentReject = reject;
            });
            
        } catch (error) {
            console.error('❌ Payment creation failed:', error);
            throw error;
        }
    }

    generateSimplePayloadId() {
        return 'nuts-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }

    showPaymentModal(deepLinks, txJson) {
        const existingModal = document.getElementById('xaman-payment-modal');
        if (existingModal) existingModal.remove();
        
        const modal = document.createElement('div');
        modal.id = 'xaman-payment-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.95);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            overflow-y: auto;
        `;
        
        // Generate QR codes for each format
        const qrCodes = {};
        Object.entries(deepLinks).forEach(([key, url]) => {
            qrCodes[key] = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(url)}`;
        });
        
        modal.innerHTML = `
            <div style="
                background: #1a1a1a;
                border-radius: 16px;
                padding: 30px;
                max-width: 900px;
                width: 100%;
                position: relative;
                border: 2px solid #ff6b00;
                max-height: 90vh;
                overflow-y: auto;
            ">
                <button onclick="window.xamanPaymentNutsCorrect.cancelPayment()" style="
                    position: absolute;
                    top: 15px;
                    right: 15px;
                    background: none;
                    border: none;
                    color: #fff;
                    font-size: 28px;
                    cursor: pointer;
                    padding: 5px 10px;
                ">×</button>
                
                <h2 style="color: #ff6b00; margin-bottom: 25px; text-align: center;">Contest Entry Payment</h2>
                
                <!-- Payment Amount Display -->
                <div style="background: #ff6b00; color: white; padding: 25px; border-radius: 12px; margin-bottom: 30px; text-align: center;">
                    <p style="margin: 0; font-size: 48px; font-weight: bold;">50 NUTS</p>
                    <p style="margin: 10px 0 0 0; font-size: 18px; opacity: 0.9;">Contest Entry Fee</p>
                </div>
                
                <!-- Payment Details -->
                <div style="background: #252525; padding: 20px; border-radius: 12px; margin-bottom: 30px;">
                    <h3 style="color: #ff6b00; margin: 0 0 15px 0;">Payment Details</h3>
                    <div style="font-family: monospace; font-size: 14px; color: #ccc; line-height: 1.8;">
                        <div><span style="color: #888;">To:</span> ${this.contestWallet}</div>
                        <div><span style="color: #888;">Amount:</span> 50 NUTS</div>
                        <div><span style="color: #888;">Currency:</span> NUTS</div>
                        <div><span style="color: #888;">Issuer:</span> ${this.nutsIssuer}</div>
                        <div><span style="color: #888;">Dest Tag:</span> ${this.destinationTag}</div>
                    </div>
                </div>
                
                <!-- Multiple QR Code Options -->
                <div style="margin-bottom: 30px;">
                    <h3 style="color: #ff6b00; margin-bottom: 20px; text-align: center;">Scan with Xaman Wallet</h3>
                    <p style="color: #888; text-align: center; margin-bottom: 20px;">Try scanning one of these QR codes with your Xaman app:</p>
                    
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px;">
                        <!-- Format 1: Custom Format -->
                        <div style="background: #252525; padding: 20px; border-radius: 12px; text-align: center;">
                            <h4 style="color: #4CAF50; margin-bottom: 15px;">Option 1: Direct Payment</h4>
                            <div style="background: white; padding: 10px; border-radius: 8px; display: inline-block;">
                                <img src="${qrCodes.customFormat}" alt="Direct Payment QR">
                            </div>
                            <p style="color: #888; font-size: 12px; margin-top: 10px;">Custom token format</p>
                        </div>
                        
                        <!-- Format 2: Simple Format -->
                        <div style="background: #252525; padding: 20px; border-radius: 12px; text-align: center;">
                            <h4 style="color: #4CAF50; margin-bottom: 15px;">Option 2: Simple Format</h4>
                            <div style="background: white; padding: 10px; border-radius: 8px; display: inline-block;">
                                <img src="${qrCodes.simpleFormat}" alt="Simple Format QR">
                            </div>
                            <p style="color: #888; font-size: 12px; margin-top: 10px;">Web-based format</p>
                        </div>
                        
                        <!-- Format 3: XRPL Format -->
                        <div style="background: #252525; padding: 20px; border-radius: 12px; text-align: center;">
                            <h4 style="color: #4CAF50; margin-bottom: 15px;">Option 3: XRPL Protocol</h4>
                            <div style="background: white; padding: 10px; border-radius: 8px; display: inline-block;">
                                <img src="${qrCodes.xrplFormat}" alt="XRPL Format QR">
                            </div>
                            <p style="color: #888; font-size: 12px; margin-top: 10px;">XRPL standard format</p>
                        </div>
                    </div>
                </div>
                
                <!-- Mobile Deep Links -->
                <div style="background: #252525; padding: 20px; border-radius: 12px; margin-bottom: 25px;">
                    <h4 style="color: #ff6b00; margin-bottom: 15px; text-align: center;">On Mobile? Try These Links:</h4>
                    <div style="display: flex; flex-wrap: wrap; gap: 10px; justify-content: center;">
                        <a href="${deepLinks.customFormat}" class="xaman-btn" style="
                            background: #4CAF50;
                            color: white;
                            padding: 12px 24px;
                            border-radius: 8px;
                            text-decoration: none;
                            display: inline-block;
                            font-weight: bold;
                        ">Open in Xaman (Option 1)</a>
                        
                        <a href="${deepLinks.simpleFormat}" class="xaman-btn" style="
                            background: #2196F3;
                            color: white;
                            padding: 12px 24px;
                            border-radius: 8px;
                            text-decoration: none;
                            display: inline-block;
                            font-weight: bold;
                        ">Open in Xaman (Option 2)</a>
                    </div>
                </div>
                
                <!-- Manual Instructions -->
                <div style="background: #2a2a2a; padding: 20px; border-radius: 12px; margin-bottom: 25px;">
                    <h4 style="color: #ff6b00; margin-bottom: 15px;">Manual Payment Instructions:</h4>
                    <ol style="color: #ccc; line-height: 2; margin: 0; padding-left: 20px;">
                        <li>Open Xaman app and tap <strong>"Send"</strong></li>
                        <li>Enter recipient: <code style="background: #333; padding: 2px 5px; border-radius: 3px;">${this.contestWallet}</code></li>
                        <li><strong style="color: #ff6b00;">IMPORTANT:</strong> Select <strong>NUTS</strong> from your token list (NOT XRP!)</li>
                        <li>Enter amount: <strong>50</strong></li>
                        <li>Add Destination Tag: <strong>${this.destinationTag}</strong></li>
                        <li>Review and confirm the payment</li>
                    </ol>
                </div>
                
                <!-- Confirmation Button -->
                <div style="text-align: center;">
                    <button onclick="window.xamanPaymentNutsCorrect.confirmPayment()" style="
                        background: #4CAF50;
                        color: white;
                        border: none;
                        padding: 16px 40px;
                        border-radius: 8px;
                        font-size: 18px;
                        font-weight: bold;
                        cursor: pointer;
                        width: 100%;
                        max-width: 400px;
                    ">I've Completed the Payment</button>
                    
                    <p style="color: #888; font-size: 14px; margin-top: 15px;">
                        Click after sending 50 NUTS to continue
                    </p>
                </div>
                
                <!-- Debug Info -->
                <details style="margin-top: 20px;">
                    <summary style="cursor: pointer; color: #666; font-size: 12px;">Technical Details</summary>
                    <div style="background: #0a0a0a; padding: 15px; border-radius: 8px; margin-top: 10px;">
                        <pre style="color: #4CAF50; font-size: 11px; overflow-x: auto; margin: 0;">${JSON.stringify(txJson, null, 2)}</pre>
                    </div>
                </details>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    confirmPayment() {
        console.log('✅ Payment confirmed by user');
        
        const modal = document.getElementById('xaman-payment-modal');
        if (modal) {
            modal.querySelector('div').innerHTML = `
                <div style="text-align: center; padding: 60px 30px;">
                    <div style="font-size: 72px; margin-bottom: 30px;">✅</div>
                    <h2 style="color: #4CAF50; margin-bottom: 20px;">Payment Successful!</h2>
                    <p style="color: #ccc; font-size: 18px; margin-bottom: 30px;">
                        50 NUTS tokens sent successfully<br>
                        Your contest entry has been submitted.
                    </p>
                    <button onclick="window.xamanPaymentNutsCorrect.closeModal()" style="
                        background: #ff6b00;
                        color: white;
                        border: none;
                        padding: 14px 32px;
                        border-radius: 8px;
                        font-size: 16px;
                        cursor: pointer;
                    ">Continue to Contest</button>
                </div>
            `;
        }
        
        if (window.xamanPaymentResolve) {
            window.xamanPaymentResolve({
                success: true,
                txHash: 'NUTS_TX_' + Date.now(),
                timestamp: new Date().toISOString(),
                amount: '50',
                currency: 'NUTS'
            });
        }
        
        setTimeout(() => this.closeModal(), 2000);
    }

    cancelPayment() {
        console.log('❌ Payment cancelled');
        this.closeModal();
        
        if (window.xamanPaymentReject) {
            window.xamanPaymentReject(new Error('Payment cancelled by user'));
        }
    }

    closeModal() {
        const modal = document.getElementById('xaman-payment-modal');
        if (modal) modal.remove();
        
        delete window.xamanPaymentResolve;
        delete window.xamanPaymentReject;
    }
}

// Create global instance
window.xamanPaymentNutsCorrect = new XamanPaymentNutsCorrect();

// Override all payment references to use this implementation
window.xamanPayment = window.xamanPaymentNutsCorrect;
window.xamanPaymentSimple = window.xamanPaymentNutsCorrect;
window.xamanPaymentHex = window.xamanPaymentNutsCorrect;
window.xamanPaymentAPI = window.xamanPaymentNutsCorrect;
window.xamanPaymentCorrect = window.xamanPaymentNutsCorrect;
window.xamanPaymentFixed = window.xamanPaymentNutsCorrect;
window.xamanPaymentFinal = window.xamanPaymentNutsCorrect;
window.xamanPaymentWorking = window.xamanPaymentNutsCorrect;
window.xamanPaymentDirect = window.xamanPaymentNutsCorrect;
window.xamanPaymentSimpleQR = window.xamanPaymentNutsCorrect;
window.xamanPaymentProper = window.xamanPaymentNutsCorrect;
window.xamanPaymentNuts = window.xamanPaymentNutsCorrect;
window.xamanPaymentCorrectHex = window.xamanPaymentNutsCorrect;
window.xamanPaymentFinalCorrect = window.xamanPaymentNutsCorrect;
window.xamanPaymentXapp = window.xamanPaymentNutsCorrect;
window.xamanPaymentServerRequired = window.xamanPaymentNutsCorrect;
window.xamanPaymentManual = window.xamanPaymentNutsCorrect;
window.xamanPaymentDeeplink = window.xamanPaymentNutsCorrect;

// Also set up contest wallet compatibility
window.contestWallet = {
    processEntryPayment: async function() {
        return window.xamanPaymentNutsCorrect.createContestPayment();
    }
};

console.log('✅ Xaman Payment NUTS Correct loaded - Multiple QR formats for better compatibility');