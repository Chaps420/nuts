// Daily Contest Manager - Multi-day contest support
class DailyContestManager {
    constructor() {
        this.selectedGames = [];
        this.availableGames = [];
        this.userPicks = {};
        this.contestData = null;
        this.currentDay = 0; // 0 = today, 1 = tomorrow, etc.
        this.contestDays = []; // Will store 5 days of contest data
        this.dayTabs = [];
        console.log('🎮 Initializing Multi-Day Contest Manager...');
    }    async init() {        try {
            console.log('🚀 Loading multi-day contest data...');
            
            // Ensure DOM is ready
            if (document.readyState === 'loading') {
                console.log('⏳ DOM still loading, waiting...');
                await new Promise(resolve => {
                    document.addEventListener('DOMContentLoaded', resolve);
                });
            }

            // Check for existing wallet connection (authentication)
            if (window.xamanAuth && window.xamanAuth.isUserAuthenticated()) {
                console.log('✅ Existing wallet connection found');
                const userInfo = window.xamanAuth.getUserInfo();
                this.onWalletConnected(userInfo);
            } else {
                console.log('🔗 No existing wallet connection');
                this.updateWalletUI(false);
                this.updateContestStatus(false);
            }

            // Initialize contest wallet for entry fee collection
            if (!window.contestWallet) {
                console.log('💰 Initializing contest wallet...');
                window.contestWallet = new ContestWallet();
                await window.contestWallet.connect();
            }

            // Initialize contest days (next 5 days)
            this.initializeContestDays();
            
            // Create day tabs
            this.createDayTabs();
            
            // Wait for MLB API to be ready
            if (window.mlbAPI) {
                await window.mlbAPI.init();
            }
            
            // Load contest data for current day
            await this.loadContestForDay(this.currentDay);
            
            this.setupEventListeners();
            this.updateUI();
            console.log('✅ Multi-day contest initialized with wallet integration');
        } catch (error) {
            console.error('❌ Failed to initialize daily contest:', error);
            this.showError('Failed to load contest games. Please try refreshing the page.');
        }
    }

    initializeContestDays() {
        const today = new Date();
        this.contestDays = [];
        
        for (let i = 0; i < 5; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            
            this.contestDays.push({
                date: date,
                dateString: date.toDateString(),
                games: [],
                userPicks: {},
                isLoaded: false
            });
        }
        
        console.log('📅 Initialized 5 contest days:', this.contestDays.map(d => d.dateString));
    }    createDayTabs() {
        const tabsContainer = document.getElementById('tabs-container');
        if (!tabsContainer) {
            console.warn('⚠️ Tabs container not found by ID - checking for class selector');
            const fallbackContainer = document.querySelector('.tabs-container');
            if (fallbackContainer) {
                console.log('✅ Found fallback tabs container');
                this.renderTabs(fallbackContainer);
                return;
            }
            console.error('❌ No tabs container found');
            return;
        }

        console.log('✅ Found tabs container, rendering tabs');
        this.renderTabs(tabsContainer);
    }    renderTabs(tabsContainer) {
        const days = ['Today', 'Tomorrow', 'Day 3', 'Day 4', 'Day 5'];
        
        tabsContainer.innerHTML = this.contestDays.map((contestDay, index) => {
            const date = contestDay.date;
            const dayName = days[index];
            const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            
            return `
                <div class="day-tab ${index === this.currentDay ? 'active' : ''}" 
                     data-day="${index}" onclick="window.switchToDay(${index})">
                    <div class="tab-day">${dayName}</div>
                    <div class="tab-date">${dateStr}</div>
                    <div class="tab-indicator">0 games</div>
                </div>
            `;
        }).join('');        
        
        console.log('📋 Created', this.contestDays.length, 'day tabs');
    }

    updateTabIndicators() {
        this.contestDays.forEach((day, index) => {
            const tabIndicator = document.querySelector(`[data-day="${index}"] .tab-indicator`);
            if (tabIndicator) {
                const gameCount = day.games ? day.games.length : 0;
                tabIndicator.textContent = `${gameCount}/10`;
                
                // Update color based on completion
                if (gameCount === 10) {
                    tabIndicator.style.color = '#4CAF50';
                } else if (gameCount > 0) {
                    tabIndicator.style.color = '#ff9800';
                } else {
                    tabIndicator.style.color = '#666';
                }
            }
        });
    }

    async switchToDay(dayIndex) {
        if (dayIndex === this.currentDay) return;
        
        console.log(`🔄 Switching to day ${dayIndex}`);
        
        // Save current day's picks
        if (this.contestDays[this.currentDay]) {
            this.contestDays[this.currentDay].userPicks = { ...this.userPicks };
        }
        
        // Switch to new day
        this.currentDay = dayIndex;
        
        // Update tab appearance
        document.querySelectorAll('.day-tab').forEach((tab, index) => {
            tab.classList.toggle('active', index === dayIndex);
        });
        
        // Load contest for new day
        await this.loadContestForDay(dayIndex);
        
        // Restore picks for this day
        this.userPicks = { ...this.contestDays[dayIndex].userPicks };
        
        this.updateUI();
        console.log(`✅ Switched to day ${dayIndex}`);
    }    async loadContestForDay(dayIndex) {
        const contestDay = this.contestDays[dayIndex];
        if (!contestDay) return;

        console.log(`📅 Loading contest for ${contestDay.dateString}`);

        // Load ALL games for this day (no admin selection needed)
        const mlbGames = await this.loadMLBGamesForDay(contestDay.date);
        
        if (mlbGames && mlbGames.length > 0) {
            console.log(`✅ Found ${mlbGames.length} MLB games for ${contestDay.dateString}`);
            this.availableGames = mlbGames; // All games available
            contestDay.games = mlbGames;
            
            // Calculate contest deadline (30 min before first game)
            this.calculateContestDeadline(mlbGames);
        } else {
            // Fallback to mock games
            console.log(`⚠️ Using mock games for ${contestDay.dateString}`);
            const mockGames = this.getMockGamesForDate(contestDay.date);
            this.availableGames = mockGames;
            contestDay.games = mockGames;
            
            // Calculate deadline for mock games
            this.calculateContestDeadline(mockGames);
        }

        contestDay.isLoaded = true;
        this.updateTabIndicators();
    }

