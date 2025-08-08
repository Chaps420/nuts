// Multi-Day Admin Portal - Compact 5-Day Contest Management
class MultiDayAdminPortal {
    constructor() {
        this.currentDay = 0; // 0 = today, 1 = tomorrow, etc.
        this.contestDays = [];
        this.availableGames = [];
        this.selectedGamesPerDay = {}; // { dayIndex: [games] }
        this.isLoading = false;
        
        console.log('🔧 Initializing Multi-Day Admin Portal...');
    }

    async init() {
        try {
            console.log('🚀 Loading multi-day admin portal...');
            
            this.initializeContestDays();
            this.createDayTabs();
            await this.loadGamesForCurrentDay();
            this.loadSavedSelections();
            this.updateUI();
            
            console.log('✅ Multi-day admin portal initialized');
            
        } catch (error) {
            console.error('❌ Failed to initialize admin portal:', error);
            this.showError('Failed to initialize admin portal: ' + error.message);
        }
    }

    initializeContestDays() {
        const today = new Date();
        this.contestDays = [];
        
        for (let i = 0; i < 5; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            
            this.contestDays.push({
                index: i,
                date: date,
                dateString: date.toDateString(),
                displayName: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : `Day ${i + 1}`,
                shortDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                isLoaded: false
            });
        }
        
        // Initialize empty selections for each day
        this.contestDays.forEach(day => {
            this.selectedGamesPerDay[day.index] = [];
        });
        
        console.log('📅 Initialized 5 contest days:', this.contestDays.map(d => d.displayName));
    }

    createDayTabs() {
        const tabsContainer = document.getElementById('admin-day-tabs');
        if (!tabsContainer) {
            console.warn('⚠️ Admin day tabs container not found');
            return;
        }

        tabsContainer.innerHTML = this.contestDays.map((day, index) => {
            const selectedCount = this.selectedGamesPerDay[index]?.length || 0;
            const isComplete = selectedCount === 10;
            
            return `
                <div class="admin-day-tab ${index === this.currentDay ? 'active' : ''} ${isComplete ? 'complete' : ''}" 
                     data-day="${index}" onclick="window.adminPortal.switchToDay(${index})">
                    <div class="tab-day-name">${day.displayName}</div>
                    <div class="tab-day-date">${day.shortDate}</div>
                    <div class="tab-day-count">${selectedCount}/10</div>
                </div>
            `;
        }).join('');
        
        this.updateDayInfo();
        console.log('📋 Created compact day tabs');
    }

    updateDayInfo() {
        const dayDisplay = document.getElementById('selected-day-display');
        const countDisplay = document.getElementById('selected-count-display');
        
        if (dayDisplay) {
            const currentDay = this.contestDays[this.currentDay];
            dayDisplay.textContent = `${currentDay.displayName} (${currentDay.shortDate})`;
        }
        
        if (countDisplay) {
            const selectedCount = this.selectedGamesPerDay[this.currentDay]?.length || 0;
            countDisplay.textContent = `${selectedCount}/10 games selected`;
            countDisplay.style.color = selectedCount === 10 ? '#4CAF50' : selectedCount > 0 ? '#ffa500' : '#888';
        }
    }

    async switchToDay(dayIndex) {
        if (dayIndex === this.currentDay || this.isLoading) return;
        
        console.log(`🔄 Switching to day ${dayIndex} (${this.contestDays[dayIndex].displayName})`);
        
        this.currentDay = dayIndex;
        
        // Update tab appearance
        document.querySelectorAll('.admin-day-tab').forEach((tab, index) => {
            tab.classList.toggle('active', index === dayIndex);
        });
        
        // Update day info
        this.updateDayInfo();
        
        // Load games for new day
        await this.loadGamesForCurrentDay();
        this.updateGameDisplay();
        this.updateSelectedGamesPanel();
        
        console.log(`✅ Switched to day ${dayIndex}`);
    }

    async loadGamesForCurrentDay() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        const currentDay = this.contestDays[this.currentDay];
        
        try {
            console.log(`⚾ Loading games for ${currentDay.displayName}...`);
            
            if (window.mlbAPI && this.currentDay === 0) {
                // Load real games for today
                this.availableGames = await window.mlbAPI.getTodaysMLBGames();
            } else {
                // Use mock games for future days
                this.availableGames = this.generateMockGamesForDay(currentDay.date);
            }
            
            currentDay.isLoaded = true;
            console.log(`📋 Loaded ${this.availableGames.length} games for ${currentDay.displayName}`);
            
        } catch (error) {
            console.error(`❌ Failed to load games for ${currentDay.displayName}:`, error);
            this.availableGames = this.generateMockGamesForDay(currentDay.date);
        }
        
