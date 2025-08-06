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
        console.log(`📅 Getting games for date: ${date.toDateString()} (${date.toISOString()})`);
        
        // Check for manually uploaded games first
        try {
            const manualGames = this.getManuallyUploadedGames(date);
            if (manualGames.length > 0) {
                console.log(`📋 Using ${manualGames.length} manually uploaded games`);
                return manualGames;
            }
        } catch (error) {
            console.log('Error loading manual games:', error.message);
        }
        
        try {
            const formattedDate = this.formatDate(date);
            console.log(`📡 Fetching MLB games from free API for ${formattedDate}...`);
            
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
            
            // If no games found, just return empty array
            if (games.length === 0) {
                const month = date.getMonth(); // 0-11
                const isOffseason = month === 11 || month === 0 || month === 1; // Dec, Jan, Feb
                
                if (isOffseason) {
                    console.log('⚾ MLB is in off-season, no games scheduled');
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
            return []; // Return empty array instead of mock games
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
                
                // Get scores if game is completed
                const homeScore = game.teams?.home?.score || 0;
                const awayScore = game.teams?.away?.score || 0;
                
                // Determine winner for completed games
                let winner = null;
                if (status === 'Final' && homeScore !== awayScore) {
                    winner = homeScore > awayScore ? 'home' : 'away';
                }
                
                // Include all games (not just scheduled ones) so we can see completed games
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
                    // Add actual scores and winner for completed games
                    homeScore: homeScore,
                    awayScore: awayScore,
                    winner: winner,
                    totalRuns: homeScore + awayScore,
                    // Add placeholder odds since we don't need real ones
                    homeOdds: this.generatePlaceholderOdds(),
                    awayOdds: this.generatePlaceholderOdds()
                });
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
     * Get real game results for contest scoring
     * @param {Date} date - The date to get results for
     * @returns {Object} - Game results formatted for contest scoring
     */
    async getGameResults(date) {
        try {
            console.log(`🏆 Fetching real game results for ${date.toDateString()} (${date.toISOString()})...`);
            
            const games = await this.getGamesForDate(date);
            const gameResults = {};
            let completedGames = 0;
            
            games.forEach(game => {
                if (game.status === 'Final' && game.winner) {
                    gameResults[game.id] = {
                        status: 'completed',
                        winner: game.winner,
                        homeScore: game.homeScore,
                        awayScore: game.awayScore,
                        homeTeam: game.homeTeam,
                        awayTeam: game.awayTeam,
                        totalRuns: game.totalRuns
                    };
                    completedGames++;
                }
            });
            
            // Calculate total runs for tiebreaker
            const totalRuns = Object.values(gameResults).reduce((sum, game) => 
                sum + game.totalRuns, 0
            );
            
            if (totalRuns > 0) {
                gameResults.lastGameRuns = totalRuns;
            }
            
            console.log(`✅ Found ${completedGames} completed games with ${totalRuns} total runs`);
            return gameResults;
            
        } catch (error) {
            console.error('❌ Failed to fetch game results:', error);
            return {};
        }
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