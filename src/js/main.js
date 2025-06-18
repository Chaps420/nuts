// Main application file for $NUTS Sports Pick'em platform

import { config } from '../../config/config.js';
import { WalletManager } from './wallet.js';
import { ContestManager } from './contests.js';
import { OddsAPI } from './odds-api.js';

class NutsApp {
  constructor() {
    this.walletManager = new WalletManager();
    this.contestManager = new ContestManager();
    this.oddsAPI = new OddsAPI();
    this.isInitialized = false;
  }

  async init() {
    try {
      console.log('🥜 Initializing $NUTS Sports Pick\'em Platform...');
      
      // Initialize components
      await this.initializeComponents();
      
      // Set up event listeners
      this.setupEventListeners();
      
      // Load initial data
      await this.loadInitialData();
      
      this.isInitialized = true;
      console.log('✅ $NUTS Platform initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize $NUTS Platform:', error);
      this.showError('Failed to initialize platform. Please refresh and try again.');
    }
  }

  async initializeComponents() {
    // Initialize wallet manager
    await this.walletManager.init();
    
    // Initialize contest manager
    await this.contestManager.init();
    
    // Initialize odds API
    await this.oddsAPI.init();
  }
  setupEventListeners() {
    // Wallet connection buttons (multiple possible selectors)
    const connectButtons = document.querySelectorAll('#connect-wallet-btn, .connect-wallet-btn, [data-action="connect-wallet"]');
    connectButtons.forEach(btn => {
      btn.addEventListener('click', async () => {
        console.log('🔗 Connect wallet button clicked');
        await this.walletManager.connectWallet();
      });
    });

    // Wallet disconnect buttons
    const disconnectButtons = document.querySelectorAll('#disconnect-wallet-btn, .disconnect-wallet-btn, [data-action="disconnect-wallet"]');
    disconnectButtons.forEach(btn => {
      btn.addEventListener('click', async () => {
        console.log('🔌 Disconnect wallet button clicked');
        await this.walletManager.disconnectWallet();
      });
    });

    // Daily contest entry button
    const dailyContestBtn = document.getElementById('daily-contest-btn');
    if (dailyContestBtn) {
      dailyContestBtn.addEventListener('click', () => {
        window.location.href = 'daily-contest.html';
      });
    }

    // NFT contest entry button (updated from weekly to NFT)
    const nftContestBtn = document.getElementById('nft-contest-btn');
    if (nftContestBtn) {
      nftContestBtn.addEventListener('click', () => {
        window.location.href = 'nft-contest.html';
      });
    }

    // Mobile menu toggle
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    if (mobileMenuBtn && mobileMenu) {
      mobileMenuBtn.addEventListener('click', () => {
        mobileMenu.classList.toggle('hidden');
      });
    }

    // Wallet state changes
    this.walletManager.addEventListener('walletConnected', (event) => {
      console.log('📱 Wallet connected event received', event.detail);
      this.onWalletConnected(event.detail);
    });

    this.walletManager.addEventListener('walletDisconnected', () => {
      console.log('📱 Wallet disconnected event received');
      this.onWalletDisconnected();
    });

    // Store wallet manager globally for easy access
    window.walletManager = this.walletManager;
  }

