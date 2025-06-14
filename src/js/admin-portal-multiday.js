// Admin Portal - Multi-Day Contest Management
class MultiDayAdminPortal {
    constructor() {
        this.availableGames = [];
        this.selectedGames = {};  // Keyed by day index
        this.contestDays = [];
        this.currentDay = 0;
        this.totalDays = 5;
        console.log('🔧 Initializing Multi-Day Admin Portal...');
    }

    async init() {
        try {
            console.log('🚀 Loading multi-day admin portal...');
            
            // Initialize contest days
            this.initializeContestDays();
            
            // Create day tabs
            this.createDayTabs();
            
            // Load MLB API
            if (window.mlbAPI) {
                await window.mlbAPI.init();
            }
            
            // Load games for current day
            await this.loadGamesForDay(this.currentDay);
            
            // Load saved selections
            this.loadSavedSelections();
            
            // Update UI
            this.updateUI();
            
            console.log('✅ Multi-day admin portal initialized');
        } catch (error) {
            console.error('❌ Failed to initialize admin portal:', error);
            this.showError('Failed to load admin portal: ' + error.message);
        }
    }

    initializeContestDays() {
        const today = new Date();
        this.contestDays = [];
        
        for (let i = 0; i < this.totalDays; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            
            this.contestDays.push({
                date: date,
                dateString: date.toDateString(),
                displayName: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : `Day ${i + 1}`,
                games: [],
                selectedGames: [],
                isLoaded: false
            });
            
            // Initialize selected games for each day
            this.selectedGames[i] = [];
        }
        
        console.log('📅 Initialized', this.totalDays, 'contest days');
    }

    createDayTabs() {
        const tabsContainer = document.getElementById('admin-day-tabs');
        if (!tabsContainer) {
            console.warn('⚠️ Admin day tabs container not found');
            return;
        }

        tabsContainer.innerHTML = this.contestDays.map((contestDay, index) => {
            const date = contestDay.date;
            const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            const isActive = index === this.currentDay;
            
            return `
                <div class="admin-day-tab ${isActive ? 'active' : ''}" 
                     data-day="${index}" onclick="window.adminPortal.switchToDay(${index})">
                    <div class="tab-day">${contestDay.displayName}</div>
                    <div class="tab-date">${dateStr}</div>
                    <div class="tab-count" id="tab-count-${index}">0/10</div>
                </div>
            `;
        }).join('');
        
        console.log('📋 Created admin day tabs');
    }

    async switchToDay(dayIndex) {
        if (dayIndex === this.currentDay) return;
        
        console.log(`🔄 Switching admin view to day ${dayIndex}`);
        
        // Save current day's state
        this.saveCurrentDayState();
        
        // Switch to new day
        this.currentDay = dayIndex;
        
        // Update tab appearance
        document.querySelectorAll('.admin-day-tab').forEach((tab, index) => {
            tab.classList.toggle('active', index === dayIndex);
        });
        
        // Load games for new day if not already loaded
        if (!this.contestDays[dayIndex].isLoaded) {
            await this.loadGamesForDay(dayIndex);
        }
        
        // Update UI
        this.updateUI();
        this.updateCurrentDayInfo();
        
        console.log(`✅ Switched to day ${dayIndex}: ${this.contestDays[dayIndex].displayName}`);
    }

    async loadGamesForDay(dayIndex) {
        const contestDay = this.contestDays[dayIndex];
        if (!contestDay) return;
        
        console.log(`📅 Loading games for ${contestDay.displayName} (${contestDay.dateString})`);
        
        try {
            if (window.mlbAPI && dayIndex === 0) {
                // Load real games for today
                this.availableGames = await window.mlbAPI.getTodaysMLBGames();
            } else {
                // Generate mock games for future days
                this.availableGames = this.generateMockGamesForDate(contestDay.date);
            }
            
            contestDay.games = this.availableGames;
            contestDay.isLoaded = true;
            
            console.log(`✅ Loaded ${this.availableGames.length} games for ${contestDay.displayName}`);
        } catch (error) {
            console.error(`❌ Failed to load games for ${contestDay.displayName}:`, error);
            this.availableGames = this.generateMockGamesForDate(contestDay.date);
            contestDay.games = this.availableGames;
        }
    }

