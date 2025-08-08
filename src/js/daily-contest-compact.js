/**
 * Daily Contest Compact Manager
 * Optimized for compact display with Today/Tomorrow tabs
 */
class DailyContestCompact {
    constructor() {
        this.currentTab = 'today'; // 'today' or 'tomorrow'
        this.todayGames = [];
        this.tomorrowGames = [];
        this.userPicks = {};
        this.maxPicks = 10;
        
        console.log('🎮 Daily Contest Compact initialized');
    }
    
    async init() {
        try {
            console.log('🚀 Loading compact contest interface...');
            
            // Initialize MLB odds API
            if (!window.mlbOddsCompact) {
                console.error('❌ MLB Odds Compact API not loaded');
                return;
            }
            
            // Load games for both days
            await this.loadGames();
            
            // Set up UI
            this.setupTabs();
            this.setupEventListeners();
            this.displayGames();
            
            console.log('✅ Compact contest interface ready');
        } catch (error) {
            console.error('❌ Failed to initialize:', error);
            this.showError('Failed to load contest. Please refresh the page.');
        }
    }
    
    async loadGames() {
        console.log('📡 Loading MLB games...');
        
        // Load today's games
        this.todayGames = await window.mlbOddsCompact.getTodayGames();
        console.log(`📅 Loaded ${this.todayGames.length} games for today`);
        
        // Load tomorrow's games
        this.tomorrowGames = await window.mlbOddsCompact.getTomorrowGames();
        console.log(`📅 Loaded ${this.tomorrowGames.length} games for tomorrow`);
    }
    
