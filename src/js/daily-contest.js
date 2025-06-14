/**
 * Daily Contest Page JavaScript
 * Handles contest entry, game selection, and pick submission
 */

class DailyContestManager {
    constructor() {
        this.selectedGames = [];
        this.availableGames = [];
        this.userPicks = {};
        this.contestData = null;
        console.log('🎮 Initializing Daily Contest Page...');
    }

    async init() {
        try {
            console.log('🏈 Loading daily contest data...');
            
            // First try to load admin-selected games
            const adminGames = this.loadAdminSelectedGames();
            
            if (adminGames && adminGames.length === 10) {
                console.log('✅ Using admin-selected games for contest');
                this.selectedGames = adminGames;
            } else {
                console.log('⚠️ No admin games found, loading from MLB API...');
                await this.loadMLBGames();
            }
            
            this.setupEventListeners();
            this.updateUI();
            console.log('✅ Daily contest page initialized');
        } catch (error) {
            console.error('❌ Failed to initialize daily contest:', error);
            this.showError('Failed to load contest games. Please try refreshing the page.');
        }
    }

    loadAdminSelectedGames() {
        try {
            const contestData = localStorage.getItem('daily_contest_games');
            if (contestData) {
                const parsed = JSON.parse(contestData);
                const contestDate = new Date(parsed.contestDate).toDateString();
                const today = new Date().toDateString();
                
                if (contestDate === today && parsed.games && parsed.games.length === 10) {
                    console.log(`📋 Loaded ${parsed.games.length} admin-selected games for today`);
                    return parsed.games;
                }
            }
            
            console.log('ℹ️ No valid admin-selected games found for today');
            return null;
        } catch (error) {
            console.error('❌ Error loading admin games:', error);
            return null;
        }
    }

    async loadMLBGames() {
        try {
            console.log('⚾ Loading MLB games for contest...');
            
            // Use the MLB API instance
            if (window.mlbAPI) {
                this.availableGames = await window.mlbAPI.getTodaysMLBGames();
                console.log(`📋 Loaded ${this.availableGames.length} available MLB games`);
            } else {
                console.error('❌ MLB API not available, using mock data');
                this.availableGames = this.getMockGames();
            }
            
            // Select first 10 games for contest (fallback when no admin selection)
            this.selectedGames = this.availableGames.slice(0, 10);
            
        } catch (error) {
            console.error('❌ Failed to load MLB games:', error);
            this.availableGames = this.getMockGames();
            this.selectedGames = this.availableGames.slice(0, 10);
        }
    }

    setupEventListeners() {
        // Enter contest button
        const enterBtn = document.getElementById('enter-contest-btn');
        if (enterBtn) {
            enterBtn.addEventListener('click', () => this.handleContestEntry());
        }

        // Submit picks button
        const submitBtn = document.getElementById('submit-picks-btn');
        if (submitBtn) {
            submitBtn.addEventListener('click', () => this.handleSubmitPicks());
        }

        // Mobile menu toggle
        const mobileMenuBtn = document.getElementById('mobile-menu-btn');
        const mobileMenu = document.getElementById('mobile-menu');
        if (mobileMenuBtn && mobileMenu) {
            mobileMenuBtn.addEventListener('click', () => {
                mobileMenu.classList.toggle('hidden');
            });
        }
    }

    updateUI() {
        this.renderGames();
        this.updateContestStats();
    }

    async updateContestStats() {
        try {
            // Get contest stats from backend (mock data for now)
            const stats = {
                prizePool: '2,500 $NUTS',
                entryCount: 47,
                deadline: new Date(Date.now() + 6 * 60 * 60 * 1000) // 6 hours from now
            };

            // Update UI
            document.getElementById('prize-pool').textContent = stats.prizePool;
            document.getElementById('entry-count').textContent = stats.entryCount;
            this.contestDeadline = stats.deadline;
            
        } catch (error) {
            console.error('Error updating contest stats:', error);
        }
    }

    renderGames() {
        const gamesGrid = document.getElementById('games-grid');
        if (!gamesGrid) return;

        if (this.selectedGames.length === 0) {
            gamesGrid.innerHTML = `
                <div class="no-games">
                    <div class="no-games-icon">🚫</div>
                    <h3>No Games Available</h3>
                    <p>There are no games scheduled for today's contest.</p>
                </div>
            `;
            return;
        }

        gamesGrid.innerHTML = this.selectedGames.map((game, index) => `
            <div class="game-card" data-game-id="${game.id}">
                <div class="game-header">
                    <div class="game-time">${this.formatGameTime(game.commence_time)}</div>
                    <div class="game-sport">${game.sport_title}</div>
                </div>
                <div class="game-matchup">
                    <div class="team-option ${this.userPicks[game.id] === game.away_team ? 'selected' : ''}" 
                         data-team="${game.away_team}" onclick="dailyContest.selectTeam('${game.id}', '${game.away_team}')">
                        <div class="team-name">${game.away_team}</div>
                        <div class="team-odds">${this.formatOdds(game.bookmakers?.[0]?.markets?.[0]?.outcomes?.find(o => o.name === game.away_team)?.price)}</div>
                    </div>
                    <div class="vs-divider">VS</div>
                    <div class="team-option ${this.userPicks[game.id] === game.home_team ? 'selected' : ''}" 
                         data-team="${game.home_team}" onclick="dailyContest.selectTeam('${game.id}', '${game.home_team}')">
                        <div class="team-name">${game.home_team}</div>
                        <div class="team-odds">${this.formatOdds(game.bookmakers?.[0]?.markets?.[0]?.outcomes?.find(o => o.name === game.home_team)?.price)}</div>
                    </div>
                </div>
                <div class="pick-status">
                    ${this.userPicks[game.id] ? 
                        `<span class="pick-selected">✓ ${this.userPicks[game.id]}</span>` : 
                        '<span class="pick-pending">Select your pick</span>'
                    }
                </div>
            </div>
        `).join('');
    }

