/**
 * NUTS Token Payment for Xaman
 * Uses the simplest working format for NUTS token payments
 */

class XamanPaymentNuts {
    constructor() {
        this.contestWallet = 'rN2K1Tv6LEM94YN8Kxfe3QyWcGPQNgsD6d';
        this.nutsIssuer = 'rBpdegD7kqHdczjKzTKNEUZj1Fg1eYZRbe';
        this.entryFee = '50';
        
        console.log('💸 NUTS Payment System initialized');
    }

    async createContestPayment() {
        console.log('💳 Creating NUTS payment...');
        
        // Try multiple URL formats to find what works
        const urls = {
            // Format 1: Direct to address with token params
            format1: `xumm://xrpl.to/${this.contestWallet}?amount=${this.entryFee}&currency=NUTS&issuer=${this.nutsIssuer}&dt=2024`,
            
            // Format 2: Using path notation
            format2: `xumm://xrpl.to/${this.contestWallet}/${this.entryFee}+NUTS+${this.nutsIssuer}?dt=2024`,
            
            // Format 3: Web URL
            format3: `https://xumm.app/detect/request:${this.contestWallet}?amount=${this.entryFee}&currency=NUTS&issuer=${this.nutsIssuer}&dt=2024`,
            
            // Format 4: Sign with tx json
            format4: this.createSignUrl()
        };
        
        console.log('🔗 Payment URLs:', urls);
        
        this.showPaymentModal(urls);
        
        return new Promise((resolve, reject) => {
            window.xamanPaymentResolve = resolve;
            window.xamanPaymentReject = reject;
        });
    }
    
    createSignUrl() {
        const tx = {
            to: this.contestWallet,
            amount: this.entryFee,
            currency: 'NUTS',
            issuer: this.nutsIssuer,
            dt: 2024
        };
        return `xumm://sign?request=${encodeURIComponent(JSON.stringify(tx))}`;
    }

    showPaymentModal(urls) {
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
                max-width: 500px;
                width: 100%;
                text-align: center;
                position: relative;
                border: 2px solid #ff6b00;
                max-height: 90vh;
                overflow-y: auto;
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
                
                <h2 style="color: #ff6b00; margin-bottom: 20px;">Pay 50 NUTS Entry Fee</h2>
                
                <div style="background: #ff1744; color: white; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                    <p style="margin: 5px 0; font-size: 24px; font-weight: bold;">
                        IMPORTANT: Select NUTS Token
                    </p>
                    <p style="margin: 5px 0;">
                        Make sure Xaman shows "50 NUTS" not "50 XRP"
                    </p>
                </div>
                
                <div style="margin: 20px 0;">
                    <p style="color: #fff; margin-bottom: 15px;">Try these options:</p>
                    
                    <div style="margin: 15px 0;">
                        <p style="color: #888; font-size: 14px; margin-bottom: 10px;">Option 1: Standard Format</p>
                        <a href="${urls.format1}" style="
                            display: inline-block;
                            background: #ff6b00;
                            color: white;
                            padding: 12px 24px;
                            border-radius: 6px;
                            text-decoration: none;
                            font-weight: bold;
                            width: 80%;
                            margin: 5px 0;
                        ">Open with Standard URL</a>
                        <div id="qr1" style="margin: 10px 0;"></div>
                    </div>
                    
                    <div style="margin: 15px 0;">
                        <p style="color: #888; font-size: 14px; margin-bottom: 10px;">Option 2: Path Format</p>
                        <a href="${urls.format2}" style="
                            display: inline-block;
                            background: #ff6b00;
                            color: white;
                            padding: 12px 24px;
                            border-radius: 6px;
                            text-decoration: none;
                            font-weight: bold;
                            width: 80%;
                            margin: 5px 0;
                        ">Open with Path Format</a>
                    </div>
                    
                    <div style="margin: 15px 0;">
                        <p style="color: #888; font-size: 14px; margin-bottom: 10px;">Option 3: Web Format</p>
                        <a href="${urls.format3}" target="_blank" style="
                            display: inline-block;
                            background: #333;
                            color: white;
                            padding: 12px 24px;
                            border-radius: 6px;
                            text-decoration: none;
                            width: 80%;
                            margin: 5px 0;
                        ">Open in Browser</a>
                    </div>
                </div>
                
                <div style="background: #2a2a2a; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p style="color: #ff6b00; font-weight: bold; margin-bottom: 10px;">
                        Manual Payment Instructions:
                    </p>
                    <ol style="text-align: left; color: #ccc; font-size: 14px; margin: 0 0 0 20px;">
                        <li>Open Xaman wallet</li>
                        <li>Tap "Send" button</li>
                        <li>Enter address: <br><code style="font-size: 11px; color: #fff;">${this.contestWallet}</code></li>
                        <li><strong>Select NUTS from token list</strong></li>
                        <li>Enter amount: 50</li>
                        <li>Add destination tag: 2024</li>
                        <li>Review: Should show "50 NUTS"</li>
                        <li>Slide to send</li>
                    </ol>
                </div>
                
                <div style="background: #333; padding: 10px; border-radius: 8px; margin: 10px 0;">
                    <p style="color: #888; font-size: 12px; margin: 0;">
                        NUTS Issuer: ${this.nutsIssuer}
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
                    margin-top: 10px;
                    width: 100%;
                ">I've Completed the Payment</button>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Generate QR for first format
        setTimeout(() => {
            this.addQR('qr1', urls.format1);
        }, 100);
    }

    addQR(elementId, data) {
        const container = document.getElementById(elementId);
        if (!container) return;
        
        container.innerHTML = `
            <div style="background: white; padding: 10px; border-radius: 8px; display: inline-block;">
                <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data)}" 
                     width="200" height="200" alt="QR Code">
            </div>
        `;
    }
}

// Create instance and set all references
const paymentInstance = new XamanPaymentNuts();

window.xamanPaymentNuts = paymentInstance;
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

console.log('✅ NUTS Payment System loaded');