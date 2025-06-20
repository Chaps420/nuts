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
        this.backend = null;
        this.integration = null; // Will be initialized in init()
        this.contestDeadline = null; // Store the contest deadline
        console.log('🎮 Initializing Multi-Day Contest Manager...');
    }    async init() {
        try {
            console.log('🚀 Loading multi-day contest data...');
            console.log('📅 Current date:', new Date().toISOString());
            console.log('📅 Today formatted:', this.formatDate(new Date()));
            
            // Ensure DOM is ready
            if (document.readyState === 'loading') {
                console.log('⏳ DOM still loading, waiting...');
                await new Promise(resolve => {
                    document.addEventListener('DOMContentLoaded', resolve);
                });
            }

            // No wallet connection needed - payment only system
            console.log('💸 Payment-only system ready');
            
            // Initialize backend
            if (window.ContestBackend) {
                this.backend = new ContestBackend();
                await this.backend.init();
                console.log('✅ Backend initialized');
            } else {
                console.warn('⚠️ ContestBackend not available');
            }
            
            // Initialize Firebase + Xaman integration
            if (window.FirebaseXamanIntegration) {
                this.integration = new FirebaseXamanIntegration();
                await this.integration.init();
                console.log('✅ Firebase + Xaman integration ready');
            } else {
                console.warn('⚠️ Firebase + Xaman integration not available');
            }

            // Initialize contest days (next 5 days)
            this.initializeContestDays();
            
            // Create day tabs
            this.createDayTabs();
            
            // MLB Schedule API is ready to use immediately (no init needed)
            console.log('⚾ MLB Schedule API status:', window.mlbSchedule ? 'Available' : 'Not loaded');
            
            // Load contest data for current day
            await this.loadContestForDay(this.currentDay);
            
            this.setupEventListeners();
            this.updateUI();
            
            // Load and display contest stats
            await this.loadContestStats();
            
            // Refresh stats every 30 seconds
            setInterval(() => this.loadContestStats(), 30000);
            
            console.log('✅ Multi-day contest initialized with wallet integration');
        } catch (error) {
            console.error('❌ Failed to initialize daily contest:', error);
            // Only show error if it's not a permissions issue
            if (error.code !== 'permission-denied' && !error.message?.includes('permissions')) {
                this.showError('Failed to load contest games. Please try refreshing the page.');
            }
        }
    }

    initializeContestDays() {
        const today = new Date();
        this.contestDays = [];
        
        // Initialize 5 days of contests
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
        const now = new Date();
        
        tabsContainer.innerHTML = this.contestDays.map((contestDay, index) => {
            const date = contestDay.date;
            const dayName = days[index];
            const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            
            // Check if contest is closed for today
            let isClosed = false;
            let closedStyle = '';
            if (index === 0) { // Today's tab
                const deadline = this.calculateContestDeadline(contestDay.games);
                if (deadline && now > deadline) {
                    isClosed = true;
                    closedStyle = 'background: #ff4444 !important; border-color: #ff4444 !important;';
                }
            }
            
            return `
                <div class="day-tab ${index === this.currentDay ? 'active' : ''} ${isClosed ? 'closed' : ''}" 
                     data-day="${index}" 
                     onclick="window.switchToDay(${index})"
                     style="${closedStyle}">
                    <div class="tab-day">${dayName}${isClosed ? ' ❌' : ''}</div>
                    <div class="tab-date">${dateStr}</div>
                    <div class="tab-indicator">${isClosed ? 'CLOSED' : '0 games'}</div>
                </div>
            `;
        }).join('');        
        
        console.log('📋 Created', this.contestDays.length, 'day tabs');
    }

    updateTabIndicators() {
        const now = new Date();
        
        this.contestDays.forEach((day, index) => {
            const tab = document.querySelector(`[data-day="${index}"]`);
            const tabIndicator = document.querySelector(`[data-day="${index}"] .tab-indicator`);
            const tabDay = document.querySelector(`[data-day="${index}"] .tab-day`);
            
            if (tabIndicator) {
                const gameCount = day.games ? day.games.length : 0;
                
                // Check if contest is closed (for today only)
                let isClosed = false;
                if (index === 0 && day.games && day.games.length > 0) {
                    const deadline = this.calculateContestDeadline(day.games);
                    if (deadline && now > deadline) {
                        isClosed = true;
                    }
                }
                
                if (isClosed) {
                    tabIndicator.textContent = 'CLOSED';
                    tabIndicator.style.color = '#fff';
                    if (tab) {
                        tab.style.background = '#ff4444';
                        tab.style.borderColor = '#ff4444';
                    }
                    if (tabDay && !tabDay.textContent.includes('❌')) {
                        tabDay.textContent = tabDay.textContent.replace('Today', 'Today ❌');
                    }
                } else if (gameCount > 0) {
                    tabIndicator.textContent = `${gameCount} games`;
                    tabIndicator.style.color = '#4CAF50';
                } else {
                    tabIndicator.textContent = 'Loading...';
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

        try {
            // Load ALL games for this day (no admin selection needed)
            const mlbGames = await this.loadMLBGamesForDay(contestDay.date);
            
            if (mlbGames && mlbGames.length > 0) {
                console.log(`✅ Found ${mlbGames.length} MLB games for ${contestDay.dateString}`);
                this.availableGames = mlbGames; // All games available
                this.selectedGames = mlbGames;  // Show all games
                contestDay.games = mlbGames;
                
                // Calculate contest deadline (30 min before first game)
                this.calculateContestDeadline(mlbGames);
            } else {
                // Fallback to mock games
                console.log(`⚠️ No real games found, using mock games for ${contestDay.dateString}`);
                const mockGames = this.getMockGamesForDate(contestDay.date);
                this.availableGames = mockGames;
                this.selectedGames = mockGames;  // Show all games
                contestDay.games = mockGames;
                
                // Calculate deadline for mock games
                this.calculateContestDeadline(mockGames);
            }

            contestDay.isLoaded = true;
            this.updateTabIndicators();
            
            // Update UI to show the games
            this.displayGames();
            
        } catch (error) {
            console.error(`❌ Error loading games for day ${dayIndex}:`, error);
            // Use mock games as fallback
            const mockGames = this.getMockGamesForDate(contestDay.date);
            this.availableGames = mockGames;
            this.selectedGames = mockGames;
            contestDay.games = mockGames;
            contestDay.isLoaded = true;
            this.updateTabIndicators();
            this.displayGames();
        }
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
            
            if (window.mlbSchedule) {
                console.log('✅ MLB Schedule API is available (FREE!)');
                
                // Get games for this specific date
                console.log('📡 Fetching MLB games from free MLB Stats API...');
                const games = await window.mlbSchedule.getGamesForDate(date);
                console.log(`📅 Found ${games.length} games for ${date.toDateString()}`);
                
                if (games.length > 0) {
                    this.availableGames = games;
                    this.selectedGames = games; // Show ALL games
                    console.log(`🎯 Showing all ${this.selectedGames.length} games (users must pick ALL)`);
                    
                    // Store in contest day
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const dayIndex = Math.floor((date - today) / (1000 * 60 * 60 * 24));
                    
                    if (this.contestDays[dayIndex] && dayIndex >= 0 && dayIndex < this.contestDays.length) {
                        this.contestDays[dayIndex].games = this.selectedGames;
                        this.contestDays[dayIndex].isLoaded = true;
                    }
                    
                    return this.selectedGames;
                } else {
                    console.log('⚠️ No games returned from API, checking if offseason or API issue');
                    return [];
                }
            } else {
                console.warn('❌ MLB Schedule API not available, using mock data');
                this.selectedGames = this.getMockGamesForDate(date);
                return this.selectedGames;
            }
            
        } catch (error) {
            console.error(`❌ Failed to load MLB games for ${date.toDateString()}:`, error);
            console.error('Error details:', error.message, error.stack);
            // Don't automatically use mock games here - let the caller decide
            return [];
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
            ['Seattle Mariners', 'Oakland Athletics'],
            ['Arizona Diamondbacks', 'Colorado Rockies'],
            ['Miami Marlins', 'Washington Nationals'],
            ['New York Mets', 'Pittsburgh Pirates'],
            ['Baltimore Orioles', 'Kansas City Royals'],
            ['Texas Rangers', 'San Diego Padres']
        ];

        // MLB typically has 12-15 games per day
        const numGames = 12 + Math.floor(Math.random() * 4); // 12-15 games
        const selectedTeams = mlbTeams.slice(0, numGames);

        return selectedTeams.map((teams, index) => {
            const gameTime = new Date(date);
            // Spread games throughout the day (1 PM to 10 PM)
            const hour = 13 + Math.floor(index / 2);
            const minute = index % 2 === 0 ? 10 : 40;
            gameTime.setHours(hour, minute, 0, 0);
            
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
        
        // Render all available games
        
        gamesContainer.innerHTML = `
            <div class="games-content-wrapper">
                <div class="games-list" style="
                    display: flex;
                    flex-direction: column;
                    gap: 0;
                    padding: 5px;
                ">
                    ${currentDayGames.map((game, index) => this.renderGameCard(game, index)).join('')}
                </div>
            </div>
        `;

        // Set up click event listeners for game selection
        this.setupGameEventListeners();
        
        // Add enter button if not already present
        this.addEnterButton();
        
        // Check if contest is closed and update UI accordingly
        this.updateContestClosedUI();
        
        console.log(`✅ Displayed ${currentDayGames.length} games with ${Object.keys(this.userPicks).length} picks`);
    }

    renderGameCard(game, index) {
        // Debug first game to see structure
        if (index === 0) {
            console.log('🎮 First game structure:', {
                awayTeam: game.awayTeam,
                homeTeam: game.homeTeam,
                awayTeamFull: game.awayTeamFull,
                homeTeamFull: game.homeTeamFull,
                awayOdds: game.awayOdds,
                homeOdds: game.homeOdds
            });
        }
        
        const gameDate = new Date(game.gameTime);
        const timeStr = gameDate.toLocaleTimeString([], {hour: 'numeric', minute:'2-digit'});
        
        // Get team abbreviations
        const getTeamAbbr = (teamName) => {
            const abbreviations = {
                'Arizona Diamondbacks': 'ARI', 'Atlanta Braves': 'ATL', 'Baltimore Orioles': 'BAL',
                'Boston Red Sox': 'BOS', 'Chicago Cubs': 'CHC', 'Chicago White Sox': 'CHW',
                'Cincinnati Reds': 'CIN', 'Cleveland Guardians': 'CLE', 'Colorado Rockies': 'COL',
                'Detroit Tigers': 'DET', 'Houston Astros': 'HOU', 'Kansas City Royals': 'KC',
                'Los Angeles Angels': 'LAA', 'Los Angeles Dodgers': 'LAD', 'Miami Marlins': 'MIA',
                'Milwaukee Brewers': 'MIL', 'Minnesota Twins': 'MIN', 'New York Mets': 'NYM',
                'New York Yankees': 'NYY', 'Oakland Athletics': 'OAK', 'Philadelphia Phillies': 'PHI',
                'Pittsburgh Pirates': 'PIT', 'San Diego Padres': 'SD', 'San Francisco Giants': 'SF',
                'Seattle Mariners': 'SEA', 'St. Louis Cardinals': 'STL', 'Tampa Bay Rays': 'TB',
                'Texas Rangers': 'TEX', 'Toronto Blue Jays': 'TOR', 'Washington Nationals': 'WSH'
            };
            return abbreviations[teamName] || teamName.substring(0, 3).toUpperCase();
        };
        
        // Handle both formats - if awayTeam is already an abbreviation (3 chars or less), use it directly
        const awayAbbr = (game.awayTeam && game.awayTeam.length <= 3) ? game.awayTeam : getTeamAbbr(game.awayTeamFull || game.awayTeam);
        const homeAbbr = (game.homeTeam && game.homeTeam.length <= 3) ? game.homeTeam : getTeamAbbr(game.homeTeamFull || game.homeTeam);
        const isPicked = this.userPicks[game.id];
        const pickedTeam = this.userPicks[game.id];
        
        return `
            <div class="game-card" data-game-id="${game.id}" style="
                background: ${isPicked ? 'linear-gradient(135deg, #1a3d1a, #1e1e1e)' : '#1e1e1e'};
                border: 2px solid ${isPicked ? '#4CAF50' : '#333'};
                border-radius: 8px;
                padding: 12px;
                margin-bottom: 8px;
                transition: all 0.2s ease;
                box-shadow: ${isPicked ? '0 2px 8px rgba(76, 175, 80, 0.3)' : 'none'};
                display: flex;
                align-items: center;
                gap: 12px;
            ">
                <!-- Game Time -->
                <div class="game-time" style="
                    color: #ffa500;
                    font-size: 0.8em;
                    min-width: 55px;
                    text-align: center;
                    flex-shrink: 0;
                    font-weight: 600;
                ">${timeStr}</div>
                
                <!-- Team Selection -->
                <div class="matchup" style="
                    flex: 1;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                ">
                    <!-- Away Team Button -->
                    <button class="team-btn ${pickedTeam === 'away' ? 'selected' : ''}" 
                         data-team="away" 
                         data-game-id="${game.id}" 
                         style="
                        flex: 1;
                        background: ${pickedTeam === 'away' ? '#4CAF50' : '#2a2a2a'};
                        color: ${pickedTeam === 'away' ? '#000' : '#fff'};
                        border: 2px solid ${pickedTeam === 'away' ? '#4CAF50' : '#444'};
                        border-radius: 6px;
                        padding: 10px;
                        cursor: pointer;
                        transition: all 0.2s ease;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        font-family: inherit;
                        position: relative;
                        min-height: 50px;
                    " 
                    onmouseover="if(!this.classList.contains('selected')) { this.style.borderColor='#666'; this.style.background='#333'; }"
                    onmouseout="if(!this.classList.contains('selected')) { this.style.borderColor='#444'; this.style.background='#2a2a2a'; }">
                        <span style="font-weight: bold; font-size: 1.1em;">${awayAbbr || 'AWAY'}</span>
                        <span style="font-size: 0.75em; opacity: 0.8; margin-top: 2px;">${game.awayOdds || '+100'}</span>
                        ${pickedTeam === 'away' ? '<div style="position: absolute; top: 2px; right: 2px; font-size: 0.7em;">✓</div>' : ''}
                    </button>
                    
                    <!-- VS Separator -->
                    <div style="
                        display: flex;
                        align-items: center;
                        padding: 0 10px;
                        color: #888;
                        font-size: 0.9em;
                        font-weight: bold;
                    ">VS</div>
                    
                    <!-- Home Team Button -->
                    <button class="team-btn ${pickedTeam === 'home' ? 'selected' : ''}" 
                         data-team="home" 
                         data-game-id="${game.id}" 
                         style="
                        flex: 1;
                        background: ${pickedTeam === 'home' ? '#4CAF50' : '#2a2a2a'};
                        color: ${pickedTeam === 'home' ? '#000' : '#fff'};
                        border: 2px solid ${pickedTeam === 'home' ? '#4CAF50' : '#444'};
                        border-radius: 6px;
                        padding: 10px;
                        cursor: pointer;
                        transition: all 0.2s ease;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        font-family: inherit;
                        position: relative;
                        min-height: 50px;
                    "
                    onmouseover="if(!this.classList.contains('selected')) { this.style.borderColor='#666'; this.style.background='#333'; }"
                    onmouseout="if(!this.classList.contains('selected')) { this.style.borderColor='#444'; this.style.background='#2a2a2a'; }">
                        <span style="font-weight: bold; font-size: 1.1em;">${homeAbbr || 'HOME'}</span>
                        <span style="font-size: 0.75em; opacity: 0.8; margin-top: 2px;">${game.homeOdds || '-120'}</span>
                        ${pickedTeam === 'home' ? '<div style="position: absolute; top: 2px; right: 2px; font-size: 0.7em;">✓</div>' : ''}
                    </button>
                </div>
                
                <!-- Clear Pick Button -->
                ${isPicked ? `
                    <button class="clear-pick-btn" 
                         data-game-id="${game.id}"
                         style="
                        background: #ff4444;
                        color: white;
                        border: none;
                        border-radius: 6px;
                        padding: 8px 14px;
                        font-size: 0.8em;
                        cursor: pointer;
                        transition: all 0.2s ease;
                        opacity: 0.9;
                        font-weight: 500;
                        flex-shrink: 0;
                    "
                    onmouseover="this.style.opacity='1'; this.style.background='#ff5555';"
                    onmouseout="this.style.opacity='0.9'; this.style.background='#ff4444';">
                        Clear
                    </button>
                ` : ''}
            </div>
        `;
    }setupGameEventListeners() {
        // Handle clicks on team buttons
        document.querySelectorAll('.team-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const gameId = button.dataset.gameId;
                const team = button.dataset.team;
                
                // Add haptic feedback for mobile
                if ('vibrate' in navigator) {
                    navigator.vibrate(10);
                }
                
                this.makePickForGame(gameId, team);
            });
        });
        
        // Handle clear pick buttons
        document.querySelectorAll('.clear-pick-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const gameId = button.dataset.gameId;
                
                // Add haptic feedback for mobile
                if ('vibrate' in navigator) {
                    navigator.vibrate(10);
                }
                
                delete this.userPicks[gameId];
                this.displayGames();
            });
        });
    }

    calculateContestDeadline(games) {
        if (!games || games.length === 0) return null;
        
        // Check if MLB API reported games in progress
        if (games.hasGamesInProgress) {
            console.log('🚨 MLB API reports games in progress - contest must be closed!');
            this.contestDeadline = new Date(Date.now() - 1000); // 1 second ago
            return this.contestDeadline;
        }
        
        // Manual override: If it's past 6:00 PM local time, force contest closure
        // This handles cases where API data might be delayed or incorrect
        const now = new Date();
        const cutoffTime = new Date();
        cutoffTime.setHours(18, 0, 0, 0); // 6:00 PM local time
        
        if (now > cutoffTime) {
            console.log('🚨 Manual override: Past 6:00 PM local time - forcing contest closure!');
            console.log(`Current time: ${now.toLocaleString()}, Cutoff: ${cutoffTime.toLocaleString()}`);
            this.contestDeadline = new Date(Date.now() - 1000); // 1 second ago
            return this.contestDeadline;
        }
        
        // Find the earliest game time
        const earliestGame = games.reduce((earliest, game) => {
            const gameTime = new Date(game.gameTime);
            const earlyTime = new Date(earliest.gameTime);
            return gameTime < earlyTime ? game : earliest;
        });
        
        // Set deadline to 30 minutes before earliest game
        const deadline = new Date(earliestGame.gameTime);
        deadline.setMinutes(deadline.getMinutes() - 30);
        
        // Log timezone information for debugging
        console.log(`⏰ Timezone debug: earliestGame=${earliestGame.gameTime}, now=${now.toISOString()}, deadline=${deadline.toISOString()}`);
        console.log(`⏰ Local times: now=${now.toLocaleString()}, deadline=${deadline.toLocaleString()}, earliestGame=${new Date(earliestGame.gameTime).toLocaleString()}`);
        
        // Check if any game has already started
        console.log('🔍 Checking all games for start times:');
        games.forEach((game, index) => {
            const gameTime = new Date(game.gameTime);
            const started = now > gameTime;
            console.log(`Game ${index + 1}: ${game.awayTeam} @ ${game.homeTeam} - ${gameTime.toLocaleString()} (Started: ${started})`);
        });
        
        const hasStartedGame = games.some(game => {
            const gameTime = new Date(game.gameTime);
            return now > gameTime;
        });
        
        if (hasStartedGame) {
            console.log('🚨 At least one game has already started - contest should be closed!');
            // Set deadline to now to force contest closure
            this.contestDeadline = new Date(now.getTime() - 1000); // 1 second ago
        } else {
            console.log('✅ No games have started yet - contest remains open');
            this.contestDeadline = deadline; // Store the deadline
        }
        
        // Trigger immediate time update in HTML
        if (typeof updateTimeRemaining === 'function') {
            updateTimeRemaining();
        }
        
        return this.contestDeadline;
    }

    isContestClosed() {
        if (!this.contestDeadline) return false;
        return new Date() > this.contestDeadline;
    }

    updateContestClosedUI() {
        const now = new Date();
        const deadline = this.contestDeadline;
        console.log(`🕐 Checking contest status: now=${now.toLocaleString()}, deadline=${deadline ? deadline.toLocaleString() : 'null'}, closed=${this.isContestClosed()}`);
        
        if (!this.isContestClosed()) return;
        
        console.log('🚫 Contest is closed - updating UI');
        
        // Disable all team buttons
        document.querySelectorAll('.team-btn').forEach(btn => {
            btn.disabled = true;
            btn.style.opacity = '0.5';
            btn.style.cursor = 'not-allowed';
        });
        
        // Update entry status
        const statusCard = document.querySelector('.status-card');
        if (statusCard) {
            const statusIcon = statusCard.querySelector('.status-icon');
            const statusTitle = statusCard.querySelector('h3');
            const statusDescription = statusCard.querySelector('p');
            
            if (statusIcon) statusIcon.textContent = '🚫';
            if (statusTitle) statusTitle.textContent = 'Contest Closed';
            if (statusDescription) statusDescription.textContent = 'Today\'s contest entry period has ended. Games have started.';
            
            statusCard.style.background = 'linear-gradient(135deg, #ff4444, #cc3333)';
        }
        
        // Hide submit section
        const submitSection = document.getElementById('submit-section');
        if (submitSection) {
            submitSection.style.display = 'none';
        }
        
        // Show closed message in games section
        const gamesGrid = document.getElementById('games-grid');
        if (gamesGrid) {
            const closedMessage = document.createElement('div');
            closedMessage.style.cssText = `
                background: #ff4444;
                color: white;
                padding: 20px;
                border-radius: 8px;
                text-align: center;
                margin: 20px 0;
                font-weight: bold;
            `;
            closedMessage.innerHTML = `
                <h3>🚫 Contest Closed</h3>
                <p>Entry period has ended. The first game has started.</p>
                <p>Come back tomorrow for the next daily contest!</p>
            `;
            gamesGrid.insertBefore(closedMessage, gamesGrid.firstChild);
        }
    }

    makePickForGame(gameId, team) {
        // Check if contest is closed
        if (this.isContestClosed()) {
            console.log('🚫 Cannot make pick - contest is closed');
            return;
        }
        
        // Store the pick
        this.userPicks[gameId] = team;
        
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

        // Check if contest is closed
        const now = new Date();
        const deadline = this.calculateContestDeadline(this.selectedGames);
        const isClosed = deadline && now > deadline;

        // Create picks summary
        const picksCount = Object.keys(this.userPicks).length;
        const totalGames = this.selectedGames.length;

        if (isClosed) {
            buttonContainer.innerHTML = `
                <div style="background: #ff4444; color: white; padding: 20px; border-radius: 8px; text-align: center;">
                    <h3 style="margin: 0 0 10px 0;">❌ Contest Closed</h3>
                    <p style="margin: 0;">Entry deadline has passed. Check back tomorrow!</p>
                </div>
            `;
        } else {
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
            
            ${picksCount === totalGames ? `
                <!-- Tiebreaker Section -->
                <div class="tiebreaker-section" style="background: #252525; padding: 15px; border-radius: 8px; margin: 15px 0; border: 1px solid #444;">
                    <h4 style="color: #4CAF50; margin: 0 0 8px 0; font-size: 1em;">Tiebreaker</h4>
                    <p style="color: #ccc; font-size: 0.85em; margin-bottom: 10px;">
                        Predict total runs in the last game
                    </p>
                    <div style="display: flex; align-items: center; gap: 10px; justify-content: center;">
                        <label style="color: #888; font-size: 0.9em;">Total Runs:</label>
                        <input type="number" 
                               id="tiebreaker-runs" 
                               min="0" 
                               max="50" 
                               style="background: #2a2a2a; 
                                      border: 1px solid #444; 
                                      color: white; 
                                      padding: 6px 10px; 
                                      border-radius: 4px; 
                                      width: 80px;
                                      text-align: center;"
                               placeholder="0">
                        <span style="color: #666; font-size: 0.8em;">(Required)</span>
                    </div>
                </div>
            ` : ''}
            
            <!-- Twitter Handle Section -->
            <div class="twitter-handle-section" style="
                background: #1a1a1a; 
                padding: 20px; 
                border-radius: 8px; 
                margin: 20px 0; 
                border: 1px solid #333;
            ">
                <h4 style="color: #1DA1F2; margin: 0 0 10px 0; display: flex; align-items: center; gap: 8px;">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="#1DA1F2">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                    Add Your X Handle (Optional)
                </h4>
                <p style="color: #ccc; font-size: 0.9em; margin-bottom: 15px;">
                    Show your X username on the leaderboard
                </p>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="color: #666; font-size: 1.2em;">@</span>
                    <input type="text" 
                           id="twitter-handle" 
                           placeholder="yourhandle"
                           style="
                               background: #2a2a2a; 
                               border: 1px solid #444; 
                               color: white; 
                               padding: 8px 12px; 
                               border-radius: 4px; 
                               flex: 1;
                               max-width: 300px;
                           "
                           onkeyup="this.value = this.value.replace(/[@\\s]/g, '').toLowerCase();">
                    <span style="color: #666; font-size: 0.85em;">(Leave blank to stay anonymous)</span>
                </div>
            </div>
            
            <button id="enter-contest-btn" type="button" class="contest-enter-btn" onclick="window.dailyContestManager.handleContestEntry()" style="
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
                💰 Entry fee: 50 $NUTS • 🏆 Top 3 win (50%/30%/20%)
            </div>
        `;
        }

        // Add the button container after the games grid
        const gamesGrid = document.getElementById('games-grid');
        if (gamesGrid && gamesGrid.parentNode) {
            gamesGrid.parentNode.insertBefore(buttonContainer, gamesGrid.nextSibling);
        }

        // Store reference to this for use in onclick
        const self = this;
        
        console.log('✅ Enter button added with', picksCount, 'picks');
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
            
            // If button just became enabled, ensure click handler is attached
            if (isComplete && !entryButton.hasClickHandler) {
                console.log('🎉 Button enabled! Attaching final click handler');
                entryButton.hasClickHandler = true;
                entryButton.onclick = (e) => {
                    console.log('🔥🔥 ENTER CONTEST CLICKED!');
                    e.preventDefault();
                    e.stopPropagation();
                    this.handleContestEntry();
                };
            }
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
        console.log('🚀 handleContestEntry called!');
        console.log('🎯 Current picks:', this.userPicks);
        
        try {
            const picksCount = Object.keys(this.userPicks).length;
            console.log('📊 Picks count:', picksCount, 'Games:', this.selectedGames.length);
            
            if (picksCount !== this.selectedGames.length) {
                this.showError(`Please make picks for all ${this.selectedGames.length} games.`);
                return;
            }
            
            // Check if contest is still open (30 min before first game)
            const contestDeadline = this.calculateContestDeadline(this.selectedGames);
            if (contestDeadline && new Date() > contestDeadline) {
                this.showError('Contest entries have closed. Entries close 30 minutes before the first game.');
                return;
            }
            
            // Check entry limits (optional - can limit entries per user)
            const userId = 'USER_' + Date.now(); // In production, use actual user ID
            const existingEntries = await this.backend.getContestEntries(
                this.formatDate(this.contestDays[this.currentDay].date)
            );
            const userEntries = existingEntries.filter(e => e.userId === userId);
            
            const MAX_ENTRIES_PER_USER = 3; // Configurable limit
            if (userEntries.length >= MAX_ENTRIES_PER_USER) {
                this.showError(`You have reached the maximum of ${MAX_ENTRIES_PER_USER} entries per contest.`);
                return;
            }
            
            // Get tiebreaker value
            const tiebreakerInput = document.getElementById('tiebreaker-runs');
            const tiebreakerRuns = tiebreakerInput ? parseInt(tiebreakerInput.value) : null;
            
            if (tiebreakerRuns === null || isNaN(tiebreakerRuns) || tiebreakerRuns < 0) {
                this.showError('Please enter your tiebreaker prediction (total runs in last game)');
                tiebreakerInput.focus();
                return;
            }

            console.log('💰 Processing contest entry...');
            console.log('🎯 Tiebreaker prediction:', tiebreakerRuns, 'runs');
            
            // Get Twitter handle if provided
            const twitterHandleInput = document.getElementById('twitter-handle');
            const twitterHandle = twitterHandleInput ? twitterHandleInput.value.trim() : '';
            
            // Prepare contest entry data
            const contestEntry = {
                userId: 'USER_' + Date.now(),
                userName: twitterHandle ? `@${twitterHandle}` : 'Player #' + Math.floor(Math.random() * 9999),
                twitterHandle: twitterHandle ? `@${twitterHandle}` : null,
                picks: this.userPicks,
                tiebreakerRuns: tiebreakerRuns,
                entryFee: 50,
                contestDay: this.formatDate(this.contestDays[this.currentDay].date),
                timestamp: new Date().toISOString(),
                totalGames: this.selectedGames.length,
                games: Object.keys(this.userPicks).map(gameId => ({
                    gameId: gameId,
                    pickedTeam: this.userPicks[gameId],
                    result: null, // win, loss, or pending
                    actualWinner: null
                }))
            };
            
            let result;
            
            // Show payment QR code
            console.log('💳 Creating payment QR code...');
            const paymentResult = await window.xamanPayment.createContestPayment();
            
            if (paymentResult && paymentResult.success) {
                console.log('✅ Payment successful!');
                contestEntry.transactionId = paymentResult.txid || paymentResult.txHash;
                contestEntry.paymentTxHash = paymentResult.txid || paymentResult.txHash; // Add this field for Firebase
                contestEntry.paymentTimestamp = paymentResult.timestamp || new Date().toISOString();
                
                // Try to store the entry - but don't fail if storage fails
                try {
                    if (this.integration) {
                        console.log('📝 Storing entry via integration...');
                        result = await this.integration.storeInFirebase(contestEntry);
                    } else if (this.backend) {
                        console.log('📝 Storing entry via backend...');
                        result = await this.backend.storeContestEntry(contestEntry);
                    } else {
                        console.log('📝 Storing entry locally...');
                        result = { success: true, entryId: 'LOCAL_' + Date.now() };
                    }
                } catch (storageError) {
                    console.error('⚠️ Storage failed but payment succeeded:', storageError);
                    // Payment succeeded, so we count this as a successful entry
                    result = { 
                        success: true, 
                        entryId: 'PAID_' + Date.now(),
                        txHash: paymentResult.txid || paymentResult.txHash,
                        storageError: true
                    };
                }
            } else {
                result = { success: false, error: 'Payment cancelled' };
            }
            
            if (!result.success) {
                throw new Error(result.error || 'Failed to process contest entry');
            }
            
            console.log('✅ Contest entry complete:', result.entryId);
                
            this.showSuccess(`✅ Contest entered successfully! Entry fee paid: 50 NUTS`);
            this.showSuccess(`📋 Entry ID: ${result.entryId}`);
            if (twitterHandle) {
                this.showSuccess(`🐦 Entered as ${contestEntry.twitterHandle}`);
            }
            this.showSuccess(`💰 Transaction: ${result.txHash ? result.txHash.substring(0, 16) + '...' : 'Recorded'}`);
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
            
            // Reload contest stats to show updated entry count and prize pool
            setTimeout(() => {
                this.loadContestStats();
            }, 1000);
            
            // Show redirect message
            setTimeout(() => {
                this.showSuccess('🏆 Redirecting to leaderboard...');
            }, 2000);
            
            // Redirect to contest results page after showing success messages
            setTimeout(() => {
                console.log('🏆 Redirecting to leaderboard...');
                const contestDate = this.formatDate(this.contestDays[this.currentDay].date);
                window.location.href = `contest-results.html?date=${contestDate}&entry=${result.entryId}`;
            }, 3000); // Give user time to see success messages
            
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
            
            // Use the production Xaman wallet connection
            if (window.xamanWallet) {
                console.log('🎨 Using Xaman production wallet connection...');
                const result = await window.xamanWallet.connect();
                
                if (result && result.account) {
                    console.log('✅ Wallet connected:', result.account);
                    // Update UI with wallet info
                    this.onWalletConnected({
                        user: {
                            account: result.account,
                            network: result.network || 'mainnet'
                        }
                    });
                }
            } else {
                throw new Error('Xaman wallet integration not loaded');
            }
            
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
    
    /**
     * Format date as YYYY-MM-DD
     */
    formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    
    async loadContestStats() {
        try {
            // Always use today's date for the contest stats, not the selected day
            const today = new Date();
            const todayFormatted = this.formatDate(today);
            const currentDate = this.formatDate(this.contestDays[this.currentDay].date);
            
            console.log(`📊 Loading contest stats - Today: ${todayFormatted}, Selected: ${currentDate}`);
            
            // Only show entries if viewing today's contest
            if (currentDate !== todayFormatted) {
                console.log('📅 Viewing future/past date - showing 0 entries');
                this.updateContestStats(0, 0);
                document.getElementById('prize-pool').textContent = '0 NUTS';
                document.getElementById('entry-count').textContent = '0';
                return;
            }
            
            if (this.backend) {
                console.log(`🔍 Backend type: Firebase enabled = ${this.backend.firebaseEnabled}`);
                console.log(`🔍 Looking for entries on date: ${todayFormatted}`);
                const entries = await this.backend.getContestEntries(todayFormatted);
                
                console.log(`📊 Raw entries returned (${entries.length}):`, entries);
                
                // Log each entry in detail
                entries.forEach((entry, index) => {
                    console.log(`📋 Entry ${index + 1}:`, {
                        id: entry.id,
                        userName: entry.userName,
                        contestDate: entry.contestDate,
                        contestDay: entry.contestDay,
                        timestamp: entry.timestamp,
                        transactionId: entry.transactionId,
                        walletAddress: entry.walletAddress,
                        contestStatus: entry.contestStatus,
                        status: entry.status
                    });
                });
                
                // Filter for active entries only (backward compatible - if no status, assume active)
                // Also filter out phantom entries missing required fields
                const activeEntries = entries.filter(entry => {
                    // Check if entry has required fields to be valid
                    // Only require userName - transactionId can be pending for demo/testing
                    const hasRequiredFields = entry.userName;
                    
                    // Check if entry is for today's contest based on contestDate field
                    let isForToday = true;
                    if (entry.contestDate) {
                        isForToday = entry.contestDate === todayFormatted;
                        console.log(`📅 Date comparison: entry.contestDate="${entry.contestDate}" vs todayFormatted="${todayFormatted}" = ${isForToday}`);
                    } else if (entry.contestDay) {
                        isForToday = entry.contestDay === todayFormatted;
                        console.log(`📅 Date comparison: entry.contestDay="${entry.contestDay}" vs todayFormatted="${todayFormatted}" = ${isForToday}`);
                    }
                    
                    // Check if active
                    const isActive = !entry.contestStatus || entry.contestStatus === 'active';
                    
                    // Additional validation - filter out test entries (but allow demo entries)
                    const isNotTest = !entry.id?.toLowerCase().includes('test');
                    
                    // Entry must have basic required fields and be for today's contest
                    const isValid = hasRequiredFields && isForToday && isActive && isNotTest;
                    
                    console.log(`Entry ${entry.id}: ` +
                        `contestStatus=${entry.contestStatus}, ` +
                        `hasReqFields=${hasRequiredFields}, ` +
                        `contestDate=${entry.contestDate}, ` +
                        `isForToday=${isForToday}, ` +
                        `isActive=${isActive}, ` +
                        `isNotTest=${isNotTest}, ` +
                        `isValid=${isValid}`);
                    
                    if (!isValid && entry.id) {
                        console.log(`🚫 Filtered out entry ${entry.id}: ${JSON.stringify({
                            userName: entry.userName,
                            contestDate: entry.contestDate,
                            transactionId: entry.transactionId ? 'present' : 'missing',
                            reason: !hasRequiredFields ? 'missing userName' :
                                   !isForToday ? 'not for today' :
                                   !isActive ? 'not active' :
                                   !isNotTest ? 'test entry' : 'unknown'
                        })}`);
                    }
                    
                    return isValid;
                });
                
                console.log(`📊 Found ${entries.length} total entries, ${activeEntries.length} active`);
                
                // Calculate stats
                const totalEntries = activeEntries.length;
                const prizePool = totalEntries * 50; // 50 NUTS per entry
                
                // Update the display
                this.updateContestStats(totalEntries, prizePool);
                
                // Also update the header stats
                document.getElementById('prize-pool').textContent = prizePool + ' NUTS';
                document.getElementById('entry-count').textContent = totalEntries;
            } else {
                // Show default values
                this.updateContestStats(0, 0);
                document.getElementById('prize-pool').textContent = '0 NUTS';
                document.getElementById('entry-count').textContent = '0';
            }
            
        } catch (error) {
            // Check if it's a permission error (expected for non-authenticated users)
            if (error.code === 'permission-denied' || error.message?.includes('permissions')) {
                console.log('📊 Contest stats require authentication - showing defaults');
            } else {
                console.error('❌ Failed to load contest stats:', error);
            }
            // Show default values - this is normal for non-authenticated users
            this.updateContestStats(0, 0);
            document.getElementById('prize-pool').textContent = '0 NUTS';
            document.getElementById('entry-count').textContent = '0';
        }
    }
    
    updateContestStats(entries, prizePool) {
        // Only update the main header stats - remove redundant displays
        console.log(`📊 Updating contest stats: ${entries} entries, ${prizePool} NUTS prize pool`);
        
        // Remove any existing live stats banner to prevent duplicates
        const existingBanner = document.getElementById('live-stats-banner');
        if (existingBanner) {
            existingBanner.remove();
        }
        
        // The main header stats are updated in loadContestStats() directly
        // We don't need additional stats displays here
    }
}

// Utility function to clear contest data
window.clearContestData = function(date) {
    if (!date) {
        console.log('Usage: clearContestData("YYYY-MM-DD") or clearContestData("all")');
        return;
    }
    
    if (date === 'all') {
        // Clear all contest data
        const keys = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.startsWith('contest_entries_') || key.startsWith('entries_') || key === 'contest_entries')) {
                keys.push(key);
            }
        }
        
        keys.forEach(key => {
            console.log(`🗑️ Removing ${key}`);
            localStorage.removeItem(key);
        });
        
        console.log(`✅ Cleared all contest data (${keys.length} keys)`);
    } else {
        // Clear specific date
        const keys = [
            `contest_entries_${date}`,
            `entries_${date}`
        ];
        
        keys.forEach(key => {
            if (localStorage.getItem(key)) {
                console.log(`🗑️ Removing ${key}`);
                localStorage.removeItem(key);
            }
        });
        
        console.log(`✅ Cleared contest data for ${date}`);
    }
    
    // Reload stats if on contest page
    if (window.dailyContestManager) {
        window.dailyContestManager.loadContestStats();
    }
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM Content Loaded');
    console.log('💡 Tip: Use clearContestData("YYYY-MM-DD") or clearContestData("all") to clear old contest entries');
    
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
