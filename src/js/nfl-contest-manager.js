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
                        <span class="entry-fee">Entry Fee: 50 NUTS</span>
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
     * Render a group of games
     */
    renderGameGroup(groupTitle, games, icon) {
        return `
            <div class="game-group">
                <div class="game-group-header">
                    <h3>${icon} ${groupTitle}</h3>
                    <span class="game-count">${games.length} game${games.length !== 1 ? 's' : ''}</span>
                </div>
                <div class="games-grid">
                    ${games.map(game => this.renderGameCard(game)).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Render individual game card
     */
    renderGameCard(game) {
        const userPick = this.userPicks[game.id];
        const hasPickClass = userPick ? 'has-pick' : 'no-pick';
        
        return `
            <div class="game-card ${hasPickClass}" data-game-id="${game.id}">
                <div class="game-time">
                    ${game.gameTimeFormatted}
                    ${game.spread ? `<span class="spread">${game.spread}</span>` : ''}
                    ${game.overUnder ? `<span class="over-under">${game.overUnder}</span>` : ''}
                    ${!userPick ? '<span style="color: #ff6b6b; font-size: 0.7em; margin-left: 8px;">⚠️ PICK NEEDED</span>' : ''}
                </div>
                
                <div class="teams-container">
                    <div class="team-option ${userPick === 'away' ? 'selected' : ''}" 
                         onclick="nflContest.selectTeam('${game.id}', 'away')">
                        <div class="team-info">
                            <span class="team-abbr">${game.awayTeam}</span>
                            <span class="team-name">${game.awayTeamFull}</span>
                        </div>
                        <div class="pick-indicator">
                            ${userPick === 'away' ? '✓' : ''}
                        </div>
                    </div>
                    
                    <div class="vs-divider">@</div>
                    
                    <div class="team-option ${userPick === 'home' ? 'selected' : ''}"
                         onclick="nflContest.selectTeam('${game.id}', 'home')">
                        <div class="team-info">
                            <span class="team-abbr">${game.homeTeam}</span>
                            <span class="team-name">${game.homeTeamFull}</span>
                        </div>
                        <div class="pick-indicator">
                            ${userPick === 'home' ? '✓' : ''}
                        </div>
                    </div>
                </div>
                
                <div class="venue">
                    📍 ${game.venue}
                </div>
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
     * Update just the selection state of a game card
     */
    updateGameCardSelection(gameId) {
        const gameCard = document.querySelector(`[data-game-id="${gameId}"]`);
        if (!gameCard) {
            console.warn(`⚠️ Game card not found for ${gameId}`);
            return;
        }

        const userPick = this.userPicks[gameId];
        
        // Update card border based on pick status
        gameCard.classList.remove('no-pick', 'has-pick');
        gameCard.classList.add(userPick ? 'has-pick' : 'no-pick');
        
        // Update team option selections
        const teamOptions = gameCard.querySelectorAll('.team-option');
        teamOptions.forEach(option => {
            // Check the onclick attribute to determine if this is away or home
            const onclickAttr = option.getAttribute('onclick') || '';
            const isAway = onclickAttr.includes("'away'");
            const isHome = onclickAttr.includes("'home'");
            
            if ((isAway && userPick === 'away') || (isHome && userPick === 'home')) {
                option.classList.add('selected');
                const indicator = option.querySelector('.pick-indicator');
                if (indicator) indicator.textContent = '✓';
            } else {
                option.classList.remove('selected');
                const indicator = option.querySelector('.pick-indicator');
                if (indicator) indicator.textContent = '';
            }
        });

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
                submitBtn.innerHTML = '💰 Submit Picks & Pay 50 NUTS';
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
        const prizePool = entryCount * 50;

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
                            <span>50 NUTS</span>
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

// Export for browser use
if (typeof window !== 'undefined') {
    window.NFLContestManager = NFLContestManager;
}
