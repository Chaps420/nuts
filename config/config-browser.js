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
      issuer: 'rNutsTokenIssuerAddressHere',
      currency: 'NUTS'
    },
    contestWallet: {
      address: 'rnWCi37MWrY4EWxnUDVHMwJ8sLY7R1XiyX',
      seed: 'sEd7d97WpuAUt7Qn21yhkZxtso2pYbx', // WARNING: Private key exposed - for development only
      publicKey: 'ED9B0A601A4BF97C25C2FE340B80CE4CFD8400845AB7FA1FAF5EC9821007B45459',
      privateKey: 'ED71F2E8986DE2242CFAA7254C04F65CDE132350500872455117F02DCD6D232DD2'
    },
    requiredNftIssuer: 'rNFTIssuerAddressHere'
  },  // XUMM/Xaman wallet configuration
  xumm: {
    apiKey: '14242c23-a236-43bd-9126-6490cbd4001d',
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
    prizeDistribution: {
      first: 0.7,   // 70% to 1st place
      second: 0.2,  // 20% to 2nd place
      third: 0.1    // 10% to 3rd place
    }
  },
  // Firebase configuration
  firebase: {
    apiKey: "AIzaSyD1NOVFWVmM98hJDyZ-TbouHbknfGj5BMc",
    authDomain: "nuts-7b133.firebaseapp.com",
    projectId: "nuts-7b133",
    storageBucket: "nuts-7b133.firebasestorage.app",
    messagingSenderId: "452726245470",
    appId: "1:452726245470:web:23d8365bab3fda99fa4ccf",
    measurementId: "G-H1WDPZMNJD",
    // Cloud Functions
    cloudFunctions: {
      region: 'us-central1',
      endpoints: {
        processXamanAuth: '/processXamanAuth',
        createUserBet: '/createUserBet',
        getUserBets: '/getUserBets',
        getContestResults: '/getContestResults',
        generatePayoutQR: '/generatePayoutQR'
      }
    },
    // Firestore collections
    collections: {
      users: 'users',
      bets: 'bets',
      contests: 'contests',
      payouts: 'payouts'
    }
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
