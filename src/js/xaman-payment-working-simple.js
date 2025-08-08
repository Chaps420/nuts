/**
 * Working Simple Xaman Payment for NUTS
 * Uses the simplest URL format that works reliably
 */

class XamanPaymentWorkingSimple {
    constructor() {
        this.contestWallet = 'rN2K1Tv6LEM94YN8Kxfe3QyWcGPQNgsD6d';
        this.nutsIssuer = 'rBpdegD7kqHdczjKzTKNEUZj1Fg1eYZRbe';
        this.entryFee = '50';
        
        console.log('💸 Working Simple Xaman Payment initialized');
    }

    async createContestPayment() {
        console.log('💳 Creating simple working payment...');
        
        // Use the simplest format that works - direct URL parameters
        const baseUrl = 'https://xumm.app/detect/request:';
        
        // Build the URL with proper encoding
        const paymentUrl = `${baseUrl}${this.contestWallet}` +
            `?amount=${this.entryFee}` +
            `&currency=NUTS` +
            `&issuer=${this.nutsIssuer}` +
            `&dt=2024` +
            `&memo=${encodeURIComponent('Contest Entry')}`;
        
        console.log('🔗 Payment URL:', paymentUrl);
        
        this.showPaymentModal(paymentUrl);
        
        return new Promise((resolve, reject) => {
            window.xamanPaymentResolve = resolve;
            window.xamanPaymentReject = reject;
        });
    }

    showPaymentModal(paymentUrl) {
        // Remove any existing modal
        const existing = document.getElementById('xaman-payment-modal');
        if (existing) existing.remove();

        // Create QR code URL
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(paymentUrl)}`;
        
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
        
        // Detect mobile
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
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
                    background: #ff6b00;
                    border: none;
                    color: #fff;
                    font-size: 24px;
                    cursor: pointer;
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                ">×</button>
                
                <h3 style="color: #ff6b00; margin-bottom: 20px;">Contest Entry Payment</h3>
                
                <div style="background: #28a745; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <p style="margin: 5px 0; font-size: 32px; font-weight: bold;">
                        50 NUTS
                    </p>
                    <p style="margin: 5px 0; font-size: 16px;">
                        Contest Entry Fee
                    </p>
                </div>
                
                ${isMobile ? `
                    <!-- Mobile: Open in Xaman button -->
                    <button onclick="window.location.href='${paymentUrl}'" style="
                        background: #ff6b00;
                        color: white;
                        border: none;
                        padding: 15px 30px;
                        border-radius: 8px;
                        font-size: 18px;
                        font-weight: bold;
                        cursor: pointer;
                        width: 100%;
                        margin-bottom: 15px;
                    ">📱 Open in Xaman Wallet</button>
                    
                    <p style="color: #888; font-size: 14px; margin-bottom: 20px;">
                        Tap the button above to open the payment in Xaman
                    </p>
                ` : `
                    <!-- Desktop: QR Code -->
                    <div style="background: white; padding: 10px; border-radius: 8px; display: inline-block; margin-bottom: 20px;">
                        <img src="${qrUrl}" width="300" height="300" alt="Payment QR Code">
                    </div>
                    
                    <p style="color: #888; font-size: 14px; margin-bottom: 20px;">
                        Scan QR code with Xaman wallet on your mobile device
                    </p>
                `}
                
                <div style="background: #333; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                    <p style="color: #ff6b00; font-size: 14px; font-weight: bold; margin: 5px 0;">
                        Payment Details:
                    </p>
                    <p style="color: #ccc; font-size: 12px; margin: 5px 0;">
                        Amount: 50 NUTS<br>
                        To: ${this.contestWallet}<br>
                        Destination Tag: 2024
                    </p>
                </div>
                
                <button onclick="
                    document.getElementById('xaman-payment-modal').remove(); 
                    if(window.xamanPaymentResolve) window.xamanPaymentResolve({
                        success: true, 
                        txid: 'MANUAL_' + Date.now(),
                        txHash: 'MANUAL_' + Date.now(),
                        timestamp: new Date().toISOString()
                    });
                " style="
                    background: #28a745;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 8px;
                    font-size: 16px;
                    cursor: pointer;
                    width: 100%;
                ">I've Completed the Payment</button>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
}

// Create global instance and set all references
const paymentInstance = new XamanPaymentWorkingSimple();

window.xamanPaymentWorkingSimple = paymentInstance;
window.xamanPayment = paymentInstance;
window.xamanPaymentAPI = paymentInstance;
window.xamanPaymentCorrect = paymentInstance;
window.xamanPaymentFixed = paymentInstance;
window.xamanPaymentWorking = paymentInstance;

console.log('✅ Working Simple Payment loaded - using direct URL format');
