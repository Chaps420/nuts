/**
 * Free MLB Schedule API
 * Uses MLB's official statsapi for free game schedules
 */

class MLBScheduleFree {
    constructor() {
        // MLB's official stats API - completely free!
        this.baseUrl = 'https://statsapi.mlb.com/api/v1';
        this.cache = new Map();
        this.cacheTimeout = 10 * 60 * 1000; // 10 minutes
        
        console.log('⚾ MLB Schedule (Free API) initialized');
    }
    
    /**
     * Get games for a specific date
     * @param {Date} date - The date to get games for
     */
    async getGamesForDate(date) {
        const dateStr = this.formatDate(date);
        
        // First check for manually uploaded games
        const manualGames = this.getManuallyUploadedGames(dateStr);
        if (manualGames && manualGames.length > 0) {
            console.log(`📋 Using ${manualGames.length} manually uploaded games for ${dateStr}`);
            return manualGames;
        }
        
        const cacheKey = `games_${dateStr}`;
        
        // Check cache
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                console.log('📦 Returning cached games for', dateStr);
                return cached.data;
            }
        }
        
        try {
            console.log(`📡 Fetching MLB games from free API for ${dateStr}...`);
            
            const url = `${this.baseUrl}/schedule?sportId=1&date=${dateStr}`;
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`Failed to fetch games: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('🔍 API Response:', data);
            
            // Check for games in progress
            if (data.totalGamesInProgress > 0) {
                console.log(`🚨 MLB API reports ${data.totalGamesInProgress} games in progress - contest should be closed!`);
                // Add a flag to the data so the contest manager knows games are in progress
                data.hasGamesInProgress = true;
            }
            
            const games = this.parseGames(data, date);
            
            // Pass the hasGamesInProgress flag to the games array
            if (data.hasGamesInProgress) {
                games.hasGamesInProgress = true;
            }
            
            // If no games found, check if we're in off-season or there's an API issue
            if (games.length === 0) {
                const month = date.getMonth(); // 0-11
                const isOffseason = month === 11 || month === 0 || month === 1; // Dec, Jan, Feb
                
                if (isOffseason) {
                    console.log('⚾ MLB is in off-season, using mock games');
                    return this.getMockGamesForDate(date);
                } else {
                    console.log('📅 No games scheduled for this date');
                }
            }
            
            // Cache the results
            this.cache.set(cacheKey, {
                data: games,
                timestamp: Date.now()
            });
            
            console.log(`✅ Found ${games.length} MLB games for ${dateStr}`);
            return games;
            
        } catch (error) {
            console.error('❌ Failed to fetch MLB games:', error);
            return this.getMockGamesForDate(date);
        }
    }
    
    /**
     * Get manually uploaded games from localStorage
     */
    getManuallyUploadedGames(dateStr) {
        try {
            const storageKey = `mlb_games_${dateStr}`;
            const stored = localStorage.getItem(storageKey);
            
            if (stored) {
                const data = JSON.parse(stored);
                // Format games to match our structure
                return data.games.map((game, index) => ({
                    ...game,
                    // Ensure all required fields are present
                    homeOdds: game.homeOdds || this.generatePlaceholderOdds(),
                    awayOdds: game.awayOdds || this.generatePlaceholderOdds(),
                    venue: game.venue || 'TBD',
                    status: game.status || 'Scheduled',
                    homeTeamFull: game.homeTeamFull || game.homeTeam,
                    awayTeamFull: game.awayTeamFull || game.awayTeam
                }));
            }
        } catch (error) {
            console.error('Error loading manual games:', error);
        }
        
        return null;
    }
    
    /**
     * Format date for API
     */
    formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    
    /**
     * Parse games from MLB API response
     */
    parseGames(data, date) {
        const games = [];
        
        if (data.dates && data.dates.length > 0) {
            const dateGames = data.dates[0].games || [];
            
            dateGames.forEach((game, index) => {
                const homeTeam = game.teams?.home?.team?.name || 'TBD';
                const awayTeam = game.teams?.away?.team?.name || 'TBD';
                const gameTime = new Date(game.gameDate);
                const status = game.status?.abstractGameState || 'Preview';
                
                // Only include scheduled games (not completed or in progress)
                if (status === 'Preview' || status === 'Scheduled') {
                    games.push({
                        id: `mlb_${date.toISOString().split('T')[0]}_${game.gamePk}`,
                        gameId: game.gamePk,
                        homeTeam: this.getTeamAbbr(homeTeam),
                        homeTeamFull: homeTeam,
                        awayTeam: this.getTeamAbbr(awayTeam),
                        awayTeamFull: awayTeam,
                        gameTime: gameTime.toISOString(),
                        gameTimeFormatted: this.formatGameTime(gameTime),
                        venue: game.venue?.name || 'TBD',
                        status: status,
                        // Add placeholder odds since we don't need real ones
                        homeOdds: this.generatePlaceholderOdds(),
                        awayOdds: this.generatePlaceholderOdds()
                    });
                }
            });
        }
        
        return games;
    }
    
    /**
     * Get team abbreviation
     */
    getTeamAbbr(teamName) {
        const abbreviations = {
            'Arizona Diamondbacks': 'ARI',
            'Atlanta Braves': 'ATL',
            'Baltimore Orioles': 'BAL',
            'Boston Red Sox': 'BOS',
            'Chicago Cubs': 'CHC',
            'Chicago White Sox': 'CHW',
            'Cincinnati Reds': 'CIN',
            'Cleveland Guardians': 'CLE',
            'Colorado Rockies': 'COL',
            'Detroit Tigers': 'DET',
            'Houston Astros': 'HOU',
            'Kansas City Royals': 'KC',
            'Los Angeles Angels': 'LAA',
            'Los Angeles Dodgers': 'LAD',
            'Miami Marlins': 'MIA',
            'Milwaukee Brewers': 'MIL',
            'Minnesota Twins': 'MIN',
            'New York Mets': 'NYM',
            'New York Yankees': 'NYY',
            'Oakland Athletics': 'OAK',
            'Philadelphia Phillies': 'PHI',
            'Pittsburgh Pirates': 'PIT',
            'San Diego Padres': 'SD',
            'San Francisco Giants': 'SF',
            'Seattle Mariners': 'SEA',
            'St. Louis Cardinals': 'STL',
            'Tampa Bay Rays': 'TB',
            'Texas Rangers': 'TEX',
            'Toronto Blue Jays': 'TOR',
            'Washington Nationals': 'WSH'
        };
        
        return abbreviations[teamName] || teamName.substring(0, 3).toUpperCase();
    }
    
    /**
     * Format game time for display
     */
    formatGameTime(date) {
        return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    }
    
    /**
     * Generate placeholder odds (just for display consistency)
     */
    generatePlaceholderOdds() {
        const odds = [-150, -140, -130, -120, -110, '+100', '+110', '+120', '+130'];
        return odds[Math.floor(Math.random() * odds.length)];
    }
    
    /**
     * Get games for multiple days
     */
    async getGamesForDays(startDate, numDays) {
        const allGames = [];
        
        for (let i = 0; i < numDays; i++) {
            const date = new Date(startDate);
            date.setDate(date.getDate() + i);
            
            const games = await this.getGamesForDate(date);
            allGames.push({
                date: date,
                dateStr: date.toDateString(),
                games: games
            });
        }
        
        return allGames;
    }
    
    /**
     * Get mock games as fallback
     */
    getMockGamesForDate(date) {
        console.log('📋 Using mock games for', date.toDateString());
        
        const teams = [
            ['NYY', 'BOS'], ['LAD', 'SF'], ['HOU', 'TEX'],
            ['ATL', 'NYM'], ['CHC', 'STL'], ['SD', 'LAA'],
            ['TB', 'TOR'], ['MIL', 'CIN'], ['PHI', 'WSH'],
            ['CLE', 'DET'], ['MIN', 'CHW'], ['SEA', 'OAK']
        ];
        
        const games = [];
        const numGames = 12 + Math.floor(Math.random() * 4); // 12-15 games
        
        for (let i = 0; i < Math.min(numGames, teams.length); i++) {
            const [away, home] = teams[i];
            const gameTime = new Date(date);
            
            // Vary game times
            if (i < 4) {
                gameTime.setHours(13 + i, 10, 0, 0); // Afternoon games
            } else {
                gameTime.setHours(19 + (i % 3), 10, 0, 0); // Evening games
            }
            
            games.push({
                id: `mock_${date.toISOString().split('T')[0]}_game${i + 1}`,
                gameId: `mock${i + 1}`,
                homeTeam: home,
                awayTeam: away,
                gameTime: gameTime.toISOString(),
                gameTimeFormatted: this.formatGameTime(gameTime),
                venue: 'Mock Stadium',
                status: 'Scheduled',
                homeOdds: this.generatePlaceholderOdds(),
                awayOdds: this.generatePlaceholderOdds()
            });
        }
        
        return games;
    }
}

// Create global instance
window.mlbSchedule = new MLBScheduleFree();

console.log('⚾ MLB Schedule Free module loaded');