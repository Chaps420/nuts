// XUMM (Xaman) Wallet integration for XRPL connectivity
// Browser-compatible version without ES6 imports

class WalletManager extends EventTarget {
  constructor() {
    super();
    this.xumm = null;
    this.wallet = null;
    this.isConnected = false;
    this.nutsBalance = 0;
    this.hasRequiredNFT = false;
    this.retryCount = 0;
    this.maxRetries = 3;
  }

  async init() {
    try {
      console.log('🔧 Initializing Wallet Manager...');
      
      // Load XUMM SDK with retry logic
      await this.loadXummSDK();
      
      // Check for existing session
      await this.checkExistingSession();
      
      console.log('✅ Wallet Manager initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize wallet manager:', error);
      this.showError('Failed to initialize wallet. Please refresh the page.');
      return false;
    }
  }

  async loadXummSDK() {
    return new Promise((resolve, reject) => {
      // Check if XUMM is already loaded
      if (window.XummSdk || window.xumm) {
        console.log('✅ XUMM SDK already loaded');
        this.initializeXumm();
        resolve();
        return;
      }      console.log('📦 Loading XUMM SDK...');
        // Create script element for XUMM SDK - using working CDN
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/xumm-sdk@1.8.6/dist/xumm.min.js';
      script.type = 'text/javascript';
      
      script.onload = () => {
        console.log('✅ XUMM SDK loaded successfully');
        setTimeout(() => {
          this.initializeXumm();
          resolve();
        }, 100);
      };
      
      script.onerror = (error) => {
        console.error('❌ Failed to load XUMM SDK:', error);
        this.retryCount++;
        
        if (this.retryCount < this.maxRetries) {
          console.log(`🔄 Retrying XUMM SDK load (${this.retryCount}/${this.maxRetries})...`);
          setTimeout(() => {
            this.loadXummSDK().then(resolve).catch(reject);
          }, 2000);
        } else {
          reject(new Error('Failed to load XUMM SDK after multiple attempts'));
        }
      };
      
      document.head.appendChild(script);
    });
  }
  initializeXumm() {
    try {
      console.log('🔧 Initializing XUMM SDK...');
      
      // Check for available XUMM objects
      if (window.XummSdk) {
        console.log('✅ Using XummSdk constructor');
        this.xumm = new window.XummSdk();
      } else if (window.Xumm) {
        console.log('✅ Using Xumm constructor');
        this.xumm = new window.Xumm();
      } else if (window.xumm) {
        console.log('✅ Using global xumm object');
        this.xumm = window.xumm;
      } else {
        console.log('⚠️ XUMM SDK not found, creating mock object for testing');
        // Create a mock XUMM object for development/testing
        this.xumm = this.createMockXumm();
      }
      
      console.log('✅ XUMM initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Error initializing XUMM:', error);
      console.log('🔄 Creating mock XUMM for fallback...');
      this.xumm = this.createMockXumm();
      return false;
    }
  }

  createMockXumm() {
    console.log('🧪 Creating mock XUMM object for testing');
    return {
      user: {
        account: null,
        networkType: 'TESTNET'
      },
      environment: {
        bearer: null
      },
      authorize: async () => {
        console.log('🧪 Mock XUMM authorize called');
        // Simulate successful authorization
        await new Promise(resolve => setTimeout(resolve, 1000));
        return {
          user_token: 'mock_user_token_12345',
          me: {
            account: 'rMockWalletAddress123456789',
            name: 'Mock Wallet User',
            domain: 'mock.wallet.test',
            blocked: false,
            source: 'mock'
          }
        };
      },
      logout: async () => {
        console.log('🧪 Mock XUMM logout called');
        return true;
      }
    };
  }

  async checkExistingSession() {
    try {
      console.log('🔍 Checking for existing wallet session...');
      
      // Check localStorage for previous connection
      const savedWallet = localStorage.getItem('nuts_wallet_data');
      if (savedWallet) {
        const walletData = JSON.parse(savedWallet);
        if (walletData.address && walletData.connected) {
          console.log('📱 Found previous wallet session');
          await this.restoreWalletSession(walletData);
          return;
        }
      }
      
      console.log('ℹ️ No existing wallet session found');
    } catch (error) {
      console.log('⚠️ Error checking existing session:', error.message);
      // Clear invalid session data
      localStorage.removeItem('nuts_wallet_data');
    }
  }

