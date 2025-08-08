/**
 * NFT Holder Contest Page JavaScript
 * Handles NFT verification, contest entry, and weekly game selection
 */

class NFTContestManager {
    constructor() {
        this.userNFTs = [];
        this.weeklyGames = [];
        this.userPicks = new Map();
        this.contestEntry = null;
        this.contestDeadline = null;
        this.nftCollectionURL = 'https://xrp.cafe/collection/nutsmlb';
        this.init();
    }

    async init() {
        console.log('Initializing NFT Contest Page...');
        
        // Initialize wallet and other managers
        if (typeof WalletManager !== 'undefined') {
            this.walletManager = new WalletManager();
        }
        
        if (typeof OddsAPI !== 'undefined') {
            this.oddsAPI = new OddsAPI();
        }
        
        if (typeof ContestManager !== 'undefined') {
            this.contestManager = new ContestManager();
        }

        // Set up event listeners
        this.setupEventListeners();
        
        // Load contest data
        await this.loadWeeklyContestData();
        
        // Check wallet and NFT holdings when connected
        this.checkWalletConnection();
        
        // Start countdown timer
        this.startWeekCountdown();
    }

    setupEventListeners() {
        // Enter NFT contest button
        const enterBtn = document.getElementById('enter-nft-contest-btn');
        if (enterBtn) {
            enterBtn.addEventListener('click', () => this.handleNFTContestEntry());
        }

        // Submit picks button
        const submitBtn = document.getElementById('submit-nft-picks-btn');
        if (submitBtn) {
            submitBtn.addEventListener('click', () => this.handleSubmitNFTPicks());
        }

        // Mobile menu toggle
        const mobileMenuBtn = document.getElementById('mobile-menu-btn');
        const mobileMenu = document.getElementById('mobile-menu');
        if (mobileMenuBtn && mobileMenu) {
            mobileMenuBtn.addEventListener('click', () => {
                mobileMenu.classList.toggle('hidden');
            });
        }

        // Wallet connection events
        document.addEventListener('walletConnected', () => {
            this.handleWalletConnected();
        });

        document.addEventListener('walletDisconnected', () => {
            this.handleWalletDisconnected();
        });
    }

    async loadWeeklyContestData() {
        try {
            // Load this week's games (different from daily games)
            const games = await this.oddsAPI.getWeeklyGames();
            this.weeklyGames = games.slice(0, 15); // More games for weekly contest
            
            // Update prize pool and entry count
            await this.updateWeeklyContestStats();
            
        } catch (error) {
            console.error('Error loading weekly contest data:', error);
            this.showError('Failed to load contest data. Please refresh the page.');
        }
    }

    async updateWeeklyContestStats() {
        try {
            // Get weekly contest stats (mock data for now)
            const stats = {
                prizePool: '1,000 $NUTS',
                nftHolderCount: 123,
                weekEnd: this.getNextSunday()
            };

            // Update UI
            document.getElementById('nft-prize-pool').textContent = stats.prizePool;
            document.getElementById('nft-entry-count').textContent = stats.nftHolderCount;
            this.contestDeadline = stats.weekEnd;
            
        } catch (error) {
            console.error('Error updating weekly contest stats:', error);
        }
    }

    async checkWalletConnection() {
        if (this.walletManager && this.walletManager.isConnected()) {
            await this.handleWalletConnected();
        }
    }

    async handleWalletConnected() {
        try {
            // Verify NFT holdings
            await this.verifyNFTHoldings();
        } catch (error) {
            console.error('Error handling wallet connection:', error);
            this.showError('Failed to verify NFT holdings.');
        }
    }

    handleWalletDisconnected() {
        // Reset NFT verification state
        this.userNFTs = [];
        document.getElementById('nft-collection').classList.add('hidden');
        document.getElementById('nft-games-section').classList.add('hidden');
        
        // Reset status to initial state
        this.updateNFTStatus('disconnected');
    }

    async verifyNFTHoldings() {
        try {
            this.updateNFTStatus('verifying');
            
            // Get user's wallet address
            const walletAddress = this.walletManager.getWalletAddress();
            
            // Check for $NUTS NFTs (mock verification for now)
            const nfts = await this.mockGetNFTsFromWallet(walletAddress);
            
            if (nfts.length > 0) {
                this.userNFTs = nfts;
                this.updateNFTStatus('verified');
                this.displayUserNFTs();
            } else {
                this.updateNFTStatus('no-nfts');
            }
            
        } catch (error) {
            console.error('Error verifying NFT holdings:', error);
            this.updateNFTStatus('error');
        }
    }

