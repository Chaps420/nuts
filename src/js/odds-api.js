// The Odds API integration for sports data

import { config } from '../../config/config.js';

export class OddsAPI {
  constructor() {
    this.apiKey = config.oddsApi.key;
    this.baseUrl = config.oddsApi.baseUrl;
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  async init() {
    if (!this.apiKey) {
      console.warn('⚠️ Odds API key not configured. Using mock data.');
      this.useMockData = true;
    }
    console.log('🏈 Odds API initialized');
  }

  async makeRequest(endpoint, params = {}) {
    const cacheKey = `${endpoint}_${JSON.stringify(params)}`;
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      const url = new URL(endpoint, this.baseUrl);
      
      // Add API key and common parameters
      const searchParams = new URLSearchParams({
        apiKey: this.apiKey,
        regions: config.oddsApi.regions.join(','),
        markets: config.oddsApi.markets.join(','),
        oddsFormat: config.oddsApi.oddsFormat,
        ...params
      });

      url.search = searchParams.toString();

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

      return data;

    } catch (error) {
      console.error('Odds API request failed:', error);
      
      // Fall back to mock data if API fails
      if (this.useMockData || error.message.includes('API request failed')) {
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
      const sportsToFetch = sports || config.oddsApi.defaultSports;
      const allGames = [];

      for (const sport of sportsToFetch) {
        const games = await this.getGamesForSport(sport);
        allGames.push(...games);
      }

      // Sort by start time and limit results
      const sortedGames = allGames
        .filter(game => new Date(game.commence_time) > new Date())
        .sort((a, b) => new Date(a.commence_time) - new Date(b.commence_time))
        .slice(0, limit);

      return this.formatGamesForDisplay(sortedGames);

    } catch (error) {
      console.error('Error fetching upcoming games:', error);
      return this.getMockUpcomingGames(limit);
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
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const games = await this.getUpcomingGames(50);
      
      // Filter for games starting today
      return games.filter(game => {
        const gameDate = new Date(game.startTime);
        return gameDate.toDateString() === today.toDateString();
      });

    } catch (error) {
      console.error('Error fetching today\'s games:', error);
      return this.getMockTodaysGames();
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
    return games.map(game => ({
      id: game.id,
      sport: game.sport_key,
      sportTitle: game.sport_title,
      homeTeam: game.home_team,
      awayTeam: game.away_team,
      startTime: game.commence_time,
      odds: this.extractOdds(game),
      bookmakers: game.bookmakers?.length || 0
    }));
  }

  extractOdds(game) {
    if (!game.bookmakers || game.bookmakers.length === 0) {
      return null;
    }

    // Use first bookmaker's odds
    const bookmaker = game.bookmakers[0];
    const market = bookmaker.markets?.find(m => m.key === 'h2h');
    
    if (!market) return null;

    const outcomes = market.outcomes;
    const homeOdds = outcomes.find(o => o.name === game.home_team)?.price;
    const awayOdds = outcomes.find(o => o.name === game.away_team)?.price;

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
    const teams = {
      nfl: [
        ['Kansas City Chiefs', 'Buffalo Bills'],
        ['Green Bay Packers', 'Detroit Lions'],
        ['Dallas Cowboys', 'Philadelphia Eagles'],
        ['San Francisco 49ers', 'Seattle Seahawks'],
        ['Miami Dolphins', 'New York Jets']
      ],
      nba: [
        ['Los Angeles Lakers', 'Boston Celtics'],
        ['Golden State Warriors', 'Phoenix Suns'],
        ['Milwaukee Bucks', 'Brooklyn Nets'],
        ['Denver Nuggets', 'Los Angeles Clippers']
      ],
      mlb: [
        ['New York Yankees', 'Boston Red Sox'],
        ['Los Angeles Dodgers', 'San Francisco Giants'],
        ['Houston Astros', 'Texas Rangers']
      ]
    };

    const games = [];
    let gameId = 1;

    Object.entries(teams).forEach(([sport, matchups]) => {
      matchups.forEach(([away, home]) => {
        const startTime = new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000); // Next 7 days
        
        games.push({
          id: `mock_${gameId++}`,
          sport: sport === 'nfl' ? 'americanfootball_nfl' : sport === 'nba' ? 'basketball_nba' : 'baseball_mlb',
          sportTitle: sport.toUpperCase(),
          homeTeam: home,
          awayTeam: away,
          startTime: startTime.toISOString(),
          odds: {
            home: this.generateRandomOdds(),
            away: this.generateRandomOdds(),
            bookmaker: 'DraftKings'
          },
          bookmakers: 1
        });
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
    lockTime.setMinutes(lockTime.getMinutes() - config.contest.lockTimeBuffer);
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
