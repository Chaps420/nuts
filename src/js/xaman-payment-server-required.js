/**
 * Xaman Payment - Server Required Version
 * This requires running the xumm-server.js for proper QR code generation
 */

class XamanPaymentServerRequired {
    constructor() {
        this.contestWallet = 'rN2K1Tv6LEM94YN8Kxfe3QyWcGPQNgsD6d';
        this.nutsIssuer = 'rBpdegD7kqHdczjKzTKNEUZj1Fg1eYZRbe';
        this.entryFee = 50;
        this.serverUrl = 'http://localhost:3001';
        
        console.log('💸 Xaman Payment (Server Required) initialized');
        console.log('⚠️ Make sure xumm-server.js is running on port 3001');
    }

    async createContestPayment() {
        console.log('💳 Creating NUTS payment via server...');
        
        try {
            // Call the server to create XUMM payload
            const response = await fetch(`${this.serverUrl}/create-nuts-payment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    amount: this.entryFee,
                    memo: 'Contest Entry - Daily Pick\'em'
                })
            });
            
            if (!response.ok) {
                throw new Error('Server not available. Please run: node xumm-server.js');
            }
            
            const result = await response.json();
            console.log('✅ Payment created:', result);
            
            // Show QR modal with server response
            this.showServerPaymentModal(result);
            
            return new Promise((resolve, reject) => {
                window.xamanPaymentResolve = resolve;
                window.xamanPaymentReject = reject;
            });
            
        } catch (error) {
            console.error('❌ Server error:', error);
            // Show manual payment instructions
            this.showManualPaymentModal();
            
            return new Promise((resolve, reject) => {
                window.xamanPaymentResolve = resolve;
                window.xamanPaymentReject = reject;
            });
        }
    }

    showServerPaymentModal(paymentData) {
        // Remove existing modal
        const existing = document.getElementById('xaman-payment-modal');
        if (existing) existing.remove();

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
        `;
        
        modal.innerHTML = `
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
                
                <h2 style="color: #ff6b00; margin-bottom: 20px;">Complete Payment in Xaman</h2>
                
                <div style="background: #28a745; color: white; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                    <p style="margin: 5px 0; font-size: 24px; font-weight: bold;">
                        50 NUTS
                    </p>
                    <p style="margin: 5px 0;">
                        Contest Entry Fee
                    </p>
                </div>
                
                <div style="margin: 20px 0;">
                    <p style="color: #fff; margin-bottom: 15px;">Scan with Xaman:</p>
                    <div style="background: white; padding: 20px; border-radius: 8px; display: inline-block;">
                        <img src="${paymentData.qr_png}" alt="Payment QR" style="width: 256px; height: 256px;" />
                    </div>
                </div>
                
                <div style="margin: 20px 0;">
                    <a href="${paymentData.next.always}" target="_blank" style="
                        display: inline-block;
                        background: #ff6b00;
                        color: white;
                        padding: 16px 32px;
                        border-radius: 8px;
                        text-decoration: none;
                        font-weight: bold;
                        font-size: 18px;
                        width: 80%;
                    ">Open in Xaman</a>
                </div>
                
                <p style="color: #888; font-size: 14px; margin-top: 20px;">
                    Waiting for payment confirmation...
                </p>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    showManualPaymentModal() {
        // Remove existing modal
        const existing = document.getElementById('xaman-payment-modal');
        if (existing) existing.remove();

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
        `;
        
        modal.innerHTML = `
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
                
                <h2 style="color: #ff6b00; margin-bottom: 20px;">Manual Payment Required</h2>
                
                <div style="background: #ff1744; color: white; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                    <p style="margin: 5px 0; font-weight: bold;">
                        ⚠️ Server Not Running
                    </p>
                    <p style="margin: 5px 0; font-size: 12px;">
                        Run: node xumm-server.js
                    </p>
                </div>
                
                <div style="background: #2a2a2a; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="color: #ff6b00; margin: 0 0 15px 0;">Manual Payment Instructions:</h3>
                    <ol style="text-align: left; color: #fff; margin: 0; padding-left: 20px;">
                        <li style="margin: 8px 0;">Open Xaman Wallet</li>
                        <li style="margin: 8px 0;">Tap "Send" button</li>
                        <li style="margin: 8px 0;">
                            Recipient: <br>
                            <code style="font-size: 11px; background: #333; padding: 4px; border-radius: 4px; display: block; margin-top: 4px;">
                                ${this.contestWallet}
                            </code>
                        </li>
                        <li style="margin: 8px 0;">
                            <strong style="color: #ff6b00;">Select NUTS from token list</strong><br>
                            <small style="color: #888;">(NOT XRP!)</small>
                        </li>
                        <li style="margin: 8px 0;">Amount: <strong>50</strong></li>
                        <li style="margin: 8px 0;">Destination Tag: <strong>2024</strong></li>
                        <li style="margin: 8px 0;">Slide to send</li>
                    </ol>
                </div>
                
                <button onclick="
                    document.getElementById('xaman-payment-modal').remove(); 
                    if(window.xamanPaymentResolve) window.xamanPaymentResolve({success:true, txid:'MANUAL_TX_'+Date.now()});
                " style="
                    background: #28a745;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 6px;
                    font-size: 16px;
                    cursor: pointer;
                    margin-top: 10px;
                    width: 100%;
                ">I've Completed the Manual Payment</button>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
}

// Create instance and set all references
const paymentInstance = new XamanPaymentServerRequired();

// Set ALL window references
window.xamanPaymentServerRequired = paymentInstance;
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

console.log('✅ Xaman Payment Server Required loaded');
console.log('⚠️ To use QR codes, run: node xumm-server.js');