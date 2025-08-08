/**
 * Xaman Payment via XUMM API
 * Uses the XUMM server to create proper payloads
 */

class XamanPaymentAPI {
    constructor(entryFee = '50') {
        this.contestWallet = 'rN2K1Tv6LEM94YN8Kxfe3QyWcGPQNgsD6d';
        this.nutsIssuer = 'rBpdegD7kqHdczjKzTKNEUZj1Fg1eYZRbe';
        this.entryFee = entryFee;
        
        // Use environment-based URL
        this.serverUrl = window.ENV_CONFIG ? window.ENV_CONFIG.api.baseUrl : 'http://localhost:3001';
        this.createPaymentEndpoint = window.ENV_CONFIG ? window.ENV_CONFIG.api.createNutsPayment : `${this.serverUrl}/create-nuts-payment`;
        this.statusEndpoint = window.ENV_CONFIG ? window.ENV_CONFIG.api.payloadStatus : `${this.serverUrl}/payload-status`;
        
        // Detect mobile device
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        console.log('💸 Xaman Payment API initialized');
        console.log('🔗 Server URL:', this.serverUrl);
        console.log('🌍 Environment:', window.ENV_CONFIG?.environment || 'development');
        console.log('📱 Mobile device:', this.isMobile);
    }

    async createContestPayment() {
        console.log('💳 Creating NUTS payment via XUMM API...');
        
        try {
            // Call the XUMM server to create payload
            const response = await fetch(this.createPaymentEndpoint, {
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
                console.log('⏱️ Polling timeout - closing modal');
                document.getElementById('xaman-payment-modal')?.remove();
                if (window.xamanPaymentReject) {
                    window.xamanPaymentReject(new Error('Payment timeout - please check your wallet'));
                }
                return;
            }
            
            try {
                // For production, use query parameter; for dev, use path parameter
                const statusUrl = window.ENV_CONFIG && window.ENV_CONFIG.environment === 'production' 
                    ? `${this.statusEndpoint}?uuid=${uuid}`
                    : `${this.serverUrl}/payload-status/${uuid}`;
                
                const response = await fetch(statusUrl);
                
                if (!response.ok) {
                    console.error('❌ Status poll HTTP error:', response.status);
                    attempts++;
                    setTimeout(poll, 5000);
                    return;
                }
                
                const data = await response.json();
                
                console.log('📊 Payment status response:', data);
                console.log('📊 Signed:', data.meta?.signed, 'Cancelled:', data.meta?.cancelled, 'Resolved:', data.meta?.resolved);
                
                // Update status text
                const statusElement = document.getElementById('payment-status');
                if (statusElement) {
                    statusElement.textContent = `Checking payment... (attempt ${attempts + 1})`;
                }
                
                // Check if payment is resolved (completed in any way)
                if (data.meta?.resolved === true) {
                    // Payment is resolved, check the outcome
                    if (data.meta?.signed === true) {
                        console.log('✅ Payment signed! Transaction ID:', data.response?.txid);
                        document.getElementById('xaman-payment-modal')?.remove();
                        
                        if (window.xamanPaymentResolve) {
                            window.xamanPaymentResolve({
                                success: true,
                                txid: data.response?.txid || 'XUMM_' + Date.now(),
                                txHash: data.response?.txid || 'XUMM_' + Date.now(),
                                walletAddress: data.response?.account || null,
                                timestamp: new Date().toISOString()
                            });
                        }
                        return;
                    } else {
                        // Resolved but not signed = rejected/cancelled/expired
                        console.log('❌ Payment rejected/cancelled/expired');
                        document.getElementById('xaman-payment-modal')?.remove();
                        
                        if (window.xamanPaymentReject) {
                            window.xamanPaymentReject(new Error('Payment was not completed'));
                        }
                        return;
                    }
                } else {
                    // Not resolved yet, continue polling
                    console.log('⏳ Payment pending, continuing to poll...');
                    attempts++;
                    setTimeout(poll, 5000); // Poll every 5 seconds
                }
                
            } catch (error) {
                console.error('❌ Status poll error:', error);
                attempts++;
                setTimeout(poll, 5000);
            }
        };
        
        // Start polling after 1 second (give time for QR to be scanned)
        setTimeout(poll, 1000);
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
        
        // Different content for mobile vs desktop
        if (this.isMobile) {
            modal.innerHTML = this.getMobilePaymentContent(payload);
        } else {
            modal.innerHTML = this.getDesktopPaymentContent(payload);
        }
        
        document.body.appendChild(modal);
        
        // Store payload data for mobile deep link
        this.currentPayload = payload;
    }
    
    getDesktopPaymentContent(payload) {
        return `
            <div style="
                background: #1a1a1a;
                border-radius: 12px;
                padding: 20px;
                text-align: center;
                position: relative;
                border: 2px solid #ff6b00;
                max-width: 400px;
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
                
                <div style="background: white; padding: 10px; border-radius: 8px; display: inline-block;">
                    <img src="${payload.refs.qr_png}" 
                         width="300" height="300" alt="Payment QR">
                </div>
                
                <p style="color: #ff6b00; margin-top: 15px; font-size: 18px; font-weight: bold;">
                    ${this.entryFee} NUTS Entry Fee
                </p>
                <p id="payment-status" style="color: #888; margin-top: 10px; font-size: 14px;">
                    Scan QR code with Xaman wallet...
                </p>
                <p style="color: #666; margin-top: 5px; font-size: 12px;">
                    Do not close this window until payment is complete
                </p>
            </div>
        `;
    }
    
    getMobilePaymentContent(payload) {
        return `
            <div style="
                background: #1a1a1a;
                border-radius: 12px;
                padding: 20px;
                text-align: center;
                position: relative;
                border: 2px solid #ff6b00;
                max-width: 400px;
                width: 90%;
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
                
                <div style="background: #2a2a2a; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <p style="color: #ff6b00; font-size: 24px; font-weight: bold; margin: 0;">
                        ${this.entryFee} NUTS
                    </p>
                    <p style="color: #888; font-size: 14px; margin: 5px 0 0 0;">
                        Entry Fee
                    </p>
                </div>
                
                <!-- Open in Xaman button -->
                <button onclick="window.xamanPayment.openInXaman()" style="
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
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                ">
                    <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M19 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.11 0 2-.9 2-2V5c0-1.1-.89-2-2-2zm-9 14l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z'/%3E%3C/svg%3E" width="24" height="24">
                    Open in Xaman
                </button>
                
                <p id="payment-status" style="color: #888; margin: 10px 0; font-size: 14px;">
                    Waiting for payment...
                </p>
                
                <!-- Alternative options -->
                <details style="margin-top: 20px; text-align: left;">
                    <summary style="color: #888; cursor: pointer; font-size: 14px;">Other options</summary>
                    <div style="margin-top: 15px;">
                        <!-- Small QR code -->
                        <p style="color: #666; font-size: 12px; margin-bottom: 10px;">Scan with another device:</p>
                        <div style="background: white; padding: 5px; border-radius: 4px; display: inline-block; margin-bottom: 15px;">
                            <img src="${payload.refs.qr_png}" width="150" height="150" alt="Payment QR">
                        </div>
                        
                        <!-- Copy UUID button -->
                        <button onclick="window.xamanPayment.copyPaymentId('${payload.uuid}')" style="
                            background: #333;
                            color: #ccc;
                            border: 1px solid #555;
                            padding: 8px 15px;
                            border-radius: 4px;
                            font-size: 12px;
                            cursor: pointer;
                            width: 100%;
                        ">
                            Copy Payment ID
                        </button>
                    </div>
                </details>
            </div>
        `;
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
                        ${this.entryFee} NUTS
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
                        <li>Enter amount: <strong>${this.entryFee}</strong></li>
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
    
    /**
     * Open payment in Xaman app (for mobile)
     */
    openInXaman() {
        if (!this.currentPayload) {
            console.error('No payment payload available');
            return;
        }
        
        // Use the 'next.always' URL which works on all platforms
        const xamanUrl = this.currentPayload.next?.always || this.currentPayload.refs?.deeplink;
        
        if (xamanUrl) {
            console.log('🚀 Opening Xaman app with URL:', xamanUrl);
            window.location.href = xamanUrl;
            
            // Update status
            const statusEl = document.getElementById('payment-status');
            if (statusEl) {
                statusEl.textContent = 'Opening Xaman app...';
            }
        } else {
            console.error('No deep link available in payload');
            alert('Unable to open Xaman app. Please try scanning the QR code.');
        }
    }
    
    /**
     * Copy payment ID to clipboard
     */
    async copyPaymentId(uuid) {
        try {
            await navigator.clipboard.writeText(uuid);
            
            // Show feedback
            const button = event.target;
            const originalText = button.textContent;
            button.textContent = 'Copied!';
            button.style.background = '#4CAF50';
            
            setTimeout(() => {
                button.textContent = originalText;
                button.style.background = '#333';
            }, 2000);
            
            console.log('📋 Payment ID copied:', uuid);
        } catch (err) {
            console.error('Failed to copy:', err);
            alert('Payment ID: ' + uuid);
        }
    }
}

// Create instance and set all references
// Detect if we're on the NFL contest page to use 5000 NUTS instead of 50
const isNFLContest = window.location.pathname.includes('nfl-contest') || 
                    window.location.href.includes('nfl-contest') ||
                    document.title.includes('NFL');

const entryFee = isNFLContest ? '5000' : '50';
const paymentInstance = new XamanPaymentAPI(entryFee);

console.log(`✅ Xaman Payment API loaded - Entry Fee: ${entryFee} NUTS (NFL: ${isNFLContest})`);

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