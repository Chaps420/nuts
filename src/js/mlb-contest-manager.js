/**
 * MLB Contest Manager
 * Handles MLB daily pick'em contests
 */

class MLBContestManager {
    constructor() {
        this.mlbSchedule = window.mlbSchedule; // Use the existing MLB schedule API
        this.backend = null;
        this.integration = null;
        this.currentDay = 0; // 0 = today, 1 = tomorrow, etc.
        this.selectedGames = [];
        this.userPicks = {};
        this.contestDays = [];
        this.contestDeadline = null;
        
        console.log('⚾ MLB Contest Manager initialized');
    }

    /**
     * Initialize the contest manager
     */
    async init() {
        try {
            // Ensure DOM is ready
            if (document.readyState === 'loading') {
                console.log('⏳ DOM still loading, waiting...');
                await new Promise(resolve => {
                    document.addEventListener('DOMContentLoaded', resolve);
                });
            }

            // Initialize backend integration
            if (window.firebaseIntegration) {
                this.integration = new FirebaseXamanIntegration();
                await this.integration.init();
                console.log('✅ Firebase + Xaman integration ready');
            }

            // Always use production backend only - no localStorage fallback
            console.log('🌐 Using production Firebase backend only');
            if (window.ContestBackendProduction) {
                this.backend = new ContestBackendProduction();
                await this.backend.init();
                console.log('✅ Production backend initialized');
            } else {
                console.error('❌ Production backend not available');
                throw new Error('Production backend required');
            }

            // Initialize payment system
            if (window.XamanPayment) {
                this.walletManager = new window.XamanPayment();
                console.log('💳 XUMM wallet system available');
            }

            // Initialize contest days (next 5 days)
            this.initializeContestDays();
            
            // Create day tabs
            this.createDayTabs();
            
            // Load contest data for current day
            await this.loadContestForDay(this.currentDay);
            
            this.setupEventListeners();
            this.updateUI();
            
            // Load and display contest stats
            await this.loadContestStats();
            
            // Refresh stats every 30 seconds
            setInterval(() => this.loadContestStats(), 30000);
            
            console.log('✅ MLB contest initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize MLB contest:', error);
            this.showError('Failed to load contest games. Please try refreshing the page.');
        }
    }

    /**
     * Initialize contest days (next 5 days)
     */
    initializeContestDays() {
        this.contestDays = [];
        const today = new Date();
        
        // Initialize 5 days of contests
        for (let i = 0; i < 5; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            
            this.contestDays.push({
                date: date,
                dateString: this.formatDate(date),
                games: [],
                isLoaded: false
            });
        }
        
        console.log('📅 Initialized 5 contest days:', this.contestDays.map(d => d.dateString));
    }

    /**
     * Format date as YYYY-MM-DD
     */
    formatDate(date) {
        return date.toISOString().split('T')[0];
    }

    /**
     * Create day selection tabs
     */
    createDayTabs() {
        const container = document.getElementById('day-tabs-container');
        if (!container) {
            console.log('⚠️ Day tabs container not found');
            return;
        }

        const tabsHTML = this.contestDays.map((day, index) => {
            const dayName = this.getDayName(day.date);
            const isActive = index === this.currentDay;
            
            return `
                <div class="day-tab ${isActive ? 'active' : ''}" onclick="window.mlbContestManager.switchToDay(${index})">
                    <div class="day-name">${dayName}</div>
                    <div class="day-date">${day.dateString}</div>
                    <div class="tab-indicator" id="tab-indicator-${index}">⏳</div>
                </div>
            `;
        }).join('');

        container.innerHTML = `
            <div class="tabs-container">
                ${tabsHTML}
            </div>
        `;
    }

    /**
     * Get display name for day
     */
    getDayName(date) {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        
        if (this.formatDate(date) === this.formatDate(today)) {
            return 'Today';
        } else if (this.formatDate(date) === this.formatDate(tomorrow)) {
            return 'Tomorrow';
        } else {
            return date.toLocaleDateString('en-US', { weekday: 'short' });
        }
    }

    /**
     * Switch to a different day
     */
    async switchToDay(dayIndex) {
        console.log(`📅 Switching to day ${dayIndex}`);
        this.currentDay = dayIndex;
        
        // Update tab appearance
        document.querySelectorAll('.day-tab').forEach((tab, index) => {
            tab.classList.toggle('active', index === dayIndex);
        });
        
        // Load contest for this day
        await this.loadContestForDay(dayIndex);
        this.updateTabIndicators();
    }

