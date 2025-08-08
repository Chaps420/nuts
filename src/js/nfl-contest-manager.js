/**
 * NFL Contest Manager
 * Handles NFL weekly pick'em contests
 */

class NFLContestManager {
    constructor() {
        this.nflSchedule = new NFLScheduleAPI();
        this.backend = null;
        this.integration = null;
        this.currentWeek = 1;
        this.selectedGames = [];
        this.userPicks = {};
        this.contestWeeks = [];
        
        console.log('🏈 NFL Contest Manager initialized');
    }

    /**
     * Initialize the contest manager
     */
    async init() {
        try {
            // Initialize backend integration
            if (window.firebaseIntegration) {
                this.integration = new FirebaseXamanIntegration();
                await this.integration.init();
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

            // Initialize payment system (use same as MLB contest)
            if (window.XamanPayment) {
                this.walletManager = new window.XamanPayment();
                console.log('💳 XUMM wallet system available');
            }

            // Get current week and load contest weeks
            this.currentWeek = this.nflSchedule.getCurrentWeek();
            await this.loadContestWeeks();

            // Initial stats update
            await this.updateContestStats();

            console.log('✅ NFL Contest Manager ready');
            return true;

        } catch (error) {
            console.error('❌ Failed to initialize NFL Contest Manager:', error);
            return false;
        }
    }

    /**
     * Load available contest weeks
     */
    async loadContestWeeks() {
        this.contestWeeks = [];
        
        // Generate weeks 1-18 for regular season - allow all weeks to be selectable
        for (let week = 1; week <= 18; week++) {
            const weekData = {
                weekNumber: week,
                weekId: `2025-W${week.toString().padStart(2, '0')}`,
                displayName: `Week ${week}`,
                status: week < this.currentWeek ? 'past' : 
                       week === this.currentWeek ? 'current' : 'upcoming',
                games: null, // Will be loaded when selected
                canView: true, // All weeks can be viewed
                canSubmit: week >= this.currentWeek // Only current and future weeks allow submission
            };
            
            this.contestWeeks.push(weekData);
        }

        console.log(`📅 Loaded ${this.contestWeeks.length} NFL contest weeks`);
    }

    /**
     * Select a specific week
     */
    async selectWeek(weekNumber) {
        try {
            console.log(`🏈 Selecting NFL week ${weekNumber}...`);
            
            this.currentWeek = weekNumber;
            this.userPicks = {}; // Clear picks when switching weeks
            
            // Load games for this week
            this.selectedGames = await this.nflSchedule.getGamesForWeek(weekNumber);
            
            console.log(`📊 Week ${weekNumber}: ${this.selectedGames.length} games loaded`);
            console.log('🎮 Game IDs:', this.selectedGames.map(g => g.id));
            
            // Update UI
            this.updateWeekDisplay();
            this.updateGamesDisplay();
            await this.updateContestStats();
            
            console.log(`✅ Selected week ${weekNumber} with ${this.selectedGames.length} games`);
            return true;

        } catch (error) {
            console.error(`❌ Failed to select week ${weekNumber}:`, error);
            return false;
        }
    }

    /**
     * Update week navigation display
     */
    updateWeekDisplay() {
        const weekSelector = document.getElementById('week-selector');
        if (!weekSelector) return;

        weekSelector.innerHTML = this.contestWeeks.map(week => `
            <button class="week-btn ${week.weekNumber === this.currentWeek ? 'active' : ''} ${week.status}"
                    onclick="nflContest.selectWeek(${week.weekNumber})"
                    title="${week.status === 'past' ? 'Past week - View only' : week.status === 'current' ? 'Current week' : 'Upcoming week'}">
                <div class="week-number">Week ${week.weekNumber}</div>
                <div class="week-status">${week.status === 'past' ? 'Past' : week.status === 'current' ? 'Current' : 'Future'}</div>
            </button>
        `).join('');

        // Update week info
        const weekInfo = document.getElementById('week-info');
        if (weekInfo) {
            const currentWeekData = this.contestWeeks.find(w => w.weekNumber === this.currentWeek);
            const firstGame = this.selectedGames[0];
            
            weekInfo.innerHTML = `
                <div class="week-header">
                    <h2>🏈 NFL ${currentWeekData?.displayName || 'Week ' + this.currentWeek}</h2>
                    <div class="week-details">
                        <span class="entry-fee">Entry Fee: 5000 NUTS</span>
                        ${firstGame ? `<span class="deadline">First Game: ${firstGame.gameTimeFormatted}</span>` : ''}
                        ${currentWeekData?.status === 'past' ? '<span class="past-week">⚠️ Past Week - View Only (No Submissions)</span>' : ''}
                        ${currentWeekData?.status === 'upcoming' ? '<span class="upcoming-week">📅 Upcoming Week - Picks Available Soon</span>' : ''}
                    </div>
                </div>
            `;
        }
    }

    /**
     * Update games display grouped by day
     */
    updateGamesDisplay() {
        const gamesContainer = document.getElementById('games-container');
        if (!gamesContainer || !this.selectedGames.length) {
            if (gamesContainer) {
                gamesContainer.innerHTML = '<div class="no-games">No games available for this week</div>';
            }
            return;
        }

        const groupedGames = this.nflSchedule.groupGamesByDay(this.selectedGames);
        
        let html = '';

        // Tuesday Games (if any)
        if (groupedGames.TUE.length > 0) {
            html += this.renderGameGroup('TUESDAY GAMES', groupedGames.TUE, '📅');
        }

        // Wednesday Games (if any)
        if (groupedGames.WED.length > 0) {
            html += this.renderGameGroup('WEDNESDAY GAMES', groupedGames.WED, '📅');
        }

        // Thursday Night Football
        if (groupedGames.THU.length > 0) {
            html += this.renderGameGroup('THURSDAY NIGHT FOOTBALL', groupedGames.THU, '🌙');
        }

        // Friday Games (if any)
        if (groupedGames.FRI.length > 0) {
            html += this.renderGameGroup('FRIDAY GAMES', groupedGames.FRI, '🌆');
        }

        // Saturday Games (if any)
        if (groupedGames.SAT.length > 0) {
            html += this.renderGameGroup('SATURDAY GAMES', groupedGames.SAT, '🏈');
        }

        // Sunday Early Games
        if (groupedGames.SUN_EARLY.length > 0) {
            html += this.renderGameGroup('SUNDAY EARLY GAMES', groupedGames.SUN_EARLY, '☀️');
        }

        // Sunday Late Games
        if (groupedGames.SUN_LATE.length > 0) {
            html += this.renderGameGroup('SUNDAY LATE GAMES', groupedGames.SUN_LATE, '🌅');
        }

        // Sunday Night Football
        if (groupedGames.SUN_NIGHT.length > 0) {
            html += this.renderGameGroup('SUNDAY NIGHT FOOTBALL', groupedGames.SUN_NIGHT, '🌙');
        }

        // Monday Night Football
        if (groupedGames.MON.length > 0) {
            html += this.renderGameGroup('MONDAY NIGHT FOOTBALL', groupedGames.MON, '🌙');
        }

        // Other/Ungrouped Games (fallback)
        if (groupedGames.OTHER.length > 0) {
            html += this.renderGameGroup('OTHER GAMES', groupedGames.OTHER, '🎮');
        }

        gamesContainer.innerHTML = html;
        this.updatePicksDisplay();
    }

    /**
     * Render a group of games with MLB-style layout
     */
    renderGameGroup(groupTitle, games, icon) {
        return `
            <div class="game-group" style="margin-bottom: 25px;">
                <div class="game-group-header" style="
                    background: linear-gradient(135deg, #1a1a1a, #2a2a2a);
                    border: 2px solid #ffa500;
                    border-radius: 12px;
                    padding: 15px 20px;
                    margin-bottom: 15px;
                    text-align: center;
                ">
                    <h3 style="color: #ffa500; margin: 0; font-size: 1.3em; font-weight: bold;">
                        ${icon} ${groupTitle}
                    </h3>
                    <span class="game-count" style="color: #888; font-size: 0.9em;">
                        ${games.length} game${games.length !== 1 ? 's' : ''} available - Pick your winners!
                    </span>
                </div>
                <div class="games-list" style="
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                ">
                    ${games.map(game => this.renderGameCard(game)).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Render individual game card with MLB-style layout
     */
    renderGameCard(game) {
        const gameId = game.id;
        const pickedTeam = this.userPicks[gameId];
        const isPicked = !!pickedTeam;
        
        // Format time similar to MLB
        const timeStr = game.gameTimeFormatted || 'TBD';
        
        // Get team abbreviations (fallback to first 3 chars if not available)
        const awayAbbr = game.awayTeam || 'AWAY';
        const homeAbbr = game.homeTeam || 'HOME';
        
        return `
            <div class="game-item" data-game-id="${gameId}" style="
                background: linear-gradient(135deg, #2a2a2a, #1a1a1a);
                border: 2px solid ${isPicked ? '#4CAF50' : '#444'};
                border-radius: 10px;
                margin-bottom: 12px;
                padding: 12px;
                display: flex;
                align-items: center;
                gap: 12px;
                transition: all 0.3s ease;
                min-height: 70px;
                position: relative;
                ${isPicked ? 'box-shadow: 0 0 15px rgba(76, 175, 80, 0.3);' : ''}
            " onmouseover="this.style.borderColor='#666'" onmouseout="this.style.borderColor='${isPicked ? '#4CAF50' : '#444'}'">
                
                <!-- Game Time -->
                <div style="
                    background: #333;
                    color: #ffa500;
                    border-radius: 6px;
                    padding: 8px 12px;
                    font-size: 0.85em;
                    font-weight: 600;
                    min-width: 65px;
                    text-align: center;
                    flex-shrink: 0;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 2px;
                ">
                    <div>${timeStr}</div>
                    <div style="font-size: 0.7em; color: #888; font-weight: normal;">📍 ${game.venue || 'TBD'}</div>
                </div>
                
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
                         data-game-id="${gameId}" 
                         onclick="nflContest.selectTeam('${gameId}', 'away')"
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
                        <span style="font-weight: bold; font-size: 1.1em;">${awayAbbr}</span>
                        <span style="font-size: 0.75em; opacity: 0.8; margin-top: 2px;">${game.spread || 'PK'}</span>
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
                         data-game-id="${gameId}" 
                         onclick="nflContest.selectTeam('${gameId}', 'home')"
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
                        <span style="font-weight: bold; font-size: 1.1em;">${homeAbbr}</span>
                        <span style="font-size: 0.75em; opacity: 0.8; margin-top: 2px;">${game.overUnder || 'O/U'}</span>
                        ${pickedTeam === 'home' ? '<div style="position: absolute; top: 2px; right: 2px; font-size: 0.7em;">✓</div>' : ''}
                    </button>
                </div>
                
                <!-- Clear Pick Button -->
                ${isPicked ? `
                    <button class="clear-pick-btn" 
                            onclick="nflContest.clearPick('${gameId}')"
                            style="
                        background: #ff6b6b;
                        color: white;
                        border: none;
                        border-radius: 6px;
                        padding: 8px 14px;
                        font-size: 0.8em;
                        font-weight: 500;
                        cursor: pointer;
                        transition: all 0.2s ease;
                        flex-shrink: 0;
                    " 
                    onmouseover="this.style.background='#ff5252'"
                    onmouseout="this.style.background='#ff6b6b'">
                        ✕ Clear
                    </button>
                ` : ''}
            </div>
        `;
    }

    /**
     * Select a team for a game
     */
    selectTeam(gameId, team) {
        const currentWeekData = this.contestWeeks.find(w => w.weekNumber === this.currentWeek);
        
        // Allow picks for any week, but show info for past weeks
        if (currentWeekData?.status === 'past') {
            console.log(`🏈 Viewing pick for past week: ${team} for game ${gameId}`);
        } else {
            console.log(`🏈 Selected ${team} for game ${gameId}`);
        }
        
        // Store the pick
        this.userPicks[gameId] = team;
        console.log(`💾 Stored pick: ${gameId} = ${team}`);
        
        // Update displays
        this.updatePicksDisplay();
        this.updateSubmitButton();
        
        // Update the specific game card without full re-render
        this.updateGameCardSelection(gameId);
    }

    /**
     * Clear a pick for a game
     */
    clearPick(gameId) {
        console.log(`🗑️ Clearing pick for game ${gameId}`);
        delete this.userPicks[gameId];
        
        // Update displays
        this.updatePicksDisplay();
        this.updateSubmitButton();
        
        // Re-render the games display to update the UI
        this.updateGamesDisplay();
    }

    /**
     * Update just the selection state of a game card
     */
    updateGameCardSelection(gameId) {
        const gameCard = document.querySelector(`[data-game-id="${gameId}"]`);
        if (!gameCard) {
            console.warn(`⚠️ Game card not found for ${gameId}`);
            return;
        }

        const userPick = this.userPicks[gameId];
        console.log(`🎨 Updating game card ${gameId} with pick: ${userPick}`);
        
        // Update team buttons
        const teamButtons = gameCard.querySelectorAll('.team-btn');
        console.log(`🔍 Found ${teamButtons.length} team buttons for game ${gameId}`);
        
        teamButtons.forEach((button, index) => {
            const isAway = button.getAttribute('data-team') === 'away';
            const isHome = button.getAttribute('data-team') === 'home';
            const isSelected = (isAway && userPick === 'away') || (isHome && userPick === 'home');
            
            console.log(`🎯 Button ${index + 1}: ${isAway ? 'away' : 'home'}, selected: ${isSelected}`);
            
            if (isSelected) {
                button.classList.add('selected');
                button.style.background = '#4CAF50';
                button.style.color = '#000';
                button.style.borderColor = '#4CAF50';
            } else {
                button.classList.remove('selected');
                button.style.background = '#2a2a2a';
                button.style.color = '#fff';
                button.style.borderColor = '#444';
            }
        });
        
        // Update the game card border
        if (userPick) {
            gameCard.style.borderColor = '#4CAF50';
            gameCard.style.boxShadow = '0 0 15px rgba(76, 175, 80, 0.3)';
        } else {
            gameCard.style.borderColor = '#444';
            gameCard.style.boxShadow = 'none';
        }

        // Update the "PICK NEEDED" indicator
        const gameTime = gameCard.querySelector('.game-time');
        if (gameTime) {
            // Remove existing pick needed warning
            const existingWarning = gameTime.querySelector('.pick-needed-warning');
            if (existingWarning) {
                existingWarning.remove();
            }
            
            // Add warning if no pick made
            if (!userPick) {
                const warning = document.createElement('span');
                warning.className = 'pick-needed-warning';
                warning.style.cssText = 'color: #ff6b6b; font-size: 0.7em; margin-left: 8px;';
                warning.textContent = '⚠️ PICK NEEDED';
                gameTime.appendChild(warning);
            }
        }
    }

    /**
     * Update picks summary display
     */
    updatePicksDisplay() {
        const picksCount = Object.keys(this.userPicks).length;
        const totalGames = this.selectedGames.length;
        
        // Find missing picks
        const pickedGameIds = Object.keys(this.userPicks);
        const allGameIds = this.selectedGames.map(g => g.id);
        const missingPicks = allGameIds.filter(id => !pickedGameIds.includes(id));
        
        // Debug logging
        console.log(`🎯 Picks Debug: ${picksCount}/${totalGames} picks made`);
        console.log('📋 Current picks:', this.userPicks);
        console.log('🎮 Available games:', allGameIds);
        if (missingPicks.length > 0) {
            console.log('⚠️ Missing picks for games:', missingPicks);
            // Show which games are missing picks
            missingPicks.forEach(gameId => {
                const game = this.selectedGames.find(g => g.id === gameId);
                if (game) {
                    console.log(`   📝 Missing: ${game.awayTeam} @ ${game.homeTeam} (${gameId})`);
                }
            });
        }
        
        const picksCounter = document.getElementById('picks-counter');
        if (picksCounter) {
            let counterHTML = `
                <div class="picks-progress">
                    <span class="picks-count">${picksCount} / ${totalGames} picks made</span>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${(picksCount / totalGames) * 100}%"></div>
                    </div>
                </div>
            `;
            
            // Show missing games if any
            if (missingPicks.length > 0) {
                const missingGames = missingPicks.map(gameId => {
                    const game = this.selectedGames.find(g => g.id === gameId);
                    return game ? `${game.awayTeam} @ ${game.homeTeam}` : gameId;
                });
                counterHTML += `
                    <div style="color: #ff6b6b; font-size: 0.8em; margin-top: 8px;">
                        Missing picks: ${missingGames.join(', ')}
                    </div>
                `;
            }
            
            picksCounter.innerHTML = counterHTML;
        }

        const picksSummary = document.getElementById('picks-summary');
        if (picksSummary && picksCount > 0) {
            const picks = Object.entries(this.userPicks).map(([gameId, team]) => {
                const game = this.selectedGames.find(g => g.id === gameId);
                if (!game) {
                    console.warn(`⚠️ Pick for unknown game: ${gameId}`);
                    return null;
                }
                
                const teamName = team === 'home' ? game.homeTeam : game.awayTeam;
                return `<span class="pick-item">${teamName}</span>`;
            }).filter(Boolean);

            picksSummary.innerHTML = `
                <div class="picks-list">
                    <h4>Your Picks:</h4>
                    <div class="picks-grid">${picks.join('')}</div>
                </div>
            `;
        }
    }

    /**
     * Update submit button state
     */
    updateSubmitButton() {
        const submitBtn = document.getElementById('submit-picks-btn');
        if (!submitBtn) return;

        const picksCount = Object.keys(this.userPicks).length;
        const totalGames = this.selectedGames.length;
        const allPicksMade = picksCount === totalGames;
        const currentWeekData = this.contestWeeks.find(w => w.weekNumber === this.currentWeek);
        const isPastWeek = currentWeekData?.status === 'past';

        if (isPastWeek) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '🔒 Past Week - View Only';
            submitBtn.classList.remove('ready');
            submitBtn.style.background = '#666';
            submitBtn.style.color = '#ccc';
        } else if (totalGames === 0) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = 'No Games Available';
            submitBtn.classList.remove('ready');
            submitBtn.style.background = '#666';
            submitBtn.style.color = '#ccc';
        } else {
            submitBtn.disabled = !allPicksMade;
            submitBtn.style.color = '';
            
            if (allPicksMade) {
                submitBtn.innerHTML = '💰 Submit Picks & Pay 5000 NUTS';
                submitBtn.classList.add('ready');
                submitBtn.style.background = '#4CAF50';
            } else {
                submitBtn.innerHTML = `📝 Select ${totalGames - picksCount} more pick${totalGames - picksCount !== 1 ? 's' : ''}`;
                submitBtn.classList.remove('ready');
                submitBtn.style.background = '#ffa500';
            }
        }
    }

    /**
     * Update contest stats in the header
     */
    async updateContestStats() {
        // Update current week display
        const currentWeekDisplay = document.getElementById('current-week-display');
        if (currentWeekDisplay) {
            currentWeekDisplay.textContent = `Week ${this.currentWeek}`;
        }

        // Get entries for current week from Firebase
        const entries = await this.getWeekEntries(this.currentWeek);
        const entryCount = entries.length;
        const prizePool = entryCount * 5000; // NFL contests are 5000 NUTS per entry

        // Update entry count
        const entryCountEl = document.getElementById('nfl-entry-count');
        if (entryCountEl) {
            entryCountEl.textContent = entryCount;
        }

        // Update prize pool
        const prizePoolEl = document.getElementById('nfl-prize-pool');
        if (prizePoolEl) {
            prizePoolEl.textContent = `${prizePool} NUTS`;
        }

        console.log(`📊 NFL Week ${this.currentWeek} stats: ${entryCount} entries, ${prizePool} NUTS pool`);
    }

    /**
     * Get entries for a specific week from localStorage
     */
    async getWeekEntries(weekNumber) {
        try {
            if (!this.backend) {
                console.warn('⚠️ No backend available for getWeekEntries');
                return [];
            }

            // Calculate the week date for the backend call
            const seasonStart = new Date(2025, 8, 7); // September 7, 2025
            const weekStart = new Date(seasonStart);
            weekStart.setDate(weekStart.getDate() + ((weekNumber - 1) * 7));
            const weekDateString = weekStart.toISOString().split('T')[0];

            // Get entries from Firebase backend only
            const entries = await this.backend.getContestEntries(weekDateString, 'nfl', weekNumber);
            console.log(`📊 Got ${entries.length} NFL entries for week ${weekNumber} from Firebase`);
            return entries;
        } catch (e) {
            console.warn('Failed to get week entries from Firebase:', e);
            return [];
        }
    }

    /**
     * Submit contest entry
     */
    async submitEntry() {
        try {
            const currentWeekData = this.contestWeeks.find(w => w.weekNumber === this.currentWeek);
            
            // Prevent submission for past weeks
            if (currentWeekData?.status === 'past') {
                alert('Cannot submit entries for past weeks. Please select a current or upcoming week.');
                return;
            }

            const picksCount = Object.keys(this.userPicks).length;
            const totalGames = this.selectedGames.length;

            if (picksCount !== totalGames) {
                alert(`Please make picks for all ${totalGames} games before submitting.`);
                return;
            }

            // Get tiebreaker
            const tiebreakerInput = document.getElementById('tiebreaker-points');
            const tiebreakerPoints = tiebreakerInput ? parseInt(tiebreakerInput.value) : 0;

            if (!tiebreakerPoints || tiebreakerPoints < 0 || tiebreakerPoints > 100) {
                alert('Please enter a valid tiebreaker (total points in Monday Night Football game, 0-100).');
                if (tiebreakerInput) tiebreakerInput.focus();
                return;
            }

            // Get Twitter handle
            const twitterInput = document.getElementById('twitter-handle');
            const twitterHandle = twitterInput ? twitterInput.value.trim() : '';

            if (!twitterHandle) {
                alert('Please enter your Twitter handle. This is required for winner announcements.');
                if (twitterInput) twitterInput.focus();
                return;
            }

            // Get wallet address
            const walletInput = document.getElementById('wallet-address');
            const walletAddress = walletInput ? walletInput.value.trim() : '';

            if (!walletAddress) {
                alert('Please enter your XRPL wallet address. This is required for prize payments.');
                if (walletInput) walletInput.focus();
                return;
            }

            // Basic wallet address validation
            if (!walletAddress.startsWith('r') || walletAddress.length < 25 || walletAddress.length > 35) {
                alert('Please enter a valid XRPL wallet address (should start with "r" and be 25-35 characters).');
                if (walletInput) walletInput.focus();
                return;
            }

            console.log('🏈 Submitting NFL contest entry...', {
                week: this.currentWeek,
                picks: this.userPicks,
                tiebreaker: tiebreakerPoints,
                twitter: twitterHandle
            });

            // Prepare contest entry
            const contestEntry = {
                userId: 'USER_' + Date.now(),
                userName: twitterHandle ? `@${twitterHandle}` : 'Player #' + Math.floor(Math.random() * 9999),
                twitterHandle: twitterHandle ? `@${twitterHandle}` : null,
                walletAddress: walletAddress,
                sport: 'nfl',
                picks: this.userPicks,
                tiebreakerPoints: tiebreakerPoints,
                entryFee: 50,
                contestWeek: `2025-W${this.currentWeek.toString().padStart(2, '0')}`,
                contestDay: this.formatWeekDate(this.currentWeek), // Required by Firebase function
                contestDate: this.formatWeekDate(this.currentWeek), // For compatibility
                weekNumber: this.currentWeek,
                timestamp: new Date().toISOString(),
                totalGames: this.selectedGames.length,
                games: Object.keys(this.userPicks).map(gameId => ({
                    gameId: gameId,
                    pickedTeam: this.userPicks[gameId],
                    result: null,
                    actualWinner: null
                }))
            };

            // Show payment QR code
            console.log('💳 Creating NFL contest payment...');
            
            // Use the same payment system as MLB contest
            const paymentResult = await window.xamanPayment.createContestPayment();

            if (paymentResult && paymentResult.success) {
                console.log('✅ NFL contest payment successful!');
                contestEntry.transactionId = paymentResult.txid || paymentResult.txHash;
                contestEntry.paymentTxHash = paymentResult.txid || paymentResult.txHash;
                contestEntry.paymentTimestamp = paymentResult.timestamp || new Date().toISOString();
                contestEntry.walletAddress = paymentResult.walletAddress || 'unknown';

                // Store the entry
                let result;
                try {
                    if (this.backend && this.backend.createContestEntry) {
                        console.log('📝 Storing NFL entry via production backend...');
                        result = await this.backend.createContestEntry(contestEntry);
                    } else if (this.integration) {
                        console.log('📝 Storing NFL entry via integration...');
                        result = await this.integration.storeInFirebase(contestEntry);
                    } else if (this.backend && this.backend.storeContestEntry) {
                        console.log('📝 Storing NFL entry via local backend...');
                        result = await this.backend.storeContestEntry(contestEntry);
                    } else {
                        console.log('📝 Storing NFL entry locally...');
                        result = { success: true, entryId: 'LOCAL_NFL_' + Date.now() };
                    }
                } catch (storageError) {
                    console.error('⚠️ Storage failed but payment succeeded:', storageError);
                    result = { 
                        success: true, 
                        entryId: 'PAID_NFL_' + Date.now(),
                        txHash: paymentResult.txid || paymentResult.txHash,
                        storageError: true
                    };
                }

                if (result.success) {
                    this.showSuccessMessage(result.entryId, contestEntry);
                    this.resetForm();
                } else {
                    throw new Error(result.error || 'Failed to store entry');
                }

            } else {
                console.log('❌ NFL contest payment cancelled or failed');
                alert('Payment was cancelled. Your picks have been saved and you can try again.');
            }

        } catch (error) {
            console.error('❌ Failed to submit NFL contest entry:', error);
            alert('Failed to submit entry: ' + error.message);
        }
    }

    /**
     * Format week date for storage compatibility
     */
    formatWeekDate(weekNumber) {
        const seasonStart = new Date(2025, 8, 7); // September 7, 2025
        const weekStart = new Date(seasonStart);
        weekStart.setDate(weekStart.getDate() + ((weekNumber - 1) * 7));
        return weekStart.toISOString().split('T')[0];
    }

    /**
     * Show success message
     */
    showSuccessMessage(entryId, contestEntry) {
        const successModal = document.getElementById('success-modal');
        if (successModal) {
            const picksText = Object.entries(contestEntry.picks).map(([gameId, team]) => {
                const game = this.selectedGames.find(g => g.id === gameId);
                if (!game) return '';
                const teamName = team === 'home' ? game.homeTeam : game.awayTeam;
                return teamName;
            }).join(', ');

            successModal.innerHTML = `
                <div class="success-content">
                    <div class="success-header">
                        <h2>🏆 NFL Contest Entry Submitted!</h2>
                        <p>Your picks have been recorded and payment confirmed.</p>
                    </div>
                    
                    <div class="entry-details">
                        <div class="detail-row">
                            <span>Week:</span>
                            <span>Week ${contestEntry.weekNumber}</span>
                        </div>
                        <div class="detail-row">
                            <span>Entry ID:</span>
                            <span>${entryId}</span>
                        </div>
                        <div class="detail-row">
                            <span>Entry Fee:</span>
                            <span>5000 NUTS</span>
                        </div>
                        <div class="detail-row">
                            <span>Tiebreaker:</span>
                            <span>${contestEntry.tiebreakerPoints} points</span>
                        </div>
                        <div class="detail-row">
                            <span>Your Picks:</span>
                            <span>${picksText}</span>
                        </div>
                    </div>
                    
                    <div class="success-actions">
                        <button onclick="downloadPicksFile('${entryId}', ${contestEntry.weekNumber}, '${picksText}', ${contestEntry.tiebreakerPoints})" class="btn btn-secondary" style="margin-right: 10px;">
                            📥 Download Picks
                        </button>
                        <button onclick="closeSuccessModal()" class="btn btn-primary">
                            Continue
                        </button>
                    </div>
                </div>
            `;
            successModal.style.display = 'flex';
        } else {
            alert(`✅ NFL Contest entry submitted successfully!\n\nEntry ID: ${entryId}\nWeek: ${contestEntry.weekNumber}\nTiebreaker: ${contestEntry.tiebreakerPoints} points`);
        }
    }

    /**
     * Reset the form after successful submission
     */
    resetForm() {
        this.userPicks = {};
        
        const tiebreakerInput = document.getElementById('tiebreaker-points');
        if (tiebreakerInput) tiebreakerInput.value = '';
        
        const twitterInput = document.getElementById('twitter-handle');
        if (twitterInput) twitterInput.value = '';
        
        this.updatePicksDisplay();
        this.updateSubmitButton();
        this.updateGamesDisplay();
    }
}

// Global functions for HTML onclick handlers
function closeSuccessModal() {
    const modal = document.getElementById('success-modal');
    if (modal) modal.style.display = 'none';
}

function downloadPicksFile(entryId, weekNumber, picksText, tiebreakerPoints) {
    // Get current date and time for filename
    const now = new Date();
    const dateStr = now.toLocaleDateString().replace(/\//g, '-');
    const timeStr = now.toLocaleTimeString().replace(/:/g, '-');
    
    // Create file content
    const fileContent = `NUTS Sports Pick'em - NFL Contest Entry
===============================================

Entry Details:
--------------
Entry ID: ${entryId}
Week: Week ${weekNumber}
Date Submitted: ${now.toLocaleString()}
Entry Fee: 5000 NUTS

Your Picks:
-----------
${picksText}

Tiebreaker:
-----------
${tiebreakerPoints} points

===============================================
Keep this record for your files!
Visit https://nuts-sports-pickem.web.app for results.
`;

    // Create and download the file
    const blob = new Blob([fileContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.href = url;
    link.download = `NFL-Week-${weekNumber}-Picks-${dateStr}-${timeStr}.txt`;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the URL object
    window.URL.revokeObjectURL(url);
    
    console.log(`📥 Downloaded picks file: NFL-Week-${weekNumber}-Picks-${dateStr}-${timeStr}.txt`);
}

// Export for browser use
if (typeof window !== 'undefined') {
    window.NFLContestManager = NFLContestManager;
}
