/**
 * Direct Xaman Payment Implementation
 * Uses the documented XRPL Payment transaction format with hex encoding
 */

class XamanPaymentDirect {
    constructor() {
        this.contestWallet = 'rN2K1Tv6LEM94YN8Kxfe3QyWcGPQNgsD6d';
        this.nutsIssuer = 'rBpdegD7kqHdczjKzTKNEUZj1Fg1eYZRbe';
        this.entryFee = '50';
        
        console.log('💸 Direct Xaman Payment initialized');
    }

    async createContestPayment() {
        console.log('💳 Creating NUTS payment with direct format...');
        
        // Create proper XRPL Payment transaction
        const tx = {
            TransactionType: 'Payment',
            Destination: this.contestWallet,
            DestinationTag: 2024,
            Amount: {
                currency: 'NUTS',
                value: this.entryFee,
                issuer: this.nutsIssuer
            }
        };
        
        // Convert to hex as per documentation
        const str = JSON.stringify(tx);
        const hex = this.stringToHex(str);
        
        // Create the Xaman deep link
        const xamanUrl = `https://xaman.app/detect/${hex}`;
        
        console.log('📄 Transaction:', tx);
        console.log('🔗 Xaman URL:', xamanUrl);
        
        this.showPaymentModal(xamanUrl, tx);
        
        return new Promise((resolve, reject) => {
            window.xamanPaymentResolve = resolve;
            window.xamanPaymentReject = reject;
        });
    }
    
    stringToHex(str) {
        let hex = '';
        for (let i = 0; i < str.length; i++) {
            const charCode = str.charCodeAt(i);
            const hexValue = charCode.toString(16);
            hex += hexValue.padStart(2, '0');
        }
        return hex;
    }

    showPaymentModal(xamanUrl, tx) {
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
                
                <div style="background: #28a745; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <p style="margin: 5px 0; font-size: 32px; font-weight: bold;">
                        50 NUTS
                    </p>
                    <p style="margin: 5px 0; font-size: 16px;">
                        Daily Contest Entry Fee
                    </p>
                </div>
                
                <div style="margin: 20px 0;">
                    <p style="color: #fff; margin-bottom: 15px;">Scan with Xaman Wallet:</p>
                    <div style="background: white; padding: 20px; border-radius: 8px; display: inline-block;">
                        <img src="https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(xamanUrl)}" 
                             width="256" height="256" alt="Payment QR">
                    </div>
                </div>
                
                <div style="margin: 20px 0;">
                    <a href="${xamanUrl}" target="_blank" style="
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
                
                <div style="background: #2a2a2a; padding: 15px; border-radius: 8px; margin-top: 20px;">
                    <p style="color: #888; font-size: 14px; margin: 5px 0;">
                        To: ${this.contestWallet}
                    </p>
                    <p style="color: #888; font-size: 14px; margin: 5px 0;">
                        Amount: 50 NUTS
                    </p>
                    <p style="color: #888; font-size: 14px; margin: 5px 0;">
                        Tag: 2024
                    </p>
                </div>
                
                <button onclick="
                    document.getElementById('xaman-payment-modal').remove(); 
                    if(window.xamanPaymentResolve) window.xamanPaymentResolve({success:true, txid:'TX_'+Date.now()});
                " style="
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
                
                <details style="margin-top: 20px; text-align: left;">
                    <summary style="color: #888; cursor: pointer;">Transaction Details</summary>
                    <pre style="background: #000; color: #0f0; padding: 10px; border-radius: 4px; overflow-x: auto; font-size: 11px; margin-top: 10px;">${JSON.stringify(tx, null, 2)}</pre>
                </details>
            </div>
        `;

        
        document.body.appendChild(modal);
    }
}

// Create instance and set all references
const paymentInstance = new XamanPaymentDirect();

// Set ALL window references to ensure compatibility
window.xamanPaymentDirect = paymentInstance;
window.xamanPayment = paymentInstance;
window.xamanPaymentSimple = paymentInstance;
window.xamanPaymentHex = paymentInstance;
window.xamanPaymentAPI = paymentInstance;
window.xamanPaymentCorrect = paymentInstance;
window.xamanPaymentFixed = paymentInstance;
window.xamanPaymentFinal = paymentInstance;
window.xamanPaymentWorking = paymentInstance;
window.xamanPaymentSimpleQR = paymentInstance;
window.xamanPaymentProper = paymentInstance;
window.xamanPaymentNuts = paymentInstance;
window.xamanPaymentCorrectHex = paymentInstance;
window.xamanPaymentFinalCorrect = paymentInstance;
window.xamanPaymentXapp = paymentInstance;
window.xamanPaymentServerRequired = paymentInstance;
window.xamanPaymentManual = paymentInstance;
window.xamanPaymentStandard = paymentInstance;

console.log('✅ Direct Xaman Payment loaded - Using documented hex format');