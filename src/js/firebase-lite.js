/**
 * Firebase initialization script for $NUTS Sports Pick'em
 * This script loads Firebase modules dynamically to avoid bundle size issues
 * and gracefully falls back to mock data when Firebase is not configured
 */

let firebaseApp = null;
let firebaseDb = null;
let firebaseAuth = null;

export async function initializeFirebase() {
  try {
    // Check if Firebase configuration is available and valid
    if (!window.CONFIG?.firebase?.apiKey || 
        window.CONFIG.firebase.apiKey === 'your_firebase_api_key') {
      console.log('🔥 Firebase not configured, using mock implementation');
      return createMockFirebase();
    }

    // Dynamically import Firebase modules
    const { initializeApp } = await import('https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js');
    const { getFirestore, connectFirestoreEmulator } = await import('https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js');
    const { getAuth, connectAuthEmulator } = await import('https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js');

    // Initialize Firebase app
    firebaseApp = initializeApp(window.CONFIG.firebase);
    firebaseDb = getFirestore(firebaseApp);
    firebaseAuth = getAuth(firebaseApp);

    // Connect to emulators in development
    if (window.location.hostname === 'localhost') {
      try {
        connectFirestoreEmulator(firebaseDb, 'localhost', 8080);
        connectAuthEmulator(firebaseAuth, 'http://localhost:9099');
        console.log('🔥 Connected to Firebase emulators');
      } catch (error) {
        console.log('🔥 Firebase emulators not available, using production');
      }
    }

    console.log('🔥 Firebase initialized successfully');
    return createFirebaseWrapper();

  } catch (error) {
    console.warn('🔥 Firebase initialization failed, using mock:', error);
    return createMockFirebase();
  }
}

function createFirebaseWrapper() {
  return {
    app: firebaseApp,
    db: firebaseDb,
    auth: firebaseAuth,
    isReal: true,
    async addDocument(collection, data) {
      const { addDoc, collection: getCollection } = await import('https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js');
      return addDoc(getCollection(firebaseDb, collection), data);
    },
    async getDocument(collection, id) {
      const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js');
      const docRef = doc(firebaseDb, collection, id);
      return getDoc(docRef);
    },
    async updateDocument(collection, id, data) {
      const { doc, updateDoc } = await import('https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js');
      const docRef = doc(firebaseDb, collection, id);
      return updateDoc(docRef, data);
    },
    async queryCollection(collection, ...queryConstraints) {
      const { collection: getCollection, getDocs, query } = await import('https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js');
      const q = query(getCollection(firebaseDb, collection), ...queryConstraints);
      return getDocs(q);
    }
  };
}

