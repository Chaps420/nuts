/**
 * Simple QR Payment for NUTS
 * Most basic implementation that definitely shows a QR code
 */

class XamanPaymentSimpleQR {
    constructor() {
        this.contestWallet = 'rN2K1Tv6LEM94YN8Kxfe3QyWcGPQNgsD6d';
        this.nutsIssuer = 'rBpdegD7kqHdczjKzTKNEUZj1Fg1eYZRbe';
        this.entryFee = '50';
        
        console.log('💸 Simple QR Payment initialized');
    }

    async createContestPayment() {
        console.log('💳 Creating payment QR...');
        
        // Use the working format with proper NUTS token specification
        // Format: to/amount/currency+issuer
        const xamanUrl = `xumm://xrpl.to/${this.contestWallet}/${this.entryFee}/NUTS+${this.nutsIssuer}?dt=2024`;
        
        console.log('🔗 Payment URL:', xamanUrl);
        
        this.showPaymentModal(xamanUrl);
        
        return new Promise((resolve, reject) => {
            window.xamanPaymentResolve = resolve;
            window.xamanPaymentReject = reject;
        });
    }

    showPaymentModal(xamanUrl) {
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
                
                <h2 style="color: #ff6b00; margin-bottom: 20px;">Pay 50 NUTS Entry Fee</h2>
                
                <div style="background: #ff1744; color: white; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                    <p style="margin: 5px 0; font-size: 24px; font-weight: bold;">
                        ⚠️ 50 NUTS (NOT XRP!)
                    </p>
                </div>
                
                <div style="margin: 20px 0;">
                    <p style="color: #fff; margin-bottom: 15px;">Scan with Xaman:</p>
                    <div id="qr-container" style="background: white; padding: 20px; border-radius: 8px; display: inline-block;">
                        <canvas id="qr-canvas"></canvas>
                    </div>
                </div>
                
                <div style="margin: 20px 0;">
                    <a href="${xamanUrl}" style="
                        display: inline-block;
                        background: #ff6b00;
                        color: white;
                        padding: 16px 32px;
                        border-radius: 8px;
                        text-decoration: none;
                        font-weight: bold;
                        font-size: 18px;
                    ">Open in Xaman</a>
                </div>
                
                <div style="background: #2a2a2a; padding: 15px; border-radius: 8px; margin-top: 20px;">
                    <p style="color: #888; font-size: 12px; margin: 5px 0;">
                        To: ${this.contestWallet}
                    </p>
                    <p style="color: #888; font-size: 12px; margin: 5px 0;">
                        Amount: 50 NUTS | Tag: 2024
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
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Generate QR code
        this.generateQR(xamanUrl);
    }

    generateQR(data) {
        // Load QRCode library if not loaded
        if (typeof QRCode === 'undefined') {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
            script.onload = () => this.createQR(data);
            document.head.appendChild(script);
        } else {
            this.createQR(data);
        }
    }

    createQR(data) {
        const container = document.getElementById('qr-container');
        if (!container) return;
        
        // Clear container
        container.innerHTML = '';
        
        try {
            new QRCode(container, {
                text: data,
                width: 256,
                height: 256,
                colorDark: '#000000',
                colorLight: '#ffffff',
                correctLevel: QRCode.CorrectLevel.M
            });
            console.log('✅ QR code generated');
        } catch (e) {
            console.error('QR generation error:', e);
            // Fallback to image
            container.innerHTML = `<img src="https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(data)}" width="256" height="256" alt="QR Code">`;
        }
    }
}

// Create instance and set all references
const paymentInstance = new XamanPaymentSimpleQR();

window.xamanPaymentSimpleQR = paymentInstance;
window.xamanPayment = paymentInstance;
window.xamanPaymentSimple = paymentInstance;
window.xamanPaymentHex = paymentInstance;
window.xamanPaymentAPI = paymentInstance;
window.xamanPaymentCorrect = paymentInstance;
window.xamanPaymentFixed = paymentInstance;
window.xamanPaymentFinal = paymentInstance;
window.xamanPaymentWorking = paymentInstance;
window.xamanPaymentDirect = paymentInstance;

console.log('✅ Simple QR Payment loaded');