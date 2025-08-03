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
            // First try admin-selected games, then fallback to ALL available games
            let games = this.loadAdminSelectedGamesForDay(contestDay.dateString);
            
            if (!games || games.length === 0) {
                // Load ALL available games for this day - no restrictions
                games = await this.loadMLBGamesForDay(contestDay.date);
                console.log(`🎮 Loaded ${games?.length || 0} available games (no admin selection)`);
            } else {
                console.log(`👨‍💼 Using ${games.length} admin-selected games`);
            }
            
            if (games && games.length > 0) {
                console.log(`✅ Found ${games.length} games for ${contestDay.dateString}`);
                this.availableGames = games;
                this.selectedGames = games;  // Show all available games
                contestDay.games = games;
                
                // Calculate contest deadline (30 min before first game)
                this.calculateContestDeadline(games);
            } else {
                // No games found for this date
                console.log(`📅 No games scheduled for ${contestDay.dateString}`);
                this.availableGames = [];
                this.selectedGames = [];
                contestDay.games = [];
            }

            contestDay.isLoaded = true;
            this.updateTabIndicators();
            
            // Update UI to show the games
            this.displayGames();
            
        } catch (error) {
            console.error(`❌ Error loading games for day ${dayIndex}:`, error);
            // No games on error
            this.availableGames = [];
            this.selectedGames = [];
            contestDay.games = [];
            contestDay.isLoaded = true;
            this.updateTabIndicators();
            this.displayGames();
        }
    }

    loadAdminSelectedGamesForDay(dateString) {
        // Firebase-only mode: no localStorage fallback for admin-selected games
        // This allows the system to use live MLB API data instead
        console.log(`ℹ️ Firebase-only mode: using live MLB API data for ${dateString}`);
        return null;
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

        // Entry button
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
        // This function no longer overrides real database stats
        // The real stats are handled by loadContestStats()
        console.log('📊 updateContestInfo called - real stats are loaded by loadContestStats()');
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
            const currentDate = this.contestDays[this.currentDay]?.date;
            const isToday = currentDate && currentDate.toDateString() === new Date().toDateString();
            
            gamesContainer.innerHTML = `
                <div class="no-games" style="
                    text-align: center; 
                    padding: 40px; 
                    background: #1a1a1a; 
                    border-radius: 10px; 
                    border: 2px dashed #333;
                    color: #888;
                ">
                    <div style="font-size: 3em; margin-bottom: 20px;">�</div>
                    <h3 style="color: #ffa500; margin-bottom: 15px;">No Games Available</h3>
                    <p style="margin-bottom: 20px;">
                        ${isToday ? 
                            'No games are scheduled for today.' : 
                            `No games are scheduled for ${currentDate ? currentDate.toDateString() : 'this date'}.`
                        }
                    </p>
                    <div style="margin-top: 20px;">
                        <button onclick="window.dailyContest.loadContestForDay(${this.currentDay})" style="
                            background: #4CAF50;
                            color: white;
                            border: none;
                            padding: 12px 24px;
                            border-radius: 6px;
                            cursor: pointer;
                            margin: 5px;
                        ">🔄 Refresh Games</button>
                        ${isToday ? `
                            <br><br>
                            <p style="color: #666; font-size: 0.9em;">
                                Admins can manually select games via the 
                                <a href="admin-contest.html" style="color: #ffa500;">Admin Portal</a>
                            </p>
                        ` : ''}
                    </div>
                </div>
            `;
            return;
        }

        console.log(`🎮 Displaying ${currentDayGames.length} games for day ${this.currentDay}`);
        
        // Check if these are admin-selected or auto-loaded games
        const adminSelectedGames = this.loadAdminSelectedGamesForDay(this.contestDays[this.currentDay].dateString);
        const isAdminSelected = adminSelectedGames && adminSelectedGames.length > 0;
        
        // Render all available games with game type indicator
        gamesContainer.innerHTML = `
            <div class="games-display-header" style="
                background: #1a1a1a; 
                padding: 20px; 
                border-radius: 8px; 
                margin-bottom: 20px;
                border: 1px solid #333;
                text-align: center;
            ">
                <h3 style="color: #4CAF50; margin-bottom: 10px;">
                    📅 ${this.contestDays[this.currentDay].dateString}
                </h3>
                <p style="color: #ccc; margin: 0;">
                    ${currentDayGames.length} games available - Pick your winners!
                </p>
                <div style="margin-top: 10px;">
                    ${isAdminSelected ? 
                        '<span style="background: #4CAF50; color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.8em;">👨‍💼 Admin Selected Games</span>' : 
                        '<span style="background: #2196F3; color: white; padding: 4px 8px; border-radius: 4px; font-size: 0.8em;">🤖 All Available Games</span>'
                    }
                </div>
                ${this.isContestClosed() ? `
                    <div style="
                        background: #ff4444; 
                        color: white; 
                        padding: 10px; 
                        border-radius: 6px; 
                        margin-top: 15px;
                        font-weight: bold;
                    ">
                        ⏰ Contest deadline has passed - No more picks allowed
                    </div>
                ` : ''}
            </div>
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
        
        // Update entry button state
        this.updateEntryButton();
        
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
        const isGameLocked = this.isGameLocked(game);
        
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
            <div class="game-card ${isGameLocked ? 'game-locked' : ''}" data-game-id="${game.id}" style="
                background: ${isGameLocked ? 'linear-gradient(135deg, #2a2a2a, #1a1a1a)' : 
                            (isPicked ? 'linear-gradient(135deg, #1a3d1a, #1e1e1e)' : '#1e1e1e')};
                border: 2px solid ${isGameLocked ? '#666' : (isPicked ? '#4CAF50' : '#333')};
                border-radius: 8px;
                padding: 12px;
                margin-bottom: 8px;
                transition: all 0.2s ease;
                box-shadow: ${isPicked ? '0 2px 8px rgba(76, 175, 80, 0.3)' : 'none'};
                display: flex;
                align-items: center;
                gap: 12px;
                opacity: ${isGameLocked ? '0.7' : '1'};
            ">
                <!-- Game Time -->
                <div class="game-time" style="
                    color: ${isGameLocked ? '#ff6b6b' : '#ffa500'};
                    font-size: 0.8em;
                    min-width: 55px;
                    text-align: center;
                    flex-shrink: 0;
                    font-weight: 600;
                ">${isGameLocked ? 'LOCKED' : timeStr}</div>
                
                <!-- Team Selection -->
                <div class="matchup" style="
                    flex: 1;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                ">
                    <!-- Away Team Button -->
                    <button class="team-btn ${pickedTeam === 'away' ? 'selected' : ''} ${isGameLocked ? 'locked' : ''}" 
                         data-team="away" 
                         data-game-id="${game.id}" 
                         ${isGameLocked ? 'disabled' : ''}
                         style="
                        flex: 1;
                        background: ${pickedTeam === 'away' ? '#4CAF50' : (isGameLocked ? '#333' : '#2a2a2a')};
                        color: ${pickedTeam === 'away' ? '#000' : (isGameLocked ? '#888' : '#fff')};
                        border: 2px solid ${pickedTeam === 'away' ? '#4CAF50' : (isGameLocked ? '#666' : '#444')};
                        border-radius: 6px;
                        padding: 10px;
                        cursor: ${isGameLocked ? 'not-allowed' : 'pointer'};
                        transition: all 0.2s ease;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        font-family: inherit;
                        position: relative;
                        min-height: 50px;
                    " 
                    ${!isGameLocked ? `onmouseover="if(!this.classList.contains('selected')) { this.style.borderColor='#666'; this.style.background='#333'; }"
                    onmouseout="if(!this.classList.contains('selected')) { this.style.borderColor='#444'; this.style.background='#2a2a2a'; }"` : ''}>
                        <span style="font-weight: bold; font-size: 1.1em;">${awayAbbr || 'AWAY'}</span>
                        <span style="font-size: 0.75em; opacity: 0.8; margin-top: 2px;">${game.awayOdds || '+100'}</span>
                        ${pickedTeam === 'away' ? '<div style="position: absolute; top: 2px; right: 2px; font-size: 0.7em;">✓</div>' : ''}
                        ${isGameLocked ? '<div style="position: absolute; top: 2px; left: 2px; font-size: 0.7em; color: #ff6b6b;">🔒</div>' : ''}
                    </button>
                    
                    <!-- VS Separator -->
                    <div style="
                        display: flex;
                        align-items: center;
                        padding: 0 10px;
                        color: ${isGameLocked ? '#666' : '#888'};
                        font-size: 0.9em;
                        font-weight: bold;
                    ">VS</div>
                    
                    <!-- Home Team Button -->
                    <button class="team-btn ${pickedTeam === 'home' ? 'selected' : ''} ${isGameLocked ? 'locked' : ''}" 
                         data-team="home" 
                         data-game-id="${game.id}" 
                         ${isGameLocked ? 'disabled' : ''}
                         style="
                        flex: 1;
                        background: ${pickedTeam === 'home' ? '#4CAF50' : (isGameLocked ? '#333' : '#2a2a2a')};
                        color: ${pickedTeam === 'home' ? '#000' : (isGameLocked ? '#888' : '#fff')};
                        border: 2px solid ${pickedTeam === 'home' ? '#4CAF50' : (isGameLocked ? '#666' : '#444')};
                        border-radius: 6px;
                        padding: 10px;
                        cursor: ${isGameLocked ? 'not-allowed' : 'pointer'};
                        transition: all 0.2s ease;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        font-family: inherit;
                        position: relative;
                        min-height: 50px;
                    "
                    ${!isGameLocked ? `onmouseover="if(!this.classList.contains('selected')) { this.style.borderColor='#666'; this.style.background='#333'; }"
                    onmouseout="if(!this.classList.contains('selected')) { this.style.borderColor='#444'; this.style.background='#2a2a2a'; }"` : ''}>
                        <span style="font-weight: bold; font-size: 1.1em;">${homeAbbr || 'HOME'}</span>
                        <span style="font-size: 0.75em; opacity: 0.8; margin-top: 2px;">${game.homeOdds || '-120'}</span>
                        ${pickedTeam === 'home' ? '<div style="position: absolute; top: 2px; right: 2px; font-size: 0.7em;">✓</div>' : ''}
                        ${isGameLocked ? '<div style="position: absolute; top: 2px; left: 2px; font-size: 0.7em; color: #ff6b6b;">🔒</div>' : ''}
                    </button>
                </div>
                
                <!-- Clear Pick Button or Lock Status -->
                ${isGameLocked ? `
                    <div style="
                        background: #ff6b6b;
                        color: white;
                        border: none;
                        border-radius: 6px;
                        padding: 8px 14px;
                        font-size: 0.8em;
                        font-weight: 500;
                        flex-shrink: 0;
                        opacity: 0.8;
                    ">
                        🔒 Started
                    </div>
                ` : (isPicked ? `
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
                ` : '')}
            </div>
        `;
    }

    setupGameEventListeners() {
        // Handle clicks on team buttons
        document.querySelectorAll('.team-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const gameId = button.dataset.gameId;
                const team = button.dataset.team;
                
                // Find the game to check if it's locked
                const game = this.selectedGames.find(g => g.id === gameId);
                if (!game) {
                    console.error('Game not found:', gameId);
                    return;
                }
                
                // Check if this specific game is locked (started)
                if (this.isGameLocked(game)) {
                    this.showError('This game has already started. Picks are locked for this game.');
                    return;
                }
                
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
                
                // Find the game to check if it's locked
                const game = this.selectedGames.find(g => g.id === gameId);
                if (!game) {
                    console.error('Game not found:', gameId);
                    return;
                }
                
                // Check if this specific game is locked (started)
                if (this.isGameLocked(game)) {
                    this.showError('This game has already started. No changes allowed.');
                    return;
                }
                
                // Add haptic feedback for mobile
                if ('vibrate' in navigator) {
                    navigator.vibrate(10);
                }
                
                delete this.userPicks[gameId];
                this.displayGames();
                this.updateEntryButton();
            });
        });
    }

    calculateContestDeadline(games) {
        if (!games || games.length === 0) return null;
        
        const now = new Date();
        
        // Find games that haven't started yet
        const upcomingGames = games.filter(game => {
            const gameTime = new Date(game.gameTime);
            return now <= gameTime;
        });
        
        // Check if MLB API reported games in progress
        if (games.hasGamesInProgress) {
            console.log('🚨 MLB API reports games in progress');
        }
        
        // Log all games and their status
        console.log('🔍 Checking all games for start times:');
        games.forEach((game, index) => {
            const gameTime = new Date(game.gameTime);
            const started = now > gameTime;
            console.log(`Game ${index + 1}: ${game.awayTeam} @ ${game.homeTeam} - ${gameTime.toLocaleString()} (Started: ${started})`);
        });
        
        // For multi-day contests, only set deadline if ALL games for current day have started
        // But individual games will be locked based on their own start time
        if (upcomingGames.length > 0) {
            const earliestUpcomingGame = upcomingGames.reduce((earliest, game) => {
                const gameTime = new Date(game.gameTime);
                const earlyTime = new Date(earliest.gameTime);
                return gameTime < earlyTime ? game : earliest;
            });
            
            this.contestDeadline = new Date(earliestUpcomingGame.gameTime);
            console.log(`✅ ${upcomingGames.length} games still available. Next deadline: ${this.contestDeadline.toLocaleString()}`);
        } else {
            // All games for today have started - but user can still pick for future days
            console.log('ℹ️ All games for today have started - but future days remain available');
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(8, 0, 0, 0); // Set to 8 AM tomorrow
            this.contestDeadline = tomorrow;
        }
        
        // Trigger immediate time update in HTML
        if (typeof updateTimeRemaining === 'function') {
            updateTimeRemaining();
        }
        
        return this.contestDeadline;
    }

    isContestClosed() {
        // For multi-day contests, never fully close - just lock individual games
        return false;
    }

    isGameStarted(game) {
        if (!game || !game.gameTime) return false;
        const now = new Date();
        const gameTime = new Date(game.gameTime);
        return now > gameTime;
    }

    isGameLocked(game) {
        // Individual games are locked once they start
        return this.isGameStarted(game);
    }

    updateContestClosedUI() {
        // For multi-day contests, we don't close the entire UI
        // Individual games are locked when they start, but the contest remains open
        console.log('ℹ️ Multi-day contest - individual games lock when they start');
        
        // Count locked games for information
        const lockedGames = this.selectedGames.filter(game => this.isGameLocked(game));
        const totalGames = this.selectedGames.length;
        
        if (lockedGames.length > 0) {
            console.log(`🔒 ${lockedGames.length}/${totalGames} games are locked (started)`);
        }
    }

    makePickForGame(gameId, team) {
        // Find the game to check if it's locked
        const game = this.selectedGames.find(g => g.id === gameId);
        if (!game) {
            console.error('Game not found:', gameId);
            return;
        }
        
        // Check if this specific game is locked (started)
        if (this.isGameLocked(game)) {
            console.log('🚫 Cannot make pick - game has started');
            return;
        }
        
        // Store the pick
        this.userPicks[gameId] = team;
        
        console.log(`✅ Pick made: Game ${gameId} -> ${team}`);
        
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
            
            <div class="entry-info" style="margin-top: 10px; font-size: 0.8em; color: #666; text-align: center;">
                💰 Entry fee: 50 $NUTS • 🏆 Top 3 win (50%/30%/20%)
                <br>
                <span style="color: #ffa500; font-weight: bold;">🔗 Wallet connection required for contest entry</span>
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
        const unlockedGames = this.selectedGames.filter(game => !this.isGameLocked(game));
        const lockedGames = this.selectedGames.filter(game => this.isGameLocked(game));
        
        // Check if user has picks for all unlocked games
        const unlockedGameIds = unlockedGames.map(g => g.id);
        const picksForUnlockedGames = Object.keys(this.userPicks).filter(gameId => 
            unlockedGameIds.includes(gameId)
        );
        
        if (entryButton) {
            const isComplete = picksForUnlockedGames.length === unlockedGames.length && unlockedGames.length > 0;
            const canSubmit = unlockedGames.length > 0;
            
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
            
            if (!canSubmit) {
                // No unlocked games available
                entryButton.style.background = '#ff4444';
                entryButton.style.color = '#fff';
                entryButton.style.cursor = 'not-allowed';
                entryButton.style.boxShadow = 'none';
                entryButton.textContent = 'All Games Started - Try Another Day!';
            } else {
                // Some unlocked games available
                entryButton.style.background = isComplete ? 
                    'linear-gradient(135deg, #4CAF50, #00ff88)' : '#555';
                entryButton.style.color = isComplete ? '#000' : '#888';
                entryButton.style.cursor = isComplete ? 'pointer' : 'not-allowed';
                entryButton.style.boxShadow = isComplete ? 
                    '0 0 20px rgba(76, 175, 80, 0.3)' : 'none';
                
                const remainingPicks = unlockedGames.length - picksForUnlockedGames.length;
                
                entryButton.textContent = isComplete ? 
                    `🎯 Enter Contest (50 $NUTS) - ${unlockedGames.length} games` : 
                    `Make All Available Picks (${remainingPicks} remaining)`;
            }
            
            // Update progress bar
            if (progressBar) {
                const progress = unlockedGames.length > 0 ? 
                    (picksForUnlockedGames.length / unlockedGames.length) * 100 : 0;
                progressBar.style.width = `${progress}%`;
            }
            
            // Update picks count
            if (picksCountSpan) {
                const statusText = lockedGames.length > 0 ? 
                    `${picksForUnlockedGames.length}/${unlockedGames.length} available (${lockedGames.length} started)` :
                    `${picksForUnlockedGames.length}/${unlockedGames.length}`;
                picksCountSpan.textContent = statusText;
            }
        }
    }    async handleContestEntry() {
        console.log('🚀 handleContestEntry called!');
        console.log('🎯 Current picks:', this.userPicks);
        
        try {
            const picksCount = Object.keys(this.userPicks).length;
            const unlockedGames = this.selectedGames.filter(game => !this.isGameLocked(game));
            const lockedGames = this.selectedGames.filter(game => this.isGameLocked(game));
            
            console.log('📊 Games status:', {
                totalGames: this.selectedGames.length,
                unlockedGames: unlockedGames.length,
                lockedGames: lockedGames.length,
                picksCount: picksCount
            });
            
            // Check if user has picks for all unlocked games
            const unlockedGameIds = unlockedGames.map(g => g.id);
            const picksForUnlockedGames = Object.keys(this.userPicks).filter(gameId => 
                unlockedGameIds.includes(gameId)
            );
            
            if (picksForUnlockedGames.length !== unlockedGames.length) {
                const missingCount = unlockedGames.length - picksForUnlockedGames.length;
                this.showError(`Please make picks for all ${unlockedGames.length} available games. You're missing ${missingCount} pick${missingCount !== 1 ? 's' : ''}.`);
                return;
            }
            
            // If there are no unlocked games, don't allow entry
            if (unlockedGames.length === 0) {
                this.showError('All games have started. No new entries allowed for today. Try another day!');
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
            
            // Prepare contest entry data - only include picks for unlocked games
            const validPicks = {};
            const validGames = [];
            
            unlockedGames.forEach(game => {
                if (this.userPicks[game.id]) {
                    validPicks[game.id] = this.userPicks[game.id];
                    validGames.push({
                        gameId: game.id,
                        pickedTeam: this.userPicks[game.id],
                        result: null, // win, loss, or pending
                        actualWinner: null,
                        gameTime: game.gameTime,
                        awayTeam: game.awayTeam,
                        homeTeam: game.homeTeam
                    });
                }
            });
            
            const contestEntry = {
                userId: 'USER_' + Date.now(),
                userName: twitterHandle ? `@${twitterHandle}` : 'Player #' + Math.floor(Math.random() * 9999),
                twitterHandle: twitterHandle ? `@${twitterHandle}` : null,
                sport: 'mlb', // Required for Firebase filtering
                picks: validPicks,
                tiebreakerRuns: tiebreakerRuns,
                entryFee: 50,
                contestDay: this.formatDate(this.contestDays[this.currentDay].date),
                timestamp: new Date().toISOString(),
                totalGames: unlockedGames.length, // Only count unlocked games
                availableGames: this.selectedGames.length, // Track total games for context
                lockedGames: lockedGames.length, // Track how many were locked
                games: validGames
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
                    if (this.backend && this.backend.createContestEntry) {
                        console.log('📝 Storing entry via production backend...');
                        result = await this.backend.createContestEntry(contestEntry);
                    } else if (this.integration) {
                        console.log('📝 Storing entry via integration...');
                        result = await this.integration.storeInFirebase(contestEntry);
                    } else if (this.backend && this.backend.storeContestEntry) {
                        console.log('📝 Storing entry via local backend...');
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
            
            // Load entries for the selected date (not just today)
            console.log(`📅 Loading entries for selected date: ${currentDate}`);
            
            if (this.backend) {
                console.log(`🔍 Backend type: Firebase enabled = ${this.backend.firebaseEnabled}`);
                console.log(`🔍 Looking for entries on date: ${currentDate}`);
                const entries = await this.backend.getContestEntries(currentDate);
                
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
                    
                    // Check if entry is for the selected contest date
                    let isForSelectedDate = true;
                    if (entry.contestDate) {
                        isForSelectedDate = entry.contestDate === currentDate;
                        console.log(`📅 Date comparison: entry.contestDate="${entry.contestDate}" vs currentDate="${currentDate}" = ${isForSelectedDate}`);
                    } else if (entry.contestDay) {
                        isForSelectedDate = entry.contestDay === currentDate;
                        console.log(`📅 Date comparison: entry.contestDay="${entry.contestDay}" vs currentDate="${currentDate}" = ${isForSelectedDate}`);
                    }
                    
                    // Check if active
                    const isActive = !entry.contestStatus || entry.contestStatus === 'active';
                    
                    // Additional validation - filter out test entries (but allow demo entries)
                    const isNotTest = !entry.id?.toLowerCase().includes('test');
                    
                    // Entry must have basic required fields and be for the selected contest date
                    const isValid = hasRequiredFields && isForSelectedDate && isActive && isNotTest;
                    
                    console.log(`Entry ${entry.id}: ` +
                        `contestStatus=${entry.contestStatus}, ` +
                        `hasReqFields=${hasRequiredFields}, ` +
                        `contestDate=${entry.contestDate}, ` +
                        `isForSelectedDate=${isForSelectedDate}, ` +
                        `isActive=${isActive}, ` +
                        `isNotTest=${isNotTest}, ` +
                        `isValid=${isValid}`);
                    
                    if (!isValid && entry.id) {
                        console.log(`🚫 Filtered out entry ${entry.id}: ${JSON.stringify({
                            userName: entry.userName,
                            contestDate: entry.contestDate,
                            transactionId: entry.transactionId ? 'present' : 'missing',
                            reason: !hasRequiredFields ? 'missing userName' :
                                   !isForSelectedDate ? 'not for selected date' :
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