    displayGames() {
        const gamesContainer = document.getElementById('contest-games');
        if (!gamesContainer) return;

        if (this.selectedGames.length === 0) {
            gamesContainer.innerHTML = `
                <div class="no-games" style="text-align: center; padding: 40px; background: #1a1a1a; border-radius: 10px; border: 2px dashed #333;">
                    <h3>🔄 No Contest Games Selected</h3>
                    <p>No games have been selected for today's contest yet.</p>
                    <div style="margin: 20px 0;">
                        <a href="admin-portal.html" style="
                            display: inline-block;
                            background: #ffa500;
                            color: black;
                            padding: 12px 24px;
                            text-decoration: none;
                            border-radius: 6px;
                            font-weight: bold;
                            margin: 5px;
                        ">🔧 Go to Admin Portal</a>
                        <button onclick="window.dailyContestManager.loadMLBGames().then(() => window.dailyContestManager.updateUI())" style="
                            background: #333;
                            color: white;
                            padding: 12px 24px;
                            border: 1px solid #555;
                            border-radius: 6px;
                            cursor: pointer;
                            margin: 5px;
                        ">🔄 Load Default Games</button>
                    </div>
                </div>
            `;
            return;
        }

        const adminSelected = this.loadAdminSelectedGames();
        const isAdminSelected = adminSelected && adminSelected.length === 10;

        gamesContainer.innerHTML = `
            <div class="games-header">
                <h3>⚾ Today's MLB Contest Games (${this.selectedGames.length}/10)</h3>
                <div style="display: flex; align-items: center; gap: 10px; margin-top: 10px;">
                    <p style="margin: 0;">Make your picks for each game to enter the contest</p>
                    ${isAdminSelected ? 
                        '<span style="background: #4CAF50; color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.8em;">👨‍💼 Admin Selected</span>' : 
                        '<span style="background: #ff9800; color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.8em;">🤖 Auto Selected</span>'
                    }
                </div>
            </div>
            <div class="games-grid">
                ${this.selectedGames.map((game, index) => this.renderGameCard(game, index)).join('')}
            </div>
            ${!isAdminSelected ? `
                <div style="text-align: center; margin-top: 20px; padding: 15px; background: #1a1a1a; border-radius: 8px; border: 1px solid #333;">
                    <p style="color: #888; margin: 10px 0;">These games were auto-selected. An admin can customize the selection.</p>
                    <a href="admin-portal.html" style="
                        display: inline-block;
                        background: #ffa500;
                        color: black;
                        padding: 8px 16px;
                        text-decoration: none;
                        border-radius: 4px;
                        font-size: 0.9em;
                    ">🔧 Customize Game Selection</a>
                </div>
            ` : ''}
        `;

        this.setupGameEventListeners();
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            background: #2a1a1a;
            border: 1px solid #f44336;
            color: #f44336;
            padding: 15px;
            border-radius: 5px;
            margin: 10px 0;
            text-align: center;
        `;
        errorDiv.textContent = message;
        
        const container = document.getElementById('contest-games');
        if (container) {
            container.appendChild(errorDiv);
        }
    }

    selectTeam(gameId, teamName) {
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
        this.userPicks[gameId] = teamName;
        
        // Re-render games to show selection
        this.renderGames();
        
        // Update picks summary
        this.updatePicksSummary();
        
        // Show submit section if all picks are made
        if (Object.keys(this.userPicks).length === this.selectedGames.length) {
            document.getElementById('submit-section').classList.remove('hidden');
        }
    }

    updatePicksSummary() {
        const picksList = document.getElementById('picks-list');
        if (!picksList) return;

        const picksArray = [];
        for (const [gameId, team] of Object.entries(this.userPicks)) {
            const game = this.selectedGames.find(g => g.id === gameId);
            if (game) {
                picksArray.push(`${game.away_team} vs ${game.home_team}: <strong>${team}</strong>`);
            }
        }

        picksList.innerHTML = picksArray.join('<br>');
    }

    async handleContestEntry() {
        try {
            const enterBtn = document.getElementById('enter-contest-btn');
            if (!enterBtn) return;

            // Show loading state
            enterBtn.innerHTML = '<span class="spinner"></span> Entering...';
            enterBtn.disabled = true;

            // Check wallet connection
            if (!this.walletManager || !this.walletManager.isConnected()) {
                throw new Error('Please connect your wallet first');
            }

            // Check $NUTS balance
            const balance = await this.walletManager.getNutsBalance();
            if (balance < 50) {
                throw new Error('Insufficient $NUTS balance. You need 50 $NUTS to enter.');
            }

            // Process payment
            const paymentResult = await this.walletManager.makePayment(50, 'DAILY_CONTEST_ENTRY');
            
            if (paymentResult.success) {
                this.contestEntry = {
                    transactionId: paymentResult.transactionId,
                    timestamp: new Date(),
                    entryFee: 50
                };

                // Update UI
                this.updateEntryStatus();
                this.showSuccess('Contest entry successful! You can now make your picks.');
                
                // Show games section
                document.getElementById('games-section').style.display = 'block';
                
            } else {
                throw new Error('Payment failed: ' + paymentResult.error);
            }

        } catch (error) {
            console.error('Contest entry error:', error);
            this.showError(error.message);
            
            // Reset button
            const enterBtn = document.getElementById('enter-contest-btn');
            if (enterBtn) {
                enterBtn.innerHTML = '<span>Enter Contest (50 $NUTS)</span>';
                enterBtn.disabled = false;
            }
        }
    }

    async handleSubmitPicks() {
        try {
            const submitBtn = document.getElementById('submit-picks-btn');
            if (!submitBtn) return;

            // Validate picks
            if (Object.keys(this.userPicks).length !== this.selectedGames.length) {
                throw new Error(`Please make picks for all ${this.selectedGames.length} games.`);
            }

            // Show loading state
            submitBtn.innerHTML = '<span class="spinner"></span> Submitting...';
            submitBtn.disabled = true;

            // Submit picks to backend
            const picksData = {
                contestEntry: this.contestEntry,
                picks: Object.entries(this.userPicks).map(([gameId, team]) => ({
                    gameId,
                    selectedTeam: team,
                    timestamp: new Date()
                }))
            };

            // Simulate API call (replace with actual backend call)
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            this.showSuccess('Picks submitted successfully! Good luck!');
            
            // Disable further changes
            document.querySelectorAll('.team-option').forEach(option => {
                option.style.pointerEvents = 'none';
            });
            
            submitBtn.innerHTML = '<span>✓ Picks Submitted</span>';
            submitBtn.classList.add('btn-success');

        } catch (error) {
            console.error('Submit picks error:', error);
            this.showError(error.message);
            
            // Reset button
            const submitBtn = document.getElementById('submit-picks-btn');
            if (submitBtn) {
                submitBtn.innerHTML = '<span>Submit Your Picks</span>';
                submitBtn.disabled = false;
            }
        }
    }

    async checkUserEntry() {
        // Check if user has already entered today's contest
        // This would typically check against backend data
        // For now, we'll simulate checking local storage
        
        const savedEntry = localStorage.getItem('daily_contest_entry_' + this.getTodayDateString());
        if (savedEntry) {
            this.contestEntry = JSON.parse(savedEntry);
            this.updateEntryStatus();
        }
    }

    updateEntryStatus() {
        const statusCard = document.querySelector('.status-card');
        if (!statusCard) return;

        if (this.contestEntry) {
            statusCard.innerHTML = `
                <div class="status-icon">✅</div>
                <h3>Contest Entered</h3>
                <p>You've successfully entered today's contest. Make your picks below.</p>
                <div class="entry-details">
                    <small>Entry Fee: 50 $NUTS | Transaction: ${this.contestEntry.transactionId?.substring(0, 8)}...</small>
                </div>
            `;
            
            // Show games section
            document.getElementById('games-section').style.display = 'block';
        }
    }

    startCountdownTimer() {
        const updateTimer = () => {
            if (!this.contestDeadline) return;

            const now = new Date();
            const timeLeft = this.contestDeadline - now;

            if (timeLeft <= 0) {
                document.getElementById('time-remaining').textContent = 'Contest Closed';
                return;
            }

            const hours = Math.floor(timeLeft / (1000 * 60 * 60));
            const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

            document.getElementById('time-remaining').textContent = `${hours}h ${minutes}m ${seconds}s`;
        };

        updateTimer();
        setInterval(updateTimer, 1000);
    }

    formatGameTime(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            timeZoneName: 'short'
        });
    }

    formatOdds(odds) {
        if (!odds) return 'N/A';
        if (odds > 0) return `+${odds}`;
        return odds.toString();
    }

    getTodayDateString() {
        return new Date().toISOString().split('T')[0];
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
let dailyContest;
document.addEventListener('DOMContentLoaded', () => {
    dailyContest = new DailyContestManager();
});

// Make it globally available for onclick handlers
window.dailyContest = dailyContest;