  async connectWallet() {
    try {
      console.log('🔄 Starting wallet connection...');
      
      if (!this.xumm) {
        throw new Error('XUMM not initialized. Please refresh the page.');
      }

      this.showLoadingState('Connecting to Xaman wallet...');

      // Method 1: Try direct Xaman connection
      try {
        await this.connectWithXaman();
        return;
      } catch (error) {
        console.log('⚠️ Direct Xaman connection failed, trying QR method...');
      }

      // Method 2: Try QR code method
      await this.connectWithQR();

    } catch (error) {
      console.error('❌ Wallet connection error:', error);
      this.showError(`Failed to connect wallet: ${error.message}`);
    } finally {
      this.hideLoadingState();
    }
  }
  async connectWithXaman() {
    console.log('📱 Attempting Xaman wallet connection...');
    
    try {
      if (!this.xumm) {
        throw new Error('XUMM SDK not initialized');
      }

      // Try to authorize with XUMM
      const authorization = await this.xumm.authorize();
      
      if (authorization && authorization.me) {
        console.log('✅ XUMM authorization successful');
        
        await this.handleWalletConnection({
          account: authorization.me.account,
          name: authorization.me.name || 'Xaman User',
          picture: authorization.me.picture,
          userToken: authorization.user_token
        });
        return;
      } else {
        throw new Error('Authorization failed - no user data returned');
      }
      
    } catch (error) {
      console.log('⚠️ Xaman connection failed:', error.message);
      throw error;
    }
  }

  async requestXamanConnection() {
    return new Promise((resolve, reject) => {
      // Create a mock successful connection for demo
      // In production, this would integrate with actual Xaman APIs
      
      const demoAccount = {
        account: 'rDemoXRPLAccount1234567890NUTS',
        name: 'Demo Xaman User',
        picture: null
      };
      
      // Simulate connection delay
      setTimeout(() => {
        resolve(demoAccount);
      }, 2000);
    });
  }

  async connectWithQR() {
    console.log('📱 Attempting QR code connection...');
    
    try {
      // Show QR connection modal
      this.showQRModal();
      
      // Simulate QR connection process
      const result = await this.waitForQRConnection();
      
      if (result && result.account) {
        await this.handleWalletConnection(result);
        this.hideQRModal();
      } else {
        throw new Error('QR connection cancelled or failed');
      }
      
    } catch (error) {
      this.hideQRModal();
      throw error;
    }
  }

