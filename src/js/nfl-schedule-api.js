/**
 * NFL Schedule API
 * Fetches NFL game schedules and handles weekly contest data
 */

class NFLScheduleAPI {
    constructor() {
        this.baseUrl = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl';
        this.currentSeason = 2025;
        this.cache = new Map();
        this.cacheTimeout = 10 * 60 * 1000; // 10 minutes
        
        console.log('🏈 NFL Schedule API initialized');
    }

    /**
     * Get current NFL week number
     */
    getCurrentWeek() {
        const now = new Date();
        const seasonStart = new Date(this.currentSeason, 8, 5); // September 5th (typical NFL start)
        
        if (now < seasonStart) {
            return 1; // Preseason or early season
        }
        
        const diffTime = now.getTime() - seasonStart.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const week = Math.ceil(diffDays / 7);
        
        return Math.min(Math.max(week, 1), 18); // Regular season is 18 weeks
    }

    /**
     * Get games for a specific week
     */
    async getGamesForWeek(weekNumber) {
        try {
            console.log(`🏈 Fetching NFL games for week ${weekNumber}...`);
            
            // Check cache first
            const cacheKey = `nfl_week_${weekNumber}`;
            const cached = this.cache.get(cacheKey);
            if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
                console.log('📦 Using cached NFL data');
                return cached.data;
            }
            
            // For development, use mock data if API fails
            try {
                const response = await fetch(`${this.baseUrl}/scoreboard?week=${weekNumber}&seasontype=2`);
                if (!response.ok) throw new Error('API unavailable');
                
                const data = await response.json();
                const games = this.parseESPNData(data);
                
                // Cache the result
                this.cache.set(cacheKey, {
                    data: games,
                    timestamp: Date.now()
                });
                
                console.log(`✅ Loaded ${games.length} NFL games for week ${weekNumber}`);
                return games;
                
            } catch (apiError) {
                console.warn('⚠️ NFL API unavailable, using mock data:', apiError.message);
                return this.getMockGamesForWeek(weekNumber);
            }
            
        } catch (error) {
            console.error('❌ Failed to fetch NFL games:', error);
            return this.getMockGamesForWeek(weekNumber);
        }
    }

    /**
     * Parse ESPN API data into our format
     */
    parseESPNData(data) {
        if (!data.events || !Array.isArray(data.events)) {
            return [];
        }

        return data.events.map(event => {
            const competition = event.competitions[0];
            const competitors = competition.competitors;
            
            const homeTeam = competitors.find(c => c.homeAway === 'home');
            const awayTeam = competitors.find(c => c.homeAway === 'away');
            
            return {
                id: `nfl_${event.id}`,
                gameTime: event.date,
                gameTimeFormatted: this.formatGameTime(event.date),
                homeTeam: homeTeam.team.abbreviation,
                homeTeamFull: homeTeam.team.displayName,
                awayTeam: awayTeam.team.abbreviation,
                awayTeamFull: awayTeam.team.displayName,
                status: competition.status.type.name,
                venue: competition.venue?.fullName || 'TBD',
                week: event.week?.number || 1,
                dayOfWeek: this.getDayOfWeek(event.date),
                spread: this.extractSpread(competition),
                overUnder: this.extractOverUnder(competition)
            };
        }).sort((a, b) => new Date(a.gameTime) - new Date(b.gameTime));
    }

    /**
     * Extract point spread from ESPN data
     */
    extractSpread(competition) {
        try {
            const odds = competition.odds?.[0];
            if (odds && odds.details) {
                const spreadMatch = odds.details.match(/([A-Z]{2,3})\s*-?(\d+\.?\d*)/);
                if (spreadMatch) {
                    return `${spreadMatch[1]} -${spreadMatch[2]}`;
                }
            }
            return null;
        } catch (error) {
            return null;
        }
    }

    /**
     * Extract over/under from ESPN data
     */
    extractOverUnder(competition) {
        try {
            const odds = competition.odds?.[0];
            if (odds && odds.overUnder) {
                return `O/U ${odds.overUnder}`;
            }
            return null;
        } catch (error) {
            return null;
        }
    }

    /**
     * Get day of week for game
     */
    getDayOfWeek(dateString) {
        const date = new Date(dateString);
        const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
        return days[date.getDay()];
    }

    /**
     * Format game time for display
     */
    formatGameTime(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            timeZoneName: 'short'
        });
    }

    /**
     * Get mock games for development/testing
     */
    getMockGamesForWeek(weekNumber) {
        const teams = [
            { abbr: 'BUF', name: 'Buffalo Bills' },
            { abbr: 'MIA', name: 'Miami Dolphins' },
            { abbr: 'NE', name: 'New England Patriots' },
            { abbr: 'NYJ', name: 'New York Jets' },
            { abbr: 'BAL', name: 'Baltimore Ravens' },
            { abbr: 'CIN', name: 'Cincinnati Bengals' },
            { abbr: 'CLE', name: 'Cleveland Browns' },
            { abbr: 'PIT', name: 'Pittsburgh Steelers' },
            { abbr: 'HOU', name: 'Houston Texans' },
            { abbr: 'IND', name: 'Indianapolis Colts' },
            { abbr: 'JAX', name: 'Jacksonville Jaguars' },
            { abbr: 'TEN', name: 'Tennessee Titans' },
            { abbr: 'DEN', name: 'Denver Broncos' },
            { abbr: 'KC', name: 'Kansas City Chiefs' },
            { abbr: 'LV', name: 'Las Vegas Raiders' },
            { abbr: 'LAC', name: 'Los Angeles Chargers' }
        ];

        const mockGames = [];
        const baseDate = new Date(2025, 8, 7 + ((weekNumber - 1) * 7)); // Sept 7 + weeks

        // Thursday Night Football
        if (weekNumber > 1) {
            const thuDate = new Date(baseDate);
            thuDate.setDate(thuDate.getDate() + 3); // Thursday
            thuDate.setHours(20, 15); // 8:15 PM

            mockGames.push({
                id: `nfl_2025_w${weekNumber}_thu`,
                gameTime: thuDate.toISOString(),
                gameTimeFormatted: this.formatGameTime(thuDate.toISOString()),
                homeTeam: teams[weekNumber % teams.length].abbr,
                homeTeamFull: teams[weekNumber % teams.length].name,
                awayTeam: teams[(weekNumber + 1) % teams.length].abbr,
                awayTeamFull: teams[(weekNumber + 1) % teams.length].name,
                status: 'STATUS_SCHEDULED',
                venue: 'MetLife Stadium',
                week: weekNumber,
                dayOfWeek: 'THU',
                spread: `${teams[weekNumber % teams.length].abbr} -3.5`,
                overUnder: 'O/U 48.5'
            });
        }

        // Sunday Early Games (1 PM ET)
        for (let i = 0; i < 8; i++) {
            const sunDate = new Date(baseDate);
            sunDate.setDate(sunDate.getDate() + 6); // Sunday
            sunDate.setHours(13, 0); // 1:00 PM

            const homeIdx = (weekNumber + i * 2) % teams.length;
            const awayIdx = (weekNumber + i * 2 + 1) % teams.length;

            mockGames.push({
                id: `nfl_2025_w${weekNumber}_sun_early_${i}`,
                gameTime: sunDate.toISOString(),
                gameTimeFormatted: this.formatGameTime(sunDate.toISOString()),
                homeTeam: teams[homeIdx].abbr,
                homeTeamFull: teams[homeIdx].name,
                awayTeam: teams[awayIdx].abbr,
                awayTeamFull: teams[awayIdx].name,
                status: 'STATUS_SCHEDULED',
                venue: `Stadium ${i + 1}`,
                week: weekNumber,
                dayOfWeek: 'SUN',
                spread: `${teams[homeIdx].abbr} -${(Math.random() * 14).toFixed(1)}`,
                overUnder: `O/U ${(40 + Math.random() * 20).toFixed(1)}`
            });
        }

        // Sunday Late Games (4:25 PM ET)
        for (let i = 0; i < 4; i++) {
            const sunDate = new Date(baseDate);
            sunDate.setDate(sunDate.getDate() + 6);
            sunDate.setHours(16, 25); // 4:25 PM

            const homeIdx = (weekNumber + i * 2 + 8) % teams.length;
            const awayIdx = (weekNumber + i * 2 + 9) % teams.length;

            mockGames.push({
                id: `nfl_2025_w${weekNumber}_sun_late_${i}`,
                gameTime: sunDate.toISOString(),
                gameTimeFormatted: this.formatGameTime(sunDate.toISOString()),
                homeTeam: teams[homeIdx].abbr,
                homeTeamFull: teams[homeIdx].name,
                awayTeam: teams[awayIdx].abbr,
                awayTeamFull: teams[awayIdx].name,
                status: 'STATUS_SCHEDULED',
                venue: `Stadium ${i + 9}`,
                week: weekNumber,
                dayOfWeek: 'SUN',
                spread: `${teams[homeIdx].abbr} -${(Math.random() * 10).toFixed(1)}`,
                overUnder: `O/U ${(42 + Math.random() * 16).toFixed(1)}`
            });
        }

        // Sunday Night Football (8:20 PM ET)
        const snfDate = new Date(baseDate);
        snfDate.setDate(snfDate.getDate() + 6);
        snfDate.setHours(20, 20);

        mockGames.push({
            id: `nfl_2025_w${weekNumber}_snf`,
            gameTime: snfDate.toISOString(),
            gameTimeFormatted: this.formatGameTime(snfDate.toISOString()),
            homeTeam: teams[(weekNumber + 14) % teams.length].abbr,
            homeTeamFull: teams[(weekNumber + 14) % teams.length].name,
            awayTeam: teams[(weekNumber + 15) % teams.length].abbr,
            awayTeamFull: teams[(weekNumber + 15) % teams.length].name,
            status: 'STATUS_SCHEDULED',
            venue: 'Prime Time Stadium',
            week: weekNumber,
            dayOfWeek: 'SUN',
            spread: `${teams[(weekNumber + 14) % teams.length].abbr} -2.5`,
            overUnder: 'O/U 45.0'
        });

        // Monday Night Football (8:15 PM ET)
        const mnfDate = new Date(baseDate);
        mnfDate.setDate(mnfDate.getDate() + 7); // Monday
        mnfDate.setHours(20, 15);

        mockGames.push({
            id: `nfl_2025_w${weekNumber}_mnf`,
            gameTime: mnfDate.toISOString(),
            gameTimeFormatted: this.formatGameTime(mnfDate.toISOString()),
            homeTeam: teams[(weekNumber + 12) % teams.length].abbr,
            homeTeamFull: teams[(weekNumber + 12) % teams.length].name,
            awayTeam: teams[(weekNumber + 13) % teams.length].abbr,
            awayTeamFull: teams[(weekNumber + 13) % teams.length].name,
            status: 'STATUS_SCHEDULED',
            venue: 'Monday Night Stadium',
            week: weekNumber,
            dayOfWeek: 'MON',
            spread: `${teams[(weekNumber + 12) % teams.length].abbr} -3.0`,
            overUnder: 'O/U 49.0'
        });

        console.log(`🏈 Generated ${mockGames.length} mock NFL games for week ${weekNumber}`);
        return mockGames.sort((a, b) => new Date(a.gameTime) - new Date(b.gameTime));
    }

    /**
     * Group games by day of week
     */
    groupGamesByDay(games) {
        const grouped = {
            THU: [],
            FRI: [],
            SAT: [],
            SUN_EARLY: [],
            SUN_LATE: [],
            SUN_NIGHT: [],
            MON: [],
            TUE: [],
            WED: [],
            OTHER: []
        };

        console.log('🗓️ Grouping games by day:', games.length);

        games.forEach(game => {
            const gameDate = new Date(game.gameTime);
            const hour = gameDate.getHours();

            console.log(`📊 Game ${game.awayTeam} @ ${game.homeTeam}: ${game.dayOfWeek}, Hour: ${hour}, Date: ${game.gameTime}`);

            if (game.dayOfWeek === 'THU') {
                grouped.THU.push(game);
            } else if (game.dayOfWeek === 'FRI') {
                grouped.FRI.push(game);
            } else if (game.dayOfWeek === 'SAT') {
                grouped.SAT.push(game);
            } else if (game.dayOfWeek === 'MON') {
                grouped.MON.push(game);
            } else if (game.dayOfWeek === 'TUE') {
                grouped.TUE.push(game);
            } else if (game.dayOfWeek === 'WED') {
                grouped.WED.push(game);
            } else if (game.dayOfWeek === 'SUN') {
                if (hour < 16) {
                    grouped.SUN_EARLY.push(game);
                } else if (hour >= 20) {
                    grouped.SUN_NIGHT.push(game);
                } else {
                    grouped.SUN_LATE.push(game);
                }
            } else {
                // Fallback for any unexpected day
                console.warn(`⚠️ Game ${game.awayTeam} @ ${game.homeTeam} assigned to OTHER group - dayOfWeek: ${game.dayOfWeek}`);
                grouped.OTHER.push(game);
            }
        });

        // Log group counts
        Object.entries(grouped).forEach(([day, games]) => {
            if (games.length > 0) {
                console.log(`📅 ${day}: ${games.length} games`);
            }
        });

        return grouped;
    }
}

// Export for browser use
if (typeof window !== 'undefined') {
    window.NFLScheduleAPI = NFLScheduleAPI;
}