    loadAdminSelectedGamesForDay(dateString) {
        try {
            const contestData = localStorage.getItem(`daily_contest_games_${dateString}`);
            if (contestData) {
                const parsed = JSON.parse(contestData);
                if (parsed.games && parsed.games.length === 10) {
                    console.log(`📋 Loaded ${parsed.games.length} admin-selected games for ${dateString}`);
                    return parsed.games;
                }
            }
            
            // Fallback to single-day storage format
            const singleDayData = localStorage.getItem('daily_contest_games');
            if (singleDayData) {
                const parsed = JSON.parse(singleDayData);
                const contestDate = new Date(parsed.contestDate).toDateString();
                
                if (contestDate === dateString && parsed.games && parsed.games.length === 10) {
                    console.log(`📋 Loaded ${parsed.games.length} admin-selected games for ${dateString} (fallback)`);
                    return parsed.games;
                }
            }
            
            console.log(`ℹ️ No valid admin-selected games found for ${dateString}`);
            return null;
        } catch (error) {
            console.error(`❌ Error loading admin games for ${dateString}:`, error);
            return null;
        }
    }

    async loadMLBGamesForDay(date) {
        try {
            console.log(`⚾ Loading MLB games for ${date.toDateString()}...`);
            
            if (window.mlbAPI) {
                // For future dates, we'll use mock data since API may not have future games
                if (date.toDateString() === new Date().toDateString()) {
                    this.availableGames = await window.mlbAPI.getTodaysMLBGames();
                } else {
                    this.availableGames = this.getMockGamesForDate(date);
                }
                
                console.log(`📋 Loaded ${this.availableGames.length} available MLB games for ${date.toDateString()}`);
                
                // Select first 10 games for contest (fallback when no admin selection)
                this.selectedGames = this.availableGames.slice(0, 10);
                
                // Store in contest day
                const dayIndex = Math.floor((date - new Date().setHours(0,0,0,0)) / (1000 * 60 * 60 * 24));
                if (this.contestDays[dayIndex]) {
                    this.contestDays[dayIndex].games = this.selectedGames;
                }
            } else {
                console.warn('❌ MLB API not available, using mock data');
                this.selectedGames = this.getMockGamesForDate(date);
            }
            
        } catch (error) {
            console.error(`❌ Failed to load MLB games for ${date.toDateString()}:`, error);
            this.selectedGames = this.getMockGamesForDate(date);
        }
    }

    getMockGamesForDate(date) {
        console.log(`📋 Generating mock MLB games for ${date.toDateString()}...`);
        
        const mlbTeams = [
            ['Los Angeles Angels', 'Houston Astros'],
            ['New York Yankees', 'Boston Red Sox'],
            ['Los Angeles Dodgers', 'San Francisco Giants'],
            ['Atlanta Braves', 'Philadelphia Phillies'],
            ['Chicago Cubs', 'Milwaukee Brewers'],
            ['St. Louis Cardinals', 'Cincinnati Reds'],
            ['Cleveland Guardians', 'Detroit Tigers'],
            ['Minnesota Twins', 'Chicago White Sox'],
            ['Tampa Bay Rays', 'Toronto Blue Jays'],
            ['Seattle Mariners', 'Oakland Athletics']
        ];

        return mlbTeams.map((teams, index) => {
            const gameTime = new Date(date);
            gameTime.setHours(19 + (index % 4), 0, 0, 0); // Spread games between 7-10 PM
            
            return {
                id: `game_${date.toDateString()}_${index + 1}`,
                awayTeam: teams[0],
                homeTeam: teams[1],
                awayOdds: this.generateRandomOdds(),
                homeOdds: this.generateRandomOdds(),
                gameTime: gameTime.toISOString(),
                sport: 'MLB'
            };
        });
    }

    // Keep the existing loadAdminSelectedGames method for backward compatibility
    loadAdminSelectedGames() {
        return this.loadAdminSelectedGamesForDay(new Date().toDateString());
    }

    // Keep the existing loadMLBGames method for backward compatibility  
    async loadMLBGames() {
        return this.loadMLBGamesForDay(new Date());
    }

