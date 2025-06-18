/**
 * Firebase initialization and database utilities for $NUTS Sports Pick'em
 * Handles database operations, contest data, and user management
 */

import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot,
  serverTimestamp 
} from 'firebase/firestore';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged 
} from 'firebase/auth';

class FirebaseManager {
  constructor() {
    this.app = null;
    this.db = null;
    this.auth = null;
    this.user = null;
    this.initialized = false;
  }

  async initialize() {
    try {
      // Firebase configuration from environment variables
      const firebaseConfig = {
        apiKey: window.CONFIG?.firebase?.apiKey,
        authDomain: window.CONFIG?.firebase?.authDomain,
        projectId: window.CONFIG?.firebase?.projectId,
        storageBucket: window.CONFIG?.firebase?.storageBucket,
        messagingSenderId: window.CONFIG?.firebase?.messagingSenderId,
        appId: window.CONFIG?.firebase?.appId
      };

      // Check if Firebase is properly configured
      if (!firebaseConfig.apiKey || firebaseConfig.apiKey === 'your_firebase_api_key') {
        console.warn('Firebase not configured, using mock data');
        this.initializeMockFirebase();
        return;
      }

      // Initialize Firebase
      this.app = initializeApp(firebaseConfig);
      this.db = getFirestore(this.app);
      this.auth = getAuth(this.app);

      // Set up auth state listener
      onAuthStateChanged(this.auth, (user) => {
        this.user = user;
        if (user) {
          console.log('User signed in:', user.uid);
        }
      });

      // Sign in anonymously for contest participation
      await signInAnonymously(this.auth);
      
      this.initialized = true;
      console.log('Firebase initialized successfully');

    } catch (error) {
      console.error('Firebase initialization error:', error);
      this.initializeMockFirebase();
    }
  }

  initializeMockFirebase() {
    // Mock Firebase for development/testing
    this.initialized = true;
    this.mockData = {
      contests: new Map(),
      entries: new Map(),
      leaderboards: new Map(),
      users: new Map()
    };
    console.log('Mock Firebase initialized');
  }

