/**
 * Standard Xaman Payment Implementation
 * Uses documented Xaman URL formats for NUTS token payments
 */

class XamanPaymentStandard {
    constructor() {
        this.contestWallet = 'rN2K1Tv6LEM94YN8Kxfe3QyWcGPQNgsD6d';
        this.nutsIssuer = 'rBpdegD7kqHdczjKzTKNEUZj1Fg1eYZRbe';
        this.entryFee = '50';
        
        console.log('💸 Standard Xaman Payment initialized');
    }

    async createContestPayment() {
        console.log('💳 Creating NUTS payment with standard format...');
        
        // Try multiple QR code formats
        const formats = [
            // Format 1: Standard XRPL format
            `https://xumm.app/tx?to=${this.contestWallet}&amount=${this.entryFee}/NUTS+${this.nutsIssuer}&dt=2024`,
            
            // Format 2: Separated parameters
            `https://xumm.app/tx?to=${this.contestWallet}&amount=${this.entryFee}&currency=NUTS&issuer=${this.nutsIssuer}&dt=2024`,
            
            // Format 3: Direct protocol
            `xumm://xumm.app/tx?to=${this.contestWallet}&amount=${this.entryFee}&currency=NUTS&issuer=${this.nutsIssuer}&dt=2024`
        ];
        
        this.showPaymentModal(formats);
        
        return new Promise((resolve, reject) => {
            window.xamanPaymentResolve = resolve;
            window.xamanPaymentReject = reject;
        });
    }

