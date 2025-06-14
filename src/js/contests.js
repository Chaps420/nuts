// Contest management for daily and weekly competitions

import { config } from '../../config/config.js';

export class ContestManager extends EventTarget {
  constructor() {
    super();
    this.firebase = null;
    this.currentUser = null;
    this.activeContests = [];
  }

  async init() {
    try {
      // Initialize Firebase (mock for now)
      await this.initializeFirebase();
      
      // Load active contests
      await this.loadActiveContests();
      
      console.log('🏆 Contest Manager initialized');
    } catch (error) {
      console.error('Failed to initialize contest manager:', error);
    }
  }
  async initializeFirebase() {
    // Initialize Firebase through the Firebase manager
    try {
      const { firebaseManager } = await import('./firebase.js');
      await firebaseManager.initialize();
      this.firebase = firebaseManager;
      
      // Generate mock data if using mock Firebase
      if (firebaseManager.mockData) {
        firebaseManager.generateMockData();
      }
      
      console.log('🔥 Firebase initialized through FirebaseManager');
    } catch (error) {
      console.warn('Firebase module not found, using mock implementation:', error);
      // Fallback to mock Firebase
      this.firebase = {
        initialized: true,
        mockData: true
      };
    }
  }

  async getActiveContests() {
    try {
      // Mock active contests data
      const now = new Date();
      const dailyContest = {
        id: 'daily_' + now.toISOString().split('T')[0],
        type: 'daily',
        name: 'Daily Pick\'em Contest',
        entryFee: config.contest.dailyEntryFee,
        prizePool: this.calculateDailyPrizePool(),
        playerCount: Math.floor(Math.random() * 500) + 50,
        startTime: this.getNextContestStartTime(),
        endTime: this.getContestEndTime(),
        maxPicks: config.contest.maxPicks,
        status: 'open'
      };

      const weeklyContest = {
        id: 'weekly_' + this.getWeekId(),
        type: 'weekly',
        name: 'Weekly NFT Holder Contest',
        entryFee: 0,
        prizeDescription: 'Exclusive NFT Rewards',
        playerCount: Math.floor(Math.random() * 100) + 20,
        startTime: this.getWeekStartTime(),
        endTime: this.getWeekEndTime(),
        maxPicks: config.contest.maxPicks,
        status: 'open',
        requiresNFT: true
      };

      this.activeContests = [dailyContest, weeklyContest];
      return this.activeContests;

    } catch (error) {
      console.error('Error loading active contests:', error);
      return [];
    }
  }

  async loadActiveContests() {
    this.activeContests = await this.getActiveContests();
  }

  async enterDailyContest(picks, walletManager) {
    try {
      if (!walletManager.isConnected) {
        throw new Error('Wallet not connected');
      }

      const contest = this.activeContests.find(c => c.type === 'daily');
      if (!contest) {
        throw new Error('No active daily contest found');
      }

      if (picks.length !== config.contest.maxPicks) {
        throw new Error(`Must make exactly ${config.contest.maxPicks} picks`);
      }

      // Validate picks
      await this.validatePicks(picks);

      // Process payment
      const paymentResult = await walletManager.sendNutsPayment(
        contest.entryFee,
        config.xrpl.contestWallet,
        `Daily Contest Entry: ${contest.id}`
      );

      if (!paymentResult.success) {
        throw new Error('Payment failed');
      }

      // Submit entry
      const entry = await this.submitContestEntry({
        contestId: contest.id,
        contestType: 'daily',
        playerWallet: walletManager.wallet.address,
        picks,
        entryFee: contest.entryFee,
        txHash: paymentResult.txHash,
        timestamp: new Date().toISOString()
      });

      this.dispatchEvent(new CustomEvent('contestEntered', {
        detail: { contest, entry, paymentResult }
      }));

      return {
        success: true,
        entry,
        paymentResult
      };

    } catch (error) {
      console.error('Error entering daily contest:', error);
      throw error;
    }
  }

  async enterWeeklyContest(picks, walletManager) {
    try {
      if (!walletManager.isConnected) {
        throw new Error('Wallet not connected');
      }

      if (!walletManager.hasRequiredNFT) {
        throw new Error('Required NFT not found in wallet');
      }

      const contest = this.activeContests.find(c => c.type === 'weekly');
      if (!contest) {
        throw new Error('No active weekly contest found');
      }

      if (picks.length !== config.contest.maxPicks) {
        throw new Error(`Must make exactly ${config.contest.maxPicks} picks`);
      }

      // Validate picks
      await this.validatePicks(picks);

      // Submit entry (no payment required for NFT holders)
      const entry = await this.submitContestEntry({
        contestId: contest.id,
        contestType: 'weekly',
        playerWallet: walletManager.wallet.address,
        picks,
        entryFee: 0,
        nftVerified: true,
        timestamp: new Date().toISOString()
      });

      this.dispatchEvent(new CustomEvent('contestEntered', {
        detail: { contest, entry }
      }));

      return {
        success: true,
        entry
      };

    } catch (error) {
      console.error('Error entering weekly contest:', error);
      throw error;
    }
  }