function createMockFirebase() {
  const mockData = {
    contests: new Map(),
    entries: new Map(),
    leaderboards: new Map(),
    users: new Map()
  };

  // Generate some mock data
  generateMockData(mockData);

  return {
    app: null,
    db: null,
    auth: null,
    isReal: false,
    mockData,
    async addDocument(collection, data) {
      const id = `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const doc = { id, ...data, createdAt: new Date(), updatedAt: new Date() };
      mockData[collection] = mockData[collection] || new Map();
      mockData[collection].set(id, doc);
      return { id };
    },
    async getDocument(collection, id) {
      const doc = mockData[collection]?.get(id);
      return {
        exists: () => !!doc,
        data: () => doc,
        id: id
      };
    },
    async updateDocument(collection, id, data) {
      if (mockData[collection]?.has(id)) {
        const existing = mockData[collection].get(id);
        mockData[collection].set(id, { ...existing, ...data, updatedAt: new Date() });
      }
      return Promise.resolve();
    },
    async queryCollection(collection) {
      const docs = Array.from(mockData[collection]?.values() || []);
      return {
        docs: docs.map(doc => ({
          id: doc.id,
          data: () => doc,
          exists: true
        })),
        size: docs.length,
        empty: docs.length === 0
      };
    }
  };
}

function generateMockData(mockData) {
  // Generate mock contest
  const today = new Date().toISOString().split('T')[0];
  const mockContest = {
    id: `daily_${today}`,
    type: 'daily',
    title: `Daily Sports Pick'em - ${today}`,
    description: 'Pick winners for today\'s top games',
    entryFee: 50,
    prizePool: 3750,
    maxEntries: 1000,
    entries: 75,
    status: 'active',
    startTime: new Date().toISOString(),
    endTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    games: generateMockGames(),
    createdAt: new Date(),
    updatedAt: new Date()
  };

  mockData.contests = new Map();
  mockData.contests.set(mockContest.id, mockContest);

  // Generate mock leaderboard
  const mockLeaderboard = {
    id: mockContest.id,
    contestId: mockContest.id,
    rankings: generateMockRankings(),
    updatedAt: new Date()
  };

  mockData.leaderboards = new Map();
  mockData.leaderboards.set(mockContest.id, mockLeaderboard);

  // Generate mock entries
  mockData.entries = new Map();
  for (let i = 0; i < 5; i++) {
    const entryId = `entry_${Date.now()}_${i}`;
    const entry = {
      id: entryId,
      contestId: mockContest.id,
      userId: `user_${i}`,
      walletAddress: generateMockWallet(),
      picks: generateMockPicks(mockContest.games),
      score: Math.floor(Math.random() * 11),
      status: 'active',
      submittedAt: new Date()
    };
    mockData.entries.set(entryId, entry);
  }

  console.log('📊 Mock data generated successfully');
}

function generateMockGames() {
  const teams = [
    { name: 'Lakers', city: 'Los Angeles' },
    { name: 'Warriors', city: 'Golden State' },
    { name: 'Cowboys', city: 'Dallas' },
    { name: 'Eagles', city: 'Philadelphia' },
    { name: 'Yankees', city: 'New York' },
    { name: 'Red Sox', city: 'Boston' },
    { name: 'Chiefs', city: 'Kansas City' },
    { name: 'Ravens', city: 'Baltimore' }
  ];

  const games = [];
  for (let i = 0; i < 10; i++) {
    const homeTeam = teams[Math.floor(Math.random() * teams.length)];
    let awayTeam;
    do {
      awayTeam = teams[Math.floor(Math.random() * teams.length)];
    } while (awayTeam.name === homeTeam.name);

    games.push({
      id: `game_${i + 1}`,
      homeTeam: homeTeam.name,
      awayTeam: awayTeam.name,
      homeCity: homeTeam.city,
      awayCity: awayTeam.city,
      startTime: new Date(Date.now() + (i + 1) * 60 * 60 * 1000).toISOString(),
      sport: ['basketball', 'americanfootball', 'baseball'][Math.floor(Math.random() * 3)],
      homeOdds: -110 + Math.floor(Math.random() * 40),
      awayOdds: -110 + Math.floor(Math.random() * 40),
      status: 'scheduled'
    });
  }

  return games;
}

function generateMockRankings() {
  const rankings = [];
  for (let i = 1; i <= 10; i++) {
    rankings.push({
      rank: i,
      userId: `user_${i}`,
      walletAddress: generateMockWallet(),
      score: Math.max(0, 10 - i + Math.floor(Math.random() * 3)),
      correctPicks: Math.max(0, 10 - i + Math.floor(Math.random() * 3)),
      totalPicks: 10,
      prize: i <= 3 ? calculatePrize(i, 3750) : 0,
      username: `Player${i}`
    });
  }
  return rankings;
}

function generateMockPicks(games) {
  return games.slice(0, 10).map(game => ({
    gameId: game.id,
    selectedTeam: Math.random() > 0.5 ? game.homeTeam : game.awayTeam,
    confidence: Math.floor(Math.random() * 10) + 1
  }));
}

function generateMockWallet() {
  const chars = 'rABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'r';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function calculatePrize(rank, totalPrize) {
  switch (rank) {
    case 1: return Math.floor(totalPrize * 0.5);
    case 2: return Math.floor(totalPrize * 0.3);
    case 3: return Math.floor(totalPrize * 0.2);
    default: return 0;
  }
}

// Auto-initialize on import
export const firebase = await initializeFirebase();
