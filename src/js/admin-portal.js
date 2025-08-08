// Admin Portal for managing daily contests and game selection
// Allows admins to select 10 MLB games for each day's contest

class AdminPortal {
    constructor() {
        this.availableGames = [];
        this.selectedGames = [];
        this.currentFilter = 'all';
        this.maxGamesPerContest = 10;
        
        console.log('🔧 Admin Portal initialized');
    }

    async init() {
        try {
            console.log('⚡ Initializing Admin Portal...');
            
            // Initialize MLB API
            if (window.mlbAPI) {
                await window.mlbAPI.init();
            }
            
            // Load available games
            await this.loadAvailableGames();
            
            // Load existing contest selection
            this.loadExistingSelection();
            
            // Update UI
            this.updateUI();
            
            console.log('✅ Admin Portal ready');
        } catch (error) {
            console.error('❌ Failed to initialize Admin Portal:', error);
            this.showError('Failed to initialize admin portal: ' + error.message);
        }
    }

    async loadAvailableGames() {
        try {
            console.log('📡 Loading available MLB games...');
            
            if (window.mlbAPI) {
                this.availableGames = await window.mlbAPI.getAllAvailableMLBGames();
            } else {
                throw new Error('MLB API not available');
            }
            
            console.log(`✅ Loaded ${this.availableGames.length} available games`);
            
            // Sort games by date and time
            this.availableGames.sort((a, b) => new Date(a.gameTime) - new Date(b.gameTime));
            
        } catch (error) {
            console.error('❌ Failed to load games:', error);
            this.showError('Failed to load MLB games: ' + error.message);
            this.availableGames = [];
        }
    }

    loadExistingSelection() {
        try {
            const saved = localStorage.getItem('admin_selected_games');
            if (saved) {
                this.selectedGames = JSON.parse(saved);
                console.log(`📋 Loaded ${this.selectedGames.length} previously selected games`);
            }
        } catch (error) {
            console.warn('⚠️ Could not load existing selection:', error);
            this.selectedGames = [];
        }
    }

    saveSelection() {
        try {
            localStorage.setItem('admin_selected_games', JSON.stringify(this.selectedGames));
            localStorage.setItem('admin_selection_timestamp', new Date().toISOString());
            console.log('💾 Selection saved to local storage');
        } catch (error) {
            console.error('❌ Failed to save selection:', error);
        }
    }

    toggleGameSelection(gameId) {
        const gameIndex = this.selectedGames.findIndex(g => g.id === gameId);
        
        if (gameIndex >= 0) {
            // Remove game from selection
            this.selectedGames.splice(gameIndex, 1);
            console.log(`➖ Removed game ${gameId} from selection`);
        } else {
            // Add game to selection (if under limit)
            if (this.selectedGames.length >= this.maxGamesPerContest) {
                this.showError(`Cannot select more than ${this.maxGamesPerContest} games for a contest`);
                return;
            }
            
            const game = this.availableGames.find(g => g.id === gameId);
            if (game) {
                this.selectedGames.push(game);
                console.log(`➕ Added game ${gameId} to selection`);
            }
        }
        
        this.saveSelection();
        this.updateUI();
    }

    removeGameFromSelection(gameId) {
        const gameIndex = this.selectedGames.findIndex(g => g.id === gameId);
        if (gameIndex >= 0) {
            this.selectedGames.splice(gameIndex, 1);
            this.saveSelection();
            this.updateUI();
            console.log(`🗑️ Removed game ${gameId} from selection`);
        }
    }

    clearSelection() {
        this.selectedGames = [];
        this.saveSelection();
        this.updateUI();
        console.log('🗑️ Cleared all selected games');
        this.showSuccess('All games cleared from selection');
    }

    autoSelectGames() {
        // Clear current selection
        this.selectedGames = [];
        
        // Get filtered games
        const filteredGames = this.getFilteredGames();
        
        if (filteredGames.length < this.maxGamesPerContest) {
            this.showError(`Not enough games available. Found ${filteredGames.length}, need ${this.maxGamesPerContest}`);
            return;
        }
        
        // Select first 10 games
        this.selectedGames = filteredGames.slice(0, this.maxGamesPerContest);
        this.saveSelection();
        this.updateUI();
        
        console.log(`🎲 Auto-selected ${this.selectedGames.length} games`);
        this.showSuccess(`Auto-selected ${this.selectedGames.length} games for the contest`);
    }