  // Contest Management
  async createContest(contestData) {
    if (!this.initialized) {
      throw new Error('Firebase not initialized');
    }

    if (this.mockData) {
      // Mock implementation
      const contestId = `contest_${Date.now()}`;
      this.mockData.contests.set(contestId, {
        id: contestId,
        ...contestData,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      return contestId;
    }

    try {
      const docRef = await addDoc(collection(this.db, 'contests'), {
        ...contestData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating contest:', error);
      throw error;
    }
  }

  async getContest(contestId) {
    if (!this.initialized) {
      throw new Error('Firebase not initialized');
    }

    if (this.mockData) {
      return this.mockData.contests.get(contestId) || null;
    }

    try {
      const docRef = doc(this.db, 'contests', contestId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
      return null;
    } catch (error) {
      console.error('Error getting contest:', error);
      throw error;
    }
  }

  async getActiveContests() {
    if (!this.initialized) {
      throw new Error('Firebase not initialized');
    }

    if (this.mockData) {
      const contests = Array.from(this.mockData.contests.values())
        .filter(contest => contest.status === 'active')
        .sort((a, b) => b.createdAt - a.createdAt);
      return contests;
    }

    try {
      const q = query(
        collection(this.db, 'contests'),
        where('status', '==', 'active'),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const contests = [];
      querySnapshot.forEach((doc) => {
        contests.push({ id: doc.id, ...doc.data() });
      });
      
      return contests;
    } catch (error) {
      console.error('Error getting active contests:', error);
      throw error;
    }
  }

  // Contest Entry Management
  async submitContestEntry(entryData) {
    if (!this.initialized) {
      throw new Error('Firebase not initialized');
    }

    if (this.mockData) {
      const entryId = `entry_${Date.now()}`;
      this.mockData.entries.set(entryId, {
        id: entryId,
        ...entryData,
        submittedAt: new Date()
      });
      return entryId;
    }

    try {
      const docRef = await addDoc(collection(this.db, 'entries'), {
        ...entryData,
        submittedAt: serverTimestamp(),
        userId: this.user?.uid
      });
      return docRef.id;
    } catch (error) {
      console.error('Error submitting entry:', error);
      throw error;
    }
  }

  async getUserEntries(userId) {
    if (!this.initialized) {
      throw new Error('Firebase not initialized');
    }

    if (this.mockData) {
      const entries = Array.from(this.mockData.entries.values())
        .filter(entry => entry.userId === userId)
        .sort((a, b) => b.submittedAt - a.submittedAt);
      return entries;
    }

    try {
      const q = query(
        collection(this.db, 'entries'),
        where('userId', '==', userId),
        orderBy('submittedAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const entries = [];
      querySnapshot.forEach((doc) => {
        entries.push({ id: doc.id, ...doc.data() });
      });
      
      return entries;
    } catch (error) {
      console.error('Error getting user entries:', error);
      throw error;
    }
  }

  async getContestEntries(contestId) {
    if (!this.initialized) {
      throw new Error('Firebase not initialized');
    }

    if (this.mockData) {
      const entries = Array.from(this.mockData.entries.values())
        .filter(entry => entry.contestId === contestId);
      return entries;
    }

    try {
      const q = query(
        collection(this.db, 'entries'),
        where('contestId', '==', contestId)
      );
      
      const querySnapshot = await getDocs(q);
      const entries = [];
      querySnapshot.forEach((doc) => {
        entries.push({ id: doc.id, ...doc.data() });
      });
      
      return entries;
    } catch (error) {
      console.error('Error getting contest entries:', error);
      throw error;
    }
  }

  // Leaderboard Management
  async updateLeaderboard(contestId, leaderboardData) {
    if (!this.initialized) {
      throw new Error('Firebase not initialized');
    }

    if (this.mockData) {
      this.mockData.leaderboards.set(contestId, {
        contestId,
        ...leaderboardData,
        updatedAt: new Date()
      });
      return;
    }

    try {
      const docRef = doc(this.db, 'leaderboards', contestId);
      await updateDoc(docRef, {
        ...leaderboardData,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating leaderboard:', error);
      throw error;
    }
  }

  async getLeaderboard(contestId) {
    if (!this.initialized) {
      throw new Error('Firebase not initialized');
    }

    if (this.mockData) {
      return this.mockData.leaderboards.get(contestId) || null;
    }

    try {
      const docRef = doc(this.db, 'leaderboards', contestId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
      return null;
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      throw error;
    }
  }

  // User Management
  async updateUserProfile(userId, profileData) {
    if (!this.initialized) {
      throw new Error('Firebase not initialized');
    }

    if (this.mockData) {
      const existingUser = this.mockData.users.get(userId) || {};
      this.mockData.users.set(userId, {
        ...existingUser,
        ...profileData,
        updatedAt: new Date()
      });
      return;
    }

    try {
      const docRef = doc(this.db, 'users', userId);
      await updateDoc(docRef, {
        ...profileData,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  async getUserProfile(userId) {
    if (!this.initialized) {
      throw new Error('Firebase not initialized');
    }

    if (this.mockData) {
      return this.mockData.users.get(userId) || null;
    }

    try {
      const docRef = doc(this.db, 'users', userId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
      return null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
  }

  // Real-time listeners
  subscribeToContest(contestId, callback) {
    if (!this.initialized) {
      throw new Error('Firebase not initialized');
    }

    if (this.mockData) {
      // Mock real-time updates
      const interval = setInterval(() => {
        const contest = this.mockData.contests.get(contestId);
        if (contest) {
          callback(contest);
        }
      }, 5000);
      
      return () => clearInterval(interval);
    }

    try {
      const docRef = doc(this.db, 'contests', contestId);
      return onSnapshot(docRef, (doc) => {
        if (doc.exists()) {
          callback({ id: doc.id, ...doc.data() });
        }
      });
    } catch (error) {
      console.error('Error subscribing to contest:', error);
      throw error;
    }
  }

  subscribeToLeaderboard(contestId, callback) {
    if (!this.initialized) {
      throw new Error('Firebase not initialized');
    }

    if (this.mockData) {
      // Mock real-time updates
      const interval = setInterval(() => {
        const leaderboard = this.mockData.leaderboards.get(contestId);
        if (leaderboard) {
          callback(leaderboard);
        }
      }, 10000);
      
      return () => clearInterval(interval);
    }

    try {
      const docRef = doc(this.db, 'leaderboards', contestId);
      return onSnapshot(docRef, (doc) => {
        if (doc.exists()) {
          callback({ id: doc.id, ...doc.data() });
        }
      });
    } catch (error) {
      console.error('Error subscribing to leaderboard:', error);
      throw error;
    }
  }

  // Utility methods
  getCurrentUser() {
    return this.user;
  }

  isInitialized() {
    return this.initialized;
  }

  generateMockData() {
    if (!this.mockData) return;

    // Generate mock contest data
    const mockContest = {
      id: 'daily_contest_20241208',
      type: 'daily',
      title: 'Daily Sports Pick\'em - December 8, 2024',
      description: 'Pick winners for today\'s top games',
      entryFee: 50,
      prizePool: 5000,
      maxEntries: 1000,
      entries: 247,
      status: 'active',
      games: [
        {
          id: 'game_1',
          homeTeam: 'Lakers',
          awayTeam: 'Warriors',
          startTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
          sport: 'basketball'
        },
        {
          id: 'game_2',
          homeTeam: 'Cowboys',
          awayTeam: 'Eagles',
          startTime: new Date(Date.now() + 3 * 60 * 60 * 1000),
          sport: 'americanfootball'
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.mockData.contests.set(mockContest.id, mockContest);

    // Generate mock leaderboard
    const mockLeaderboard = {
      contestId: mockContest.id,
      rankings: [
        { userId: 'user_1', walletAddress: 'rXXX...123', score: 9, winnings: 2000 },
        { userId: 'user_2', walletAddress: 'rXXX...456', score: 8, winnings: 1500 },
        { userId: 'user_3', walletAddress: 'rXXX...789', score: 8, winnings: 1000 }
      ],
      updatedAt: new Date()
    };

    this.mockData.leaderboards.set(mockContest.id, mockLeaderboard);

    console.log('Mock data generated');
  }
}

// Export singleton instance
export const firebaseManager = new FirebaseManager();
export default firebaseManager;
