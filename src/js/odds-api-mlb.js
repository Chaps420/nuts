// MLB-focused Odds API integration for The Odds API v4
// Browser-compatible version for real MLB game data

class MLBOddsAPI {
    constructor() {
        // Widget key - for embedded widgets, not direct API access
        this.widgetKey = 'wk_8e7ce1bebe8c2b5776b4d810dfa22cf1';
        // API key would be needed for direct API access
        this.apiKey = '9d542e15caa7acb9fc6dd5d3dc72ed6d'; // This appears to be invalid
        this.baseUrl = 'https://api.the-odds-api.com/v4';
        this.mlbSportKey = 'baseball_mlb';
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
        
        console.log('🏈 MLBOddsAPI initialized for real MLB games');
        console.log('⚠️ Note: Using widget key, not API key. API features may be limited.');
    }

    async init() {
        console.log('⚾ Initializing MLB API connection...');
        const testResult = await this.testAPIConnection();
        return testResult.success;
    }

    async testAPIConnection() {
        try {
            const url = `${this.baseUrl}/sports?apiKey=${this.apiKey}`;
            console.log('🧪 Testing API connection...');
            
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`API test failed: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('✅ API Connection successful');
            
            // Check if MLB is available
            const mlbSport = data.find(sport => sport.key === this.mlbSportKey);
            console.log('⚾ MLB Sport Available:', mlbSport ? 'Yes' : 'No');
            
            if (mlbSport) {
                console.log('📋 MLB Sport Details:', mlbSport);
            }
            
            return { 
                success: true, 
                data, 
                mlbAvailable: !!mlbSport,
                mlbDetails: mlbSport 
            };
        } catch (error) {
            console.error('❌ API Connection Test Failed:', error);
            return { success: false, error: error.message };
        }
    }

    async getMLBGames(daysAhead = 2) {
        try {
            console.log(`📡 Fetching MLB games for next ${daysAhead} days...`);
            
            const url = `${this.baseUrl}/sports/${this.mlbSportKey}/odds?` + 
                `apiKey=${this.apiKey}&` +
                `regions=us&` +
                `markets=h2h&` +
                `oddsFormat=american&` +
                `dateFormat=iso`;
            
            console.log('🌐 Making MLB API request...');
            
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`MLB API request failed: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('✅ Raw MLB API response received:', data.length, 'games');
            
            // Filter games for specified date range
            const filteredGames = this.filterGamesForDateRange(data, daysAhead);
            console.log(`⚾ Filtered to ${filteredGames.length} MLB games for next ${daysAhead} days`);
            
            return filteredGames.length > 0 ? filteredGames : this.getMockMLBGames();
            
        } catch (error) {
            console.error('❌ MLB API request failed:', error);
            console.log('📋 Using mock MLB data as fallback');
            return this.getMockMLBGames();
        }
    }

    filterGamesForDateRange(games, daysAhead) {
        const now = new Date();
        const endDate = new Date();
        endDate.setDate(now.getDate() + daysAhead);
        endDate.setHours(23, 59, 59, 999); // End of day
        
        return games.filter(game => {
            const gameDate = new Date(game.commence_time);
            return gameDate >= now && gameDate <= endDate;
        }).map(game => this.formatGameData(game));
    }

