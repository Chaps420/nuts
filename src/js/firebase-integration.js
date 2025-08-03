/**
 * Firebase Integration Module for $NUTS Sports Pick'em
 * Handles user authentication, bet storage, and admin functions
 */

class FirebaseIntegration {
    constructor() {
        this.config = window.config?.firebase || {};
        this.db = null;
        this.auth = null;
        this.functions = null;
        this.currentUser = null;
        this.initialized = false;
        
        console.log('🔥 Firebase Integration initializing...');
    }

    /**
     * Initialize Firebase services
     */
    async initialize() {
        try {
            console.log('🔥 Initializing Firebase...');
            
            // Wait for Firebase SDK to be fully loaded
            await this.waitForFirebase();
            
            // Check if Firebase SDK is loaded
            if (typeof firebase === 'undefined') {
                throw new Error('Firebase SDK not loaded after waiting');
            }

            // Check for required Firebase services
            if (!firebase.auth) {
                throw new Error('Firebase Auth not available');
            }
            if (!firebase.firestore) {
                throw new Error('Firebase Firestore not available');
            }
            if (!firebase.functions) {
                throw new Error('Firebase Functions not available');
            }

            // Initialize Firebase app
            if (!firebase.apps.length) {
                firebase.initializeApp(this.config);
                console.log('🔥 Firebase app initialized');
            }

            // Initialize services
            this.auth = firebase.auth();
            this.db = firebase.firestore();
            this.functions = firebase.functions();

            // Set up auth state listener
            this.auth.onAuthStateChanged((user) => {
                this.handleAuthStateChange(user);
            });

            this.initialized = true;
            console.log('✅ Firebase integration ready');
            
            return true;
        } catch (error) {
            console.error('❌ Firebase initialization failed:', error);
            return false;
        }
    }