    generateRandomOdds() {
        const isNegative = Math.random() > 0.5;
        if (isNegative) {
            return -Math.floor(Math.random() * 200 + 100); // -100 to -300
        } else {
            return `+${Math.floor(Math.random() * 200 + 100)}`; // +100 to +300
        }
    }    setupEventListeners() {
        // Mobile menu toggle
        const mobileMenuBtn = document.getElementById('mobile-menu-btn');
        const mobileMenu = document.getElementById('mobile-menu');
        if (mobileMenuBtn && mobileMenu) {
            mobileMenuBtn.addEventListener('click', () => {
                mobileMenu.classList.toggle('hidden');
            });
        }

        // Connect Wallet Button - integrate with enhanced Xaman QR modal
        const connectWalletBtn = document.getElementById('connect-wallet-btn');
        if (connectWalletBtn) {
            connectWalletBtn.addEventListener('click', () => this.handleWalletConnection());
        }

        // Entry button (will be enabled after wallet connection/authentication)
        const enterBtn = document.getElementById('enter-contest-btn');
        if (enterBtn) {
            enterBtn.addEventListener('click', () => this.handleContestEntry());
        }

        // Listen for authentication events from Xaman OAuth2 (legacy)
        window.addEventListener('xamanLoginSuccess', (event) => {
            console.log('✅ User wallet connected via OAuth2:', event.detail);
            this.onWalletConnected(event.detail);
        });

        // Listen for enhanced QR modal events (new)
        window.addEventListener('xamanQRSuccess', (event) => {
            console.log('✅ User wallet connected via QR:', event.detail);
            this.onWalletConnected(event.detail);
        });

        window.addEventListener('xamanQRError', (event) => {
            console.log('❌ QR connection failed:', event.detail);
            this.showError('QR connection failed: ' + event.detail.error);
            this.resetWalletButton();
        });

        window.addEventListener('xamanLogout', () => {
            console.log('🚪 User wallet disconnected');
            this.onWalletDisconnected();
        });
    }
    
    updateUI() {
        this.displayGames();
        this.updateContestInfo();
        this.updateTabIndicators();
    }
    
    updateContestInfo() {
        // Update contest stats with dynamic data
        const prizePoolElement = document.getElementById('prize-pool');
        const entryCountElement = document.getElementById('entry-count');
        const timeRemainingElement = document.getElementById('time-remaining');
        
        // Calculate dynamic contest stats
        const baseEntries = 25;
        const randomEntries = Math.floor(Math.random() * 50);
        const totalEntries = baseEntries + randomEntries;
        const prizePool = totalEntries * 50; // 50 $NUTS entry fee
        
        // Calculate time remaining until contest deadline (assume 8 PM today)
        const now = new Date();
        const deadline = new Date();
        deadline.setHours(20, 0, 0, 0); // 8 PM today
        
        if (now > deadline) {
            deadline.setDate(deadline.getDate() + 1); // Next day if past deadline
        }
        
        const timeRemaining = deadline - now;
        const hoursRemaining = Math.floor(timeRemaining / (1000 * 60 * 60));
        const minutesRemaining = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
        
        if (prizePoolElement) prizePoolElement.textContent = `${prizePool.toLocaleString()} $NUTS`;
        if (entryCountElement) entryCountElement.textContent = totalEntries.toString();        if (timeRemainingElement) {
            if (timeRemaining > 0) {
                timeRemainingElement.textContent = `${hoursRemaining}h ${minutesRemaining}m`;
            } else {
                timeRemainingElement.textContent = 'Contest Closed';
            }
        }
    }
    
    // displayGames - Main function to display all available games for the current day
    displayGames() {
        const gamesContainer = document.getElementById('games-grid');
        if (!gamesContainer) {
            console.error('❌ Games container (#games-grid) not found');
            return;
        }

        // Get current day's games
        const currentDayGames = this.contestDays[this.currentDay]?.games || [];
        
        if (currentDayGames.length === 0) {
            gamesContainer.innerHTML = `
                <div class="no-games" style="
                    text-align: center; 
                    padding: 40px; 
                    background: #1a1a1a; 
                    border-radius: 10px; 
                    border: 2px dashed #333;
                    color: #888;
                ">
                    <h3>🔄 Loading Games...</h3>
                    <p>Loading available games for this day.</p>
                </div>
            `;
            return;
        }

        console.log(`🎮 Displaying ${currentDayGames.length} games for day ${this.currentDay}`);
        
        // Render all available games (user can pick any 10)
        gamesContainer.innerHTML = `
            <div class="games-header" style="margin-bottom: 15px; text-align: center;">
                <h3 style="color: #ffa500; margin-bottom: 10px;">All Available Games - Pick Any 10</h3>
                <p style="color: #888; margin: 0;">Select exactly 10 games to enter the contest</p>
            </div>
            <div class="games-list">
                ${currentDayGames.map((game, index) => this.renderGameCard(game, index)).join('')}
            </div>
        `;

        // Set up click event listeners for game selection
        this.setupGameEventListeners();
        
        // Add enter button if not already present
        this.addEnterButton();
        
        console.log(`✅ Displayed ${currentDayGames.length} games with ${Object.keys(this.userPicks).length} picks`);
    }