  async loadInitialData() {
    try {
      // Load active contests
      await this.loadActiveContests();
      
      // Load latest winners
      await this.loadLatestWinners();
      
      // Load upcoming games preview
      await this.loadUpcomingGames();
      
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  }

  async loadActiveContests() {
    try {
      const contests = await this.contestManager.getActiveContests();
      this.updateContestDisplay(contests);
    } catch (error) {
      console.error('Error loading active contests:', error);
    }
  }

  async loadLatestWinners() {
    try {
      const winners = await this.contestManager.getLatestWinners(5);
      this.updateWinnersDisplay(winners);
    } catch (error) {
      console.error('Error loading latest winners:', error);
    }
  }

  async loadUpcomingGames() {
    try {
      const games = await this.oddsAPI.getUpcomingGames(5);
      this.updateGamesPreview(games);
    } catch (error) {
      console.error('Error loading upcoming games:', error);
    }
  }

  updateContestDisplay(contests) {
    // Update daily contest info
    const dailyContest = contests.find(c => c.type === 'daily');
    if (dailyContest) {
      const dailyPrizeElement = document.getElementById('daily-prize-pool');
      const dailyPlayersElement = document.getElementById('daily-players');
      
      if (dailyPrizeElement) {
        dailyPrizeElement.textContent = `${dailyContest.prizePool.toLocaleString()} $NUTS`;
      }
      if (dailyPlayersElement) {
        dailyPlayersElement.textContent = `${dailyContest.playerCount} players`;
      }
    }

    // Update weekly contest info
    const weeklyContest = contests.find(c => c.type === 'weekly');
    if (weeklyContest) {
      const weeklyPrizeElement = document.getElementById('weekly-prize-pool');
      const weeklyPlayersElement = document.getElementById('weekly-players');
      
      if (weeklyPrizeElement) {
        weeklyPrizeElement.textContent = weeklyContest.prizeDescription || 'Exclusive NFTs';
      }
      if (weeklyPlayersElement) {
        weeklyPlayersElement.textContent = `${weeklyContest.playerCount} NFT holders`;
      }
    }
  }

  updateWinnersDisplay(winners) {
    const winnersContainer = document.getElementById('latest-winners');
    if (!winnersContainer) return;

    winnersContainer.innerHTML = winners.map(winner => `
      <div class="winner-card">
        <div class="winner-info">
          <span class="winner-wallet">${this.truncateWallet(winner.wallet)}</span>
          <span class="winner-prize">+${winner.prize.toLocaleString()} $NUTS</span>
        </div>
        <div class="winner-meta">
          <span class="contest-type">${winner.contestType}</span>
          <span class="winner-date">${this.formatDate(winner.date)}</span>
        </div>
      </div>
    `).join('');
  }

  updateGamesPreview(games) {
    const gamesContainer = document.getElementById('upcoming-games-preview');
    if (!gamesContainer) return;

    gamesContainer.innerHTML = games.slice(0, 3).map(game => `
      <div class="game-preview-card">
        <div class="teams">
          <span class="away-team">${game.awayTeam}</span>
          <span class="vs">@</span>
          <span class="home-team">${game.homeTeam}</span>
        </div>
        <div class="game-time">
          ${this.formatGameTime(game.startTime)}
        </div>
      </div>
    `).join('');
  }
  onWalletConnected(walletData) {
    console.log('🎉 Processing wallet connection in main app', walletData);
    
    // Update connect button
    const connectBtns = document.querySelectorAll('#connect-wallet-btn, .connect-wallet-btn');
    connectBtns.forEach(btn => {
      if (btn) {
        btn.textContent = `🔗 ${this.truncateWallet(walletData.address)}`;
        btn.classList.add('connected');
        btn.disabled = false;
      }
    });
    
    // Update wallet info displays
    const walletInfo = document.getElementById('wallet-info');
    if (walletInfo) {
      walletInfo.innerHTML = `
        <div class="wallet-details">
          <span class="wallet-address" title="${walletData.address}">
            ${this.truncateWallet(walletData.address)}
          </span>
          <span class="nuts-balance">${walletData.nutsBalance.toLocaleString()} $NUTS</span>
          ${walletData.hasRequiredNFT ? '<span class="nft-badge">🐿️ NFT Holder</span>' : ''}
        </div>
        <button class="disconnect-wallet-btn" onclick="walletManager.disconnectWallet()">
          Disconnect
        </button>
      `;
      walletInfo.classList.remove('hidden');
    }

    // Update all wallet data elements
    this.walletManager.updateWalletUI();

    // Show wallet-dependent features
    document.querySelectorAll('.wallet-required').forEach(el => {
      el.classList.remove('disabled');
    });

    // Update page body class
    document.body.classList.add('wallet-connected');
    document.body.classList.remove('wallet-disconnected');

    // Show success message if not a restored session
    if (!walletData.restored) {
      this.showSuccess(`🎉 Wallet connected: ${this.truncateWallet(walletData.address)}`);
    }
  }

  onWalletDisconnected() {
    console.log('👋 Processing wallet disconnection in main app');
    
    // Update connect buttons
    const connectBtns = document.querySelectorAll('#connect-wallet-btn, .connect-wallet-btn');
    connectBtns.forEach(btn => {
      if (btn) {
        btn.textContent = '🔗 Connect Wallet';
        btn.classList.remove('connected');
        btn.disabled = false;
      }
    });
    
    // Hide wallet info
    const walletInfo = document.getElementById('wallet-info');
    if (walletInfo) {
      walletInfo.classList.add('hidden');
      walletInfo.innerHTML = '';
    }

    // Update wallet UI elements
    this.walletManager.updateWalletUI();

    // Hide wallet-dependent features
    document.querySelectorAll('.wallet-required').forEach(el => {
      el.classList.add('disabled');
    });

    // Update page body class
    document.body.classList.add('wallet-disconnected');
    document.body.classList.remove('wallet-connected');
  }

  // Utility methods
  truncateWallet(address) {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  formatDate(date) {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  }

  formatGameTime(timestamp) {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }

  showError(message) {
    // Create error notification
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-notification';
    errorDiv.textContent = message;
    
    document.body.appendChild(errorDiv);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      errorDiv.remove();
    }, 5000);
  }

  showSuccess(message) {
    // Create success notification
    const successDiv = document.createElement('div');
    successDiv.className = 'success-notification';
    successDiv.textContent = message;
    
    document.body.appendChild(successDiv);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
      successDiv.remove();
    }, 3000);
  }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.nutsApp = new NutsApp();
  window.nutsApp.init();
});

// Export for use in other modules
export default NutsApp;
