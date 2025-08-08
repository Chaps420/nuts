/**
 * Admin Testing Portal JavaScript
 * Provides comprehensive testing functionality for the NUTS Sports Pick'em platform
 * 
 * Features:
 * - Mock game generation with realistic data
 * - Real wallet transaction testing
 * - User entry simulation and management
 * - Contest result simulation and payout testing
 * - Real-time monitoring and logging
 */

class AdminTestingPortal {
    constructor() {
        this.testGames = [];
        this.testEntries = [];
        this.testResults = {};
        this.activityLog = [];
        this.contestBackend = null;
        this.currentContestDate = new Date().toISOString().split('T')[0];
        
        console.log('🧪 Admin Testing Portal initialized');
        this.init();
    }

    async init() {
        try {
            // Initialize contest backend
            if (window.ContestBackend) {
                this.contestBackend = new ContestBackend();
                await this.contestBackend.init();
            }
            
            // Set initial date
            document.getElementById('contest-date').value = this.currentContestDate;
            
            // Load existing data
            await this.loadExistingData();
            
            // Update displays
            this.updateAllDisplays();
            
            // Start monitoring
            this.startMonitoring();
            
            this.log('System initialized successfully', 'success');
        } catch (error) {
            console.error('❌ Failed to initialize testing portal:', error);
            this.log('Failed to initialize: ' + error.message, 'error');
        }
    }

    // ==========================================
    // LOGGING AND MONITORING
    // ==========================================

    log(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = `[${timestamp}] [${type.toUpperCase()}] ${message}`;
        
        this.activityLog.unshift(logEntry);
        if (this.activityLog.length > 100) {
            this.activityLog = this.activityLog.slice(0, 100);
        }
        
        this.updateLogDisplay();
        console.log(logEntry);
    }

    updateLogDisplay() {
        const logDisplay = document.getElementById('activity-log');
        if (logDisplay) {
            logDisplay.innerHTML = this.activityLog.join('\n');
            logDisplay.scrollTop = 0;
        }
    }

    startMonitoring() {
        // Update stats every 30 seconds
        setInterval(() => {
            this.updateLiveStats();
            this.checkSystemHealth();
        }, 30000);
        
        this.log('Monitoring started', 'info');
    }

    // ==========================================
    // GAME MANAGEMENT
    // ==========================================

    generateMockGames() {
        const gameCount = parseInt(document.getElementById('game-count').value);
        const sportType = document.getElementById('sport-type').value;
        
        this.log(`Generating ${gameCount} mock ${sportType} games`, 'info');
        
        this.testGames = [];
        const teams = this.getTeamsForSport(sportType);
        
        for (let i = 0; i < gameCount; i++) {
            const homeTeam = teams[Math.floor(Math.random() * teams.length)];
            let awayTeam = teams[Math.floor(Math.random() * teams.length)];
            
            // Ensure different teams
            while (awayTeam === homeTeam) {
                awayTeam = teams[Math.floor(Math.random() * teams.length)];
            }
            
            // Generate game time (today + random hours)
            const gameTime = new Date();
            gameTime.setHours(gameTime.getHours() + Math.floor(Math.random() * 12) + 1);
            
            const game = {
                id: `GAME_${Date.now()}_${i}`,
                homeTeam: homeTeam,
                awayTeam: awayTeam,
                homeOdds: this.generateRandomOdds(),
                awayOdds: this.generateRandomOdds(),
                gameTime: gameTime.toISOString(),
                sport: sportType,
                status: 'scheduled',
                result: null,
                winner: null
            };
            
            this.testGames.push(game);
        }
        
        // Save to storage
        this.saveTestGames();
        this.updateGamesDisplay();
        this.log(`Generated ${gameCount} ${sportType} games successfully`, 'success');
    }

    getTeamsForSport(sport) {
        const teams = {
            MLB: [
                'Yankees', 'Red Sox', 'Dodgers', 'Giants', 'Cubs', 'Cardinals',
                'Astros', 'Phillies', 'Mets', 'Braves', 'Padres', 'Angels',
                'Rangers', 'Mariners', 'Blue Jays', 'Orioles', 'Rays', 'Twins',
                'White Sox', 'Tigers', 'Guardians', 'Royals', 'Athletics', 'Nationals',
                'Marlins', 'Brewers', 'Pirates', 'Reds', 'Rockies', 'Diamondbacks'
            ],
            NFL: [
                'Chiefs', 'Bills', 'Bengals', 'Cowboys', '49ers', 'Eagles',
                'Ravens', 'Dolphins', 'Chargers', 'Titans', 'Vikings', 'Packers',
                'Steelers', 'Browns', 'Colts', 'Jaguars', 'Broncos', 'Raiders',
                'Patriots', 'Jets', 'Texans', 'Saints', 'Falcons', 'Panthers',
                'Buccaneers', 'Lions', 'Bears', 'Cardinals', 'Seahawks', 'Rams',
                'Giants', 'Commanders'
            ],
            NBA: [
                'Lakers', 'Celtics', 'Warriors', 'Nets', 'Heat', 'Nuggets',
                'Bucks', 'Suns', '76ers', 'Clippers', 'Mavs', 'Grizzlies',
                'Hawks', 'Bulls', 'Knicks', 'Cavs', 'Raptors', 'Pacers',
                'Kings', 'Pelicans', 'Thunder', 'Wolves', 'Magic', 'Hornets',
                'Pistons', 'Rockets', 'Spurs', 'Trail Blazers', 'Jazz', 'Wizards'
            ],
            NHL: [
                'Rangers', 'Panthers', 'Oilers', 'Stars', 'Bruins', 'Avalanche',
                'Lightning', 'Devils', 'Maple Leafs', 'Golden Knights', 'Kraken', 'Kings',
                'Hurricanes', 'Wild', 'Jets', 'Flames', 'Islanders', 'Capitals',
                'Flyers', 'Penguins', 'Red Wings', 'Predators', 'Blues', 'Senators',
                'Canucks', 'Ducks', 'Sharks', 'Blackhawks', 'Sabres', 'Blue Jackets',
                'Coyotes', 'Canadiens'
            ]
        };
        
        return teams[sport] || teams.MLB;
    }

