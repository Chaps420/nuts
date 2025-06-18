/**
 * Xaman Payment via XUMM API
 * Uses the XUMM server to create proper payloads
 */

class XamanPaymentAPI {
    constructor() {
        this.contestWallet = 'rN2K1Tv6LEM94YN8Kxfe3QyWcGPQNgsD6d';
        this.nutsIssuer = 'rBpdegD7kqHdczjKzTKNEUZj1Fg1eYZRbe';
        this.entryFee = '50';
        this.serverUrl = 'http://localhost:3001';
        
        console.log('💸 Xaman Payment API initialized');
        console.log('🔗 Server URL:', this.serverUrl);
    }

    async createContestPayment() {
        console.log('💳 Creating NUTS payment via XUMM API...');
        
        try {
            // Call the XUMM server to create payload
            const response = await fetch(`${this.serverUrl}/create-nuts-payment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    amount: this.entryFee,
                    memo: 'Contest Entry'
                })
            });
            
            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('📦 Payload created:', data);
            
            if (data.success && data.payload) {
                // Show payment modal with QR code
                this.showPaymentModal(data.payload);
                
                // Poll for payment status
                this.pollPaymentStatus(data.payload.uuid);
                
                return new Promise((resolve, reject) => {
                    window.xamanPaymentResolve = resolve;
                    window.xamanPaymentReject = reject;
                });
            } else {
                throw new Error(data.error || 'Failed to create payload');
            }
            
        } catch (error) {
            console.error('❌ Payment creation failed:', error);
            
            // Show fallback payment instructions
            this.showFallbackPayment();
            
            return new Promise((resolve, reject) => {
                window.xamanPaymentResolve = resolve;
                window.xamanPaymentReject = reject;
            });
        }
    }
    
    async pollPaymentStatus(uuid) {
        console.log('🔄 Polling payment status for:', uuid);
        
        let attempts = 0;
        const maxAttempts = 60; // 5 minutes max
        
        const poll = async () => {
            if (attempts >= maxAttempts) {
                console.log('⏱️ Polling timeout');
                return;
            }
            
            try {
                const response = await fetch(`${this.serverUrl}/payload-status/${uuid}`);
                const data = await response.json();
                
                console.log('📊 Payment status:', data);
                
                if (data.meta?.signed === true) {
                    console.log('✅ Payment signed!');
                    document.getElementById('xaman-payment-modal')?.remove();
                    
                    if (window.xamanPaymentResolve) {
                        window.xamanPaymentResolve({
                            success: true,
                            txid: data.response?.txid || 'XUMM_' + Date.now(),
                            timestamp: new Date().toISOString()
                        });
                    }
                    return;
                }
                
                if (data.meta?.signed === false) {
                    console.log('❌ Payment rejected');
                    document.getElementById('xaman-payment-modal')?.remove();
                    
                    if (window.xamanPaymentReject) {
                        window.xamanPaymentReject(new Error('Payment rejected by user'));
                    }
                    return;
                }
                
                // Continue polling
                attempts++;
                setTimeout(poll, 5000); // Poll every 5 seconds
                
            } catch (error) {
                console.error('❌ Status poll error:', error);
                attempts++;
                setTimeout(poll, 5000);
            }
        };
        
        // Start polling after 3 seconds
        setTimeout(poll, 3000);
    }

    showPaymentModal(payload) {
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
                
                ${payload.pushed ? `
                    <div style="background: #2196F3; color: white; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                        <p style="margin: 5px 0;">
                            📱 Push notification sent to your Xaman wallet!
                        </p>
                    </div>
                ` : ''}
                
                <div style="margin: 20px 0;">
                    <p style="color: #fff; margin-bottom: 15px;">Scan with Xaman Wallet:</p>
                    <div style="background: white; padding: 20px; border-radius: 8px; display: inline-block;">
                        <img src="${payload.refs.qr_png}" 
                             width="256" height="256" alt="Payment QR">
                    </div>
                </div>
                
                <div style="margin: 20px 0;">
                    <a href="${payload.next.always}" target="_blank" style="
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
                        Waiting for payment confirmation...
                    </p>
                    <div style="margin-top: 10px;">
                        <div style="display: inline-block; width: 8px; height: 8px; background: #ff6b00; border-radius: 50%; animation: pulse 1.5s infinite;"></div>
                        <div style="display: inline-block; width: 8px; height: 8px; background: #ff6b00; border-radius: 50%; animation: pulse 1.5s infinite 0.5s; margin-left: 5px;"></div>
                        <div style="display: inline-block; width: 8px; height: 8px; background: #ff6b00; border-radius: 50%; animation: pulse 1.5s infinite 1s; margin-left: 5px;"></div>
                    </div>
                </div>
                
                <style>
                    @keyframes pulse {
                        0% { opacity: 0.3; }
                        50% { opacity: 1; }
                        100% { opacity: 0.3; }
                    }
                </style>
            </div>
        `;

        
        document.body.appendChild(modal);
    }
    
    showFallbackPayment() {
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
                
                <div style="background: #ff3333; color: white; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                    <p style="margin: 5px 0;">
                        ⚠️ Server connection issue. Please pay manually:
                    </p>
                </div>
                
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
            </div>
        `;
        
        document.body.appendChild(modal);
    }
}

// Create instance and set all references
const paymentInstance = new XamanPaymentAPI();

// Set ALL window references to ensure compatibility
window.xamanPaymentAPI = paymentInstance;
window.xamanPayment = paymentInstance;
window.xamanPaymentSimple = paymentInstance;
window.xamanPaymentHex = paymentInstance;
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
window.xamanPaymentStandard = paymentInstance;

console.log('✅ Xaman Payment API loaded - Using XUMM server');