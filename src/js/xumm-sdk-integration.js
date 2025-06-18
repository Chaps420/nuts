/**
 * XUMM SDK Integration for Production
 * Uses the official XUMM SDK for proper wallet connections
 */

class XummSDKIntegration {
    constructor() {
        this.sdk = null;
        this.connected = false;
        this.account = null;
        this.apiKey = window.config?.xumm?.apiKey || '14242c23-a236-43bd-9126-6490cbd4001d';
        
        console.log('🔗 XUMM SDK Integration initializing...');
        this.initializeSDK();
    }

    /**
     * Initialize XUMM SDK
     */
    async initializeSDK() {
        try {
            // Load XUMM SDK from CDN
            if (!window.Xumm && !window.XummSdk) {
                await this.loadXummSDK();
            }
            
            // Check for different possible SDK locations
            const XummConstructor = window.Xumm || window.XummSdk || (window.xumm && window.xumm.Xumm);
            
            if (!XummConstructor) {
                throw new Error('XUMM SDK not found after loading');
            }
            
            // Initialize SDK with API key
            this.sdk = new XummConstructor(this.apiKey);
            console.log('✅ XUMM SDK initialized successfully');
            
        } catch (error) {
            console.error('❌ Failed to initialize XUMM SDK:', error);
            throw error;
        }
    }

    /**
     * Load XUMM SDK from CDN
     */
    loadXummSDK() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://xumm.app/assets/cdn/xumm-sdk-browser.min.js';
            script.onload = () => {
                console.log('✅ XUMM SDK script loaded');
                // Give it a moment to initialize
                setTimeout(resolve, 100);
            };
            script.onerror = () => reject(new Error('Failed to load XUMM SDK'));
            document.head.appendChild(script);
        });
    }

    /**
     * Connect wallet using XUMM
     */
    async connect() {
        try {
            console.log('🔄 Initiating XUMM wallet connection...');
            
            if (!this.sdk) {
                await this.initializeSDK();
            }
            
            // Create sign-in payload
            const payload = await this.sdk.payload.create({
                TransactionType: 'SignIn'
            });
            
            console.log('📱 XUMM Payload created:', payload.uuid);
            
            // Subscribe to payload updates
            const subscription = await this.sdk.payload.subscribe(payload.uuid, (event) => {
                console.log('📡 XUMM Event:', event);
                
                if (event.data.signed === true) {
                    console.log('✅ Payload signed!');
                    return event.data;
                }
                
                if (event.data.signed === false) {
                    console.log('❌ Payload rejected');
                    throw new Error('User rejected the sign request');
                }
            });
            
            // Open sign request (opens Xaman app or shows QR)
            if (typeof window !== 'undefined') {
                window.open(payload.next.always, '_blank');
            }
            
            // Wait for response
            console.log('⏳ Waiting for user to sign...');
            const resolveData = await subscription.resolved;
            
            if (resolveData.signed) {
                // Get the payload result
                const result = await this.sdk.payload.get(payload.uuid);
                console.log('📦 Payload result:', result);
                
                if (result.response.account) {
                    this.handleConnection({
                        account: result.response.account,
                        network: result.response.network_type || 'MAINNET'
                    });
                    
                    return {
                        success: true,
                        account: result.response.account,
                        network: result.response.network_type
                    };
                }
            }
            
            throw new Error('Failed to get account information');
            
        } catch (error) {
            console.error('❌ XUMM connection failed:', error);
            throw error;
        }
    }

    /**
     * Create payment request
     */
    async createPaymentRequest(amount, destination) {
        try {
            console.log('💸 Creating XUMM payment request...');
            
            if (!this.sdk) {
                throw new Error('XUMM SDK not initialized');
            }
            
            // Create payment payload
            const payload = await this.sdk.payload.create({
                TransactionType: 'Payment',
                Destination: destination,
                Amount: {
                    currency: 'NUTS',
                    value: String(amount),
                    issuer: 'rGzx83BVoqTYbGn7tiVAnFw7cbxjin13jL'
                },
                Memos: [
                    {
                        Memo: {
                            MemoType: Buffer.from('contest_entry', 'utf8').toString('hex').toUpperCase(),
                            MemoData: Buffer.from(JSON.stringify({
                                contest: 'daily',
                                date: new Date().toISOString().split('T')[0]
                            }), 'utf8').toString('hex').toUpperCase()
                        }
                    }
                ]
            });
            
            console.log('📱 Payment payload created:', payload.uuid);
            
            // Subscribe to payload updates
            const subscription = await this.sdk.payload.subscribe(payload.uuid, (event) => {
                console.log('📡 Payment event:', event);
                
                if (event.data.signed === true) {
                    return event.data;
                }
                
                if (event.data.signed === false) {
                    throw new Error('Payment rejected by user');
                }
            });
            
            // Open payment request
            if (typeof window !== 'undefined') {
                window.open(payload.next.always, '_blank');
            }
            
            // Wait for response
            console.log('⏳ Waiting for payment confirmation...');
            const resolveData = await subscription.resolved;
            
            if (resolveData.signed) {
                const result = await this.sdk.payload.get(payload.uuid);
                console.log('✅ Payment completed:', result);
                
                return {
                    success: true,
                    txHash: result.response.txid,
                    signed: true
                };
            }
            
            throw new Error('Payment was not completed');
            
        } catch (error) {
            console.error('❌ Payment request failed:', error);
            throw error;
        }
    }

    /**
     * Handle successful connection
     */
    handleConnection(data) {
        this.connected = true;
        this.account = data.account;
        
        window.dispatchEvent(new CustomEvent('xaman:connected', {
            detail: { account: data.account, network: data.network }
        }));
    }

    /**
     * Disconnect wallet
     */
    disconnect() {
        this.connected = false;
        this.account = null;
        
        window.dispatchEvent(new CustomEvent('xaman:disconnected'));
    }

    /**
     * Check if connected
     */
    isConnected() {
        return this.connected && this.account !== null;
    }

    /**
     * Get account
     */
    getAccount() {
        return this.account;
    }
}

// Replace xamanWallet with proper XUMM SDK implementation
window.xamanWallet = new XummSDKIntegration();

console.log('✅ XUMM SDK Integration module loaded');