    renderGameCard(game, index) {
        const gameDate = new Date(game.gameTime);
        const isToday = gameDate.toDateString() === new Date().toDateString();
        
        return `
            <div class="game-card compact" data-game-id="${game.id}" style="
                background: #2a2a2a;
                border: 1px solid #444;
                border-radius: 6px;
                padding: 8px;
                margin-bottom: 6px;
                transition: all 0.3s ease;
            ">
                <div class="game-header" style="
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 6px;
                    font-size: 0.75em;
                ">
                    <div class="game-time" style="color: #ffa500; font-weight: bold;">
                        ${isToday ? 'Today' : 'Tomorrow'} ${gameDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                    <div class="game-sport" style="color: #888; font-size: 0.7em;">Game ${index + 1}</div>
                </div>
                
                <div class="game-matchup" style="
                    display: grid;
                    grid-template-columns: 1fr auto 1fr;
                    gap: 6px;
                    align-items: center;
                    margin-bottom: 4px;
                ">
                    <div class="team-option ${this.userPicks[game.id] === 'away' ? 'selected' : ''}" 
                         data-team="away" data-game-id="${game.id}" style="
                        background: ${this.userPicks[game.id] === 'away' ? '#4CAF50' : '#333'};
                        border: 1px solid ${this.userPicks[game.id] === 'away' ? '#4CAF50' : '#555'};
                        border-radius: 4px;
                        padding: 6px 4px;
                        cursor: pointer;
                        text-align: center;
                        transition: all 0.3s ease;
                        font-size: 0.8em;
                        min-height: 45px;
                        display: flex;
                        flex-direction: column;
                        justify-content: center;
                    ">
                        <div class="team-name" style="font-weight: bold; font-size: 0.75em; margin-bottom: 1px; line-height: 1.1;">
                            ${game.awayTeam}
                        </div>
                        <div class="team-odds" style="color: #4CAF50; font-size: 0.7em;">
                            ${game.awayOdds}
                        </div>
                    </div>
                    
                    <div class="vs-divider" style="
                        color: #ffa500; 
                        font-weight: bold; 
                        font-size: 0.7em;
                        text-align: center;
                    ">@</div>
                    
                    <div class="team-option ${this.userPicks[game.id] === 'home' ? 'selected' : ''}" 
                         data-team="home" data-game-id="${game.id}" style="
                        background: ${this.userPicks[game.id] === 'home' ? '#4CAF50' : '#333'};
                        border: 1px solid ${this.userPicks[game.id] === 'home' ? '#4CAF50' : '#555'};
                        border-radius: 4px;
                        padding: 6px 4px;
                        cursor: pointer;
                        text-align: center;
                        transition: all 0.3s ease;
                        font-size: 0.8em;
                        min-height: 45px;
                        display: flex;
                        flex-direction: column;
                        justify-content: center;
                    ">
                        <div class="team-name" style="font-weight: bold; font-size: 0.75em; margin-bottom: 1px; line-height: 1.1;">
                            ${game.homeTeam}
                        </div>
                        <div class="team-odds" style="color: #4CAF50; font-size: 0.7em;">
                            ${game.homeOdds}
                        </div>
                    </div>
                </div>
                
                <div class="pick-status" style="text-align: center; font-size: 0.7em; margin-top: 3px; padding-top: 3px; border-top: 1px solid #444;">
                    ${this.userPicks[game.id] ? 
                        `<span style="color: #4CAF50;">✅ ${this.userPicks[game.id] === 'home' ? game.homeTeam : game.awayTeam}</span>` : 
                        '<span style="color: #888;">Click a team</span>'
                    }
                </div>
            </div>
        `;
    }setupGameEventListeners() {
        document.querySelectorAll('.team-option').forEach(teamElement => {
            teamElement.addEventListener('click', (e) => {
                const gameId = e.currentTarget.dataset.gameId;
                const team = e.currentTarget.dataset.team;
                this.makePickForGame(gameId, team);
            });
        });
    }

    calculateContestDeadline(games) {
        if (!games || games.length === 0) return null;
        
        // Find the earliest game time
        const earliestGame = games.reduce((earliest, game) => {
            const gameTime = new Date(game.gameTime);
            const earlyTime = new Date(earliest.gameTime);
            return gameTime < earlyTime ? game : earliest;
        });
        
        // Set deadline to 30 minutes before earliest game
        const deadline = new Date(earliestGame.gameTime);
        deadline.setMinutes(deadline.getMinutes() - 30);
        
        console.log(`⏰ Contest deadline set to: ${deadline.toLocaleString()}`);
        return deadline;
    }

    makePickForGame(gameId, team) {
        const pickedCount = Object.keys(this.userPicks).length;
        const maxPicks = 10;
        
        // Don't allow more than 10 picks
        if (pickedCount >= maxPicks && !this.userPicks[gameId]) {
            this.showError(`You can only pick ${maxPicks} games!`);
            return;
        }
        
        // Store the pick
        this.userPicks[gameId] = team;
        
        console.log(`🎯 Pick made: Game ${gameId} -> ${team} team`);
        
        // Refresh display
        this.displayGames();
    }

    removePick(gameId) {
        delete this.userPicks[gameId];
        console.log(`🗑️ Pick removed: Game ${gameId}`);
        this.displayGames();
    }

    // Make this function available globally
    removePick(gameId) {
        delete this.userPicks[gameId];
        console.log(`🗑️ Pick removed: Game ${gameId}`);
        this.displayGames();
    }

    updateGamePickUI(gameId, selectedTeam) {
        const gameCard = document.querySelector(`[data-game-id="${gameId}"]`);
        if (!gameCard) return;

        // Remove previous selections
        gameCard.querySelectorAll('.team-option').forEach(team => {
            team.classList.remove('selected');
        });

        // Add selection to chosen team
        gameCard.querySelector(`[data-team="${selectedTeam}"]`).classList.add('selected');

        // Update pick status
        const game = this.selectedGames.find(g => g.id === gameId);
        const teamName = selectedTeam === 'home' ? game.homeTeam : game.awayTeam;
        gameCard.querySelector('.pick-status').innerHTML = 
            `<span class="picked" style="color: #4CAF50;">✅ ${teamName} selected</span>`;
    }

    updateEntryButton() {
        const entryButton = document.getElementById('enter-contest-btn');
        const picksCount = Object.keys(this.userPicks).length;
        
        if (entryButton) {
            if (picksCount === this.selectedGames.length) {
                entryButton.disabled = false;
                entryButton.textContent = `Enter Contest (${picksCount}/${this.selectedGames.length} picks)`;
                entryButton.classList.add('ready');
            } else {
                entryButton.disabled = true;
                entryButton.textContent = `Make Your Picks (${picksCount}/${this.selectedGames.length})`;
                entryButton.classList.remove('ready');
            }
        }
    }