    /**
     * Update tab indicators
     */
    updateTabIndicators() {
        this.contestDays.forEach((day, index) => {
            const indicator = document.getElementById(`tab-indicator-${index}`);
            if (indicator) {
                if (!day.isLoaded) {
                    indicator.textContent = '⏳';
                } else if (day.games && day.games.length > 0) {
                    indicator.textContent = `${day.games.length} games`;
                } else {
                    indicator.textContent = 'No games';
                }
            }
        });
    }

    /**
     * Load contest data for a specific day
     */
    async loadContestForDay(dayIndex) {
        const contestDay = this.contestDays[dayIndex];
        if (!contestDay) return;

        console.log(`📅 Loading contest for ${contestDay.dateString}`);

        try {
            // Load MLB games for this day
            const games = await this.loadMLBGamesForDay(contestDay.date);
            
            if (games && games.length > 0) {
                console.log(`✅ Found ${games.length} games for ${contestDay.dateString}`);
                this.selectedGames = games;
                contestDay.games = games;
                
                // Calculate contest deadline (30 min before first game)
                this.calculateContestDeadline(games);
            } else {
                console.log(`📅 No games scheduled for ${contestDay.dateString}`);
                this.selectedGames = [];
                contestDay.games = [];
            }

            contestDay.isLoaded = true;
            this.updateTabIndicators();
            
            // Update UI to show the games
            this.displayGames();
            
        } catch (error) {
            console.error(`❌ Error loading games for day ${dayIndex}:`, error);
            this.selectedGames = [];
            contestDay.games = [];
            contestDay.isLoaded = true;
            this.updateTabIndicators();
            this.displayGames();
        }
    }

    /**
     * Load MLB games for a specific date
     */
    async loadMLBGamesForDay(date) {
        try {
            console.log(`⚾ Loading MLB games for ${date.toDateString()}...`);
            
            if (this.mlbSchedule) {
                console.log('✅ MLB Schedule API is available');
                
                // Get games for this specific date
                const games = await this.mlbSchedule.getGamesForDate(date);
                console.log(`📅 Found ${games.length} games for ${date.toDateString()}`);
                
                return games;
            } else {
                console.warn('❌ MLB Schedule API not available');
                return [];
            }
            
        } catch (error) {
            console.error(`❌ Failed to load MLB games for ${date.toDateString()}:`, error);
            return [];
        }
    }

    /**
     * Calculate contest deadline (30 minutes before first game)
     */
    calculateContestDeadline(games) {
        if (!games || games.length === 0) return;

        // Find the earliest game time
        let earliestTime = null;
        
        games.forEach(game => {
            if (game.gameTime) {
                const gameTime = new Date(game.gameTime);
                if (!earliestTime || gameTime < earliestTime) {
                    earliestTime = gameTime;
                }
            }
        });

        if (earliestTime) {
            // Set deadline to 30 minutes before first game
            this.contestDeadline = new Date(earliestTime.getTime() - (30 * 60 * 1000));
            console.log(`⏰ Contest deadline set to: ${this.contestDeadline}`);
        }
    }