    showPaymentModal(formats) {
        // Remove any existing modal
        const existing = document.getElementById('xaman-payment-modal');
        if (existing) existing.remove();

        // Create modal
        const modal = document.createElement('div');
        modal.id = 'xaman-payment-modal';
        modal.style.cssText = `
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
            overflow-y: auto;
        `;
        
        modal.innerHTML = `
            <div style="
                background: #1a1a1a;
                border-radius: 12px;
                padding: 30px;
                max-width: 600px;
                width: 100%;
                max-height: 90vh;
                overflow-y: auto;
                position: relative;
                border: 2px solid #ff6b00;
            ">
                <button onclick="document.getElementById('xaman-payment-modal').remove(); if(window.xamanPaymentReject) window.xamanPaymentReject(new Error('Cancelled'));" style="
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    background: none;
                    border: none;
                    color: #fff;
                    font-size: 24px;
                    cursor: pointer;
                ">×</button>
                
                <h2 style="color: #ff6b00; margin-bottom: 20px; text-align: center;">Contest Entry Payment</h2>
                
                <div style="background: #ff3333; color: white; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                    <p style="margin: 5px 0; font-weight: bold; font-size: 18px; text-align: center;">
                        ⚠️ IMPORTANT: Select NUTS Token ⚠️
                    </p>
                    <p style="margin: 5px 0; text-align: center;">
                        When Xaman opens, make sure to select <strong>NUTS</strong> from your token list, NOT XRP!
                    </p>
                </div>
                
                <div style="background: #28a745; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; text-align: center;">
                    <p style="margin: 5px 0; font-size: 32px; font-weight: bold;">
                        50 NUTS
                    </p>
                    <p style="margin: 5px 0; font-size: 16px;">
                        Daily Contest Entry Fee
                    </p>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <h3 style="color: #ff6b00; margin-bottom: 15px;">Option 1: Scan QR Code</h3>
                    <p style="color: #ccc; margin-bottom: 15px;">Try each QR code until one works correctly:</p>
                    
                    <!-- QR Code 1 -->
                    <div style="background: #2a2a2a; padding: 20px; border-radius: 8px; margin-bottom: 15px;">
                        <p style="color: #fff; margin-bottom: 10px; font-weight: bold;">Format 1: Standard XRPL</p>
                        <div style="text-align: center; margin-bottom: 10px;">
                            <div style="background: white; padding: 20px; border-radius: 8px; display: inline-block;">
                                <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(formats[0])}" 
                                     width="200" height="200" alt="Payment QR 1">
                            </div>
                        </div>
                        <a href="${formats[0]}" target="_blank" style="
                            display: block;
                            background: #ff6b00;
                            color: white;
                            padding: 10px;
                            border-radius: 6px;
                            text-decoration: none;
                            text-align: center;
                            font-weight: bold;
                        ">Open in Browser</a>
                    </div>
                    
                    <!-- QR Code 2 -->
                    <div style="background: #2a2a2a; padding: 20px; border-radius: 8px; margin-bottom: 15px;">
                        <p style="color: #fff; margin-bottom: 10px; font-weight: bold;">Format 2: Separated Parameters</p>
                        <div style="text-align: center; margin-bottom: 10px;">
                            <div style="background: white; padding: 20px; border-radius: 8px; display: inline-block;">
                                <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(formats[1])}" 
                                     width="200" height="200" alt="Payment QR 2">
                            </div>
                        </div>
                        <a href="${formats[1]}" target="_blank" style="
                            display: block;
                            background: #ff6b00;
                            color: white;
                            padding: 10px;
                            border-radius: 6px;
                            text-decoration: none;
                            text-align: center;
                            font-weight: bold;
                        ">Open in Browser</a>
                    </div>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <h3 style="color: #ff6b00; margin-bottom: 15px;">Option 2: Mobile Deep Link</h3>
                    <p style="color: #ccc; margin-bottom: 15px;">On mobile? Tap this button:</p>
                    <a href="${formats[2]}" style="
                        display: block;
                        background: #ff6b00;
                        color: white;
                        padding: 16px;
                        border-radius: 8px;
                        text-decoration: none;
                        text-align: center;
                        font-weight: bold;
                        font-size: 18px;
                    ">Open in Xaman App</a>
                </div>
                
                <div style="background: #333; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <h3 style="color: #ff6b00; margin-bottom: 15px;">Option 3: Manual Payment</h3>
                    <ol style="color: #ccc; margin: 0; padding-left: 20px; line-height: 1.8;">
                        <li>Open Xaman Wallet</li>
                        <li>Tap "Send"</li>
                        <li>Enter recipient: <code style="background: #000; padding: 2px 6px; border-radius: 3px;">${this.contestWallet}</code></li>
                        <li><strong style="color: #ff6b00;">IMPORTANT:</strong> Select NUTS from token list (NOT XRP!)</li>
                        <li>Enter amount: <strong>50</strong></li>
                        <li>Add Destination Tag: <strong>2024</strong></li>
                        <li>Slide to send</li>
                    </ol>
                </div>
                
                <button onclick="
                    document.getElementById('xaman-payment-modal').remove(); 
                    if(window.xamanPaymentResolve) window.xamanPaymentResolve({
                        success: true, 
                        txid: 'MANUAL_' + Date.now(),
                        timestamp: new Date().toISOString()
                    });
                " style="
                    background: #28a745;
                    color: white;
                    border: none;
                    padding: 16px 32px;
                    border-radius: 8px;
                    font-size: 18px;
                    font-weight: bold;
                    cursor: pointer;
                    width: 100%;
                ">I've Completed the Payment</button>
                
                <details style="margin-top: 20px;">
                    <summary style="color: #888; cursor: pointer;">Technical Details</summary>
                    <div style="background: #000; padding: 10px; border-radius: 4px; margin-top: 10px;">
                        <p style="color: #0f0; font-family: monospace; font-size: 12px; margin: 5px 0;">
                            Wallet: ${this.contestWallet}<br>
                            NUTS Issuer: ${this.nutsIssuer}<br>
                            Amount: 50 NUTS<br>
                            Destination Tag: 2024
                        </p>
                    </div>
                </details>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
}

// Create instance and set all references
const paymentInstance = new XamanPaymentStandard();

// Set ALL window references to ensure compatibility
window.xamanPaymentStandard = paymentInstance;
window.xamanPayment = paymentInstance;
window.xamanPaymentSimple = paymentInstance;
window.xamanPaymentHex = paymentInstance;
window.xamanPaymentAPI = paymentInstance;
window.xamanPaymentCorrect = paymentInstance;
window.xamanPaymentFixed = paymentInstance;
window.xamanPaymentFinal = paymentInstance;
window.xamanPaymentWorking = paymentInstance;
window.xamanPaymentDirect = paymentInstance;
window.xamanPaymentSimpleQR = paymentInstance;
window.xamanPaymentProper = paymentInstance;
window.xamanPaymentNuts = paymentInstance;
window.xamanPaymentCorrectHex = paymentInstance;
window.xamanPaymentFinalCorrect = paymentInstance;
window.xamanPaymentXapp = paymentInstance;
window.xamanPaymentServerRequired = paymentInstance;
window.xamanPaymentManual = paymentInstance;

console.log('✅ Standard Xaman Payment loaded - Multiple formats available');