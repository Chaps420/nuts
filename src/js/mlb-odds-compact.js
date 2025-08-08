/**
 * MLB Odds API - Compact Version
 * Fetches only today and tomorrow's MLB games with proper odds
 */

class MLBOddsCompact {
    constructor() {
        this.apiKey = '9d542e15caa7acb9fc6dd5d3dc72ed6d';
        this.baseUrl = 'https://api.the-odds-api.com/v4';
        this.mlbSportKey = 'baseball_mlb';
        
        console.log('⚾ MLB Odds Compact initialized');
    }

    /**
     * Get today's MLB games
     */
    async getTodayGames() {
        try {
            const games = await this.fetchMLBGames();
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            
            return games.filter(game => {
                const gameDate = new Date(game.commence_time);
                return gameDate >= today && gameDate < tomorrow;
            }).map(game => this.formatGame(game));
        } catch (error) {
            console.error('❌ Error fetching today\'s games:', error);
            return this.getMockGames('today');
        }
    }

    /**
     * Get tomorrow's MLB games
     */
    async getTomorrowGames() {
        try {
            const games = await this.fetchMLBGames();
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(0, 0, 0, 0);
            const dayAfter = new Date(tomorrow);
            dayAfter.setDate(dayAfter.getDate() + 1);
            
            return games.filter(game => {
                const gameDate = new Date(game.commence_time);
                return gameDate >= tomorrow && gameDate < dayAfter;
            }).map(game => this.formatGame(game));
        } catch (error) {
            console.error('❌ Error fetching tomorrow\'s games:', error);
            return this.getMockGames('tomorrow');
        }
    }

    /**
     * Fetch MLB games from API
     */
    async fetchMLBGames() {
        const url = `${this.baseUrl}/sports/${this.mlbSportKey}/odds?` + 
            `apiKey=${this.apiKey}&` +
            `regions=us&` +
            `markets=h2h&` +
            `oddsFormat=american&` +
            `dateFormat=iso`;
        
        console.log('📡 Fetching MLB games...');
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }
        
        const data = await response.json();
        console.log(`✅ Fetched ${data.length} MLB games`);
        return data;
    }

    /**
     * Format game data for display
     */
    formatGame(game) {
        // Get the best odds from available bookmakers
        const bestOdds = this.getBestOdds(game.bookmakers);
        
        return {
            id: game.id,
            homeTeam: this.formatTeamName(game.home_team),
            awayTeam: this.formatTeamName(game.away_team),
            gameTime: game.commence_time,
            homeOdds: this.formatOdds(bestOdds.home),
            awayOdds: this.formatOdds(bestOdds.away),
            rawHomeOdds: bestOdds.home,
            rawAwayOdds: bestOdds.away
        };
    }

    /**
     * Get best odds from bookmakers
     */
    getBestOdds(bookmakers) {
        if (!bookmakers || bookmakers.length === 0) {
            return { home: -110, away: -110 }; // Default odds
        }

        let bestHome = -999999;
        let bestAway = -999999;

        bookmakers.forEach(bookmaker => {
            const h2h = bookmaker.markets?.find(m => m.key === 'h2h');
            if (h2h && h2h.outcomes) {
                h2h.outcomes.forEach(outcome => {
                    if (outcome.name === bookmaker.home_team) {
                        bestHome = Math.max(bestHome, outcome.price);
                    } else {
                        bestAway = Math.max(bestAway, outcome.price);
                    }
                });
            }
        });

        return {
            home: bestHome > -999999 ? bestHome : -110,
            away: bestAway > -999999 ? bestAway : -110
        };
    }

    /**
     * Format team name for display
     */
    formatTeamName(fullName) {
        // Shorten common team names
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

        return abbreviations[fullName] || fullName.split(' ').pop();
    }

    /**
     * Format odds for display
     */
    formatOdds(odds) {
        if (odds > 0) return `+${odds}`;
        return odds.toString();
    }

    /**
     * Get mock games for testing
     */
    getMockGames(day) {
        const baseTime = new Date();
        if (day === 'tomorrow') {
            baseTime.setDate(baseTime.getDate() + 1);
        }
        baseTime.setHours(19, 0, 0, 0);

        const teams = [
            ['NYY', 'BOS'], ['LAD', 'SF'], ['HOU', 'TEX'], ['ATL', 'NYM'],
            ['CHC', 'STL'], ['SD', 'LAA'], ['TB', 'TOR'], ['MIL', 'CIN'],
            ['PHI', 'WSH'], ['CLE', 'DET']
        ];

        return teams.map((matchup, index) => {
            const gameTime = new Date(baseTime);
            gameTime.setMinutes(gameTime.getMinutes() + (index * 30));
            
            return {
                id: `${day}_game_${index + 1}`,
                homeTeam: matchup[1],
                awayTeam: matchup[0],
                gameTime: gameTime.toISOString(),
                homeOdds: this.generateMockOdds(),
                awayOdds: this.generateMockOdds(),
                rawHomeOdds: -110,
                rawAwayOdds: -110
            };
        });
    }

    /**
     * Generate realistic mock odds
     */
    generateMockOdds() {
        const odds = [-150, -140, -130, -120, -110, +100, +110, +120, +130, +140];
        return odds[Math.floor(Math.random() * odds.length)];
    }
}

// Create global instance
window.mlbOddsCompact = new MLBOddsCompact();