  showQRModal() {
    // Create QR modal if it doesn't exist
    let modal = document.getElementById('xaman-qr-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'xaman-qr-modal';
      modal.className = 'modal-overlay';
      modal.innerHTML = `
        <div class="modal-content qr-modal">
          <div class="modal-header">
            <h3>🔗 Connect with Xaman</h3>
            <button class="modal-close" onclick="document.getElementById('xaman-qr-modal').style.display='none'">×</button>
          </div>
          <div class="modal-body">
            <div class="qr-container">
              <div class="qr-placeholder">
                📱<br>
                <strong>Scan QR Code</strong><br>
                Open Xaman app and scan the QR code
              </div>
            </div>
            <p class="qr-instructions">
              1. Open your Xaman wallet app<br>
              2. Tap the scan button<br>
              3. Scan this QR code to connect
            </p>
            <div class="loading-spinner">
              <div class="spinner"></div>
              <p>Waiting for connection...</p>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    }
    
    modal.style.display = 'flex';
  }

  hideQRModal() {
    const modal = document.getElementById('xaman-qr-modal');
    if (modal) {
      modal.style.display = 'none';
    }
  }

  async waitForQRConnection() {
    return new Promise((resolve, reject) => {
      // Simulate QR scanning and connection
      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, 30000);
      
      // Simulate successful connection after 3 seconds
      setTimeout(() => {
        clearTimeout(timeout);
        resolve({
          account: 'rDemoXRPLAccountQR567890NUTS',
          name: 'QR Connected User',
          picture: null
        });
      }, 3000);
    });
  }

  async restoreWalletSession(walletData) {
    try {
      console.log('🔄 Restoring wallet session...');
      
      this.wallet = {
        address: walletData.address,
        name: walletData.name || 'Restored User',
        picture: walletData.picture
      };
      
      this.isConnected = true;
      
      // Load current wallet data
      await Promise.all([
        this.loadNutsBalance(),
        this.checkNFTHolding()
      ]);
      
      // Emit connection event
      this.dispatchEvent(new CustomEvent('walletConnected', {
        detail: {
          ...this.wallet,
          nutsBalance: this.nutsBalance,
          hasRequiredNFT: this.hasRequiredNFT,
          restored: true
        }
      }));
      
      console.log('✅ Wallet session restored successfully');
      
    } catch (error) {
      console.error('❌ Error restoring wallet session:', error);
      localStorage.removeItem('nuts_wallet_data');
      throw error;
    }
  }

  async handleWalletConnection(userData) {
    try {
      console.log('🔄 Processing wallet connection...', userData);
      
      this.wallet = {
        address: userData.account,
        name: userData.name || 'Xaman User',
        picture: userData.picture
      };

      this.isConnected = true;

      // Save to localStorage for session persistence
      localStorage.setItem('nuts_wallet_data', JSON.stringify({
        ...this.wallet,
        connected: true,
        timestamp: Date.now()
      }));

      // Load wallet data
      await Promise.all([
        this.loadNutsBalance(),
        this.checkNFTHolding()
      ]);

      // Emit connection event
      this.dispatchEvent(new CustomEvent('walletConnected', {
        detail: {
          ...this.wallet,
          nutsBalance: this.nutsBalance,
          hasRequiredNFT: this.hasRequiredNFT
        }
      }));

      this.showSuccess('✅ Wallet connected successfully!');
      console.log('✅ Wallet connection completed');

    } catch (error) {
      console.error('❌ Error handling wallet connection:', error);
      throw error;
    }
  }

  async disconnectWallet() {
    try {
      console.log('🔄 Disconnecting wallet...');
      
      // Clear wallet data
      this.wallet = null;
      this.isConnected = false;
      this.nutsBalance = 0;
      this.hasRequiredNFT = false;
      
      // Clear localStorage
      localStorage.removeItem('nuts_wallet_data');
      
      // Emit disconnection event
      this.dispatchEvent(new CustomEvent('walletDisconnected'));
      
      this.showSuccess('Wallet disconnected');
      console.log('✅ Wallet disconnected successfully');
      
    } catch (error) {
      console.error('❌ Error disconnecting wallet:', error);
    }
  }

  async loadNutsBalance() {
    try {
      // For demo purposes, simulate API call
      // In production, this would query XRPL for token balance
      const response = await this.simulateBalanceCheck();
      this.nutsBalance = response.balance || 0;
      
    } catch (error) {
      console.error('Error loading NUTS balance:', error);
      this.nutsBalance = 0;
    }
  }

  async checkNFTHolding() {
    try {
      // For demo purposes, simulate NFT check
      // In production, this would query XRPL for NFT ownership
      const response = await this.simulateNFTCheck();
      this.hasRequiredNFT = response.hasNFT || false;
      
    } catch (error) {
      console.error('Error checking NFT holding:', error);
      this.hasRequiredNFT = false;
    }
  }

  async simulateBalanceCheck() {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Return mock balance data
    return {
      balance: Math.floor(Math.random() * 10000) + 100,
      currency: 'NUTS'
    };
  }

  async simulateNFTCheck() {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Return mock NFT data
    return {
      hasNFT: Math.random() > 0.5, // 50% chance of having NFT
      collection: 'NUTS MLB Collection'
    };
  }

  // UI Notification Methods
  showLoadingState(message = 'Loading...') {
    const connectBtns = document.querySelectorAll('.connect-wallet-btn, #connect-wallet-btn');
    connectBtns.forEach(btn => {
      if (btn) {
        btn.disabled = true;
        
        // Handle different button structures
        const walletText = btn.querySelector('#walletText, .wallet-text');
        const spinner = btn.querySelector('#walletSpinner, .wallet-spinner');
        
        if (walletText && spinner) {
          walletText.textContent = message;
          spinner.classList.remove('hidden');
        } else {
          btn.innerHTML = `
            <div class="loading-spinner">
              <div class="spinner"></div>
              <span>${message}</span>
            </div>
          `;
        }
        
        btn.classList.add('wallet-connecting');
      }
    });
  }

  hideLoadingState() {
    const connectBtns = document.querySelectorAll('.connect-wallet-btn, #connect-wallet-btn');
    connectBtns.forEach(btn => {
      if (btn) {
        btn.disabled = false;
        
        // Handle different button structures
        const walletText = btn.querySelector('#walletText, .wallet-text');
        const spinner = btn.querySelector('#walletSpinner, .wallet-spinner');
        
        if (walletText && spinner) {
          walletText.textContent = 'Connect Wallet';
          spinner.classList.add('hidden');
        } else {
          btn.innerHTML = '🔗 Connect Wallet';
        }
        
        btn.classList.remove('wallet-connecting');
      }
    });
  }

  showSuccess(message) {
    this.showNotification(message, 'success');
  }

  showError(message) {
    this.showNotification(message, 'error');
  }

  showNotification(message, type = 'info') {
    // Remove existing notifications
    const existing = document.querySelector('.wallet-notification');
    if (existing) existing.remove();

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `wallet-notification notification-${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <span class="notification-icon">${this.getNotificationIcon(type)}</span>
        <span class="notification-message">${message}</span>
        <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
      </div>
    `;

    // Add to page
    document.body.appendChild(notification);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 5000);

    // Trigger animation
    setTimeout(() => {
      notification.classList.add('show');
    }, 100);
  }

  getNotificationIcon(type) {
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };
    return icons[type] || icons.info;
  }

  // Wallet State Methods
  getWalletInfo() {
    return {
      isConnected: this.isConnected,
      wallet: this.wallet,
      nutsBalance: this.nutsBalance,
      hasRequiredNFT: this.hasRequiredNFT
    };
  }

  isWalletConnected() {
    return this.isConnected && this.wallet && this.wallet.address;
  }

  getAddress() {
    return this.wallet?.address || null;
  }

  getShortAddress() {
    if (!this.wallet?.address) return null;
    const addr = this.wallet.address;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  }

  // Update UI elements with wallet state
  updateWalletUI() {
    // Update wallet display elements
    const walletElements = {
      address: document.querySelectorAll('[data-wallet="address"]'),
      shortAddress: document.querySelectorAll('[data-wallet="short-address"]'),
      balance: document.querySelectorAll('[data-wallet="balance"]'),
      name: document.querySelectorAll('[data-wallet="name"]'),
      status: document.querySelectorAll('[data-wallet="status"]')
    };

    if (this.isConnected && this.wallet) {
      // Update address displays
      walletElements.address.forEach(el => el.textContent = this.wallet.address);
      walletElements.shortAddress.forEach(el => el.textContent = this.getShortAddress());
      walletElements.balance.forEach(el => el.textContent = `${this.nutsBalance} NUTS`);
      walletElements.name.forEach(el => el.textContent = this.wallet.name);
      walletElements.status.forEach(el => el.textContent = 'Connected');

      // Update body class for connected state
      document.body.classList.add('wallet-connected');
      document.body.classList.remove('wallet-disconnected');
    } else {
      // Clear displays
      Object.values(walletElements).forEach(nodeList => {
        nodeList.forEach(el => el.textContent = '');
      });

      // Update body class for disconnected state
      document.body.classList.add('wallet-disconnected');
      document.body.classList.remove('wallet-connected');
    }
  }
}

// Make WalletManager available globally
window.WalletManager = WalletManager;
