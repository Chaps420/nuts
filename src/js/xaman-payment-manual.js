/**
 * Manual Xaman Payment Instructions
 * Simple solution that works without API complications
 */

class XamanPaymentManual {
    constructor() {
        this.contestWallet = 'rN2K1Tv6LEM94YN8Kxfe3QyWcGPQNgsD6d';
        this.nutsIssuer = 'rBpdegD7kqHdczjKzTKNEUZj1Fg1eYZRbe';
        this.entryFee = '50';
        
        console.log('💸 Manual Xaman Payment initialized');
    }

    async createContestPayment() {
        console.log('💳 Showing manual payment instructions...');
        
        this.showPaymentModal();
        
        return new Promise((resolve, reject) => {
            window.xamanPaymentResolve = resolve;
            window.xamanPaymentReject = reject;
        });
    }

    showPaymentModal() {
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
                
                <h2 style="color: #ff6b00; margin-bottom: 20px;">Contest Entry Payment</h2>
                
                <div style="background: #ff6b00; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <p style="margin: 5px 0; font-size: 32px; font-weight: bold;">
                        50 NUTS
                    </p>
                    <p style="margin: 5px 0;">
                        Entry Fee
                    </p>
                </div>
                
                <div style="background: #2a2a2a; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="color: #ff6b00; margin: 0 0 15px 0;">Payment Instructions:</h3>
                    <ol style="text-align: left; color: #fff; margin: 0; padding-left: 20px; line-height: 1.8;">
                        <li>Open <strong>Xaman Wallet</strong></li>
                        <li>Tap the <strong>"Send"</strong> button</li>
                        <li>Enter recipient address:
                            <div style="background: #333; padding: 10px; border-radius: 4px; margin: 10px 0; word-break: break-all; font-family: monospace; font-size: 12px;">
                                ${this.contestWallet}
                            </div>
                        </li>
                        <li><strong style="color: #ff6b00;">IMPORTANT:</strong> Select <strong>NUTS</strong> from your token list
                            <div style="color: #888; font-size: 14px; margin-top: 5px;">
                                (Make sure it shows NUTS, not XRP!)
                            </div>
                        </li>
                        <li>Enter amount: <strong>50</strong></li>
                        <li>Add Destination Tag: <strong>2024</strong></li>
                        <li>Review and slide to send</li>
                    </ol>
                </div>
                
                <div style="background: #333; padding: 15px; border-radius: 8px; margin: 15px 0;">
                    <p style="color: #ccc; font-size: 14px; margin: 5px 0;">
                        <strong>NUTS Token Details:</strong>
                    </p>
                    <p style="color: #888; font-size: 12px; margin: 5px 0; word-break: break-all;">
                        Issuer: ${this.nutsIssuer}
                    </p>
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
                    margin-top: 20px;
                    width: 100%;
                ">I've Sent the Payment</button>
                
                <p style="color: #888; font-size: 12px; margin-top: 15px;">
                    After sending, click the button above to continue
                </p>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
}

// Create instance and set all references
const paymentInstance = new XamanPaymentManual();

// Set ALL window references to ensure compatibility
window.xamanPaymentManual = paymentInstance;
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

console.log('✅ Manual Xaman Payment loaded');
console.log('📋 Will show clear manual payment instructions');