  async validatePicks(picks) {
    // Validate each pick
    for (const pick of picks) {
      if (!pick.gameId || !pick.selectedTeam) {
        throw new Error('Invalid pick format');
      }

      // Check if game is still open for picks
      if (this.isGameLocked(pick.gameId)) {
        throw new Error(`Game ${pick.gameId} is locked for picks`);
      }
    }

    // Check for duplicate games
    const gameIds = picks.map(p => p.gameId);
    const uniqueGameIds = new Set(gameIds);
    if (gameIds.length !== uniqueGameIds.size) {
      throw new Error('Cannot pick the same game multiple times');
    }

    return true;
  }

  async submitContestEntry(entryData) {
    try {
      // Mock database submission
      // In production, this would save to Firebase
      const entry = {
        id: this.generateEntryId(),
        ...entryData,
        score: 0,
        status: 'active'
      };

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));

      console.log('Contest entry submitted:', entry);
      return entry;

    } catch (error) {
      console.error('Error submitting contest entry:', error);
      throw error;
    }
  }

  async getPlayerEntries(walletAddress) {
    try {
      // Mock player entries
      // In production, query Firebase for user's entries
      return this.getMockPlayerEntries(walletAddress);

    } catch (error) {
      console.error('Error loading player entries:', error);
      return [];
    }
  }

  async getLeaderboard(contestId, limit = 10) {
    try {
      // Mock leaderboard data
      // In production, query Firebase for contest leaderboard
      return this.getMockLeaderboard(contestId, limit);

    } catch (error) {
      console.error('Error loading leaderboard:', error);
      return [];
    }
  }

  async getLatestWinners(limit = 5) {
    try {
      // Mock recent winners
      // In production, query Firebase for recent contest winners
      return this.getMockLatestWinners(limit);

    } catch (error) {
      console.error('Error loading latest winners:', error);
      return [];
    }
  }

  // Utility methods
  calculateDailyPrizePool() {
    // Simulate prize pool based on estimated entries
    const estimatedEntries = Math.floor(Math.random() * 300) + 100;
    return estimatedEntries * config.contest.dailyEntryFee;
  }

  getNextContestStartTime() {
    // Next contest starts at midnight UTC
    const tomorrow = new Date();
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    tomorrow.setUTCHours(0, 0, 0, 0);
    return tomorrow.toISOString();
  }

  getContestEndTime() {
    // Contest ends at 11:59 PM UTC same day
    const today = new Date();
    today.setUTCHours(23, 59, 59, 999);
    return today.toISOString();
  }

  getWeekStartTime() {
    // Week starts on Monday
    const now = new Date();
    const monday = new Date(now);
    monday.setDate(now.getDate() - (now.getDay() + 6) % 7);
    monday.setHours(0, 0, 0, 0);
    return monday.toISOString();
  }

  getWeekEndTime() {
    // Week ends on Sunday
    const now = new Date();
    const sunday = new Date(now);
    sunday.setDate(now.getDate() + (7 - now.getDay()));
    sunday.setHours(23, 59, 59, 999);
    return sunday.toISOString();
  }

  getWeekId() {
    const now = new Date();
    const year = now.getFullYear();
    const week = this.getWeekNumber(now);
    return `${year}W${week}`;
  }

  getWeekNumber(date) {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }

  isGameLocked(gameId) {
    // Mock game lock check
    // In production, check actual game start time
    return false;
  }

  generateEntryId() {
    return 'entry_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Mock data methods
  getMockPlayerEntries(walletAddress) {
    return [
      {
        id: 'entry_123',
        contestId: 'daily_2025-06-08',
        contestType: 'daily',
        picks: [],
        score: 7,
        rank: 15,
        status: 'completed',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      }
    ];
  }

  getMockLeaderboard(contestId, limit) {
    const players = [];
    for (let i = 1; i <= limit; i++) {
      players.push({
        rank: i,
        wallet: this.generateMockWallet(),
        score: Math.max(0, 10 - i + Math.floor(Math.random() * 3)),
        correctPicks: Math.max(0, 10 - i + Math.floor(Math.random() * 3)),
        totalPicks: 10,
        prize: i <= 3 ? this.calculatePrize(i) : 0
      });
    }
    return players;
  }

  getMockLatestWinners(limit) {
    const winners = [];
    for (let i = 0; i < limit; i++) {
      const daysAgo = Math.floor(Math.random() * 7);
      const date = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
      
      winners.push({
        wallet: this.generateMockWallet(),
        prize: Math.floor(Math.random() * 5000) + 1000,
        contestType: Math.random() > 0.5 ? 'Daily' : 'Weekly',
        date: date.toISOString(),
        rank: Math.floor(Math.random() * 3) + 1
      });
    }
    return winners;
  }

  generateMockWallet() {
    const chars = 'rABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'r';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  calculatePrize(rank) {
    const totalPrize = this.calculateDailyPrizePool();
    const distribution = config.contest.prizeDistribution;
    
    switch (rank) {
      case 1: return Math.floor(totalPrize * distribution.first);
      case 2: return Math.floor(totalPrize * distribution.second);
      case 3: return Math.floor(totalPrize * distribution.third);
      default: return 0;
    }
  }
}