    addEnterButton() {
        // Find the games section container
        const gamesSection = document.getElementById('games-section');
        if (!gamesSection) {
            console.warn('⚠️ Games section not found for enter button');
            return;
        }

        // Remove existing enter button if it exists
        const existingButton = document.getElementById('contest-enter-button-container');
        if (existingButton) {
            existingButton.remove();
        }

        // Create the enter button container
        const buttonContainer = document.createElement('div');
        buttonContainer.id = 'contest-enter-button-container';
        buttonContainer.style.cssText = `
            margin-top: 20px;
            padding: 20px;
            background: #1a1a1a;
            border-radius: 8px;
            border: 2px solid #333;
            text-align: center;
        `;

        // Create picks summary
        const picksCount = Object.keys(this.userPicks).length;
        const totalGames = this.selectedGames.length;

        buttonContainer.innerHTML = `
            <div class="picks-summary" style="margin-bottom: 15px;">
                <h3 style="color: #ffa500; margin-bottom: 10px; font-size: 1.1em;">Your Contest Entry</h3>
                <div class="picks-progress" style="
                    background: #2a2a2a;
                    border-radius: 20px;
                    padding: 8px;
                    margin-bottom: 10px;
                    border: 1px solid #444;
                ">
                    <div class="progress-bar" style="
                        background: linear-gradient(90deg, #4CAF50, #00ff88);
                        height: 8px;
                        border-radius: 4px;
                        width: ${(picksCount / totalGames) * 100}%;
                        transition: width 0.3s ease;
                    "></div>
                </div>
                <p style="color: #888; font-size: 0.9em; margin: 5px 0;">
                    Picks made: <span style="color: #4CAF50; font-weight: bold;">${picksCount}/${totalGames}</span>
                </p>
            </div>
            
            <button id="enter-contest-btn" class="contest-enter-btn" style="
                background: ${picksCount === totalGames ? 'linear-gradient(135deg, #4CAF50, #00ff88)' : '#555'};
                color: ${picksCount === totalGames ? '#000' : '#888'};
                border: none;
                padding: 15px 30px;
                border-radius: 8px;
                font-size: 1.1em;
                font-weight: bold;
                cursor: ${picksCount === totalGames ? 'pointer' : 'not-allowed'};
                transition: all 0.3s ease;
                box-shadow: ${picksCount === totalGames ? '0 0 20px rgba(76, 175, 80, 0.3)' : 'none'};
                position: relative;
                overflow: hidden;
                min-width: 200px;
            " ${picksCount !== totalGames ? 'disabled' : ''}>
                ${picksCount === totalGames ? 
                    `🎯 Enter Contest (50 $NUTS)` : 
                    `Make All Picks (${totalGames - picksCount} remaining)`
                }
            </button>
            
            <div class="entry-info" style="margin-top: 10px; font-size: 0.8em; color: #666;">
                💰 Entry fee: 50 $NUTS • 🏆 Top 3 split prize pool
            </div>
        `;

        // Add the button container after the games grid
        const gamesGrid = document.getElementById('games-grid');
        if (gamesGrid && gamesGrid.parentNode) {
            gamesGrid.parentNode.insertBefore(buttonContainer, gamesGrid.nextSibling);
        }

        // Set up the enter button event listener
        const enterButton = document.getElementById('enter-contest-btn');
        if (enterButton) {
            enterButton.addEventListener('click', () => this.handleContestEntry());
        }        console.log('✅ Enter button added with', picksCount, 'picks');
    }