    getFilteredGames() {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const todayStr = today.toDateString();
        const tomorrowStr = tomorrow.toDateString();
        
        switch (this.currentFilter) {
            case 'today':
                return this.availableGames.filter(game => {
                    const gameDate = new Date(game.gameTime);
                    return gameDate.toDateString() === todayStr;
                });
            case 'tomorrow':
                return this.availableGames.filter(game => {
                    const gameDate = new Date(game.gameTime);
                    return gameDate.toDateString() === tomorrowStr;
                });
            default:
                return this.availableGames;
        }
    }

    filterGames(filter) {
        this.currentFilter = filter;
        
        // Update filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.filter === filter) {
                btn.classList.add('active');
            }
        });
        
        this.updateAvailableGamesDisplay();
        console.log(`🔍 Applied filter: ${filter}`);
    }

    updateUI() {
        this.updateContestStatus();
        this.updateAvailableGamesDisplay();
        this.updateSelectedGamesDisplay();
        this.updateActionButtons();
    }

    updateContestStatus() {
        const statusElement = document.getElementById('contestStatus');
        const today = new Date().toDateString();
        const selectedForToday = this.selectedGames.filter(game => {
            const gameDate = new Date(game.gameTime);
            return gameDate.toDateString() === today;
        }).length;
        
        statusElement.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                <div style="background: #2a2a2a; padding: 15px; border-radius: 8px; text-align: center;">
                    <h4 style="margin: 0 0 10px 0; color: #ffa500;">Today's Contest</h4>
                    <p style="margin: 0; font-size: 1.2em;">${selectedForToday} / ${this.maxGamesPerContest} games selected</p>
                </div>
                <div style="background: #2a2a2a; padding: 15px; border-radius: 8px; text-align: center;">
                    <h4 style="margin: 0 0 10px 0; color: #ffa500;">Available Games</h4>
                    <p style="margin: 0; font-size: 1.2em;">${this.availableGames.length} total</p>
                </div>
                <div style="background: #2a2a2a; padding: 15px; border-radius: 8px; text-align: center;">
                    <h4 style="margin: 0 0 10px 0; color: #ffa500;">Last Updated</h4>
                    <p style="margin: 0; font-size: 1.2em;">${new Date().toLocaleTimeString()}</p>
                </div>
            </div>
        `;
    }

    updateAvailableGamesDisplay() {
        const container = document.getElementById('availableGames');
        const countElement = document.getElementById('gamesCount');
        const filteredGames = this.getFilteredGames();
        
        countElement.textContent = `${filteredGames.length} games`;
        
        if (filteredGames.length === 0) {
            container.innerHTML = '<div class="loading">No games available for the selected filter</div>';
            return;
        }
        
        container.innerHTML = filteredGames.map(game => {
            const isSelected = this.selectedGames.some(g => g.id === game.id);
            const gameDate = new Date(game.gameTime);
            const isToday = gameDate.toDateString() === new Date().toDateString();
            const isTomorrow = gameDate.toDateString() === new Date(Date.now() + 24*60*60*1000).toDateString();
            
            let dayLabel = gameDate.toLocaleDateString();
            if (isToday) dayLabel = 'Today';
            else if (isTomorrow) dayLabel = 'Tomorrow';
            
            return `
                <div class="available-game ${isSelected ? 'selected' : ''}" 
                     onclick="window.adminPortal.toggleGameSelection('${game.id}')">
                    <div class="game-info">
                        <div class="game-time">${gameDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                        <div class="game-day">${dayLabel}</div>
                    </div>
                    
                    <div class="matchup">
                        <div class="team">
                            <div class="team-name">${game.awayTeam}</div>
                            <div class="team-odds">${game.awayOdds}</div>
                        </div>
                        
                        <div class="vs">@</div>
                        
                        <div class="team">
                            <div class="team-name">${game.homeTeam}</div>
                            <div class="team-odds">${game.homeOdds}</div>
                        </div>
                    </div>
                    
                    <div style="font-size: 0.8em; color: #888; margin-top: 8px;">
                        ${game.bookmaker} | ID: ${game.id}
                    </div>
                </div>
            `;
        }).join('');
    }

    updateSelectedGamesDisplay() {
        const countElement = document.getElementById('selectedCount');
        const listElement = document.getElementById('selectedGamesList');
        
        countElement.textContent = `${this.selectedGames.length} / ${this.maxGamesPerContest} games selected`;
        
        if (this.selectedGames.length === 0) {
            listElement.innerHTML = '<p style="text-align: center; color: #666;">No games selected yet</p>';
            return;
        }
        
        // Sort selected games by time
        const sortedSelected = [...this.selectedGames].sort((a, b) => new Date(a.gameTime) - new Date(b.gameTime));
        
        listElement.innerHTML = sortedSelected.map((game, index) => {
            const gameDate = new Date(game.gameTime);
            const isToday = gameDate.toDateString() === new Date().toDateString();
            
            return `
                <div class="selected-game-item">
                    <div style="flex: 1;">
                        <div style="font-weight: bold; font-size: 0.9em;">
                            ${game.awayTeam} @ ${game.homeTeam}
                        </div>
                        <div style="font-size: 0.8em; color: #888;">
                            ${isToday ? 'Today' : 'Tomorrow'} ${gameDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>
                    </div>
                    <button class="remove-btn" onclick="window.adminPortal.removeGameFromSelection('${game.id}')">
                        ✕
                    </button>
                </div>
            `;
        }).join('');
    }

    updateActionButtons() {
        const saveBtn = document.getElementById('saveContestBtn');
        
        if (this.selectedGames.length === this.maxGamesPerContest) {
            saveBtn.disabled = false;
            saveBtn.classList.add('success');
            saveBtn.textContent = `💾 Save Contest (${this.selectedGames.length} games)`;
        } else {
            saveBtn.disabled = true;
            saveBtn.classList.remove('success');
            saveBtn.textContent = `💾 Save Contest (${this.selectedGames.length}/${this.maxGamesPerContest})`;
        }
    }

    async saveContestGames() {
        if (this.selectedGames.length !== this.maxGamesPerContest) {
            this.showError(`Please select exactly ${this.maxGamesPerContest} games`);
            return;
        }
        
        try {
            // Save to localStorage
            this.saveSelection();
            
            // Save with timestamp for contest management
            const contestData = {
                games: this.selectedGames,
                createdAt: new Date().toISOString(),
                contestDate: new Date().toDateString(),
                gameCount: this.selectedGames.length
            };
            
            localStorage.setItem('daily_contest_games', JSON.stringify(contestData));
            
            console.log('💾 Contest games saved successfully');
            this.showSuccess(`Contest saved! ${this.selectedGames.length} games selected for today's contest.`);
            
            // Update UI to reflect saved state
            this.updateUI();
            
        } catch (error) {
            console.error('❌ Failed to save contest:', error);
            this.showError('Failed to save contest: ' + error.message);
        }
    }

    async refreshGames() {
        this.showInfo('🔄 Refreshing MLB games...');
        
        try {
            await this.loadAvailableGames();
            this.updateUI();
            this.showSuccess('✅ Games refreshed successfully');
        } catch (error) {
            this.showError('Failed to refresh games: ' + error.message);
        }
    }

    showSuccess(message) {
        this.showMessage(message, 'success');
    }

    showError(message) {
        this.showMessage(message, 'error');
    }

    showInfo(message) {
        this.showMessage(message, 'info');
    }

    showMessage(message, type) {
        const resultsElement = document.getElementById('actionResults');
        const messageDiv = document.createElement('div');
        
        const colors = {
            success: '#4CAF50',
            error: '#f44336',
            info: '#2196F3'
        };
        
        messageDiv.style.cssText = `
            background: ${colors[type]}20;
            border: 1px solid ${colors[type]};
            color: ${colors[type]};
            padding: 15px;
            border-radius: 5px;
            margin: 10px 0;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;
        
        messageDiv.textContent = message;
        resultsElement.appendChild(messageDiv);
        
        // Fade in
        setTimeout(() => messageDiv.style.opacity = '1', 100);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            messageDiv.style.opacity = '0';
            setTimeout(() => {
                if (messageDiv.parentNode) {
                    messageDiv.parentNode.removeChild(messageDiv);
                }
            }, 300);
        }, 5000);
    }
}

// Global functions for HTML onclick events
window.filterGames = (filter) => window.adminPortal.filterGames(filter);
window.refreshGames = () => window.adminPortal.refreshGames();
window.clearSelection = () => window.adminPortal.clearSelection();
window.autoSelectGames = () => window.adminPortal.autoSelectGames();
window.saveContestGames = () => window.adminPortal.saveContestGames();

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.adminPortal = new AdminPortal();
    window.adminPortal.init();
});

console.log('🔧 Admin Portal module loaded');