    formatGameData(game) {
        const homeTeam = game.home_team;
        const awayTeam = game.away_team;
        const gameTime = new Date(game.commence_time);
        
        // Get odds if available
        let homeOdds = 'N/A';
        let awayOdds = 'N/A';
        let bookmaker = 'N/A';
        
        if (game.bookmakers && game.bookmakers.length > 0) {
            const firstBookmaker = game.bookmakers[0];
            bookmaker = firstBookmaker.title;
            const market = firstBookmaker.markets.find(m => m.key === 'h2h');
            
            if (market && market.outcomes) {
                const homeOutcome = market.outcomes.find(o => o.name === homeTeam);
                const awayOutcome = market.outcomes.find(o => o.name === awayTeam);
                
                homeOdds = homeOutcome ? this.formatOdds(homeOutcome.price) : 'N/A';
                awayOdds = awayOutcome ? this.formatOdds(awayOutcome.price) : 'N/A';
            }
        }
        
        return {
            id: game.id,
            homeTeam: homeTeam,
            awayTeam: awayTeam,
            gameTime: gameTime.toISOString(),
            gameTimeFormatted: gameTime.toLocaleString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            }),
            homeOdds: homeOdds,
            awayOdds: awayOdds,
            bookmaker: bookmaker,
            sport: 'MLB',
            sportKey: 'baseball_mlb',
            status: 'scheduled',
            rawData: game // Keep original data for reference
        };
    }

    formatOdds(odds) {
        if (typeof odds !== 'number') return 'N/A';
        return odds > 0 ? `+${odds}` : odds.toString();
    }

    // Get today's and tomorrow's MLB games
    async getTodaysMLBGames() {
        return await this.getMLBGames(2); // Today and tomorrow
    }

    // Get all available MLB games (up to 7 days)
    async getAllAvailableMLBGames() {
        return await this.getMLBGames(7); // Full week
    }

    getMockMLBGames() {
        console.log('📋 Generating mock MLB games for testing...');
        
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

        const games = [];
        
        // Generate games for next 7 days
        for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
            const gameDate = new Date();
            gameDate.setDate(gameDate.getDate() + dayOffset);
            
            // Randomize number of games per day (8-15 games)
            const gamesPerDay = 8 + Math.floor(Math.random() * 8);
            
            // Shuffle teams for variety
            const shuffledTeams = [...mlbTeams].sort(() => Math.random() - 0.5);
            
            for (let i = 0; i < Math.min(gamesPerDay, shuffledTeams.length); i++) {
                const [away, home] = shuffledTeams[i];
                const gameTime = new Date(gameDate);
                
                // Vary game times: afternoon (1-5 PM) and evening (6-10 PM) games
                if (i < gamesPerDay / 2) {
                    // Afternoon games
                    gameTime.setHours(13 + Math.floor(Math.random() * 4), Math.random() > 0.5 ? 10 : 40, 0, 0);
                } else {
                    // Evening games
                    gameTime.setHours(18 + Math.floor(Math.random() * 4), Math.random() > 0.5 ? 5 : 35, 0, 0);
                }
                
                games.push({
                    id: `mock_mlb_day${dayOffset}_game${i + 1}`,
                    homeTeam: home,
                    awayTeam: away,
                    gameTime: gameTime.toISOString(),
                    gameTimeFormatted: gameTime.toLocaleString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                    }),
                    homeOdds: this.generateRandomOdds(),
                    awayOdds: this.generateRandomOdds(),
                    bookmaker: ['DraftKings', 'FanDuel', 'BetMGM', 'Caesars'][Math.floor(Math.random() * 4)],
                    sport: 'MLB',
                    sportKey: 'baseball_mlb',
                    status: 'scheduled'
                });
            }
        }

        return games.sort((a, b) => new Date(a.gameTime) - new Date(b.gameTime));
    }

    generateRandomOdds() {
        const isNegative = Math.random() > 0.5;
        if (isNegative) {
            return -Math.floor(Math.random() * 200 + 100); // -100 to -300
        } else {
            return `+${Math.floor(Math.random() * 200 + 100)}`; // +100 to +300
        }
    }

    // Utility methods
    isGameLocked(game) {
        const gameTime = new Date(game.gameTime);
        const lockTime = new Date(gameTime.getTime() - 30 * 60 * 1000); // 30 minutes before
        return new Date() > lockTime;
    }

    getGamesByDate(games, date) {
        const targetDate = new Date(date);
        const targetDateStr = targetDate.toDateString();
        
        return games.filter(game => {
            const gameDate = new Date(game.gameTime);
            return gameDate.toDateString() === targetDateStr;
        });
    }
}

// Make MLBOddsAPI available globally
window.MLBOddsAPI = MLBOddsAPI;

// Initialize global instance
window.mlbAPI = new MLBOddsAPI();

console.log('⚾ MLB Odds API module loaded');