    async mockGetNFTsFromWallet(walletAddress) {
        // Simulate API call to check NFTs
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Mock NFT data - in real implementation, this would query XRPL
        return [
            {
                id: 'nft_001',
                name: 'Golden Squirrel #42',
                image: 'placeholder_golden_squirrel.png',
                rarity: 'Ultra Rare',
                attributes: { type: 'Golden', level: 5 }
            },
            {
                id: 'nft_002',
                name: 'Diamond Nut #128',
                image: 'placeholder_diamond_nut.png',
                rarity: 'Legendary',
                attributes: { type: 'Diamond', level: 8 }
            },
            {
                id: 'nft_003',
                name: 'Acorn Collector #256',
                image: 'placeholder_acorn.png',
                rarity: 'Rare',
                attributes: { type: 'Collector', level: 3 }
            }
        ];
    }

    updateNFTStatus(status) {
        const statusCard = document.querySelector('#nft-status .status-card');
        if (!statusCard) return;

        switch (status) {
            case 'verifying':
                statusCard.innerHTML = `
                    <div class="status-icon spinner"></div>
                    <h3>Verifying NFT Holdings</h3>
                    <p>Checking your wallet for $NUTS NFTs...</p>
                `;
                break;
                
            case 'verified':
                statusCard.innerHTML = `
                    <div class="status-icon">✅</div>
                    <h3>NFT Holdings Verified</h3>
                    <p>Great! You own ${this.userNFTs.length} $NUTS NFT${this.userNFTs.length > 1 ? 's' : ''}. You can enter the weekly contest for free.</p>
                `;
                document.getElementById('nft-collection').classList.remove('hidden');
                break;
                
            case 'no-nfts':
                statusCard.innerHTML = `
                    <div class="status-icon">❌</div>
                    <h3>No $NUTS NFTs Found</h3>
                    <p>You need to own at least one $NUTS NFT to participate in the weekly contest.</p>
                    <a href="#buy-nfts" class="btn btn-primary">Buy $NUTS NFTs</a>
                `;
                break;
                
            case 'error':
                statusCard.innerHTML = `
                    <div class="status-icon">⚠️</div>
                    <h3>Verification Error</h3>
                    <p>Unable to verify NFT holdings. Please try refreshing the page.</p>
                    <button onclick="location.reload()" class="btn btn-secondary">Refresh</button>
                `;
                break;
                
            case 'disconnected':
            default:
                statusCard.innerHTML = `
                    <div class="status-icon">🔍</div>
                    <h3>Checking NFT Holdings</h3>
                    <p>Connect your wallet to verify $NUTS NFT ownership</p>
                    <div class="verification-steps">
                        <div class="step-item">
                            <span class="step-number">1</span>
                            <span>Connect Wallet</span>
                        </div>
                        <div class="step-item">
                            <span class="step-number">2</span>
                            <span>Verify NFT Holdings</span>
                        </div>
                        <div class="step-item">
                            <span class="step-number">3</span>
                            <span>Enter Contest</span>
                        </div>
                    </div>
                `;
                break;
        }
    }