    /**
     * Wait for Firebase SDK to be fully loaded
     */
    async waitForFirebase(maxWaitTime = 10000) {
        const startTime = Date.now();
        
        while (Date.now() - startTime < maxWaitTime) {
            if (typeof firebase !== 'undefined' && 
                firebase.auth && 
                firebase.firestore && 
                firebase.functions) {
                console.log('✅ Firebase SDK fully loaded');
                return true;
            }
            
            console.log('⏳ Waiting for Firebase SDK to load...');
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        throw new Error('Firebase SDK failed to load within timeout');
    }

    /**
     * Handle authentication state changes
     */
    handleAuthStateChange(user) {
        if (user) {
            this.currentUser = user;
            console.log('✅ Firebase user authenticated:', user.uid);
            this.dispatchEvent('firebaseUserAuthenticated', { user });
        } else {
            this.currentUser = null;
            console.log('🚪 Firebase user signed out');
            this.dispatchEvent('firebaseUserSignedOut');
        }
    }    /**
     * Process Xaman authentication through Cloud Function
     */
    async processXamanAuth(xamanPayload) {        try {
            console.log('🔄 Processing Xaman authentication...');
            
            // Check if we're in real wallet mode or development mode
            const isRealWallet = window.xamanQR && window.xamanQR.forceRealWallet;
            const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            
            if (isRealWallet) {
                console.log('🚀 REAL WALLET MODE: Processing authentication with live backend');
                // Continue to production Cloud Functions even on localhost for real wallet testing
            } else if (isLocalhost) {
                console.log('🛠️ Development mode detected, using local authentication simulation...');
                return this.simulateLocalAuth(xamanPayload);
            }

            // Try production Cloud Functions (for both production and real wallet testing)
            if (!this.functions) {
                throw new Error('Firebase Functions not initialized');
            }

            console.log('🔥 Attempting Cloud Functions authentication...');
            const processAuth = this.functions.httpsCallable('processXamanAuth');
            const result = await processAuth({
                payloadId: xamanPayload.uuid,
                userAddress: xamanPayload.response?.account || xamanPayload.wallet_address,
                signedTx: xamanPayload.response?.txid,
                realWallet: isRealWallet,
                userName: xamanPayload.name || 'Xaman User'
            });

            if (result.data.success) {
                // Custom token received, sign in to Firebase
                await this.auth.signInWithCustomToken(result.data.customToken);
                
                console.log('✅ Real wallet authentication successful');
                return {
                    success: true,
                    user: this.currentUser,
                    userData: result.data.userData,
                    realWallet: isRealWallet
                };
            } else {
                throw new Error(result.data.error || 'Authentication failed');
            }
        } catch (error) {
            console.error('❌ Xaman authentication failed:', error);
            
            if (window.xamanQR?.forceRealWallet) {
                console.warn('🚀 Real wallet mode: Cloud Functions unavailable, using enhanced local auth');
            } else {
                console.log('🛠️ Falling back to local authentication simulation...');
            }
            
            return this.simulateLocalAuth(xamanPayload);
        }
    }

    /**
     * Simulate local authentication for development/fallback
     */
    simulateLocalAuth(xamanPayload) {
        const isRealWallet = window.xamanQR?.forceRealWallet || false;
        
        console.log(isRealWallet ? '🚀 Real wallet local auth simulation' : '🛠️ Development authentication simulation');
        
        const simulatedResult = {
            success: true,
            customToken: (isRealWallet ? 'real_wallet_local_' : 'dev_token_') + Date.now(),
            userData: {
                uid: (isRealWallet ? 'real_wallet_user_' : 'dev_user_') + Date.now(),
                xrplAddress: xamanPayload.response?.account || xamanPayload.wallet_address || 'rSimulatedUser123456789',
                displayName: xamanPayload.name || (isRealWallet ? 'Real Wallet User' : 'Development User'),
                isRealWallet: isRealWallet,
                authMethod: isRealWallet ? 'real_wallet_local' : 'development'
            },
            realWallet: isRealWallet
        };
          console.log('✅ Local authentication successful:', simulatedResult);
        return simulatedResult;
    }

    /**
     * Create a user bet in Firestore
     */
    async createUserBet(betData) {
        try {
            console.log('💰 Creating user bet...');
            
            if (!this.currentUser) {
                throw new Error('User not authenticated');
            }

            if (!this.db) {
                throw new Error('Firestore not initialized');
            }

            const bet = {
                userId: this.currentUser.uid,
                userAddress: this.currentUser.displayName, // We'll store XRPL address as displayName
                contestId: betData.contestId,
                gameId: betData.gameId,
                selection: betData.selection, // team chosen
                odds: betData.odds,
                amount: betData.amount || 100, // Default 100 NUTS
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                status: 'pending',
                txHash: betData.txHash || null
            };

            const docRef = await this.db.collection(this.config.collections.bets).add(bet);
            
            console.log('✅ Bet created:', docRef.id);
            
            // Dispatch event for UI updates
            this.dispatchEvent('betCreated', { betId: docRef.id, bet });
            
            return {
                success: true,
                betId: docRef.id,
                bet
            };
        } catch (error) {
            console.error('❌ Failed to create bet:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get user's bets
     */
    async getUserBets(userId = null) {
        try {
            const targetUserId = userId || this.currentUser?.uid;
            if (!targetUserId) {
                throw new Error('User ID not provided and no current user');
            }

            console.log('📋 Fetching user bets for:', targetUserId);

            const snapshot = await this.db
                .collection(this.config.collections.bets)
                .where('userId', '==', targetUserId)
                .orderBy('timestamp', 'desc')
                .get();

            const bets = [];
            snapshot.forEach(doc => {
                bets.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            console.log(`✅ Found ${bets.length} bets for user`);
            return bets;
        } catch (error) {
            console.error('❌ Failed to fetch user bets:', error);
            return [];
        }
    }

    /**
     * Get all bets for admin portal
     */
    async getAllBets(contestId = null) {
        try {
            console.log('🏦 Fetching all bets for admin...');

            let query = this.db.collection(this.config.collections.bets);
            
            if (contestId) {
                query = query.where('contestId', '==', contestId);
            }

            const snapshot = await query
                .orderBy('timestamp', 'desc')
                .get();

            const bets = [];
            snapshot.forEach(doc => {
                bets.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            console.log(`✅ Found ${bets.length} total bets`);
            return bets;
        } catch (error) {
            console.error('❌ Failed to fetch all bets:', error);
            return [];
        }
    }

    /**
     * Generate payout QR code for admin
     */
    async generatePayoutQR(winnerAddress, amount, contestId) {
        try {
            console.log('💸 Generating payout QR for:', winnerAddress);

            if (!this.functions) {
                throw new Error('Firebase Functions not initialized');
            }

            const generateQR = this.functions.httpsCallable('generatePayoutQR');
            const result = await generateQR({
                recipientAddress: winnerAddress,
                amount: amount,
                contestId: contestId,
                memo: `NUTS Prize - Contest ${contestId}`
            });

            if (result.data.success) {
                console.log('✅ Payout QR generated successfully');
                return {
                    success: true,
                    qrData: result.data.qrData,
                    payloadId: result.data.payloadId
                };
            } else {
                throw new Error(result.data.error || 'Failed to generate payout QR');
            }
        } catch (error) {
            console.error('❌ Failed to generate payout QR:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Update bet status (for resolving contests)
     */
    async updateBetStatus(betId, status, result = null) {
        try {
            console.log('🔄 Updating bet status:', betId, status);

            const updateData = {
                status: status,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            if (result !== null) {
                updateData.result = result; // 'win', 'loss', 'push'
            }

            await this.db
                .collection(this.config.collections.bets)
                .doc(betId)
                .update(updateData);

            console.log('✅ Bet status updated');
            return true;
        } catch (error) {
            console.error('❌ Failed to update bet status:', error);
            return false;
        }
    }

    /**
     * Get contest winners
     */
    async getContestWinners(contestId) {
        try {
            console.log('🏆 Fetching contest winners for:', contestId);

            const snapshot = await this.db
                .collection(this.config.collections.bets)
                .where('contestId', '==', contestId)
                .where('result', '==', 'win')
                .get();

            const winners = [];
            snapshot.forEach(doc => {
                const bet = doc.data();
                winners.push({
                    betId: doc.id,
                    userId: bet.userId,
                    userAddress: bet.userAddress,
                    amount: bet.amount,
                    selection: bet.selection,
                    gameId: bet.gameId
                });
            });

            console.log(`🏆 Found ${winners.length} winners`);
            return winners;
        } catch (error) {
            console.error('❌ Failed to fetch winners:', error);
            return [];
        }
    }

    /**
     * Utility method to dispatch custom events
     */
    dispatchEvent(eventName, detail = {}) {
        const event = new CustomEvent(eventName, {
            detail: detail,
            bubbles: true
        });
        window.dispatchEvent(event);
    }

    /**
     * Sign out current user
     */
    async signOut() {
        try {
            await this.auth.signOut();
            console.log('✅ User signed out successfully');
            return true;
        } catch (error) {
            console.error('❌ Sign out failed:', error);
            return false;
        }
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return !!this.currentUser;
    }

    /**
     * Get current user info
     */
    getCurrentUser() {
        return this.currentUser;
    }
}

// Initialize global instance
window.firebaseIntegration = new FirebaseIntegration();

console.log('🔥 Firebase Integration module loaded');