        this.isLoading = false;
    }

    generateMockGamesForDay(date) {
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
            ['Kansas City Royals', 'Pittsburgh Pirates']
        ];

        return mlbTeams.slice(0, 12).map((teams, index) => {
            const gameTime = new Date(date);
            gameTime.setHours(13 + (index % 8), 0, 0, 0); // Spread games 1 PM - 8 PM
            
            return {
                id: `${date.toDateString()}_game_${index + 1}`,
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
    }    updateGameDisplay() {
        const gamesContainer = document.getElementById('gamesContainer');
        if (!gamesContainer) {
            console.warn('⚠️ Games container not found');
            return;
        }

        if (this.availableGames.length === 0) {
            gamesContainer.innerHTML = `
                <div class="loading" style="text-align: center; padding: 40px;">
                    <p>No games available for this day</p>
                    <button class="admin-btn" onclick="window.adminPortal.loadGamesForCurrentDay()">🔄 Retry</button>
                </div>
            `;
            return;
        }

        const selectedGameIds = new Set(this.selectedGamesPerDay[this.currentDay].map(g => g.id));

        gamesContainer.innerHTML = this.availableGames.map(game => {
            const gameTime = new Date(game.gameTime);
            const isSelected = selectedGameIds.has(game.id);
            
            return `
                <div class="available-game ${isSelected ? 'selected' : ''}" 
                     data-game-id="${game.id}" onclick="window.adminPortal.toggleGameSelection('${game.id}')">
                    <div class="game-info">
                        <span class="game-time">${gameTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        <span class="game-day">${gameTime.toLocaleDateString('en-US', { weekday: 'short' })}</span>
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
                    ${isSelected ? '<div class="selected-indicator">✓ Selected</div>' : ''}
                </div>
            `;
        }).join('');
    }

    toggleGameSelection(gameId) {
        const game = this.availableGames.find(g => g.id === gameId);
        if (!game) return;

        const selectedGames = this.selectedGamesPerDay[this.currentDay];
        const gameIndex = selectedGames.findIndex(g => g.id === gameId);

        if (gameIndex > -1) {
            // Remove game
            selectedGames.splice(gameIndex, 1);
            console.log(`➖ Removed game: ${game.awayTeam} @ ${game.homeTeam}`);
        } else {
            // Add game (if under limit)
            if (selectedGames.length < 10) {
                selectedGames.push(game);
                console.log(`➕ Added game: ${game.awayTeam} @ ${game.homeTeam}`);
            } else {
                this.showError('Maximum 10 games allowed per day');
                return;
            }
        }

        this.updateUI();
        this.saveSelectionsToStorage();
    }

    updateUI() {
        this.updateGameDisplay();
        this.updateSelectedGamesPanel();
        this.updateDayTabs();
        this.updateDayInfo();
    }

    updateDayTabs() {
        document.querySelectorAll('.admin-day-tab').forEach((tab, index) => {
            const selectedCount = this.selectedGamesPerDay[index]?.length || 0;
            const isComplete = selectedCount === 10;
            
            tab.classList.toggle('complete', isComplete);
            
            const countElement = tab.querySelector('.tab-day-count');
            if (countElement) {
                countElement.textContent = `${selectedCount}/10`;
            }
        });
    }

    updateSelectedGamesPanel() {
        const selectedGames = this.selectedGamesPerDay[this.currentDay];
        const panel = document.getElementById('selected-games-list');
        
        if (!panel) return;

        if (selectedGames.length === 0) {
            panel.innerHTML = '<p style="color: #888; text-align: center; font-style: italic;">No games selected</p>';
            return;
        }

        panel.innerHTML = selectedGames.map((game, index) => `
            <div class="selected-game-item">
                <div class="selected-game-info">
                    <div class="selected-game-teams">${game.awayTeam} @ ${game.homeTeam}</div>
                    <div class="selected-game-time">${new Date(game.gameTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                </div>
                <button class="remove-btn" onclick="window.adminPortal.toggleGameSelection('${game.id}')">✕</button>
            </div>
        `).join('');
    }

    saveSelectionsToStorage() {
        try {
            // Save current day's selections
            const currentDay = this.contestDays[this.currentDay];
            const storageKey = `daily_contest_games_${currentDay.dateString}`;
            
            const contestData = {
                contestDate: currentDay.date.toISOString(),
                dateString: currentDay.dateString,
                games: this.selectedGamesPerDay[this.currentDay],
                lastUpdated: new Date().toISOString()
            };
            
            localStorage.setItem(storageKey, JSON.stringify(contestData));
            
            // Also save overview of all days
            const overview = {
                lastUpdated: new Date().toISOString(),
                days: this.contestDays.map(day => ({
                    index: day.index,
                    dateString: day.dateString,
                    gameCount: this.selectedGamesPerDay[day.index]?.length || 0,
                    isComplete: (this.selectedGamesPerDay[day.index]?.length || 0) === 10
                }))
            };
            
            localStorage.setItem('multi_day_contest_overview', JSON.stringify(overview));
            
            console.log(`💾 Saved ${this.selectedGamesPerDay[this.currentDay].length} games for ${currentDay.displayName}`);
            
        } catch (error) {
            console.error('❌ Failed to save selections:', error);
            this.showError('Failed to save selections');
        }
    }

    loadSavedSelections() {
        try {
            this.contestDays.forEach(day => {
                const storageKey = `daily_contest_games_${day.dateString}`;
                const savedData = localStorage.getItem(storageKey);
                
                if (savedData) {
                    const parsed = JSON.parse(savedData);
                    if (parsed.games && Array.isArray(parsed.games)) {
                        this.selectedGamesPerDay[day.index] = parsed.games;
                        console.log(`📁 Loaded ${parsed.games.length} saved games for ${day.displayName}`);
                    }
                }
            });
            
        } catch (error) {
            console.error('❌ Failed to load saved selections:', error);
        }
    }

    // Admin actions
    async refreshGames() {
        console.log('🔄 Refreshing games...');
        await this.loadGamesForCurrentDay();
        this.updateGameDisplay();
    }

    autoSelectGames() {
        const selectedGames = this.selectedGamesPerDay[this.currentDay];
        const availableGames = this.availableGames.filter(g => 
            !selectedGames.some(sg => sg.id === g.id)
        );
        
        const needed = 10 - selectedGames.length;
        const toSelect = availableGames.slice(0, needed);
        
        this.selectedGamesPerDay[this.currentDay].push(...toSelect);
        
        this.updateUI();
        this.saveSelectionsToStorage();
        
        console.log(`🎲 Auto-selected ${toSelect.length} games`);
    }

    clearAllSelections() {
        if (confirm(`Clear all selections for ${this.contestDays[this.currentDay].displayName}?`)) {
            this.selectedGamesPerDay[this.currentDay] = [];
            this.updateUI();
            this.saveSelectionsToStorage();
            console.log('🧹 Cleared all selections for current day');
        }
    }

    saveContestGames() {
        const selectedGames = this.selectedGamesPerDay[this.currentDay];
        
        if (selectedGames.length !== 10) {
            this.showError('Please select exactly 10 games before saving');
            return;
        }

        this.saveSelectionsToStorage();
        this.showSuccess(`Saved contest for ${this.contestDays[this.currentDay].displayName}`);
        console.log(`💾 Saved ${selectedGames.length} games for day ${this.currentDay}`);
    }

    copyToNextDay() {
        const nextDay = this.currentDay + 1;
        if (nextDay >= 5) {
            this.showError('No next day to copy to');
            return;
        }

        const currentSelections = this.selectedGamesPerDay[this.currentDay];
        if (currentSelections.length === 0) {
            this.showError('No games selected to copy');
            return;
        }

        this.selectedGamesPerDay[nextDay] = [...currentSelections];
        this.updateUI();
        this.saveSelectionsToStorage();
        this.showSuccess(`Copied ${currentSelections.length} games to ${this.contestDays[nextDay].displayName}`);
    }

    publishAllDays() {
        let publishedCount = 0;
        this.contestDays.forEach((day, index) => {
            const gameCount = this.selectedGamesPerDay[index]?.length || 0;
            if (gameCount === 10) {
                publishedCount++;
            }
        });

        if (publishedCount === 0) {
            this.showError('No complete days to publish (need 10 games per day)');
            return;
        }

        this.showSuccess(`Published ${publishedCount} out of 5 contest days!`);
        console.log(`🚀 Published ${publishedCount} contest days`);
    }

    publishAllContests() {
        return this.publishAllDays();
    }

    showError(message) {
        console.error('❌', message);
        alert('Error: ' + message);
    }

    showSuccess(message) {
        console.log('✅', message);
        alert('Success: ' + message);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 Admin Portal DOM loaded');
    
    setTimeout(() => {
        console.log('🔧 Initializing Multi-Day Admin Portal...');
        window.adminPortal = new MultiDayAdminPortal();
        window.adminPortal.init();
    }, 500);
});

// Global functions for HTML onclick handlers
window.refreshGames = () => window.adminPortal?.refreshGames();
window.autoSelectGames = () => window.adminPortal?.autoSelectGames();
window.clearAllSelections = () => window.adminPortal?.clearAllSelections();
window.publishAllContests = () => window.adminPortal?.publishAllContests();
window.saveContestGames = () => window.adminPortal?.saveContestGames();
window.copyToNextDay = () => window.adminPortal?.copyToNextDay();
window.publishAllDays = () => window.adminPortal?.publishAllDays();
window.clearSelection = () => window.adminPortal?.clearAllSelections();
window.filterGames = (filter) => console.log('Filter not implemented in multi-day version:', filter);

console.log('🔧 Multi-Day Admin Portal module loaded');
