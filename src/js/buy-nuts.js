/**
 * Buy NUTS page functionality for $NUTS Sports Pick'em
 * Handles token purchases, package selection, and payment processing
 */

class BuyNutsManager {
    constructor() {
        this.currentPrice = 0.0847; // $NUTS price in USD
        this.userBalance = 0;
        this.selectedPackage = null;
        this.customAmount = null;
        this.walletManager = null;
        this.init();
    }

    async init() {
        await this.initWalletIntegration();
        this.initPackageSelection();
        this.initCustomPurchase();
        this.initPriceUpdates();
        this.loadUserBalance();
        this.updatePriceDisplay();
        console.log('BuyNutsManager initialized');
    }

    async initWalletIntegration() {
        // Wait for wallet manager to be available
        if (window.walletManager) {
            this.walletManager = window.walletManager;
        } else {
            // Import wallet manager if not available
            try {
                const { WalletManager } = await import('./wallet.js');
                this.walletManager = new WalletManager();
            } catch (error) {
                console.error('Failed to load wallet manager:', error);
            }
        }
    }

    initPackageSelection() {
        const packageButtons = document.querySelectorAll('.package-btn');
        
        packageButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const amount = parseInt(e.target.dataset.amount);
                this.selectPackage(amount, e.target);
            });
        });
    }

    selectPackage(amount, buttonElement) {
        this.selectedPackage = amount;
        this.customAmount = null;

        // Update UI to show selection
        document.querySelectorAll('.package-card').forEach(card => {
            card.classList.remove('selected');
        });
        
        const packageCard = buttonElement.closest('.package-card');
        packageCard.classList.add('selected');

        // Clear custom amount selection
        const customAmountInput = document.getElementById('custom-amount');
        if (customAmountInput) {
            customAmountInput.value = '';
        }

        this.processPurchase(amount);
    }

    initCustomPurchase() {
        const customAmountInput = document.getElementById('custom-amount');
        const customBuyButton = document.getElementById('custom-buy-btn');

        if (customAmountInput && customBuyButton) {
            customAmountInput.addEventListener('input', (e) => {
                const amount = parseFloat(e.target.value);
                this.updateCustomPurchaseDisplay(amount);
            });

            customBuyButton.addEventListener('click', () => {
                const amount = parseFloat(customAmountInput.value);
                if (amount && amount >= 100) {
                    this.customAmount = amount;
                    this.selectedPackage = null;
                    this.processPurchase(amount);
                } else {
                    this.showNotification('Minimum purchase is 100 $NUTS', 'warning');
                }
            });
        }
    }

    updateCustomPurchaseDisplay(amount) {
        const costDisplay = document.getElementById('custom-cost');
        const buyButton = document.getElementById('custom-buy-btn');

        if (costDisplay && buyButton) {
            if (amount && amount >= 100) {
                const usdCost = (amount * this.currentPrice).toFixed(2);
                costDisplay.textContent = `≈ $${usdCost}`;
                buyButton.disabled = false;
                buyButton.innerHTML = `
                    <span>Buy ${amount.toLocaleString()} $NUTS</span>
                    <div class="btn-glow"></div>
                `;
            } else {
                costDisplay.textContent = '≈ $0.00';
                buyButton.disabled = true;
                buyButton.innerHTML = `
                    <span>Enter Amount (Min: 100)</span>
                `;
            }
        }
    }

    async processPurchase(amount) {
        if (!this.walletManager || !this.walletManager.isConnected()) {
            this.showNotification('Please connect your wallet first', 'warning');
            return;
        }

        const usdCost = amount * this.currentPrice;
        
        // Show purchase confirmation
        if (!confirm(`Purchase ${amount.toLocaleString()} $NUTS for $${usdCost.toFixed(2)}?`)) {
            return;
        }

        try {
            this.showPurchaseLoading(true);
            
            // Simulate purchase process (replace with actual XRPL transaction)
            const txResult = await this.simulatePurchase(amount, usdCost);
            
            if (txResult.success) {
                this.handlePurchaseSuccess(amount, txResult.txHash);
            } else {
                this.handlePurchaseError(txResult.error);
            }
        } catch (error) {
            console.error('Purchase failed:', error);
            this.handlePurchaseError(error.message);
        } finally {
            this.showPurchaseLoading(false);
        }
    }

    async simulatePurchase(amount, usdCost) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Mock transaction result
        const success = Math.random() > 0.1; // 90% success rate for demo
        
        if (success) {
            return {
                success: true,
                txHash: 'ABCDEF123456789ABCDEF123456789ABCDEF123456789ABCDEF123456789ABCDEF',
                amount: amount,
                cost: usdCost
            };
        } else {
            return {
                success: false,
                error: 'Transaction failed. Please try again.'
            };
        }
    }

    handlePurchaseSuccess(amount, txHash) {
        this.userBalance += amount;
        this.updateBalanceDisplay();
        
        this.showNotification(
            `Successfully purchased ${amount.toLocaleString()} $NUTS!`, 
            'success'
        );

        // Clear selections
        this.selectedPackage = null;
        this.customAmount = null;
        document.querySelectorAll('.package-card').forEach(card => {
            card.classList.remove('selected');
        });

        // Show transaction details
        this.showTransactionDetails(amount, txHash);
    }

    handlePurchaseError(error) {
        this.showNotification(`Purchase failed: ${error}`, 'error');
    }

    showTransactionDetails(amount, txHash) {
        const modal = document.createElement('div');
        modal.className = 'transaction-modal';
        modal.innerHTML = `
            <div class="modal-overlay" onclick="this.parentElement.remove()"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Purchase Successful!</h3>
                    <button class="modal-close" onclick="this.closest('.transaction-modal').remove()">×</button>
                </div>
                <div class="modal-body">
                    <div class="success-icon">✅</div>
                    <div class="transaction-details">
                        <div class="detail-row">
                            <span class="label">Amount Purchased:</span>
                            <span class="value">${amount.toLocaleString()} $NUTS</span>
                        </div>
                        <div class="detail-row">
                            <span class="label">Transaction Hash:</span>
                            <span class="value hash">${this.truncateHash(txHash)}</span>
                        </div>
                        <div class="detail-row">
                            <span class="label">New Balance:</span>
                            <span class="value">${this.userBalance.toLocaleString()} $NUTS</span>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="this.closest('.transaction-modal').remove()">
                        Close
                    </button>
                    <a href="daily-contest.html" class="btn btn-primary">
                        Enter Contest
                    </a>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }

    truncateHash(hash) {
        return `${hash.slice(0, 8)}...${hash.slice(-8)}`;
    }

    showPurchaseLoading(isLoading) {
        const buttons = document.querySelectorAll('.package-btn, #custom-buy-btn');
        
        buttons.forEach(button => {
            if (isLoading) {
                button.disabled = true;
                const originalText = button.querySelector('span').textContent;
                button.innerHTML = `
                    <span class="spinner"></span>
                    <span>Processing...</span>
                `;
                button.dataset.originalText = originalText;
            } else {
                button.disabled = false;
                const originalText = button.dataset.originalText;
                if (originalText) {
                    button.innerHTML = `
                        <span>${originalText}</span>
                        <div class="btn-glow"></div>
                    `;
                }
            }
        });
    }

    async loadUserBalance() {
        if (this.walletManager && this.walletManager.isConnected()) {
            try {
                // Mock balance loading
                this.userBalance = await this.getMockBalance();
                this.updateBalanceDisplay();
            } catch (error) {
                console.error('Failed to load balance:', error);
            }
        }
    }

    async getMockBalance() {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));
        return Math.floor(Math.random() * 5000); // Random balance for demo
    }

    updateBalanceDisplay() {
        const balanceElement = document.getElementById('user-balance');
        if (balanceElement) {
            balanceElement.textContent = `${this.userBalance.toLocaleString()} $NUTS`;
        }
    }

    initPriceUpdates() {
        // Update price every 30 seconds
        setInterval(() => {
            this.updatePriceDisplay();
        }, 30000);
    }

    updatePriceDisplay() {
        // Simulate price fluctuation
        const change = (Math.random() - 0.5) * 0.002; // ±0.1% change
        this.currentPrice = Math.max(0.001, this.currentPrice + change);
        
        const priceElement = document.getElementById('nuts-price');
        const changeElement = document.getElementById('price-change');
        
        if (priceElement) {
            priceElement.textContent = `$${this.currentPrice.toFixed(4)}`;
        }
        
        if (changeElement) {
            const changePercent = ((change / this.currentPrice) * 100).toFixed(1);
            changeElement.textContent = `${changePercent >= 0 ? '+' : ''}${changePercent}%`;
            changeElement.className = `stat-value ${changePercent >= 0 ? 'positive' : 'negative'}`;
        }

        // Update package prices
        this.updatePackagePrices();
    }

    updatePackagePrices() {
        const packages = document.querySelectorAll('.package-card');
        
        packages.forEach(card => {
            const amountElement = card.querySelector('.nuts-amount');
            const usdElement = card.querySelector('.usd-amount');
            
            if (amountElement && usdElement) {
                const nutsAmount = parseInt(amountElement.textContent.replace(/[^\d]/g, ''));
                const usdAmount = (nutsAmount * this.currentPrice).toFixed(2);
                usdElement.textContent = `≈ $${usdAmount}`;
            }
        });
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <span class="notification-icon">${this.getNotificationIcon(type)}</span>
            <span class="notification-message">${message}</span>
            <button class="notification-close" onclick="this.parentElement.remove()">×</button>
        `;

        document.body.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    getNotificationIcon(type) {
        const icons = {
            'info': 'ℹ️',
            'success': '✅',
            'warning': '⚠️',
            'error': '❌'
        };
        return icons[type] || icons.info;
    }

    // DEX trading integration
    initDEXIntegration() {
        const dexButtons = document.querySelectorAll('.dex-btn');
        
        dexButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const dex = e.target.dataset.dex;
                this.openDEXTrading(dex);
            });
        });
    }

    openDEXTrading(dex) {
        const dexUrls = {
            'sologenic': 'https://dex.sologenic.org/',
            'xrptoolkit': 'https://www.xrptoolkit.com/',
            'gatehub': 'https://gatehub.net/'
        };

        const url = dexUrls[dex];
        if (url) {
            if (confirm(`This will open ${dex} in a new tab. Continue?`)) {
                window.open(url, '_blank', 'noopener,noreferrer');
            }
        }
    }

    // Token information display
    displayTokenInfo() {
        const tokenInfo = {
            symbol: '$NUTS',
            totalSupply: '100,000,000',
            contractAddress: 'rNUTSTokenXXXXXXXXXXXXXXXXXXXXXXXXX',
            decimals: 6,
            network: 'XRPL'
        };

        // Update token info display
        Object.keys(tokenInfo).forEach(key => {
            const element = document.getElementById(`token-${key}`);
            if (element) {
                element.textContent = tokenInfo[key];
            }
        });
    }
}

