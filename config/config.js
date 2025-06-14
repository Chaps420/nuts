// Configuration file for the $NUTS Sports Pick'em platform
export const config = {
  app: {
    name: import.meta.env.VITE_APP_NAME || '$NUTS Sports Pick\'em',
    version: import.meta.env.VITE_APP_VERSION || '1.0.0',
    debug: import.meta.env.VITE_DEBUG === 'true'
  },
  
  // The Odds API configuration
  oddsApi: {
    key: import.meta.env.VITE_ODDS_API_KEY,
    baseUrl: import.meta.env.VITE_ODDS_API_URL || 'https://api.the-odds-api.com/v4',
    endpoints: {
      sports: '/sports',
      odds: '/sports/{sport}/odds',
      scores: '/sports/{sport}/scores'
    },
    defaultSports: ['americanfootball_nfl', 'basketball_nba', 'baseball_mlb', 'icehockey_nhl'],
    markets: ['h2h'], // head-to-head (winner) markets
    regions: ['us'],
    oddsFormat: 'american'
  },  // XRPL configuration
  xrpl: {
    network: import.meta.env.VITE_XRPL_NETWORK || 'mainnet',
    server: import.meta.env.VITE_XRPL_SERVER || 'wss://xrplcluster.com',
    nutsToken: {
      issuer: import.meta.env.VITE_NUTS_TOKEN_ISSUER,
      currency: import.meta.env.VITE_NUTS_TOKEN_CURRENCY || 'NUTS'
    },
    contestWallet: {
      address: 'rnWCi37MWrY4EWxnUDVHMwJ8sLY7R1XiyX',
      seed: 'sEd7d97WpuAUt7Qn21yhkZxtso2pYbx' // WARNING: Private key exposed - for development only
    },
    requiredNftIssuer: import.meta.env.VITE_REQUIRED_NFT_ISSUER
  },

  // XUMM/Xaman wallet configuration
  xumm: {
    apiKey: import.meta.env.VITE_XUMM_API_KEY,
    apiSecret: import.meta.env.VITE_XUMM_API_SECRET,
    networks: {
      testnet: 'wss://s.altnet.rippletest.net:51233',
      mainnet: 'wss://xrplcluster.com'
    }
  },

  // Contest settings
  contest: {
    dailyEntryFee: parseFloat(import.meta.env.VITE_DAILY_ENTRY_FEE) || 50,
    maxPicks: 10,
    lockTimeBuffer: 5, // minutes before first game
    prizeDistribution: {
      first: 0.7,   // 70% to 1st place
      second: 0.2,  // 20% to 2nd place
      third: 0.1    // 10% to 3rd place
    }
  },

  // Firebase configuration
  firebase: {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
  },

  // UI configuration
  ui: {
    theme: 'dark',
    colors: {
      primary: '#0a0a0a',
      secondary: '#1a1a1a',
      accent: '#ffa500',
      success: '#00ff88',
      error: '#ff4444',
      text: '#ffffff',
      textSecondary: '#b0b0b0'
    },
    animations: {
      duration: 300,
      easing: 'ease-in-out'
    }
  }
};

export default config;
