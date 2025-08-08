/**
 * Simple Contest Wallet Implementation
 * Handles $NUTS token payments for contest entries
 */

class ContestWallet {
    constructor() {
        // Contest wallet address that receives entry fees
        this.address = 'rN2K1Tv6LEM94YN8Kxfe3QyWcGPQNgsD6d';
        this.entryFee = 50; // 50 $NUTS
        
        console.log('💰 Contest Wallet initialized:', this.address);
    }

    /**
     * Create payment request for contest entry
     */
    async createEntryPayment(userWallet) {
        try {
            console.log('💸 Creating contest entry payment...');
            
            if (!userWallet) {
                throw new Error('No wallet connected');
            }
            
            // Create payment request payload
            const paymentRequest = {
                TransactionType: 'Payment',
                Account: userWallet,
                Destination: this.address,
                Amount: {
                    currency: 'NUTS',
                    value: String(this.entryFee),
                    issuer: 'rGzx83BVoqTYbGn7tiVAnFw7cbxjin13jL' // $NUTS issuer
                },
                Memos: [
                    {
                        Memo: {
                            MemoType: Buffer.from('contest_entry', 'utf8').toString('hex').toUpperCase(),
                            MemoData: Buffer.from(JSON.stringify({
                                contest: 'daily',
                                date: new Date().toISOString().split('T')[0],
                                fee: this.entryFee
                            }), 'utf8').toString('hex').toUpperCase()
                        }
                    }
                ]
            };
            
            return paymentRequest;
            
        } catch (error) {
            console.error('❌ Failed to create payment request:', error);
            throw error;
        }
    }

    /**
     * Process contest entry payment through Xaman
     */
    async processEntryPayment() {
        try {
            console.log('🎮 Processing contest entry payment...');
            
            // Check if Xaman wallet is available
            if (!window.xamanWallet || !window.xamanWallet.isConnected()) {
                throw new Error('Please connect your Xaman wallet first');
            }
            
            const userWallet = window.xamanWallet.getAccount();
            if (!userWallet) {
                throw new Error('No wallet account found');
            }
            
            // Create payment request
            const paymentRequest = await this.createEntryPayment(userWallet);
            
            // Send payment request to Xaman
            const result = await this.sendPaymentToXaman(paymentRequest);
            
            if (result.signed) {
                console.log('✅ Contest entry payment successful!');
                return {
                    success: true,
                    txHash: result.txHash,
                    amount: this.entryFee,
                    wallet: userWallet
                };
            } else {
                throw new Error('Payment was rejected or cancelled');
            }
            
        } catch (error) {
            console.error('❌ Contest entry payment failed:', error);
            throw error;
        }
    }

    /**
     * Send payment request to Xaman using XUMM SDK
     */
    async sendPaymentToXaman(paymentRequest) {
        try {
            // Use the XUMM SDK integration
            if (window.xamanWallet && window.xamanWallet.createPaymentRequest) {
                const result = await window.xamanWallet.createPaymentRequest(
                    this.entryFee,
                    this.address
                );
                
                return result;
            } else {
                throw new Error('XUMM SDK not available');
            }
        } catch (error) {
            console.error('❌ Payment request failed:', error);
            throw error;
        }
    }


    /**
     * Get contest wallet balance (optional feature)
     */
    async getBalance() {
        // This would connect to XRPL to get actual balance
        // For now, return mock data
        return {
            NUTS: 10000,
            XRP: 25
        };
    }
}

// Create global instance
window.contestWallet = new ContestWallet();

console.log('💰 Contest Wallet module loaded');