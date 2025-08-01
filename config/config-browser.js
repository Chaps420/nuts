// Configuration file for the $NUTS Sports Pick'em platform
// Browser-compatible configuration without ES6 modules

window.config = {
  app: {
    name: '$NUTS Sports Pick\'em',
    version: '1.0.0',
    debug: true
  },
    // The Odds API configuration
  oddsApi: {
    key: '9d542e15caa7acb9fc6dd5d3dc72ed6d',
    baseUrl: 'https://api.the-odds-api.com/v4',
    endpoints: {
      sports: '/sports',
      odds: '/sports/{sport}/odds',
      scores: '/sports/{sport}/scores'
    },
    defaultSports: ['baseball_mlb'],
    markets: ['h2h'], // head-to-head (winner) markets
    regions: ['us'],
    oddsFormat: 'american'
  },
  // XRPL configuration
  xrpl: {
    network: 'mainnet',
    server: 'wss://xrplcluster.com',
    nutsToken: {
      issuer: 'rBpdegD7kqHdczjKzTKNEUZj1Fg1eYZRbe',
      currency: 'NUTS'
    },
    contestWallet: {
      address: 'rN2K1Tv6LEM94YN8Kxfe3QyWcGPQNgsD6d'
      // No private keys in production!
    },
    requiredNftIssuer: 'rNFTIssuerAddressHere'
  },  // XUMM/Xaman wallet configuration
  xumm: {
    apiKey: '5ae8e69a-1b48-4f80-b5bb-20ae099e6f2f',
    apiSecret: '6b5d2831-aa58-4b5b-9b72-fe0f65de3e5c',
    apiUrl: 'https://xumm.app/api/v1',
    websocketUrl: 'wss://xumm.app/sign/',
    oauthClientId: 'your-xaman-oauth-client-id', // Replace with actual OAuth2 client ID when registered
    oauthClientSecret: 'your-oauth-client-secret', // For server-side only
    networks: {
      testnet: 'wss://s.altnet.rippletest.net:51233',
      mainnet: 'wss://xrplcluster.com'
    },
    oauth: {
      authorizationUrl: 'https://oauth2.xumm.app/auth',
      tokenUrl: 'https://oauth2.xumm.app/token',
      userInfoUrl: 'https://oauth2.xumm.app/userinfo',
      scope: 'openid profile email wallet:read',
      redirectUri: window.location.origin + '/daily-contest.html'
    },
    qr: {
      size: 256,
      quality: 'M',
      margin: 4
    }
  },

  // Contest settings
  contest: {
    dailyEntryFee: 50,
    maxPicks: 10,
    lockTimeBuffer: 5, // minutes before first game
    minimumEntries: 4, // Minimum players required to run contest
    prizeDistribution: {
      first: 0.5,   // 50% to 1st place
      second: 0.3,  // 30% to 2nd place
      third: 0.2    // 20% to 3rd place
    }
  },
  // Firebase configuration
  firebase: {
    apiKey: "AIzaSyB25fHJN3_6EzpE-KIkp3fEMFtsKEBmtY8",
    authDomain: "nuts-sports-pickem.firebaseapp.com",
    projectId: "nuts-sports-pickem",
    storageBucket: "nuts-sports-pickem.firebasestorage.app",
    messagingSenderId: "759992859280",
    appId: "1:759992859280:web:e42c5c219e4bc0c2e8f615",
    // Cloud Functions URL for GitHub Pages
    functionsUrl: "https://us-central1-nuts-sports-pickem.cloudfunctions.net",
    // Cloud Functions
    cloudFunctions: {
      region: 'us-central1',
      endpoints: {
        processXamanAuth: '/processXamanAuth',
        createUserBet: '/createUserBet',
        getUserBets: '/getUserBets',
        getContestResults: '/getContestResults',
        generatePayoutQR: '/generatePayoutQR',
        // New endpoints for production
        createContestEntry: '/createContestEntry',
        getContestEntries: '/getContestEntries',
        updateGameResults: '/updateGameResults'
      }
    },
    // Firestore collections
    collections: {
      users: 'users',
      bets: 'bets',
      contests: 'contests',
      payouts: 'payouts',
      mlbContests: 'mlbContests',
      nflContests: 'nflContests',
      contestEntries: 'contestEntries'
    },
    // CORS configuration for GitHub Pages
    allowedOrigins: [
      'https://yourusername.github.io', // Replace with your GitHub username
      'http://localhost:8080',
      'http://localhost:3000',
      'https://nuts-sports-pickem.web.app',
      'https://nuts-sports-pickem.firebaseapp.com'
    ]
  },
  },

  // NFT Configuration
  nft: {
    collectionUrl: 'https://xrp.cafe/collection/nutsmlb',
    requiredCollection: 'NUTS MLB Collection',
    marketplaceUrl: 'https://xrp.cafe'
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

console.log('✅ Configuration loaded:', window.config);