    updateEntryButton() {
        const entryButton = document.getElementById('enter-contest-btn');
        const progressBar = document.querySelector('.progress-bar');
        const picksCountSpan = document.querySelector('.picks-summary span[style*="color: #4CAF50"]');
        const picksCount = Object.keys(this.userPicks).length;
        const totalGames = this.selectedGames.length;
        
        if (entryButton) {
            const isComplete = picksCount === totalGames;
            
            // Update button state
            entryButton.disabled = !isComplete;
            entryButton.style.background = isComplete ? 
                'linear-gradient(135deg, #4CAF50, #00ff88)' : '#555';
            entryButton.style.color = isComplete ? '#000' : '#888';
            entryButton.style.cursor = isComplete ? 'pointer' : 'not-allowed';
            entryButton.style.boxShadow = isComplete ? 
                '0 0 20px rgba(76, 175, 80, 0.3)' : 'none';
            
            entryButton.textContent = isComplete ? 
                '🎯 Enter Contest (50 $NUTS)' : 
                `Make All Picks (${totalGames - picksCount} remaining)`;
            
            // Update progress bar
            if (progressBar) {
                progressBar.style.width = `${(picksCount / totalGames) * 100}%`;
            }
            
            // Update picks count
            if (picksCountSpan) {
                picksCountSpan.textContent = `${picksCount}/${totalGames}`;
            }
        }
    }    async handleContestEntry() {
        try {
            // Check if wallet is connected (authenticated)
            if (!window.xamanAuth || !window.xamanAuth.isUserAuthenticated()) {
                this.showError('Please connect your Xaman wallet to enter the contest.');
                return;
            }

            const picksCount = Object.keys(this.userPicks).length;
            
            if (picksCount !== this.selectedGames.length) {
                this.showError(`Please make picks for all ${this.selectedGames.length} games.`);
                return;
            }

            // Show entry fee collection notification
            this.showNotification('🔄 Processing entry fee payment...', 'info');
            
            // Initialize contest wallet if not already done
            if (!window.contestWallet) {
                window.contestWallet = new ContestWallet();
                await window.contestWallet.connect();
            }
            
            // Get authenticated user's wallet address
            const userWallet = this.getUserWallet();
            if (!userWallet) {
                this.showError('Unable to get wallet address. Please try logging in again.');
                return;
            }
            
            console.log('💰 Collecting entry fee from authenticated user:', userWallet);
            
            // Collect 50 NUTS entry fee
            const entryFeeTransaction = await window.contestWallet.collectEntryFee(userWallet, 50);
              if (entryFeeTransaction.status === 'SUCCESS') {
                // Entry fee collected successfully, now enter contest
                console.log('🎮 Entering contest with picks:', this.userPicks);
                console.log('💰 Entry fee transaction:', entryFeeTransaction.txId);
                
                // Store contest entry data with authenticated user info
                const userInfo = window.xamanAuth.getUserInfo();
                const contestEntry = {
                    userId: userInfo.sub,
                    userName: userInfo.name,
                    userWallet: userWallet,
                    picks: this.userPicks,
                    entryFee: 50,
                    transactionId: entryFeeTransaction.txId,
                    contestDay: this.currentDay,
                    timestamp: new Date().toISOString(),
                    games: this.selectedGames.length
                };
                
                // Create individual bets in Firebase for each pick
                if (window.firebaseIntegration && window.firebaseIntegration.initialized) {
                    console.log('🔥 Creating bets in Firebase...');
                    await this.createFirebaseBets(contestEntry);
                }
                
                // Store in local storage for backup (in production, save to database)
                this.saveContestEntry(contestEntry);
                
                this.showSuccess(`✅ Contest entered successfully! Entry fee paid: 50 NUTS`);
                this.showSuccess(`📋 Transaction ID: ${entryFeeTransaction.txId.substring(0, 16)}...`);
                this.showSuccess(`🎯 ${picksCount} picks submitted. Good luck! 🍀`);
                
                // Disable further changes
                document.querySelectorAll('.team-option').forEach(team => {
                    team.style.pointerEvents = 'none';
                    team.style.opacity = '0.7';
                });
                
                const entryButton = document.getElementById('enter-contest-btn');
                if (entryButton) {
                    entryButton.textContent = '✅ Contest Entered (50 NUTS Paid)';
                    entryButton.disabled = true;
                    entryButton.style.background = '#4CAF50';
                }
            } else {
                throw new Error('Entry fee payment failed');
            }
            
        } catch (error) {
            console.error('❌ Contest entry failed:', error);
            this.showError('Failed to enter contest: ' + error.message);
        }
    }    // Wallet Connection handler methods
    async handleWalletConnection() {
        try {
            console.log('🔗 Connecting Xaman wallet with enhanced QR modal...');
            
            const connectBtn = document.getElementById('connect-wallet-btn');
            const walletText = document.getElementById('walletText');
            const walletSpinner = document.getElementById('walletSpinner');
            
            // Prevent multiple clicks
            if (connectBtn && connectBtn.disabled) {
                console.log('⚠️ Connection already in progress...');
                return;
            }
            
            // Check if already authenticated
            if (window.xamanAuth && window.xamanAuth.isUserAuthenticated()) {
                // Already authenticated, show disconnect option
                this.handleWalletDisconnection();
                return;
            }
            
            // Show loading state
            if (walletText) walletText.textContent = 'Connecting...';
            if (walletSpinner) walletSpinner.classList.remove('hidden');
            if (connectBtn) connectBtn.disabled = true;
            
            // Initialize enhanced QR modal if not available
            if (!window.enhancedQRModal) {
                console.log('🎨 Initializing enhanced QR modal...');
                window.enhancedQRModal = new EnhancedQRModal();
            }
            
            // Show enhanced QR modal with real Xaman API integration
            await window.enhancedQRModal.show();
            
        } catch (error) {
            console.error('❌ Wallet connection failed:', error);
            this.showError('Wallet connection failed: ' + error.message);
            this.resetWalletButton();
        }
    }handleWalletDisconnection() {
        try {
            console.log('🚪 Disconnecting wallet...');
            
            // Clear authentication state
            if (window.xamanAuth) {
                window.xamanAuth.user = null;
                window.xamanAuth.isAuthenticated = false;
                window.xamanAuth.accessToken = null;
            }
            
            // Trigger disconnect event
            window.dispatchEvent(new CustomEvent('xamanLogout'));
            
            // Update UI immediately
            this.onWalletDisconnected();
            
        } catch (error) {
            console.error('❌ Wallet disconnection failed:', error);
            this.showError('Wallet disconnection failed: ' + error.message);
        }
    }    onWalletConnected(userInfo) {
        console.log('✅ Wallet connected successfully:', userInfo);
        
        // Update wallet connection UI
        this.updateWalletUI(true, userInfo);
        
        // Update contest status
        this.updateContestStatus(true, userInfo);
        
        // Show success message
        this.showNotification(`Wallet connected! Welcome ${userInfo.name}`, 'success');
    }