    setupTabs() {
        const tabsContainer = document.getElementById('contest-tabs');
        if (!tabsContainer) {
            console.error('❌ Tabs container not found');
            return;
        }
        
        tabsContainer.innerHTML = `
            <div class="tabs-wrapper" style="
                display: flex;
                gap: 10px;
                margin-bottom: 20px;
                background: #1a1a1a;
                padding: 5px;
                border-radius: 8px;
                border: 1px solid #333;
            ">
                <button class="tab-btn active" data-tab="today" style="
                    flex: 1;
                    padding: 12px 20px;
                    background: #4CAF50;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    font-weight: bold;
                    cursor: pointer;
                    transition: all 0.3s ease;
                ">
                    Today (${this.todayGames.length})
                </button>
                <button class="tab-btn" data-tab="tomorrow" style="
                    flex: 1;
                    padding: 12px 20px;
                    background: #333;
                    color: #888;
                    border: none;
                    border-radius: 6px;
                    font-weight: bold;
                    cursor: pointer;
                    transition: all 0.3s ease;
                ">
                    Tomorrow (${this.tomorrowGames.length})
                </button>
            </div>
        `;
    }
    
    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.target.dataset.tab;
                this.switchTab(tab);
            });
        });
        
        // Submit button
        const submitBtn = document.getElementById('submit-picks-btn');
        if (submitBtn) {
            submitBtn.addEventListener('click', () => this.handleSubmit());
        }
    }
    
    switchTab(tab) {
        this.currentTab = tab;
        
        // Update tab styles
        document.querySelectorAll('.tab-btn').forEach(btn => {
            if (btn.dataset.tab === tab) {
                btn.classList.add('active');
                btn.style.background = '#4CAF50';
                btn.style.color = 'white';
            } else {
                btn.classList.remove('active');
                btn.style.background = '#333';
                btn.style.color = '#888';
            }
        });
        
        this.displayGames();
    }
    
    displayGames() {
        const container = document.getElementById('games-container');
        if (!container) {
            console.error('❌ Games container not found');
            return;
        }
        
        const games = this.currentTab === 'today' ? this.todayGames : this.tomorrowGames;
        const pickedCount = Object.keys(this.userPicks).length;
        
        container.innerHTML = `
            <div class="picks-header" style="
                background: #2a2a2a;
                padding: 15px;
                border-radius: 8px;
                margin-bottom: 15px;
                text-align: center;
                border: 1px solid #444;
            ">
                <h3 style="margin: 0 0 5px 0; color: #ffa500;">
                    ${this.currentTab === 'today' ? "Today's" : "Tomorrow's"} MLB Games
                </h3>
                <p style="margin: 0; color: #888; font-size: 0.9em;">
                    Picks: ${pickedCount}/${this.maxPicks} 
                    ${pickedCount < this.maxPicks ? `(${this.maxPicks - pickedCount} remaining)` : '✅ Ready to submit!'}
                </p>
            </div>
            
            <div class="games-grid" style="
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                gap: 10px;
                max-height: 60vh;
                overflow-y: auto;
                padding: 5px;
            ">
                ${games.map(game => this.renderCompactGameCard(game)).join('')}
            </div>
            
            ${this.renderSubmitSection(pickedCount)}
        `;
        
        // Add click handlers to game cards
        this.attachGameHandlers();
    }
    
    renderCompactGameCard(game) {
        const isPicked = this.userPicks[game.id];
        const pickedTeam = this.userPicks[game.id];
        const gameTime = new Date(game.gameTime);
        const timeStr = gameTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        return `
            <div class="game-card-compact" data-game-id="${game.id}" style="
                background: ${isPicked ? '#2a3a2a' : '#2a2a2a'};
                border: 2px solid ${isPicked ? '#4CAF50' : '#444'};
                border-radius: 8px;
                padding: 10px;
                cursor: pointer;
                transition: all 0.2s ease;
                position: relative;
            ">
                ${isPicked ? `
                    <div style="
                        position: absolute;
                        top: 5px;
                        right: 5px;
                        color: #4CAF50;
                        font-size: 1.2em;
                    ">✓</div>
                ` : ''}
                
                <div style="
                    text-align: center;
                    margin-bottom: 8px;
                    font-size: 0.8em;
                    color: #ffa500;
                    font-weight: bold;
                ">${timeStr}</div>
                
                <div style="
                    display: grid;
                    grid-template-columns: 1fr auto 1fr;
                    gap: 8px;
                    align-items: center;
                ">
                    <div class="team-box" data-team="away" style="
                        background: ${pickedTeam === 'away' ? '#4CAF50' : '#333'};
                        color: ${pickedTeam === 'away' ? '#000' : '#fff'};
                        padding: 8px 6px;
                        border-radius: 4px;
                        text-align: center;
                        font-size: 0.85em;
                        font-weight: bold;
                        transition: all 0.2s ease;
                    ">
                        <div>${game.awayTeam}</div>
                        <div style="font-size: 0.8em; opacity: 0.8;">${game.awayOdds}</div>
                    </div>
                    
                    <div style="
                        color: #666;
                        font-size: 0.8em;
                    ">@</div>
                    
                    <div class="team-box" data-team="home" style="
                        background: ${pickedTeam === 'home' ? '#4CAF50' : '#333'};
                        color: ${pickedTeam === 'home' ? '#000' : '#fff'};
                        padding: 8px 6px;
                        border-radius: 4px;
                        text-align: center;
                        font-size: 0.85em;
                        font-weight: bold;
                        transition: all 0.2s ease;
                    ">
                        <div>${game.homeTeam}</div>
                        <div style="font-size: 0.8em; opacity: 0.8;">${game.homeOdds}</div>
                    </div>
                </div>
            </div>
        `;
    }
    
    renderSubmitSection(pickedCount) {
        const isReady = pickedCount === this.maxPicks;
        
        return `
            <div class="submit-section" style="
                margin-top: 20px;
                padding: 20px;
                background: #1a1a1a;
                border-radius: 8px;
                border: 2px solid ${isReady ? '#4CAF50' : '#333'};
                text-align: center;
            ">
                <div style="
                    margin-bottom: 15px;
                    background: #2a2a2a;
                    border-radius: 20px;
                    overflow: hidden;
                    height: 10px;
                ">
                    <div style="
                        background: linear-gradient(90deg, #4CAF50, #00ff88);
                        height: 100%;
                        width: ${(pickedCount / this.maxPicks) * 100}%;
                        transition: width 0.3s ease;
                    "></div>
                </div>
                
                <button id="submit-picks-btn" style="
                    background: ${isReady ? 'linear-gradient(135deg, #4CAF50, #00ff88)' : '#555'};
                    color: ${isReady ? '#000' : '#888'};
                    border: none;
                    padding: 15px 40px;
                    border-radius: 8px;
                    font-size: 1.1em;
                    font-weight: bold;
                    cursor: ${isReady ? 'pointer' : 'not-allowed'};
                    transition: all 0.3s ease;
                    box-shadow: ${isReady ? '0 0 20px rgba(76, 175, 80, 0.3)' : 'none'};
                " ${!isReady ? 'disabled' : ''}>
                    ${isReady ? '🎯 Submit Picks (50 NUTS)' : `Select ${this.maxPicks - pickedCount} More Games`}
                </button>
                
                <div style="
                    margin-top: 10px;
                    font-size: 0.8em;
                    color: #666;
                ">
                    💰 Entry fee: 50 NUTS • 🏆 Top 3 split prize pool
                </div>
            </div>
        `;
    }
    
    attachGameHandlers() {
        document.querySelectorAll('.game-card-compact').forEach(card => {
            card.addEventListener('click', (e) => {
                const gameId = card.dataset.gameId;
                const teamBox = e.target.closest('.team-box');
                
                if (teamBox) {
                    const team = teamBox.dataset.team;
                    this.handlePick(gameId, team);
                } else if (this.userPicks[gameId]) {
                    // Click on card to remove pick
                    this.removePick(gameId);
                }
            });
        });
    }
    
    handlePick(gameId, team) {
        const pickedCount = Object.keys(this.userPicks).length;
        
        // Check if we're at max picks
        if (pickedCount >= this.maxPicks && !this.userPicks[gameId]) {
            this.showError(`You can only pick ${this.maxPicks} games!`);
            return;
        }
        
        // Toggle pick
        if (this.userPicks[gameId] === team) {
            delete this.userPicks[gameId];
        } else {
            this.userPicks[gameId] = team;
        }
        
        console.log(`🎯 Pick updated: Game ${gameId} -> ${team}`);
        this.displayGames();
    }
    
    removePick(gameId) {
        delete this.userPicks[gameId];
        console.log(`🗑️ Pick removed: Game ${gameId}`);
        this.displayGames();
    }
    
    async handleSubmit() {
        try {
            const pickedCount = Object.keys(this.userPicks).length;
            
            if (pickedCount !== this.maxPicks) {
                this.showError(`Please select exactly ${this.maxPicks} games`);
                return;
            }
            
            console.log('💰 Showing payment QR code...');
            
            // Prepare picks data
            const picksData = this.preparePicks();
            
            // Show payment QR
            if (window.xamanPayment) {
                const result = await window.xamanPayment.createContestPayment();
                
                if (result.success) {
                    console.log('✅ Payment successful:', result);
                    this.showSuccess('Contest entry submitted! Good luck! 🍀');
                    
                    // Save entry
                    this.saveEntry(picksData, result.txHash);
                    
                    // Disable further changes
                    this.disableInterface();
                }
            } else {
                throw new Error('Payment system not loaded');
            }
        } catch (error) {
            console.error('❌ Submit failed:', error);
            this.showError('Failed to submit entry: ' + error.message);
        }
    }
    
    preparePicks() {
        const allGames = [...this.todayGames, ...this.tomorrowGames];
        const picks = [];
        
        Object.entries(this.userPicks).forEach(([gameId, team]) => {
            const game = allGames.find(g => g.id === gameId);
            if (game) {
                picks.push({
                    gameId,
                    team,
                    game: {
                        homeTeam: game.homeTeam,
                        awayTeam: game.awayTeam,
                        gameTime: game.gameTime,
                        selectedTeam: team === 'home' ? game.homeTeam : game.awayTeam,
                        odds: team === 'home' ? game.homeOdds : game.awayOdds
                    }
                });
            }
        });
        
        return picks;
    }
    
    saveEntry(picks, txHash) {
        const entry = {
            timestamp: new Date().toISOString(),
            picks,
            txHash,
            entryFee: 50,
            userId: 'USER_' + Date.now()
        };
        
        localStorage.setItem(`contest_entry_${Date.now()}`, JSON.stringify(entry));
        console.log('💾 Entry saved:', entry);
    }
    
    disableInterface() {
        document.querySelectorAll('.game-card-compact').forEach(card => {
            card.style.opacity = '0.6';
            card.style.pointerEvents = 'none';
        });
        
        const submitBtn = document.getElementById('submit-picks-btn');
        if (submitBtn) {
            submitBtn.textContent = '✅ Entry Submitted';
            submitBtn.disabled = true;
        }
    }
    
    showError(message) {
        this.showNotification(message, 'error');
    }
    
    showSuccess(message) {
        this.showNotification(message, 'success');
    }
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#4CAF50' : '#f44336'};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            animation: slideIn 0.3s ease-out;
        `;
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => notification.remove(), 3000);
    }
}

// Initialize when ready
window.addEventListener('DOMContentLoaded', () => {
    window.dailyContestCompact = new DailyContestCompact();
    window.dailyContestCompact.init();
});

console.log('🎮 Daily Contest Compact module loaded');