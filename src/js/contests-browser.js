// Contest management for daily and weekly competitions
// Browser-compatible version without ES6 modules

class ContestManager extends EventTarget {
  constructor() {
    super();
    this.firebase = null;
    this.currentUser = null;
    this.activeContests = [];
  }

  async init() {
    try {
      // Initialize with mock data for browser compatibility
      await this.initializeFirebase();
      
      // Load active contests
      await this.loadActiveContests();
      
      console.log('🏆 Contest Manager initialized (browser mode)');
      return true;
    } catch (error) {
      console.error('Failed to initialize contest manager:', error);
      return false;
    }
  }

  async initializeFirebase() {
    console.log('🔥 Using mock Firebase for browser compatibility');
    // Mock Firebase implementation
    this.firebase = {
      initialized: true,
      mockData: true
    };
  }

  async getActiveContests() {
    try {
      // Mock active contests data
      const mockContests = [
        {
          id: 'daily-contest-001',
          type: 'daily',
          name: 'Daily Pick\'em Challenge',
          prizePool: 50000,
          playerCount: 247,
          status: 'active',
          startTime: new Date().toISOString(),
          endTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'nft-contest-001',
          type: 'weekly',
          name: 'NFT Holder Weekly',
          prizeDescription: 'Exclusive $NUTS NFTs',
          playerCount: 89,
          status: 'active',
          startTime: new Date().toISOString(),
          endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];

      this.activeContests = mockContests;
      return mockContests;
    } catch (error) {
      console.error('Error fetching active contests:', error);
      return [];
    }
  }

  async getLatestWinners(limit = 5) {
    try {
      // Mock recent winners data
      const mockWinners = [
        {
          wallet: 'rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH',
          prize: 25000,
          contestType: 'Daily',
          date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        },
        {
          wallet: 'rLNaPoKeeBjZe2qs6x52yVPZpZ8td4dc6w',
          prize: 15000,
          contestType: 'Daily',
          date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          wallet: 'rPVMhWBsfF9iMXYj3aAzJVkPDTFNSyWdKy',
          prize: 10000,
          contestType: 'Weekly',
          date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          wallet: 'rJrRMgiRgrU5penuadAisoXRbcTXdQaRj',
          prize: 5000,
          contestType: 'Daily',
          date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          wallet: 'rGKmhWBbPnkqnVxnDdMAhcYvMPfCDBXzTM',
          prize: 30000,
          contestType: 'Weekly',
          date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];

      return mockWinners.slice(0, limit);
    } catch (error) {
      console.error('Error fetching latest winners:', error);
      return [];
    }
  }

  async enterContest(contestId, picks, walletAddress) {
    try {
      console.log(`📝 Entering contest ${contestId} with picks:`, picks);
      
      // Validate wallet connection
      if (!walletAddress) {
        throw new Error('Wallet must be connected to enter contest');
      }

      // Validate picks
      if (!picks || picks.length === 0) {
        throw new Error('Must make at least one pick to enter contest');
      }

      // Mock contest entry
      const entry = {
        id: `entry-${Date.now()}`,
        contestId,
        walletAddress,
        picks,
        timestamp: new Date().toISOString(),
        status: 'submitted'
      };

      console.log('✅ Contest entry submitted:', entry);
      
      // Dispatch event
      this.dispatchEvent(new CustomEvent('contestEntered', {
        detail: { entry, contestId }
      }));

      return entry;
    } catch (error) {
      console.error('Error entering contest:', error);
      throw error;
    }
  }

  async getUserEntries(walletAddress) {
    try {
      // Mock user entries
      const mockEntries = [
        {
          id: 'entry-001',
          contestId: 'daily-contest-001',
          contestName: 'Daily Pick\'em Challenge',
          picks: ['LAL', 'GSW', 'BOS'],
          status: 'active',
          submittedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        }
      ];

      return mockEntries;
    } catch (error) {
      console.error('Error fetching user entries:', error);
      return [];
    }
  }

  async getContestResults(contestId) {
    try {
      // Mock contest results
      const mockResults = {
        contestId,
        status: 'completed',
        winners: [
          { wallet: 'rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH', prize: 25000, rank: 1 },
          { wallet: 'rLNaPoKeeBjZe2qs6x52yVPZpZ8td4dc6w', prize: 15000, rank: 2 },
          { wallet: 'rPVMhWBsfF9iMXYj3aAzJVkPDTFNSyWdKy', prize: 10000, rank: 3 }
        ],
        totalEntries: 247,
        prizePool: 50000
      };

      return mockResults;
    } catch (error) {
      console.error('Error fetching contest results:', error);
      return null;
    }
  }

  // Utility methods
  formatPrize(amount) {
    return `${amount.toLocaleString()} $NUTS`;
  }

  isContestActive(contest) {
    const now = new Date();
    const endTime = new Date(contest.endTime);
    return now < endTime && contest.status === 'active';
  }

  getTimeRemaining(contest) {
    const now = new Date();
    const endTime = new Date(contest.endTime);
    const diff = endTime - now;

    if (diff <= 0) return 'Contest ended';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h remaining`;
    }

    return `${hours}h ${minutes}m remaining`;
  }
}

// Make ContestManager available globally
window.ContestManager = ContestManager;