    onWalletDisconnected() {
        console.log('🚪 Wallet disconnected');
        
        // Update wallet connection UI
        this.updateWalletUI(false);
        
        // Update contest status
        this.updateContestStatus(false);
        
        // Clear any user-specific data
        this.clearUserData();
    }    updateWalletUI(isConnected, userInfo = null) {
        const connectBtn = document.getElementById('connect-wallet-btn');
        const walletText = document.getElementById('walletText');
        const walletSpinner = document.getElementById('walletSpinner');
        const walletInfo = document.getElementById('wallet-info');
        const walletAddress = document.querySelector('.wallet-address');
        
        if (isConnected && userInfo) {
            // Update connect button to show connected state
            if (walletText) walletText.textContent = 'Disconnect';
            if (walletSpinner) walletSpinner.classList.add('hidden');
            if (connectBtn) {
                connectBtn.disabled = false;
                connectBtn.onclick = () => this.handleWalletDisconnection();
                connectBtn.title = 'Click to disconnect wallet';
                connectBtn.style.background = 'linear-gradient(135deg, #f44336, #ff6b6b)';
            }
            
            // Show wallet info
            if (walletInfo) walletInfo.classList.remove('hidden');
            if (walletAddress) {
                walletAddress.textContent = userInfo.wallet_address.substring(0, 8) + '...';
            }
            
            // Update user info section
            const userInfoDiv = document.getElementById('user-info');
            if (userInfoDiv) {
                userInfoDiv.innerHTML = `
                    <div class="user-profile" style="
                        background: #2a2a2a; 
                        padding: 15px; 
                        border-radius: 8px; 
                        border: 1px solid #4CAF50;
                        text-align: center;
                    ">
                        <div class="user-details">
                            <div class="user-name" style="color: #4CAF50; font-weight: bold; margin-bottom: 5px;">
                                🟢 ${userInfo.name}
                            </div>
                            <div class="user-wallet" style="color: #ffa500; font-size: 0.9em; font-family: monospace;">
                                ${userInfo.wallet_address}
                            </div>
                        </div>
                    </div>
                `;
                userInfoDiv.style.display = 'block';
            }
            
        } else {
            // Update connect button to show disconnected state
            if (walletText) walletText.textContent = 'Connect Wallet';
            if (walletSpinner) walletSpinner.classList.add('hidden');
            if (connectBtn) {
                connectBtn.disabled = false;
                connectBtn.onclick = () => this.handleWalletConnection();
                connectBtn.title = 'Connect your Xaman wallet';
                connectBtn.style.background = 'linear-gradient(135deg, #4CAF50, #00ff88)';
            }
            
            // Hide wallet info
            if (walletInfo) walletInfo.classList.add('hidden');
            
            // Hide user info
            const userInfoDiv = document.getElementById('user-info');
            if (userInfoDiv) userInfoDiv.style.display = 'none';
        }
    }

    updateContestStatus(isConnected, userInfo = null) {
        const statusCard = document.querySelector('.status-card');
        const statusIcon = document.querySelector('.status-icon');
        const statusTitle = statusCard?.querySelector('h3');
        const statusDescription = statusCard?.querySelector('p');
        const enterContestBtn = document.getElementById('enter-contest-btn');
        
        if (isConnected && userInfo) {
            // Update to connected state
            if (statusIcon) statusIcon.textContent = '🎯';
            if (statusTitle) statusTitle.textContent = 'Ready to Enter Contest';
            if (statusDescription) statusDescription.textContent = 'Your wallet is connected and you can enter contests!';
            
            // Enable contest entry button
            if (enterContestBtn) {
                enterContestBtn.disabled = false;
                enterContestBtn.innerHTML = '<span>Enter Contest (50 $NUTS)</span><div class="btn-glow"></div>';
            }
            
        } else {
            // Update to disconnected state
            if (statusIcon) statusIcon.textContent = '🔗';
            if (statusTitle) statusTitle.textContent = 'Wallet Connection Required';
            if (statusDescription) statusDescription.textContent = 'Connect your Xaman wallet to participate in contests';
            
            // Disable contest entry button
            if (enterContestBtn) {
                enterContestBtn.disabled = true;
                enterContestBtn.innerHTML = '<span>Connect Wallet to Enter Contest</span><div class="btn-glow"></div>';
            }
        }
    }    clearUserData() {
        // Clear user picks and contest entry data when wallet is disconnected
        this.userPicks = {};
        
        // Reset any disabled UI elements
        document.querySelectorAll('.team-option').forEach(team => {
            team.style.pointerEvents = '';
            team.style.opacity = '';
        });
        
        // Re-enable entry button if user was in middle of contest entry
        const entryButton = document.getElementById('enter-contest-btn');
        if (entryButton && entryButton.textContent.includes('Contest Entered')) {
            entryButton.disabled = true;
            entryButton.innerHTML = '<span>Connect Wallet to Enter Contest</span><div class="btn-glow"></div>';
            entryButton.style.background = '';
        }
        
        // Refresh games display
        this.displayGames();
    }    // Update getUserWallet to use authenticated user's wallet
    getUserWallet() {
        if (window.xamanAuth && window.xamanAuth.isUserAuthenticated()) {
            const userInfo = window.xamanAuth.getUserInfo();
            if (userInfo && userInfo.wallet_address) {
                return userInfo.wallet_address;
            }
        }
        
        // Fallback for demo purposes
        return null;
    }    resetWalletButton() {
        const connectBtn = document.getElementById('connect-wallet-btn');
        const walletText = document.getElementById('walletText');
        const walletSpinner = document.getElementById('walletSpinner');
        
        if (walletText) walletText.textContent = 'Connect Wallet';
        if (walletSpinner) walletSpinner.classList.add('hidden');
        if (connectBtn) {
            connectBtn.disabled = false;
            connectBtn.onclick = () => this.handleWalletConnection();
        }
    }