    displayUserNFTs() {
        const nftsGrid = document.getElementById('nfts-grid');
        if (!nftsGrid || this.userNFTs.length === 0) return;

        nftsGrid.innerHTML = this.userNFTs.map(nft => `
            <div class="nft-card">
                <div class="nft-image">
                    <div class="nft-placeholder">
                        <div class="nft-icon">${this.getNFTIcon(nft.attributes.type)}</div>
                    </div>
                </div>
                <div class="nft-info">
                    <h4 class="nft-name">${nft.name}</h4>
                    <div class="nft-rarity ${nft.rarity.toLowerCase().replace(' ', '-')}">${nft.rarity}</div>
                    <div class="nft-attributes">
                        <span class="attribute">Level ${nft.attributes.level}</span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    getNFTIcon(type) {
        const icons = {
            'Golden': '🌟',
            'Diamond': '💎',
            'Collector': '🥜',
            'Silver': '⚪',
            'Bronze': '🟤'
        };
        return icons[type] || '🐿️';
    }

    async handleNFTContestEntry() {
        try {
            const enterBtn = document.getElementById('enter-nft-contest-btn');
            if (!enterBtn) return;

            // Verify NFT ownership
            if (this.userNFTs.length === 0) {
                throw new Error('You need to own at least one $NUTS NFT to enter this contest.');
            }

            // Show loading state
            enterBtn.innerHTML = '<span class="spinner"></span> Entering...';
            enterBtn.disabled = true;

            // Check if already entered this week
            const weekKey = this.getWeekKey();
            const existingEntry = localStorage.getItem(`nft_contest_entry_${weekKey}`);
            
            if (existingEntry) {
                this.contestEntry = JSON.parse(existingEntry);
            } else {
                // Create new entry (no payment required for NFT holders)
                this.contestEntry = {
                    walletAddress: this.walletManager.getWalletAddress(),
                    nftCount: this.userNFTs.length,
                    timestamp: new Date(),
                    weekKey: weekKey
                };

                // Save entry
                localStorage.setItem(`nft_contest_entry_${weekKey}`, JSON.stringify(this.contestEntry));
            }

            // Update UI
            this.updateEntryStatus();
            this.showSuccess('Successfully entered the weekly NFT holder contest!');
            
            // Load and show games
            await this.loadAndRenderWeeklyGames();
            document.getElementById('nft-games-section').classList.remove('hidden');

        } catch (error) {
            console.error('NFT contest entry error:', error);
            this.showError(error.message);
            
            // Reset button
            const enterBtn = document.getElementById('enter-nft-contest-btn');
            if (enterBtn) {
                enterBtn.innerHTML = '<span>Enter Weekly Contest (FREE)</span>';
                enterBtn.disabled = false;
            }
        }
    }

    async loadAndRenderWeeklyGames() {
        const gamesGrid = document.getElementById('nft-games-grid');
        if (!gamesGrid) return;

        try {
            // Load fresh games data if needed
            if (this.weeklyGames.length === 0) {
                await this.loadWeeklyContestData();
            }

            if (this.weeklyGames.length === 0) {
                gamesGrid.innerHTML = `
                    <div class="no-games">
                        <div class="no-games-icon">🚫</div>
                        <h3>No Games This Week</h3>
                        <p>Check back next week for new games.</p>
                    </div>
                `;
                return;
            }

            gamesGrid.innerHTML = this.weeklyGames.map((game, index) => `
                <div class="game-card" data-game-id="${game.id}">
                    <div class="game-header">
                        <div class="game-time">${this.formatGameTime(game.commence_time)}</div>
                        <div class="game-sport">${game.sport_title}</div>
                    </div>
                    <div class="game-matchup">
                        <div class="team-option ${this.userPicks.get(game.id) === game.away_team ? 'selected' : ''}" 
                             data-team="${game.away_team}" onclick="nftContest.selectWeeklyTeam('${game.id}', '${game.away_team}')">
                            <div class="team-name">${game.away_team}</div>
                            <div class="team-odds">${this.formatOdds(game.bookmakers?.[0]?.markets?.[0]?.outcomes?.find(o => o.name === game.away_team)?.price)}</div>
                        </div>
                        <div class="vs-divider">VS</div>
                        <div class="team-option ${this.userPicks.get(game.id) === game.home_team ? 'selected' : ''}" 
                             data-team="${game.home_team}" onclick="nftContest.selectWeeklyTeam('${game.id}', '${game.home_team}')">
                            <div class="team-name">${game.home_team}</div>
                            <div class="team-odds">${this.formatOdds(game.bookmakers?.[0]?.markets?.[0]?.outcomes?.find(o => o.name === game.home_team)?.price)}</div>
                        </div>
                    </div>
                    <div class="pick-status">
                        ${this.userPicks.get(game.id) ? 
                            `<span class="pick-selected">✓ ${this.userPicks.get(game.id)}</span>` : 
                            '<span class="pick-pending">Select your pick</span>'
                        }
                    </div>
                </div>
            `).join('');

        } catch (error) {
            console.error('Error loading weekly games:', error);
            gamesGrid.innerHTML = `
                <div class="error-state">
                    <div class="error-icon">⚠️</div>
                    <h3>Failed to Load Games</h3>
                    <p>Please refresh the page to try again.</p>
                </div>
            `;
        }
    }

    selectWeeklyTeam(gameId, teamName) {
        // Check if user has entered contest
        if (!this.contestEntry) {
            this.showError('Please enter the contest first to make picks.');
            return;
        }

        // Check if deadline has passed
        if (this.contestDeadline && new Date() > this.contestDeadline) {
            this.showError('Contest deadline has passed. No more picks allowed.');
            return;
        }

        // Update user pick
        this.userPicks.set(gameId, teamName);
        
        // Re-render games to show selection
        this.loadAndRenderWeeklyGames();
        
        // Update picks summary
        this.updateNFTPicksSummary();
        
        // Show submit section if enough picks are made
        if (this.userPicks.size >= Math.min(10, this.weeklyGames.length)) {
            document.getElementById('nft-submit-section').classList.remove('hidden');
        }
    }

    updateNFTPicksSummary() {
        const picksList = document.getElementById('nft-picks-list');
        if (!picksList) return;

        const picksArray = [];
        this.userPicks.forEach((team, gameId) => {
            const game = this.weeklyGames.find(g => g.id === gameId);
            if (game) {
                picksArray.push(`${game.away_team} vs ${game.home_team}: <strong>${team}</strong>`);
            }
        });

        picksList.innerHTML = picksArray.join('<br>');
    }

    async handleSubmitNFTPicks() {
        try {
            const submitBtn = document.getElementById('submit-nft-picks-btn');
            if (!submitBtn) return;

            // Validate picks
            const minPicks = Math.min(10, this.weeklyGames.length);
            if (this.userPicks.size < minPicks) {
                throw new Error(`Please make at least ${minPicks} picks.`);
            }

            // Show loading state
            submitBtn.innerHTML = '<span class="spinner"></span> Submitting...';
            submitBtn.disabled = true;

            // Submit picks to backend
            const picksData = {
                contestEntry: this.contestEntry,
                picks: Array.from(this.userPicks.entries()).map(([gameId, team]) => ({
                    gameId,
                    selectedTeam: team,
                    timestamp: new Date()
                })),
                nftHoldings: this.userNFTs
            };

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Save picks locally
            const weekKey = this.getWeekKey();
            localStorage.setItem(`nft_picks_${weekKey}`, JSON.stringify(picksData));
            
            this.showSuccess('Weekly picks submitted successfully! Good luck!');
            
            // Disable further changes
            document.querySelectorAll('.team-option').forEach(option => {
                option.style.pointerEvents = 'none';
            });
            
            submitBtn.innerHTML = '<span>✓ Picks Submitted</span>';
            submitBtn.classList.add('btn-success');

        } catch (error) {
            console.error('Submit NFT picks error:', error);
            this.showError(error.message);
            
            // Reset button
            const submitBtn = document.getElementById('submit-nft-picks-btn');
            if (submitBtn) {
                submitBtn.innerHTML = '<span>Submit Your Picks</span>';
                submitBtn.disabled = false;
            }
        }
    }

    updateEntryStatus() {
        const enterBtn = document.getElementById('enter-nft-contest-btn');
        if (!enterBtn || !this.contestEntry) return;

        enterBtn.innerHTML = '<span>✓ Contest Entered</span>';
        enterBtn.classList.add('btn-success');
        enterBtn.disabled = true;
    }

    startWeekCountdown() {
        const updateTimer = () => {
            if (!this.contestDeadline) return;

            const now = new Date();
            const timeLeft = this.contestDeadline - now;

            if (timeLeft <= 0) {
                document.getElementById('week-remaining').textContent = 'Week Ended';
                return;
            }

            const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
            const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

            document.getElementById('week-remaining').textContent = `${days}d ${hours}h`;
        };

        updateTimer();
        setInterval(updateTimer, 60000); // Update every minute
    }

    getNextSunday() {
        const now = new Date();
        const daysUntilSunday = (7 - now.getDay()) % 7 || 7;
        const nextSunday = new Date(now);
        nextSunday.setDate(now.getDate() + daysUntilSunday);
        nextSunday.setHours(23, 59, 59, 999);
        return nextSunday;
    }

    getWeekKey() {
        const now = new Date();
        const year = now.getFullYear();
        const week = this.getWeekNumber(now);
        return `${year}_W${week}`;
    }

    getWeekNumber(date) {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    }

    formatGameTime(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleDateString('en-US', { 
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        });
    }

    formatOdds(odds) {
        if (!odds) return 'N/A';
        if (odds > 0) return `+${odds}`;
        return odds.toString();
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
                <span class="notification-message">${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">✕</button>
            </div>
        `;

        // Add to page
        document.body.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }
}

// Initialize when page loads
let nftContest;
document.addEventListener('DOMContentLoaded', () => {
    nftContest = new NFTContestManager();
});

// Make it globally available for onclick handlers
window.nftContest = nftContest;