    generateMockGamesForDate(date) {
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
            ['Texas Rangers', 'Colorado Rockies'],
            ['Kansas City Royals', 'Miami Marlins']
        ];

        return mlbTeams.slice(0, 12).map((teams, index) => {
            const gameTime = new Date(date);
            gameTime.setHours(13 + (index % 8), 0, 0, 0); // Games between 1-8 PM
            
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

    generateRandomOdds() {
        const isNegative = Math.random() > 0.5;
        if (isNegative) {
            return -Math.floor(Math.random() * 200 + 100); // -100 to -300
        } else {
            return `+${Math.floor(Math.random() * 200 + 100)}`; // +100 to +300
        }
    }

    saveCurrentDayState() {
        // Save selections for current day
        const currentDayGames = this.getSelectedGamesForCurrentDay();
        this.selectedGames[this.currentDay] = currentDayGames;
        
        // Save to localStorage for persistence
        const contestDay = this.contestDays[this.currentDay];
        if (currentDayGames.length === 10) {
            const contestData = {
                contestDate: contestDay.date.toISOString(),
                games: currentDayGames,
                dayIndex: this.currentDay
            };
            
            localStorage.setItem(`daily_contest_games_${contestDay.dateString}`, JSON.stringify(contestData));
            console.log(`💾 Saved ${currentDayGames.length} games for ${contestDay.displayName}`);
        }
    }

    loadSavedSelections() {
        this.contestDays.forEach((contestDay, index) => {
            try {
                const saved = localStorage.getItem(`daily_contest_games_${contestDay.dateString}`);
                if (saved) {
                    const data = JSON.parse(saved);
                    if (data.games && data.games.length === 10) {
                        this.selectedGames[index] = data.games;
                        console.log(`📋 Loaded ${data.games.length} saved games for ${contestDay.displayName}`);
                    }
                }
            } catch (error) {
                console.warn(`⚠️ Failed to load saved games for ${contestDay.displayName}:`, error);
                this.selectedGames[index] = [];
            }
        });
    }

    getSelectedGamesForCurrentDay() {
        const selectedElements = document.querySelectorAll('.available-game.selected');
        const selectedGames = [];
        
        selectedElements.forEach(element => {
            const gameId = element.dataset.gameId;
            const game = this.availableGames.find(g => g.id === gameId);
            if (game) {
                selectedGames.push(game);
            }
        });
        
        return selectedGames;
    }

    updateUI() {
        this.displayAvailableGames();
        this.updateSelectedGamesList();
        this.updateDayStatusGrid();
        this.updateTabCounts();
    }

    displayAvailableGames() {
        const container = document.getElementById('gamesContainer');
        if (!container) {
            console.warn('⚠️ Games container not found');
            return;
        }

        if (this.availableGames.length === 0) {
            container.innerHTML = `
                <div class="loading">
                    <h3>No games available</h3>
                    <button class="admin-btn" onclick="window.adminPortal.loadGamesForDay(${this.currentDay})">
                        🔄 Reload Games
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="game-selection-grid">
                ${this.availableGames.map(game => this.renderGameCard(game)).join('')}
            </div>
        `;

        // Restore selections for current day
        this.restoreSelectionsForCurrentDay();
    }

    renderGameCard(game) {
        const gameDate = new Date(game.gameTime);
        const isSelected = this.selectedGames[this.currentDay]?.some(g => g.id === game.id) || false;
        
        return `
            <div class="available-game ${isSelected ? 'selected' : ''}" 
                 data-game-id="${game.id}" onclick="window.adminPortal.toggleGameSelection('${game.id}')">
                <div class="game-info">
                    <div class="game-time">
                        ${gameDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                    <div class="game-day">
                        ${this.contestDays[this.currentDay].displayName}
                    </div>
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
            </div>
        `;
    }

    restoreSelectionsForCurrentDay() {
        const currentDaySelections = this.selectedGames[this.currentDay] || [];
        
        currentDaySelections.forEach(selectedGame => {
            const gameElement = document.querySelector(`[data-game-id="${selectedGame.id}"]`);
            if (gameElement) {
                gameElement.classList.add('selected');
            }
        });
    }

    toggleGameSelection(gameId) {
        const gameElement = document.querySelector(`[data-game-id="${gameId}"]`);
        if (!gameElement) return;

        const isCurrentlySelected = gameElement.classList.contains('selected');
        const currentSelections = this.getSelectedGamesForCurrentDay();

        if (isCurrentlySelected) {
            // Deselect
            gameElement.classList.remove('selected');
        } else {
            // Select (if under limit)
            if (currentSelections.length >= 10) {
                this.showError('You can only select 10 games per day');
                return;
            }
            gameElement.classList.add('selected');
        }

        this.updateSelectedGamesList();
        this.updateCurrentDayInfo();
        this.updateTabCounts();
    }

    updateSelectedGamesList() {
        const container = document.getElementById('selectedGamesList');
        if (!container) return;

        const currentSelections = this.getSelectedGamesForCurrentDay();
        
        if (currentSelections.length === 0) {
            container.innerHTML = '<div class="no-selection">No games selected</div>';
        } else {
            container.innerHTML = currentSelections.map(game => `
                <div class="selected-game-item">
                    <span>${game.awayTeam} @ ${game.homeTeam}</span>
                    <button class="remove-btn" onclick="window.adminPortal.toggleGameSelection('${game.id}')">✕</button>
                </div>
            `).join('');
        }

        // Update progress bar
        const progressBar = document.getElementById('progress-bar');
        if (progressBar) {
            const percentage = (currentSelections.length / 10) * 100;
            progressBar.style.width = `${percentage}%`;
        }

        // Update selected count
        const selectedCount = document.getElementById('selectedCount');
        if (selectedCount) {
            selectedCount.textContent = `${currentSelections.length}/10 Games Selected`;
        }
    }

    updateCurrentDayInfo() {
        const dayDisplay = document.getElementById('selected-day-display');
        const countDisplay = document.getElementById('selected-count-display');
        
        if (dayDisplay) {
            dayDisplay.textContent = this.contestDays[this.currentDay].displayName;
        }
        
        if (countDisplay) {
            const count = this.getSelectedGamesForCurrentDay().length;
            countDisplay.textContent = `${count}/10 games selected`;
        }
    }

    updateTabCounts() {
        this.contestDays.forEach((_, index) => {
            const tabCount = document.getElementById(`tab-count-${index}`);
            if (tabCount) {
                const count = this.selectedGames[index]?.length || 0;
                tabCount.textContent = `${count}/10`;
            }
        });
    }

    updateDayStatusGrid() {
        const grid = document.getElementById('day-status-grid');
        if (!grid) return;

        grid.innerHTML = this.contestDays.map((contestDay, index) => {
            const count = this.selectedGames[index]?.length || 0;
            const status = count === 10 ? 'complete' : count > 0 ? 'partial' : '';
            
            return `
                <div class="day-status-item ${status}">
                    ${contestDay.displayName.replace('Day ', 'D')}
                    <br>${count}/10
                </div>
            `;
        }).join('');
    }

    // Admin Actions
    async refreshGames() {
        console.log('🔄 Refreshing games...');
        this.contestDays[this.currentDay].isLoaded = false;
        await this.loadGamesForDay(this.currentDay);
        this.updateUI();
        this.showSuccess('Games refreshed successfully');
    }

    autoSelectGames() {
        const currentSelections = this.getSelectedGamesForCurrentDay();
        const needed = 10 - currentSelections.length;
        
        if (needed <= 0) {
            this.showError('Already have 10 games selected');
            return;
        }

        // Clear current selections visually
        document.querySelectorAll('.available-game.selected').forEach(el => {
            el.classList.remove('selected');
        });

        // Auto-select first 10 available games
        const gameElements = document.querySelectorAll('.available-game');
        for (let i = 0; i < Math.min(10, gameElements.length); i++) {
            gameElements[i].classList.add('selected');
        }

        this.updateSelectedGamesList();
        this.updateCurrentDayInfo();
        this.updateTabCounts();
        this.showSuccess(`Auto-selected 10 games for ${this.contestDays[this.currentDay].displayName}`);
    }

    saveContestGames() {
        const currentSelections = this.getSelectedGamesForCurrentDay();
        
        if (currentSelections.length !== 10) {
            this.showError('Please select exactly 10 games before saving');
            return;
        }

        this.saveCurrentDayState();
        this.showSuccess(`Saved contest for ${this.contestDays[this.currentDay].displayName}`);
        this.updateTabCounts();
        this.updateDayStatusGrid();
    }

    clearAllGames() {
        if (!confirm('Clear all selected games for this day?')) return;

        document.querySelectorAll('.available-game.selected').forEach(el => {
            el.classList.remove('selected');
        });

        this.selectedGames[this.currentDay] = [];
        this.updateSelectedGamesList();
        this.updateCurrentDayInfo();
        this.updateTabCounts();
        this.updateDayStatusGrid();
        
        this.showSuccess(`Cleared all games for ${this.contestDays[this.currentDay].displayName}`);
    }

    copyToNextDay() {
        const nextDay = this.currentDay + 1;
        if (nextDay >= this.totalDays) {
            this.showError('No next day to copy to');
            return;
        }

        const currentSelections = this.getSelectedGamesForCurrentDay();
        if (currentSelections.length === 0) {
            this.showError('No games selected to copy');
            return;
        }

        // Note: This would need more complex logic to map games to next day
        this.showSuccess(`Would copy ${currentSelections.length} games to ${this.contestDays[nextDay].displayName}`);
    }

    publishAllDays() {
        const completeDays = this.contestDays.filter((_, index) => 
            this.selectedGames[index]?.length === 10
        ).length;

        if (completeDays === 0) {
            this.showError('No complete days to publish (need 10 games each)');
            return;
        }

        if (!confirm(`Publish ${completeDays} complete contest days?`)) return;

        // Save all complete days
        this.contestDays.forEach((contestDay, index) => {
            if (this.selectedGames[index]?.length === 10) {
                const contestData = {
                    contestDate: contestDay.date.toISOString(),
                    games: this.selectedGames[index],
                    dayIndex: index,
                    published: true,
                    publishedAt: new Date().toISOString()
                };
                
                localStorage.setItem(`daily_contest_games_${contestDay.dateString}`, JSON.stringify(contestData));
            }
        });

        this.showSuccess(`Published ${completeDays} contest days successfully! 🚀`);
    }

    // Utility methods
    showSuccess(message) {
        console.log('✅', message);
        this.showNotification(message, 'success');
    }

    showError(message) {
        console.error('❌', message);
        this.showNotification(message, 'error');
    }

    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#4CAF50' : '#f44336'};
            color: white;
            padding: 12px 20px;
            border-radius: 6px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 10000;
            transform: translateX(400px);
            transition: transform 0.3s ease;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => notification.style.transform = 'translateX(0)', 100);
        setTimeout(() => {
            notification.style.transform = 'translateX(400px)';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Global functions for HTML onclick handlers
window.refreshGames = () => window.adminPortal.refreshGames();
window.autoSelectGames = () => window.adminPortal.autoSelectGames();
window.saveContestGames = () => window.adminPortal.saveContestGames();
window.clearAllGames = () => window.adminPortal.clearAllGames();
window.copyToNextDay = () => window.adminPortal.copyToNextDay();
window.publishAllDays = () => window.adminPortal.publishAllDays();

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM loaded for multi-day admin portal');
    
    setTimeout(() => {
        console.log('🚀 Initializing Multi-Day Admin Portal...');
        window.adminPortal = new MultiDayAdminPortal();
        window.adminPortal.init();
    }, 500);
});

console.log('🔧 Multi-Day Admin Portal module loaded');