// Initialize Buy NUTS manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.buyNutsManager = new BuyNutsManager();
});

// Add CSS for purchase-specific components
const style = document.createElement('style');
style.textContent = `
    .package-card {
        transition: all 0.3s ease;
        cursor: pointer;
    }

    .package-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 32px rgba(243, 156, 18, 0.2);
    }

    .package-card.selected {
        border-color: #f39c12;
        box-shadow: 0 0 20px rgba(243, 156, 18, 0.4);
    }

    .package-card.selected::before {
        content: '✓';
        position: absolute;
        top: 1rem;
        right: 1rem;
        background: #f39c12;
        color: #000;
        border-radius: 50%;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 14px;
    }

    .transaction-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .transaction-modal .modal-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        backdrop-filter: blur(4px);
    }

    .transaction-modal .modal-content {
        position: relative;
        background: #1a1a1a;
        border-radius: 12px;
        max-width: 500px;
        width: 90%;
        border: 1px solid #333;
    }

    .transaction-modal .modal-header {
        padding: 1.5rem;
        border-bottom: 1px solid #333;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .transaction-modal .modal-body {
        padding: 2rem 1.5rem;
        text-align: center;
    }

    .success-icon {
        font-size: 3rem;
        margin-bottom: 1rem;
    }

    .transaction-details {
        text-align: left;
        margin-top: 1.5rem;
    }

    .detail-row {
        display: flex;
        justify-content: space-between;
        padding: 0.5rem 0;
        border-bottom: 1px solid #333;
    }

    .detail-row:last-child {
        border-bottom: none;
    }

    .detail-row .label {
        color: #999;
    }

    .detail-row .value {
        font-weight: 600;
    }

    .detail-row .hash {
        font-family: monospace;
        font-size: 0.9rem;
    }

    .transaction-modal .modal-footer {
        padding: 1.5rem;
        border-top: 1px solid #333;
        display: flex;
        gap: 1rem;
        justify-content: flex-end;
    }

    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        background: #1a1a1a;
        border: 1px solid #333;
        border-radius: 8px;
        padding: 1rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        z-index: 10001;
        max-width: 400px;
        animation: slideInRight 0.3s ease-out;
    }

    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    .notification-success {
        border-color: #27ae60;
    }

    .notification-warning {
        border-color: #f39c12;
    }

    .notification-error {
        border-color: #e74c3c;
    }

    .notification-close {
        background: none;
        border: none;
        color: #fff;
        cursor: pointer;
        margin-left: auto;
    }

    .spinner {
        display: inline-block;
        width: 16px;
        height: 16px;
        border: 2px solid #333;
        border-radius: 50%;
        border-top-color: #f39c12;
        animation: spin 1s ease-in-out infinite;
    }

    @keyframes spin {
        to { transform: rotate(360deg); }
    }

    .stat-value.positive {
        color: #27ae60;
    }

    .stat-value.negative {
        color: #e74c3c;
    }
`;

document.head.appendChild(style);