    /**
     * Display games in the UI
     */
    displayGames() {
        const container = document.getElementById('games-grid');
        if (!container) {
            console.log('❌ Games container not found');
            return;
        }

        const currentDayGames = this.contestDays[this.currentDay]?.games || [];
        
        if (currentDayGames.length === 0) {
            container.innerHTML = `
                <div class="no-games-message">
                    <h3>📅 No games scheduled</h3>
                    <p>There are no MLB games scheduled for ${this.contestDays[this.currentDay]?.dateString || 'this date'}.</p>
                    <p>Try selecting a different day or check back later.</p>
                </div>
            `;
            return;
        }

        // Display games
        const gamesHTML = currentDayGames.map((game, index) => {
            const gameId = `game-${index}`;
            
            return `
                <div class="game-card" data-game-id="${gameId}">
                    <div class="game-header">
                        <div class="teams">
                            <span class="away-team">${game.awayTeam}</span>
                            <span class="vs">@</span>
                            <span class="home-team">${game.homeTeam}</span>
                        </div>
                        <div class="game-time">${this.formatGameTime(game.gameTime)}</div>
                    </div>
                    
                    <div class="pick-options">
                        <label class="pick-option">
                            <input type="radio" name="pick-${gameId}" value="${game.awayTeam}" 
                                   onchange="window.mlbContestManager.updatePick('${gameId}', '${game.awayTeam}')">
                            <span class="option-text">${game.awayTeam}</span>
                        </label>
                        <label class="pick-option">
                            <input type="radio" name="pick-${gameId}" value="${game.homeTeam}" 
                                   onchange="window.mlbContestManager.updatePick('${gameId}', '${game.homeTeam}')">
                            <span class="option-text">${game.homeTeam}</span>
                        </label>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = gamesHTML;
        
        // Update contest info
        this.updateContestInfo();
    }

    /**
     * Format game time for display
     */
    formatGameTime(gameTime) {
        if (!gameTime) return 'TBD';
        
        const time = new Date(gameTime);
        return time.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            timeZoneName: 'short'
        });
    }

    /**
     * Update user pick for a game
     */
    updatePick(gameId, pick) {
        this.userPicks[gameId] = pick;
        console.log(`✅ Updated pick for ${gameId}: ${pick}`);
        
        // Update UI to show how many picks are made
        this.updateContestInfo();
    }

    /**
     * Update contest information display
     */
    updateContestInfo() {
        const currentDayGames = this.contestDays[this.currentDay]?.games || [];
        const picksNeeded = currentDayGames.length;
        const picksMade = Object.keys(this.userPicks).length;
        
        // Update picks counter
        const picksCounter = document.getElementById('picks-counter');
        if (picksCounter) {
            picksCounter.textContent = `${picksMade}/${picksNeeded}`;
        }
        
        // Update enter button state
        const enterButton = document.getElementById('submit-picks-btn');
        if (enterButton) {
            if (picksMade === picksNeeded && picksNeeded > 0) {
                enterButton.disabled = false;
                enterButton.textContent = `Enter Contest - ${picksNeeded} Picks Made`;
            } else {
                enterButton.disabled = true;
                enterButton.textContent = `Make Your Picks (${picksMade}/${picksNeeded})`;
            }
        }
    }

    /**
     * Handle contest entry
     */
    async handleContestEntry() {
        try {
            const currentDayGames = this.contestDays[this.currentDay]?.games || [];
            const picksNeeded = currentDayGames.length;
            const picksMade = Object.keys(this.userPicks).length;
            
            if (picksMade !== picksNeeded) {
                this.showError(`Please make picks for all ${picksNeeded} games before entering.`);
                return;
            }

            // Check if deadline has passed
            if (this.contestDeadline && new Date() > this.contestDeadline) {
                this.showError('Contest entry deadline has passed. Games have started.');
                return;
            }

            // Get user information
            const playerName = document.getElementById('player-name')?.value?.trim() || '';
            const twitterHandle = document.getElementById('twitter-handle')?.value?.trim() || '';
            const tiebreakerRuns = document.getElementById('tiebreaker-runs')?.value;

            // Validate required fields
            if (!playerName) {
                this.showError('Please enter your display name.');
                return;
            }

            if (!tiebreakerRuns || tiebreakerRuns < 0) {
                this.showError('Please enter a valid tiebreaker prediction.');
                return;
            }

            console.log('💳 Starting contest entry process...');
            
            // Create contest entry data
            const contestEntry = {
                contestDate: this.contestDays[this.currentDay].dateString,
                sport: 'mlb',
                picks: this.userPicks,
                games: currentDayGames,
                entryFee: 50, // $NUTS
                userName: playerName,
                twitterHandle: twitterHandle || null,
                tiebreakerRuns: parseInt(tiebreakerRuns),
                timestamp: new Date().toISOString()
            };

            // Show payment interface
            await this.processPayment(contestEntry);
            
        } catch (error) {
            console.error('❌ Error handling contest entry:', error);
            this.showError('Failed to process contest entry. Please try again.');
        }
    }

    /**
     * Process payment for contest entry
     */
    async processPayment(contestEntry) {
        if (!this.walletManager) {
            this.showError('Payment system not available. Please refresh and try again.');
            return;
        }

        try {
            console.log('💳 Processing payment...');
            
            // Use the same payment flow as NFL contest
            const paymentResult = await this.walletManager.initiatePayment({
                amount: contestEntry.entryFee,
                currency: 'NUTS',
                description: `MLB Contest Entry - ${contestEntry.contestDate}`,
                contestData: contestEntry
            });

            if (paymentResult.success) {
                // Payment successful, store contest entry
                await this.storeContestEntry({
                    ...contestEntry,
                    transactionId: paymentResult.transactionId,
                    walletAddress: paymentResult.walletAddress || paymentResult.account || null,
                    userName: contestEntry.userName, // Use the userName from form, not payment
                    twitterHandle: contestEntry.twitterHandle
                });
                
                this.showSuccess('Contest entry successful! Good luck!');
                this.loadContestStats(); // Refresh stats
            } else {
                throw new Error(paymentResult.error || 'Payment failed');
            }
            
        } catch (error) {
            console.error('❌ Payment error:', error);
            this.showError('Payment failed: ' + error.message);
        }
    }

    /**
     * Store contest entry
     */
    async storeContestEntry(contestEntry) {
        if (this.backend && this.backend.createContestEntry) {
            console.log('📝 Storing entry via production backend...');
            return await this.backend.createContestEntry(contestEntry);
        } else {
            throw new Error('Backend not available');
        }
    }

    /**
     * Load contest statistics
     */
    async loadContestStats() {
        try {
            const currentDate = this.contestDays[this.currentDay]?.dateString;
            if (!currentDate) return;

            console.log(`📊 Loading contest stats for ${currentDate}`);
            
            if (this.backend) {
                const entries = await this.backend.getContestEntries(currentDate);
                
                // Filter for active MLB entries
                const activeEntries = entries.filter(entry => 
                    entry.sport === 'mlb' && 
                    (!entry.contestStatus || entry.contestStatus === 'active')
                );
                
                console.log(`📊 Found ${activeEntries.length} active MLB entries for ${currentDate}`);
                
                // Update stats display
                this.updateStatsDisplay(activeEntries);
            }
            
        } catch (error) {
            console.error('❌ Error loading contest stats:', error);
        }
    }

    /**
     * Update statistics display
     */
    updateStatsDisplay(entries) {
        // Update participant count
        const participantCount = document.getElementById('entry-count');
        if (participantCount) {
            participantCount.textContent = entries.length;
        }
        
        // Update prize pool (50 $NUTS per entry)
        const prizePool = document.getElementById('prize-pool');
        if (prizePool) {
            const total = entries.length * 50;
            prizePool.textContent = `${total} $NUTS`;
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Wallet connection events
        window.addEventListener('xamanOAuth2Success', (event) => {
            console.log('🎉 OAuth2 authentication successful:', event.detail);
            this.onWalletConnected(event.detail);
        });
        
        window.addEventListener('xamanOAuth2Error', (event) => {
            console.error('❌ OAuth2 authentication failed:', event.detail);
            this.showError('Authentication failed: ' + event.detail.error);
        });
    }

    /**
     * Handle wallet connection
     */
    onWalletConnected(walletData) {
        console.log('👛 Wallet connected:', walletData);
        // Update UI to show connected state
        // This is handled by the payment system
    }

    /**
     * Update UI elements
     */
    updateUI() {
        // Update day tabs
        this.createDayTabs();
        this.updateTabIndicators();
        
        // Display current day's games
        this.displayGames();
    }

    /**
     * Show error message
     */
    showError(message) {
        console.error('❌', message);
        
        // Show in UI if available
        const errorElement = document.getElementById('error-message');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
            
            // Hide after 5 seconds
            setTimeout(() => {
                errorElement.style.display = 'none';
            }, 5000);
        } else {
            // Fallback to alert
            alert(message);
        }
    }

    /**
     * Show success message
     */
    showSuccess(message) {
        console.log('✅', message);
        
        // Show in UI if available
        const successElement = document.getElementById('success-message');
        if (successElement) {
            successElement.textContent = message;
            successElement.style.display = 'block';
            
            // Hide after 5 seconds
            setTimeout(() => {
                successElement.style.display = 'none';
            }, 5000);
        } else {
            // Fallback to alert
            alert(message);
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM Content Loaded - Initializing MLB Contest Manager');
    
    // Wait a bit to ensure all scripts are loaded
    setTimeout(() => {
        console.log('🎮 Initializing MLB Contest Manager...');
        window.mlbContestManager = new MLBContestManager();
        window.mlbContestManager.init();
    }, 500);
});

console.log('⚾ MLB Contest Manager module loaded');