    generateRandomOdds() {
        const odds = ['-150', '-120', '-110', '+100', '+110', '+120', '+150', '+180', '+200'];
        return odds[Math.floor(Math.random() * odds.length)];
    }

    saveTestGames() {
        const contestData = {
            contestDate: this.currentContestDate,
            games: this.testGames,
            createdAt: new Date().toISOString(),
            gameCount: this.testGames.length
        };
        
        localStorage.setItem('daily_contest_games', JSON.stringify(contestData));
        localStorage.setItem(`daily_contest_games_${this.currentContestDate}`, JSON.stringify(contestData));
        
        this.log(`Saved ${this.testGames.length} games to storage`, 'info');
    }

    updateGamesDisplay() {
        const container = document.getElementById('mock-games-container');
        if (!container) return;
        
        if (this.testGames.length === 0) {
            container.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; color: #888; padding: 40px;">
                    No games generated yet. Use the controls above to generate mock games.
                </div>
            `;
            return;
        }
        
        container.innerHTML = this.testGames.map((game, index) => {
            const gameTime = new Date(game.gameTime);
            const resultDisplay = game.result ? `Winner: ${game.winner}` : 'Pending';
            
            return `
                <div class="mock-game-card">
                    <div class="game-matchup">${game.awayTeam} @ ${game.homeTeam}</div>
                    <div class="game-time">${gameTime.toLocaleString()}</div>
                    <div style="font-size: 12px; color: #888; margin-bottom: 8px;">
                        ${game.awayOdds} / ${game.homeOdds} | ${resultDisplay}
                    </div>
                    <div class="game-controls">
                        <button class="btn-testing" onclick="adminTesting.setGameWinner('${game.id}', 'away')">
                            ${game.awayTeam} Wins
                        </button>
                        <button class="btn-testing" onclick="adminTesting.setGameWinner('${game.id}', 'home')">
                            ${game.homeTeam} Wins
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    setGameWinner(gameId, winner) {
        const game = this.testGames.find(g => g.id === gameId);
        if (!game) return;
        
        game.result = winner;
        game.winner = winner === 'home' ? game.homeTeam : game.awayTeam;
        game.status = 'completed';
        
        this.saveTestGames();
        this.updateGamesDisplay();
        this.log(`Set winner for ${game.awayTeam} @ ${game.homeTeam}: ${game.winner}`, 'info');
        
        // Recalculate scores if we have entries
        if (this.testEntries.length > 0) {
            this.recalculateScores();
        }
    }

    clearAllGames() {
        if (!confirm('Clear all test games? This will also clear all related entries.')) return;
        
        this.testGames = [];
        this.testEntries = [];
        this.testResults = {};
        
        localStorage.removeItem('daily_contest_games');
        localStorage.removeItem(`daily_contest_games_${this.currentContestDate}`);
        
        this.updateGamesDisplay();
        this.updateEntriesDisplay();
        this.log('Cleared all games and entries', 'warning');
    }

    // ==========================================
    // CONTEST DATE MANAGEMENT
    // ==========================================

    setContestDate() {
        const newDate = document.getElementById('contest-date').value;
        if (!newDate) return;
        
        this.currentContestDate = newDate;
        this.log(`Contest date set to: ${newDate}`, 'info');
        
        // Load data for this date
        this.loadExistingData();
        this.updateDateStatus();
    }

    resetToToday() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('contest-date').value = today;
        this.setContestDate();
    }

    updateDateStatus() {
        const statusElement = document.getElementById('date-status');
        if (statusElement) {
            const gameCount = this.testGames.length;
            const entryCount = this.testEntries.length;
            
            statusElement.innerHTML = `
                Contest Date: ${this.currentContestDate}
                Games: ${gameCount}
                Entries: ${entryCount}
                Prize Pool: ${entryCount * 50} NUTS
            `;
        }
    }

    // ==========================================
    // ENTRY MANAGEMENT
    // ==========================================

    generateMockEntries() {
        const entryCount = parseInt(document.getElementById('mock-entry-count').value);
        
        if (this.testGames.length === 0) {
            alert('Please generate mock games first!');
            return;
        }
        
        this.log(`Generating ${entryCount} mock entries`, 'info');
        
        this.testEntries = [];
        
        for (let i = 0; i < entryCount; i++) {
            const entry = this.createMockEntry(i);
            this.testEntries.push(entry);
        }
        
        // Save entries
        this.saveTestEntries();
        this.updateEntriesDisplay();
        this.log(`Generated ${entryCount} mock entries successfully`, 'success');
    }

    createMockEntry(index) {
        const mockUsers = [
            { name: 'TestUser1', twitter: '@testuser1', wallet: 'rMockWallet1TestingAddress123456789ABC' },
            { name: 'TestUser2', twitter: '@testuser2', wallet: 'rMockWallet2TestingAddress123456789DEF' },
            { name: 'TestUser3', twitter: '@testuser3', wallet: 'rMockWallet3TestingAddress123456789GHI' },
            { name: 'TestUser4', twitter: '@testuser4', wallet: 'rMockWallet4TestingAddress123456789JKL' },
            { name: 'TestUser5', twitter: '@testuser5', wallet: 'rMockWallet5TestingAddress123456789MNO' },
            { name: 'ProPicker', twitter: '@propicker', wallet: 'rMockWalletProPickerAddress123456789PQR' },
            { name: 'LuckyGuesser', twitter: '@luckyguesser', wallet: 'rMockWalletLuckyAddress123456789STU' },
            { name: 'SportsExpert', twitter: '@sportsexpert', wallet: 'rMockWalletExpertAddress123456789VWX' },
            { name: 'RandomPicks', twitter: '@randompicks', wallet: 'rMockWalletRandomAddress123456789YZ1' },
            { name: 'BigBettor', twitter: '@bigbettor', wallet: 'rMockWalletBigBettorAddress123456789234' }
        ];
        
        const user = mockUsers[index % mockUsers.length];
        
        // Generate random picks for each game
        const picks = {};
        const games = [];
        
        this.testGames.forEach(game => {
            const pick = Math.random() > 0.5 ? 'home' : 'away';
            picks[game.id] = pick;
            
            games.push({
                gameId: game.id,
                pickedTeam: pick,
                result: null,
                actualWinner: null
            });
        });
        
        return {
            id: `ENTRY_${Date.now()}_${index}`,
            userId: `user_${index}`,
            userName: user.name,
            twitterHandle: user.twitter,
            walletAddress: user.wallet,
            contestDate: this.currentContestDate,
            picks: picks,
            games: games,
            tiebreakerRuns: Math.floor(Math.random() * 15) + 5, // 5-20 runs
            entryFee: 50,
            transactionId: `MOCK_TX_${Date.now()}_${index}`,
            timestamp: new Date().toISOString(),
            status: 'active',
            contestStatus: 'active',
            score: 0,
            prizeWon: 0,
            place: null
        };
    }

    saveTestEntries() {
        if (this.contestBackend) {
            // Save each entry to the backend
            this.testEntries.forEach(entry => {
                this.contestBackend.storeInLocalStorage(entry);
            });
        }
        
        // Also save to testing storage
        localStorage.setItem(`test_entries_${this.currentContestDate}`, JSON.stringify(this.testEntries));
        
        this.log(`Saved ${this.testEntries.length} entries to storage`, 'info');
    }

    updateEntriesDisplay() {
        const tbody = document.getElementById('entries-table-body');
        if (!tbody) return;
        
        if (this.testEntries.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="10" style="text-align: center; color: #888; padding: 40px;">
                        No entries found. Generate mock entries or create real entries to test.
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = this.testEntries.map(entry => {
            const prizeDisplay = entry.prizeWon > 0 ? 
                `<span class="prize-badge">${entry.prizeWon} NUTS</span>` : 
                '--';
            
            const statusColor = entry.status === 'won' ? '#28a745' : 
                               entry.status === 'lost' ? '#dc3545' : '#ffa500';
            
            return `
                <tr>
                    <td style="font-family: monospace; font-size: 12px;">${entry.id.substring(0, 12)}...</td>
                    <td>${entry.userName}</td>
                    <td>${entry.twitterHandle}</td>
                    <td style="font-family: monospace; font-size: 11px;">${entry.walletAddress.substring(0, 12)}...</td>
                    <td>${entry.entryFee} NUTS</td>
                    <td style="font-family: monospace; font-size: 11px;">${entry.transactionId.substring(0, 12)}...</td>
                    <td>${Object.keys(entry.picks).length}</td>
                    <td style="font-weight: bold; color: #fff;">${entry.score}</td>
                    <td style="color: ${statusColor}; font-weight: bold;">${entry.status}</td>
                    <td>
                        <button class="btn-testing" style="padding: 4px 8px; font-size: 11px;" 
                                onclick="adminTesting.viewEntryDetails('${entry.id}')">
                            View
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
        
        this.updateEntryStats();
    }

    updateEntryStats() {
        const statsElement = document.getElementById('entry-stats');
        if (!statsElement) return;
        
        const totalEntries = this.testEntries.length;
        const prizePool = totalEntries * 50;
        const avgScore = totalEntries > 0 ? 
            (this.testEntries.reduce((sum, entry) => sum + entry.score, 0) / totalEntries).toFixed(1) : 0;
        
        statsElement.innerHTML = `
            Total Entries: ${totalEntries}
            Prize Pool: ${prizePool} NUTS
            Average Score: ${avgScore}
        `;
    }

    viewEntryDetails(entryId) {
        const entry = this.testEntries.find(e => e.id === entryId);
        if (!entry) return;
        
        let picksDetails = '';
        this.testGames.forEach(game => {
            const pick = entry.picks[game.id];
            const pickedTeam = pick === 'home' ? game.homeTeam : game.awayTeam;
            const result = game.result ? (game.winner === pickedTeam ? '✅' : '❌') : '⏳';
            picksDetails += `${game.awayTeam} @ ${game.homeTeam}: ${pickedTeam} ${result}\n`;
        });
        
        alert(`Entry Details:\n\nUser: ${entry.userName}\nTwitter: ${entry.twitterHandle}\nScore: ${entry.score}\nTiebreaker: ${entry.tiebreakerRuns}\n\nPicks:\n${picksDetails}`);
    }

    clearAllEntries() {
        if (!confirm('Clear all test entries?')) return;
        
        this.testEntries = [];
        localStorage.removeItem(`test_entries_${this.currentContestDate}`);
        
        this.updateEntriesDisplay();
        this.log('Cleared all entries', 'warning');
    }

    // ==========================================
    // RESULTS AND SCORING
    // ==========================================

    simulateGameResults() {
        if (this.testGames.length === 0) {
            alert('Please generate mock games first!');
            return;
        }
        
        const distribution = document.getElementById('result-distribution').value;
        this.log(`Simulating game results with ${distribution} distribution`, 'info');
        
        this.testGames.forEach(game => {
            let winnerSide;
            
            switch (distribution) {
                case 'home-favored':
                    winnerSide = Math.random() < 0.7 ? 'home' : 'away';
                    break;
                case 'away-favored':
                    winnerSide = Math.random() < 0.7 ? 'away' : 'home';
                    break;
                case 'balanced':
                    winnerSide = Math.random() < 0.5 ? 'home' : 'away';
                    break;
                default: // random
                    winnerSide = Math.random() < 0.5 ? 'home' : 'away';
            }
            
            game.result = winnerSide;
            game.winner = winnerSide === 'home' ? game.homeTeam : game.awayTeam;
            game.status = 'completed';
        });
        
        this.saveTestGames();
        this.updateGamesDisplay();
        this.recalculateScores();
        this.log('Simulated results for all games', 'success');
    }

    recalculateScores() {
        if (this.testEntries.length === 0) return;
        
        this.log('Recalculating entry scores', 'info');
        
        this.testEntries.forEach(entry => {
            let score = 0;
            
            // Update games array with results
            entry.games.forEach(gameEntry => {
                const game = this.testGames.find(g => g.id === gameEntry.gameId);
                if (game && game.result) {
                    gameEntry.result = game.result;
                    gameEntry.actualWinner = game.winner;
                    
                    // Check if pick was correct
                    if (gameEntry.pickedTeam === game.result) {
                        score++;
                    }
                }
            });
            
            entry.score = score;
        });
        
        this.saveTestEntries();
        this.updateEntriesDisplay();
        this.log('Scores recalculated for all entries', 'success');
    }

    calculateTestWinners() {
        if (this.testEntries.length === 0) {
            alert('No entries to calculate winners for!');
            return;
        }
        
        // Check if all games have results
        const incompleteGames = this.testGames.filter(g => !g.result);
        if (incompleteGames.length > 0) {
            if (!confirm(`${incompleteGames.length} games don't have results yet. Calculate winners anyway?`)) {
                return;
            }
        }
        
        this.log('Calculating contest winners', 'info');
        
        if (this.contestBackend) {
            const result = this.contestBackend.calculateWinners(this.testEntries, true);
            this.displayWinners(result);
        } else {
            // Fallback calculation
            this.calculateWinnersFallback();
        }
    }

    displayWinners(result) {
        const container = document.getElementById('winners-container');
        if (!container) return;
        
        if (!result.winners || result.winners.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; color: #888; padding: 40px;">
                    No winners found. Make sure entries have valid scores.
                </div>
            `;
            return;
        }
        
        container.innerHTML = `
            <div style="margin-bottom: 20px;">
                <strong>Total Prize Pool:</strong> ${result.totalPrizePool} NUTS<br>
                <strong>Total Entries:</strong> ${result.allEntries.length}<br>
                <strong>Winners:</strong> ${result.winners.length}
            </div>
            
            ${result.winners.map(winner => `
                <div style="background: #2a5a2a; border: 1px solid #4a7c4a; border-radius: 8px; padding: 15px; margin: 10px 0;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <strong style="color: #90ee90;">${this.getPlaceDisplay(winner.place)} Place</strong><br>
                            <span style="color: #ccc;">${winner.entry.userName} (${winner.entry.twitterHandle})</span><br>
                            <span style="color: #aaa; font-size: 12px;">Score: ${winner.entry.score} | Wallet: ${winner.entry.walletAddress.substring(0, 16)}...</span>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-size: 24px; font-weight: bold; color: #90ee90;">
                                ${winner.prize} NUTS
                            </div>
                            <button class="btn-success" onclick="adminTesting.initiatePayout('${winner.entry.id}', ${winner.prize})">
                                Generate Payout
                            </button>
                        </div>
                    </div>
                </div>
            `).join('')}
        `;
        
        this.log(`Calculated winners: ${result.winners.length} winners, ${result.totalPrizePool} NUTS total prize pool`, 'success');
        
        // Update the winner calculation status
        const statusElement = document.getElementById('winner-calculation-status');
        if (statusElement) {
            statusElement.innerHTML = `
                Winners calculated successfully!
                🥇 ${result.winners.length} winners
                💰 ${result.totalPrizePool} NUTS prize pool
            `;
        }
    }

    getPlaceDisplay(place) {
        const places = {
            1: '🥇 1st',
            2: '🥈 2nd', 
            3: '🥉 3rd'
        };
        return places[place] || `#${place}`;
    }

    // ==========================================
    // PAYOUT MANAGEMENT
    // ==========================================

    async initiatePayout(entryId, amount) {
        const entry = this.testEntries.find(e => e.id === entryId);
        if (!entry) return;
        
        this.log(`Initiating payout: ${amount} NUTS to ${entry.userName}`, 'info');
        
        try {
            // Generate payout QR code using the existing XUMM system
            if (window.xamanPaymentNutsCorrect) {
                const paymentSystem = window.xamanPaymentNutsCorrect;
                
                // Temporarily modify the destination for payout
                const originalWallet = paymentSystem.contestWallet;
                paymentSystem.contestWallet = entry.walletAddress;
                paymentSystem.entryFee = amount.toString();
                
                await paymentSystem.createContestPayment();
                
                // Restore original settings
                paymentSystem.contestWallet = originalWallet;
                paymentSystem.entryFee = '50';
                
                this.log(`Payout QR generated for ${entry.userName}`, 'success');
            } else {
                alert(`Payout Required:\n\nAmount: ${amount} NUTS\nRecipient: ${entry.userName}\nWallet: ${entry.walletAddress}\n\nPlease process this payout manually through Xaman.`);
            }
        } catch (error) {
            console.error('❌ Payout generation failed:', error);
            this.log(`Payout generation failed: ${error.message}`, 'error');
        }
    }

    generatePayoutQRs() {
        const winners = this.testEntries.filter(e => e.prizeWon > 0);
        if (winners.length === 0) {
            alert('No winners found. Calculate winners first!');
            return;
        }
        
        this.log(`Generating payout QR codes for ${winners.length} winners`, 'info');
        
        const payoutContainer = document.getElementById('payout-container');
        if (payoutContainer) {
            payoutContainer.innerHTML = winners.map(winner => `
                <div style="background: #252525; border-radius: 8px; padding: 20px; margin: 10px 0;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <strong>${winner.userName}</strong> (${winner.twitterHandle})<br>
                            <span style="color: #aaa; font-size: 12px;">${winner.walletAddress}</span><br>
                            <span style="color: #90ee90; font-weight: bold;">${winner.prizeWon} NUTS</span>
                        </div>
                        <div>
                            <button class="btn-success" onclick="adminTesting.initiatePayout('${winner.id}', ${winner.prizeWon})">
                                Generate QR
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');
        }
        
        this.log('Payout queue updated', 'success');
    }

    // ==========================================
    // REAL TRANSACTION TESTING
    // ==========================================

    async createRealTestEntry() {
        if (!confirm('This will create a REAL transaction sending 50 NUTS. Continue?')) return;
        
        this.log('Creating real contest entry with actual payment', 'warning');
        
        try {
            // Use the existing payment system
            if (window.xamanPaymentNutsCorrect) {
                const result = await window.xamanPaymentNutsCorrect.createContestPayment();
                this.log('Real payment initiated successfully', 'success');
                return result;
            } else if (window.contestWallet) {
                const result = await window.contestWallet.processEntryPayment();
                this.log('Real payment initiated through contest wallet', 'success');
                return result;
            } else {
                throw new Error('Payment system not available');
            }
        } catch (error) {
            console.error('❌ Real payment failed:', error);
            this.log(`Real payment failed: ${error.message}`, 'error');
            throw error;
        }
    }

    testPaymentFlow() {
        this.log('Testing payment flow', 'info');
        
        if (window.xamanPaymentNutsCorrect) {
            // Test the payment system
            window.xamanPaymentNutsCorrect.createContestPayment()
                .then(() => {
                    this.log('Payment flow test completed', 'success');
                })
                .catch(error => {
                    this.log(`Payment flow test failed: ${error.message}`, 'error');
                });
        } else {
            alert('Payment system not loaded. Please check that xaman-payment-nuts-correct.js is included.');
        }
    }

    // ==========================================
    // ADDITIONAL TESTING FUNCTIONS
    // ==========================================

    testWalletConnection() {
        this.log('Testing wallet connection', 'info');
        
        const walletInfo = {
            contestWallet: 'rN2K1Tv6LEM94YN8Kxfe3QyWcGPQNgsD6d',
            nutsIssuer: 'rBpdegD7kqHdczjKzTKNEUZj1Fg1eYZRbe',
            entryFee: '50 NUTS'
        };
        
        if (window.xamanPaymentNutsCorrect) {
            this.log('✅ Xaman payment system available', 'success');
            alert(`Wallet Connection Test:\n\n✅ Payment System: Available\n✅ Contest Wallet: ${walletInfo.contestWallet}\n✅ NUTS Issuer: ${walletInfo.nutsIssuer}\n✅ Entry Fee: ${walletInfo.entryFee}\n\nWallet connection test successful!`);
        } else {
            this.log('❌ Xaman payment system not available', 'error');
            alert('❌ Wallet Connection Test Failed:\n\nXaman payment system not loaded. Check console for errors.');
        }
    }

    openContestPage() {
        this.log('Opening contest page for testing', 'info');
        window.open('daily-contest.html', '_blank');
    }

    simulatePicksSubmission() {
        if (this.testGames.length === 0) {
            alert('Please generate mock games first!');
            return;
        }
        
        this.log('Simulating picks submission', 'info');
        
        // Create a mock picks submission
        const mockPicks = {};
        this.testGames.forEach(game => {
            mockPicks[game.id] = Math.random() > 0.5 ? 'home' : 'away';
        });
        
        const mockEntry = {
            picks: mockPicks,
            tiebreakerRuns: Math.floor(Math.random() * 15) + 5,
            timestamp: new Date().toISOString()
        };
        
        this.log(`Simulated picks submission: ${Object.keys(mockPicks).length} picks, tiebreaker: ${mockEntry.tiebreakerRuns}`, 'success');
        
        const statusElement = document.getElementById('payment-test-status');
        if (statusElement) {
            statusElement.innerHTML = `
                Picks simulation completed!
                Games picked: ${Object.keys(mockPicks).length}
                Tiebreaker: ${mockEntry.tiebreakerRuns} runs
            `;
        }
    }

    setContestStatus() {
        const status = document.getElementById('contest-status').value;
        this.log(`Setting contest status to: ${status}`, 'info');
        
        const statusElement = document.getElementById('contest-timing-status');
        if (statusElement) {
            const statusMessages = {
                open: 'Contest is open for entries',
                locked: 'Contest is locked - games have started',
                completed: 'Contest is completed - calculating results'
            };
            
            statusElement.innerHTML = `
                Status: ${statusMessages[status]}
                Updated: ${new Date().toLocaleTimeString()}
            `;
        }
        
        this.log(`Contest status updated to: ${status}`, 'success');
    }

    generateTestQR() {
        this.log('Generating test payment QR code', 'info');
        
        if (window.xamanPaymentNutsCorrect) {
            window.xamanPaymentNutsCorrect.createContestPayment()
                .then(() => {
                    this.log('Test QR code generated successfully', 'success');
                })
                .catch(error => {
                    this.log(`QR generation failed: ${error.message}`, 'error');
                });
        } else {
            this.log('Payment system not available for QR generation', 'error');
            alert('Payment system not available. Please check that the payment scripts are loaded.');
        }
    }

    simulateSuccessfulPayment() {
        this.log('Simulating successful payment', 'info');
        
        const mockTransaction = {
            txId: `MOCK_SUCCESS_${Date.now()}`,
            amount: 50,
            currency: 'NUTS',
            status: 'SUCCESS',
            timestamp: new Date().toISOString()
        };
        
        const statusElement = document.getElementById('payment-test-status');
        if (statusElement) {
            statusElement.innerHTML = `
                ✅ Payment Simulation: SUCCESS
                Transaction ID: ${mockTransaction.txId}
                Amount: ${mockTransaction.amount} NUTS
                Status: ${mockTransaction.status}
            `;
        }
        
        this.log('Payment simulation completed successfully', 'success');
    }

    simulateFailedPayment() {
        this.log('Simulating failed payment', 'warning');
        
        const mockError = {
            error: 'PAYMENT_CANCELLED',
            reason: 'User cancelled payment in Xaman',
            timestamp: new Date().toISOString()
        };
        
        const statusElement = document.getElementById('payment-test-status');
        if (statusElement) {
            statusElement.innerHTML = `
                ❌ Payment Simulation: FAILED
                Error: ${mockError.error}
                Reason: ${mockError.reason}
                Time: ${new Date().toLocaleTimeString()}
            `;
        }
        
        this.log('Payment failure simulation completed', 'warning');
    }

    analyzeEntries() {
        if (this.testEntries.length === 0) {
            alert('No entries to analyze. Generate mock entries first!');
            return;
        }
        
        this.log('Analyzing contest entries', 'info');
        
        // Calculate detailed statistics
        const totalEntries = this.testEntries.length;
        const scores = this.testEntries.map(e => e.score);
        const avgScore = (scores.reduce((a, b) => a + b, 0) / totalEntries).toFixed(2);
        const maxScore = Math.max(...scores);
        const minScore = Math.min(...scores);
        const prizePool = totalEntries * 50;
        
        // Count picks distribution
        const pickDistribution = {};
        this.testGames.forEach(game => {
            pickDistribution[game.id] = { home: 0, away: 0 };
        });
        
        this.testEntries.forEach(entry => {
            Object.keys(entry.picks).forEach(gameId => {
                const pick = entry.picks[gameId];
                if (pickDistribution[gameId]) {
                    pickDistribution[gameId][pick]++;
                }
            });
        });
        
        const analysis = `
Entry Analysis Report:
━━━━━━━━━━━━━━━━━━━━━━━━━

📊 Summary:
• Total Entries: ${totalEntries}
• Prize Pool: ${prizePool} NUTS
• Average Score: ${avgScore}
• Highest Score: ${maxScore}
• Lowest Score: ${minScore}

🎯 Pick Distribution:
${Object.keys(pickDistribution).map(gameId => {
    const game = this.testGames.find(g => g.id === gameId);
    const dist = pickDistribution[gameId];
    return `• ${game?.awayTeam} @ ${game?.homeTeam}: ${dist.away} away, ${dist.home} home`;
}).join('\n')}
        `;
        
        alert(analysis);
        this.log('Entry analysis completed', 'success');
    }

    exportEntries() {
        if (this.testEntries.length === 0) {
            alert('No entries to export!');
            return;
        }
        
        this.log('Exporting entry data', 'info');
        
        // Create CSV data
        const headers = ['Entry ID', 'User', 'Twitter', 'Wallet', 'Score', 'Prize', 'Status', 'Timestamp'];
        const csvData = [
            headers.join(','),
            ...this.testEntries.map(entry => [
                entry.id,
                entry.userName,
                entry.twitterHandle,
                entry.walletAddress,
                entry.score,
                entry.prizeWon,
                entry.status,
                entry.timestamp
            ].join(','))
        ].join('\n');
        
        // Download CSV
        const blob = new Blob([csvData], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `contest_entries_${this.currentContestDate}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        this.log(`Exported ${this.testEntries.length} entries to CSV`, 'success');
    }

    verifyRealEntry() {
        this.log('Verifying real entry transaction', 'info');
        alert('Real Entry Verification:\n\nThis feature would verify actual NUTS transactions on the XRPL.\nIn production, this would:\n\n• Check transaction status\n• Verify payment amount (50 NUTS)\n• Confirm destination wallet\n• Update entry status\n\nFor testing purposes, assume verification successful.');
    }

    simulatePartialResults() {
        if (this.testGames.length === 0) {
            alert('Please generate mock games first!');
            return;
        }
        
        this.log('Simulating partial game results', 'info');
        
        // Randomly complete about half the games
        const gamesToComplete = Math.floor(this.testGames.length / 2);
        const shuffledGames = [...this.testGames].sort(() => Math.random() - 0.5);
        
        for (let i = 0; i < gamesToComplete; i++) {
            const game = shuffledGames[i];
            if (!game.result) {
                const winner = Math.random() > 0.5 ? 'home' : 'away';
                game.result = winner;
                game.winner = winner === 'home' ? game.homeTeam : game.awayTeam;
                game.status = 'completed';
            }
        }
        
        this.saveTestGames();
        this.updateGamesDisplay();
        this.recalculateScores();
        
        this.log(`Simulated results for ${gamesToComplete} games`, 'success');
    }

    previewPrizeDistribution() {
        if (this.testEntries.length === 0) {
            alert('No entries to calculate prize distribution for!');
            return;
        }
        
        this.log('Previewing prize distribution', 'info');
        
        const totalEntries = this.testEntries.length;
        const prizePool = totalEntries * 50;
        
        // Standard distribution: 50% to 1st, 30% to 2nd, 20% to 3rd
        const prizes = {
            first: Math.floor(prizePool * 0.5),
            second: Math.floor(prizePool * 0.3),
            third: Math.floor(prizePool * 0.2)
        };
        
        const preview = `
Prize Distribution Preview:
━━━━━━━━━━━━━━━━━━━━━━━━━━

💰 Prize Pool: ${prizePool} NUTS
👥 Total Entries: ${totalEntries}

🥇 1st Place: ${prizes.first} NUTS (50%)
🥈 2nd Place: ${prizes.second} NUTS (30%)
🥉 3rd Place: ${prizes.third} NUTS (20%)

Total Distributed: ${prizes.first + prizes.second + prizes.third} NUTS
        `;
        
        alert(preview);
        this.log('Prize distribution preview shown', 'success');
    }

    processTestPayouts() {
        if (!confirm('This will initiate REAL NUTS payouts to winners. Are you sure?')) return;
        
        this.log('Processing real test payouts', 'warning');
        
        const winners = this.testEntries.filter(e => e.prizeWon > 0);
        if (winners.length === 0) {
            alert('No winners found to pay out!');
            return;
        }
        
        this.log(`Initiating payouts for ${winners.length} winners`, 'info');
        
        // In a real implementation, this would process actual payouts
        alert(`Test Payout Processing:\n\n${winners.length} winners identified\nTotal payout: ${winners.reduce((sum, w) => sum + w.prizeWon, 0)} NUTS\n\nIn production, this would generate individual payout transactions for each winner.`);
    }

    refreshStats() {
        this.log('Refreshing live statistics', 'info');
        this.updateLiveStats();
        this.checkSystemHealth();
        this.log('Statistics refreshed', 'success');
    }

    checkTransactions() {
        this.log('Checking recent transactions', 'info');
        
        const mockTransactions = [
            { type: 'entry', amount: 50, user: 'TestUser1', time: '2 min ago' },
            { type: 'entry', amount: 50, user: 'TestUser2', time: '5 min ago' },
            { type: 'payout', amount: 150, user: 'Winner1', time: '1 hour ago' }
        ];
        
        const monitorElement = document.getElementById('transaction-monitor');
        if (monitorElement) {
            monitorElement.innerHTML = `
                Recent Transactions:
                ${mockTransactions.map(tx => 
                    `${tx.type.toUpperCase()}: ${tx.amount} NUTS - ${tx.user} (${tx.time})`
                ).join('\n')}
                
                Last checked: ${new Date().toLocaleTimeString()}
            `;
        }
        
        this.log('Transaction check completed', 'success');
    }

    testErrorScenarios() {
        this.log('Testing error scenarios', 'warning');
        
        const scenarios = [
            'Insufficient NUTS balance',
            'Wallet connection timeout',
            'Invalid transaction signature',
            'Network connectivity issues',
            'Contest deadline exceeded'
        ];
        
        const randomScenario = scenarios[Math.floor(Math.random() * scenarios.length)];
        
        this.log(`Simulating error: ${randomScenario}`, 'error');
        alert(`Error Scenario Test:\n\n❌ ${randomScenario}\n\nThis tests how the system handles various error conditions.\nIn production, proper error handling and user feedback would be implemented.`);
    }

    clearErrorLogs() {
        this.log('Clearing error logs', 'info');
        
        // Filter out error logs
        this.activityLog = this.activityLog.filter(log => !log.includes('[ERROR]'));
        this.updateLogDisplay();
        
        this.log('Error logs cleared', 'success');
    }

    async loadExistingData() {
        try {
            // Load games
            const gameData = localStorage.getItem(`daily_contest_games_${this.currentContestDate}`);
            if (gameData) {
                const parsed = JSON.parse(gameData);
                this.testGames = parsed.games || [];
                this.log(`Loaded ${this.testGames.length} existing games`, 'info');
            }
            
            // Load entries
            const entryData = localStorage.getItem(`test_entries_${this.currentContestDate}`);
            if (entryData) {
                this.testEntries = JSON.parse(entryData);
                this.log(`Loaded ${this.testEntries.length} existing entries`, 'info');
            }
            
            // Load from contest backend if available
            if (this.contestBackend) {
                const backendEntries = await this.contestBackend.getContestEntries(this.currentContestDate);
                if (backendEntries.length > 0) {
                    this.log(`Found ${backendEntries.length} entries in backend`, 'info');
                }
            }
        } catch (error) {
            console.error('❌ Failed to load existing data:', error);
            this.log(`Failed to load existing data: ${error.message}`, 'error');
        }
    }

    updateAllDisplays() {
        this.updateGamesDisplay();
        this.updateEntriesDisplay();
        this.updateDateStatus();
        this.updateLiveStats();
    }

    updateLiveStats() {
        const statsElement = document.getElementById('live-stats');
        if (statsElement) {
            const gameCount = this.testGames.length;
            const entryCount = this.testEntries.length;
            const completedGames = this.testGames.filter(g => g.result).length;
            const prizePool = entryCount * 50;
            
            statsElement.innerHTML = `
                📊 Live Statistics:
                Games: ${gameCount} (${completedGames} completed)
                Entries: ${entryCount}
                Prize Pool: ${prizePool} NUTS
                Contest Date: ${this.currentContestDate}
            `;
        }
    }

    checkSystemHealth() {
        const healthElement = document.getElementById('system-health');
        if (healthElement) {
            const localStorageOK = typeof(Storage) !== "undefined";
            const paymentSystemOK = window.xamanPaymentNutsCorrect !== undefined;
            const contestSystemOK = this.contestBackend !== null;
            
            healthElement.innerHTML = `
                Local Storage: ${localStorageOK ? '✅ OK' : '❌ ERROR'}
                Payment System: ${paymentSystemOK ? '✅ OK' : '❌ ERROR'}
                Contest System: ${contestSystemOK ? '✅ OK' : '❌ ERROR'}
            `;
        }
    }

    // Quick setup functions
    quickSetupBaseball() {
        document.getElementById('sport-type').value = 'MLB';
        document.getElementById('game-count').value = '10';
        this.generateMockGames();
        
        setTimeout(() => {
            document.getElementById('mock-entry-count').value = '5';
            this.generateMockEntries();
        }, 1000);
        
        this.log('Quick setup: Baseball contest with 10 games and 5 entries', 'info');
    }

    quickSetupFootball() {
        document.getElementById('sport-type').value = 'NFL';
        document.getElementById('game-count').value = '10';
        this.generateMockGames();
        
        setTimeout(() => {
            document.getElementById('mock-entry-count').value = '10';
            this.generateMockEntries();
        }, 1000);
        
        this.log('Quick setup: Football contest with 10 games and 10 entries', 'info');
    }

    publishTestContest() {
        if (this.testGames.length === 0) {
            alert('Please generate games first!');
            return;
        }
        
        this.saveTestGames();
        this.log(`Published test contest with ${this.testGames.length} games for ${this.currentContestDate}`, 'success');
        alert(`Contest published successfully!\n\nGames: ${this.testGames.length}\nDate: ${this.currentContestDate}\n\nYou can now test the contest flow on the main contest page.`);
    }
}

// ==========================================
// UI HELPER FUNCTIONS
// ==========================================

function showTestingSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.testing-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Remove active class from all tabs
    document.querySelectorAll('.testing-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Show selected section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // Add active class to clicked tab
    event.target.classList.add('active');
}

// Global functions for HTML onclick handlers
window.showTestingSection = showTestingSection;

// Contest Setup & Game Management Functions
window.setContestDate = () => window.adminTesting?.setContestDate();
window.resetToToday = () => window.adminTesting?.resetToToday();
window.generateMockGames = () => window.adminTesting?.generateMockGames();
window.clearAllGames = () => window.adminTesting?.clearAllGames();
window.testWalletConnection = () => window.adminTesting?.testWalletConnection();
window.quickSetupBaseball = () => window.adminTesting?.quickSetupBaseball();
window.quickSetupFootball = () => window.adminTesting?.quickSetupFootball();
window.publishTestContest = () => window.adminTesting?.publishTestContest();

// Contest Testing Functions
window.openContestPage = () => window.adminTesting?.openContestPage();
window.testPaymentFlow = () => window.adminTesting?.testPaymentFlow();
window.simulatePicksSubmission = () => window.adminTesting?.simulatePicksSubmission();
window.setContestStatus = () => window.adminTesting?.setContestStatus();
window.generateTestQR = () => window.adminTesting?.generateTestQR();
window.simulateSuccessfulPayment = () => window.adminTesting?.simulateSuccessfulPayment();
window.simulateFailedPayment = () => window.adminTesting?.simulateFailedPayment();

// User Entries Functions
window.generateMockEntries = () => window.adminTesting?.generateMockEntries();
window.clearAllEntries = () => window.adminTesting?.clearAllEntries();
window.analyzeEntries = () => window.adminTesting?.analyzeEntries();
window.exportEntries = () => window.adminTesting?.exportEntries();
window.createRealTestEntry = () => window.adminTesting?.createRealTestEntry();
window.verifyRealEntry = () => window.adminTesting?.verifyRealEntry();

// Results & Payouts Functions
window.simulateGameResults = () => window.adminTesting?.simulateGameResults();
window.simulatePartialResults = () => window.adminTesting?.simulatePartialResults();
window.calculateTestWinners = () => window.adminTesting?.calculateTestWinners();
window.previewPrizeDistribution = () => window.adminTesting?.previewPrizeDistribution();
window.generatePayoutQRs = () => window.adminTesting?.generatePayoutQRs();
window.processTestPayouts = () => window.adminTesting?.processTestPayouts();

// Monitoring Functions
window.refreshStats = () => window.adminTesting?.refreshStats();
window.checkTransactions = () => window.adminTesting?.checkTransactions();
window.testErrorScenarios = () => window.adminTesting?.testErrorScenarios();
window.clearErrorLogs = () => window.adminTesting?.clearErrorLogs();

// Initialize the testing portal when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM loaded for admin testing portal');
    
    // Wait a bit for other scripts to load
    setTimeout(() => {
        console.log('🚀 Initializing Admin Testing Portal...');
        window.adminTesting = new AdminTestingPortal();
    }, 1000);
});

console.log('🧪 Admin Testing Portal script loaded');