    /**
     * Create individual bets in Firebase for each pick
     */
    async createFirebaseBets(contestEntry) {
        try {
            console.log('🔥 Creating Firebase bets for contest entry...');
            
            const contestId = `contest-${contestEntry.contestDay}-${new Date().toISOString().split('T')[0]}`;
            const betPromises = [];

            // Create a bet for each pick
            for (const [gameId, selection] of Object.entries(contestEntry.picks)) {
                const game = this.selectedGames.find(g => g.id === gameId);
                if (!game) continue;

                const betData = {
                    contestId: contestId,
                    gameId: gameId,
                    selection: selection, // 'home' or 'away'
                    selectedTeam: selection === 'home' ? game.homeTeam : game.awayTeam,
                    opposingTeam: selection === 'home' ? game.awayTeam : game.homeTeam,
                    odds: selection === 'home' ? game.homeOdds : game.awayOdds,
                    amount: 100, // 100 NUTS per bet
                    txHash: contestEntry.transactionId,
                    gameTime: game.commence_time,
                    sport: 'MLB'
                };

                const betPromise = window.firebaseIntegration.createUserBet(betData);
                betPromises.push(betPromise);
            }

            const results = await Promise.all(betPromises);
            const successfulBets = results.filter(r => r.success);
            
            console.log(`✅ Created ${successfulBets.length} bets in Firebase`);
            
            if (successfulBets.length > 0) {
                this.showSuccess(`🔥 ${successfulBets.length} bets stored in Firebase`);
            }

            return successfulBets;
        } catch (error) {
            console.error('❌ Failed to create Firebase bets:', error);
            this.showError('Failed to store bets in Firebase: ' + error.message);
            return [];
        }
    }    /**
     * Save contest entry to local storage (backup)
     */
    saveContestEntry(contestEntry) {
        try {
            const storageKey = `contest_entry_${contestEntry.contestDay}_${Date.now()}`;
            localStorage.setItem(storageKey, JSON.stringify(contestEntry));
            
            // Also save to a general contest entries array
            const allEntries = JSON.parse(localStorage.getItem('all_contest_entries') || '[]');
            allEntries.push({
                ...contestEntry,
                storageKey: storageKey
            });
            localStorage.setItem('all_contest_entries', JSON.stringify(allEntries));
            
            console.log('✅ Contest entry saved to local storage');
        } catch (error) {
            console.error('❌ Failed to save contest entry:', error);
        }
    }

    /**
     * Show success notification
     */
    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    /**
     * Show error notification
     */
    showError(message) {
        this.showNotification(message, 'error');
    }

    /**
     * Show notification with type
     */
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            z-index: 10000;
            max-width: 400px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            font-weight: 500;
            animation: slideInRight 0.3s ease-out;
        `;
        
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 1.2em;">
                    ${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}
                </span>
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" style="
                    background: none;
                    border: none;
                    color: white;
                    font-size: 1.2em;
                    cursor: pointer;
                    padding: 0;
                    margin-left: 10px;
                ">×</button>
            </div>
        `;

        // Add animation styles if not already present
        if (!document.getElementById('notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }

        // Add to page
        document.body.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.style.animation = 'slideInRight 0.3s ease-out reverse';
                setTimeout(() => notification.remove(), 300);
            }
        }, 5000);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM Content Loaded');
    
    // Wait a bit to ensure all scripts are loaded
    setTimeout(() => {
        console.log('🎮 Initializing Daily Contest Manager...');
        window.dailyContestManager = new DailyContestManager();
        window.dailyContestManager.init();
        
        // Force tab creation after a short delay
        setTimeout(() => {
            if (window.dailyContestManager) {
                console.log('🔄 Force creating tabs...');
                window.dailyContestManager.createDayTabs();
                window.dailyContestManager.updateTabIndicators();
                console.log('✅ Tabs force created');
            }
        }, 1000);
    }, 500);
});

// Add a manual initialization function
window.initializeTabs = () => {
    console.log('🔧 Manual tab initialization...');
    if (window.dailyContestManager) {
        window.dailyContestManager.createDayTabs();
        window.dailyContestManager.updateTabIndicators();
        window.dailyContestManager.updateUI();
        console.log('✅ Manual initialization complete');
    } else {
        console.log('❌ dailyContestManager not available');
    }
};

// Add debug functions to global scope for testing
window.forceLoadBasicGames = () => {
    if (window.dailyContestManager) {
        window.dailyContestManager.forceLoadBasicGames();
    }
};

window.forceLoadGames = () => {
    if (window.dailyContestManager) {
        window.dailyContestManager.forceLoadGames();
    }
};

window.testGamesContainer = () => {
    if (window.dailyContestManager) {
        return window.dailyContestManager.testGamesContainer();
    }
    return false;
};

window.debugContestState = () => {
    if (window.dailyContestManager) {
        console.log('🔍 Contest State Debug:');
        console.log('Selected Games:', window.dailyContestManager.selectedGames);
        console.log('Available Games:', window.dailyContestManager.availableGames);
        console.log('User Picks:', window.dailyContestManager.userPicks);
    }
};

// Add removePick function to global scope
window.removePick = (gameId) => {
    if (window.dailyContestManager) {
        window.dailyContestManager.removePick(gameId);
    }
};

// Add function to manually switch days for testing
window.switchToDay = (dayIndex) => {
    if (window.dailyContestManager) {
        window.dailyContestManager.switchToDay(dayIndex);
    }
};

console.log('⚾ Daily Contest module loaded');
