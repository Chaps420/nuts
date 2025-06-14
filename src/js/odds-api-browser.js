// The Odds API integration for sports data
// Browser-compatible version without ES6 modules

class OddsAPI {
  constructor() {
    // Use your provided API key
    this.apiKey = '9d542e15caa7acb9fc6dd5d3dc72ed6d';
    this.baseUrl = 'https://api.the-odds-api.com/v4';
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    this.useMockData = false;
      // Default configuration - Only MLB games as requested
    this.config = {
      regions: ['us'],
      markets: ['h2h'],
      oddsFormat: 'american',
      defaultSports: ['baseball_mlb'] // Only MLB as requested by user
    };
  }

  async init() {
    if (!this.apiKey) {
      console.warn('⚠️ Odds API key not configured. Using mock data.');
      this.useMockData = true;
    } else {
      console.log('🏈 Odds API initialized with API key');
    }
    return true;
  }

  async makeRequest(endpoint, params = {}) {
    const cacheKey = `${endpoint}_${JSON.stringify(params)}`;
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      console.log('📦 Using cached data for:', endpoint);
      return cached.data;
    }

    try {
      const url = new URL(endpoint, this.baseUrl);
      
      // Add API key and common parameters
      const searchParams = new URLSearchParams({
        apiKey: this.apiKey,
        regions: this.config.regions.join(','),
        markets: this.config.markets.join(','),
        oddsFormat: this.config.oddsFormat,
        ...params
      });

      url.search = searchParams.toString();

      console.log('🌐 Making API request to:', url.toString().replace(this.apiKey, '[API_KEY]'));

      const response = await fetch(url.toString());
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Cache the response
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });

      console.log(`✅ API request successful, received ${Array.isArray(data) ? data.length : 1} items`);
      return data;

    } catch (error) {
      console.error('❌ Odds API request failed:', error);
      
      // Fall back to mock data if API fails
      if (this.useMockData || error.message.includes('API request failed')) {
        console.log('📋 Using mock data as fallback');
        return this.getMockData(endpoint);
      }
      
      throw error;
    }
  }

  async getSports() {
    try {
      if (this.useMockData) {
        return this.getMockSports();
      }
      
      return await this.makeRequest('/sports');
    } catch (error) {
      console.error('Error fetching sports:', error);
      return this.getMockSports();
    }
  }
  async getUpcomingGames(limit = 10, sports = null) {
    try {
      const sportsToFetch = sports || this.config.defaultSports;
      const allGames = [];

      // Get today and tomorrow dates
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const todayStr = today.toISOString().split('T')[0];
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      console.log(`🗓️ Fetching MLB games for ${todayStr} and ${tomorrowStr}`);

      for (const sport of sportsToFetch) {
        try {
          const games = await this.getGamesForSport(sport);
          if (games && Array.isArray(games)) {
            // Filter for only today and tomorrow
            const filteredGames = games.filter(game => {
              const gameDate = new Date(game.commence_time || game.startTime);
              const gameDateStr = gameDate.toISOString().split('T')[0];
              return gameDateStr === todayStr || gameDateStr === tomorrowStr;
            });
            
            console.log(`🎾 Found ${filteredGames.length} ${sport} games for today/tomorrow`);
            allGames.push(...filteredGames);
          }
        } catch (error) {
          console.warn(`Failed to fetch games for ${sport}:`, error);
        }
      }

      // Sort by start time and limit results
      const sortedGames = allGames
        .filter(game => new Date(game.commence_time || game.startTime) > new Date())
        .sort((a, b) => new Date(a.commence_time || a.startTime) - new Date(b.commence_time || b.startTime))
        .slice(0, limit);

      console.log(`📊 Returning ${sortedGames.length} upcoming MLB games`);
      return this.formatGamesForDisplay(sortedGames);

    } catch (error) {
      console.error('Error fetching upcoming games:', error);
      return this.getMockMLBGames(limit);
    }
  }

  async getGamesForSport(sport) {
    try {
      if (this.useMockData) {
        return this.getMockGamesForSport(sport);
      }

      return await this.makeRequest(`/sports/${sport}/odds`, {
        dateFormat: 'iso'
      });

    } catch (error) {
      console.error(`Error fetching games for ${sport}:`, error);
      return this.getMockGamesForSport(sport);
    }
  }
  async getTodaysGames() {
    try {
      console.log('🗓️ Fetching MLB games for today and tomorrow...');
      
      if (this.useMockData) {
        console.log('📊 Using mock MLB data for today/tomorrow');
        return this.getMockMLBGames(10);
      }

      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const todayStr = today.toISOString().split('T')[0];
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      // Get games for baseball_mlb only
      const games = await this.getGamesForSport('baseball_mlb');
      
      // Filter for games starting today or tomorrow
      const todayTomorrowGames = games.filter(game => {
        const gameDate = new Date(game.commence_time || game.startTime);
        const gameDateStr = gameDate.toISOString().split('T')[0];
        return gameDateStr === todayStr || gameDateStr === tomorrowStr;
      });

      console.log(`⚾ Found ${todayTomorrowGames.length} MLB games for today/tomorrow`);
      return this.formatGamesForDisplay(todayTomorrowGames);

    } catch (error) {
      console.error('Error fetching today\'s games:', error);
      console.log('🔄 Falling back to mock MLB data');
      return this.getMockMLBGames(10);
    }
  }

  async getContestGames(date = null) {
    try {
      const targetDate = date ? new Date(date) : new Date();
      const games = await this.getTodaysGames();
      
      // Filter games suitable for contest (min 2 hours from now)
      const minStartTime = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours from now
      
      const contestGames = games.filter(game => {
        const gameTime = new Date(game.startTime);
        return gameTime > minStartTime;
      });

      // Limit to 10 games for daily contest
      return contestGames.slice(0, 10);

    } catch (error) {
      console.error('Error fetching contest games:', error);
      return this.getMockContestGames();
    }
  }

  formatGamesForDisplay(games) {
    if (!Array.isArray(games)) {
      return [];
    }

    return games.map(game => ({
      id: game.id,
      sport: game.sport_key || game.sport,
      sportTitle: game.sport_title || game.sportTitle,
      homeTeam: game.home_team || game.homeTeam,
      awayTeam: game.away_team || game.awayTeam,
      startTime: game.commence_time || game.startTime,
      odds: this.extractOdds(game),
      bookmakers: game.bookmakers?.length || 0
    }));
  }

  extractOdds(game) {
    if (!game.bookmakers || game.bookmakers.length === 0) {
      return game.odds || null;
    }

    // Use first bookmaker's odds
    const bookmaker = game.bookmakers[0];
    const market = bookmaker.markets?.find(m => m.key === 'h2h');
    
    if (!market) return null;

    const outcomes = market.outcomes;
    const homeTeam = game.home_team || game.homeTeam;
    const awayTeam = game.away_team || game.awayTeam;
    
    const homeOdds = outcomes.find(o => o.name === homeTeam)?.price;
    const awayOdds = outcomes.find(o => o.name === awayTeam)?.price;

    return {
      home: homeOdds,
      away: awayOdds,
      bookmaker: bookmaker.title
    };
  }

  // Mock data methods for development/fallback
  getMockSports() {
    return [
      { key: 'americanfootball_nfl', title: 'NFL', description: 'National Football League' },
      { key: 'basketball_nba', title: 'NBA', description: 'National Basketball Association' },
      { key: 'baseball_mlb', title: 'MLB', description: 'Major League Baseball' },
      { key: 'icehockey_nhl', title: 'NHL', description: 'National Hockey League' }
    ];
  }
  getMockUpcomingGames(limit = 10) {
    return this.getMockMLBGames(limit);
  }

  getMockMLBGames(limit = 10) {
    const mlbTeams = [
      ['New York Yankees', 'Boston Red Sox'],
      ['Los Angeles Dodgers', 'San Francisco Giants'],
      ['Houston Astros', 'Texas Rangers'],
      ['Atlanta Braves', 'New York Mets'],
      ['Philadelphia Phillies', 'Miami Marlins'],
      ['Chicago Cubs', 'Milwaukee Brewers'],
      ['St. Louis Cardinals', 'Chicago White Sox'],
      ['Cleveland Guardians', 'Detroit Tigers'],
      ['Minnesota Twins', 'Kansas City Royals'],
      ['Los Angeles Angels', 'Oakland Athletics'],
      ['Seattle Mariners', 'San Diego Padres'],
      ['Arizona Diamondbacks', 'Colorado Rockies'],
      ['Toronto Blue Jays', 'Baltimore Orioles'],
      ['Tampa Bay Rays', 'Washington Nationals'],
      ['Pittsburgh Pirates', 'Cincinnati Reds']
    ];

    const games = [];
    let gameId = 1;

    // Generate games for today and tomorrow only
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Games for today (afternoon/evening)
    mlbTeams.slice(0, Math.ceil(limit / 2)).forEach(([away, home]) => {
      const gameTime = new Date(today);
      gameTime.setHours(19 + Math.floor(Math.random() * 3), Math.floor(Math.random() * 60)); // 7-10 PM today
      
      games.push({
        id: `mlb_today_${gameId++}`,
        sport: 'baseball_mlb',
        sportTitle: 'MLB',
        homeTeam: home,
        awayTeam: away,
        startTime: gameTime.toISOString(),
        odds: {
          home: this.generateRandomOdds(),
          away: this.generateRandomOdds(),
          bookmaker: 'DraftKings'
        },
        bookmakers: 1
      });
    });

    // Games for tomorrow
    mlbTeams.slice(Math.ceil(limit / 2), limit).forEach(([away, home]) => {
      const gameTime = new Date(tomorrow);
      gameTime.setHours(13 + Math.floor(Math.random() * 8), Math.floor(Math.random() * 60)); // 1-9 PM tomorrow
      
      games.push({
        id: `mlb_tomorrow_${gameId++}`,
        sport: 'baseball_mlb',
        sportTitle: 'MLB',
        homeTeam: home,
        awayTeam: away,
        startTime: gameTime.toISOString(),
        odds: {
          home: this.generateRandomOdds(),
          away: this.generateRandomOdds(),
          bookmaker: 'FanDuel'
        },
        bookmakers: 1
      });
    });

    return games
      .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
      .slice(0, limit);
  }

  getMockGamesForSport(sport) {
    const allGames = this.getMockUpcomingGames(20);
    return allGames.filter(game => game.sport === sport);
  }

  getMockTodaysGames() {
    const today = new Date();
    const games = this.getMockUpcomingGames(20);
    
    return games.filter(game => {
      const gameDate = new Date(game.startTime);
      return gameDate.toDateString() === today.toDateString();
    });
  }

  getMockContestGames() {
    return this.getMockUpcomingGames(10).map(game => {
      // Ensure games start at least 2 hours from now
      const minStartTime = new Date(Date.now() + 2 * 60 * 60 * 1000);
      const gameTime = new Date(game.startTime);
      
      if (gameTime < minStartTime) {
        game.startTime = new Date(minStartTime.getTime() + Math.random() * 6 * 60 * 60 * 1000).toISOString();
      }
      
      return game;
    });
  }

  generateRandomOdds() {
    // Generate American odds between -300 and +300
    const isNegative = Math.random() > 0.5;
    if (isNegative) {
      return -Math.floor(Math.random() * 200 + 100); // -100 to -300
    } else {
      return Math.floor(Math.random() * 200 + 100); // +100 to +300
    }
  }

  getMockData(endpoint) {
    if (endpoint.includes('/sports')) {
      return this.getMockSports();
    }
    return this.getMockUpcomingGames();
  }

  // Utility methods
  isGameLocked(game) {
    const lockTime = new Date(game.startTime);
    lockTime.setMinutes(lockTime.getMinutes() - 30); // 30 min buffer
    return new Date() > lockTime;
  }

  formatOdds(odds) {
    if (!odds) return 'N/A';
    return odds > 0 ? `+${odds}` : odds.toString();
  }

  calculateImpliedProbability(odds) {
    if (odds > 0) {
      return 100 / (odds + 100);
    } else {
      return Math.abs(odds) / (Math.abs(odds) + 100);
    }
  }
}

// Make OddsAPI available globally
window.OddsAPI = OddsAPI;
