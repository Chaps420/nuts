/**
 * Firebase + Xaman Integration
 * Handles the complete flow: payment -> Firebase storage -> contest entry
 */

class FirebaseXamanIntegration {
    constructor() {
        this.firebase = window.firebaseIntegration;
        this.xaman = window.xamanPaymentFixed || window.xamanPayment || window.xamanProperAPI || window.xamanSimplePayment || window.xamanAPIPayment;
        this.backend = window.ContestBackend ? new ContestBackend() : null;
        this.initialized = false;
        
        console.log('🔗 Firebase + Xaman Integration initializing...');
    }

    async init() {
        try {
            // Initialize Firebase if not already done
            if (this.firebase && !this.firebase.initialized) {
                await this.firebase.initialize();
            }

            // Check if both systems are ready
            if (!this.firebase || !this.firebase.initialized) {
                console.warn('⚠️ Firebase not initialized, using local storage');
            }

            // Re-check for xaman payment system
            this.xaman = window.xamanPaymentSimple || window.xamanPayment || window.xamanPaymentFixed || window.xamanProperAPI || window.xamanSimplePayment || window.xamanAPIPayment;
            
            if (!this.xaman) {
                console.warn('⚠️ Xaman payment system not found, will retry on use');
            }

            this.initialized = true;
            console.log('✅ Firebase + Xaman integration ready');
            
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize integration:', error);
            return false;
        }
    }

    /**
     * Process contest entry with payment and Firebase storage
     */
    async processContestEntry(contestData) {
        try {
            console.log('🎮 Processing contest entry...', contestData);
            
            // Re-check for xaman payment system if not found during init
            if (!this.xaman) {
                this.xaman = window.xamanPaymentSimple || window.xamanPayment || window.xamanPaymentFixed || window.xamanProperAPI || window.xamanSimplePayment || window.xamanAPIPayment;
                if (!this.xaman) {
                    throw new Error('Xaman payment system not available');
                }
            }
            
            // Step 1: Create and show payment QR
            const paymentResult = await this.xaman.createContestPayment();
            
            if (!paymentResult.success) {
                throw new Error('Payment cancelled or failed');
            }

            console.log('✅ Payment successful:', paymentResult.txid);
            
            // Step 2: Store entry in Firebase
            const entryData = {
                ...contestData,
                paymentTxHash: paymentResult.txid,
                paymentTimestamp: paymentResult.timestamp || new Date().toISOString(),
                paymentAmount: 50,
                paymentCurrency: 'NUTS',
                walletAddress: paymentResult.walletAddress || null
            };

            let storeResult;
            
            if (this.firebase && this.firebase.initialized) {
                // Store in Firebase
                storeResult = await this.storeInFirebase(entryData);
            } else {
                // Fallback to local backend
                if (this.backend) {
                    storeResult = await this.backend.storeContestEntry(entryData);
                } else {
                    // Last resort: local storage
                    storeResult = this.storeInLocalStorage(entryData);
                }
            }

            console.log('✅ Contest entry stored:', storeResult);
            
            // Step 3: Return success with entry details
            return {
                success: true,
                entryId: storeResult.entryId,
                txHash: paymentResult.txHash,
                timestamp: entryData.paymentTimestamp
            };

        } catch (error) {
            console.error('❌ Contest entry failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Store contest entry in Firebase
     */
    async storeInFirebase(entryData) {
        try {
            // Check if Firebase is available
            if (!this.firebase || !this.firebase.db) {
                console.warn('⚠️ Firebase not available, falling back to local storage');
                return this.storeInLocalStorage(entryData);
            }
            
            const db = this.firebase.db;
            
            // Ensure anonymous authentication for contest entries
            if (this.firebase.auth && !this.firebase.currentUser) {
                try {
                    console.log('🔐 Signing in anonymously for contest entry...');
                    await this.firebase.auth.signInAnonymously();
                    console.log('✅ Anonymous auth successful');
                } catch (authError) {
                    console.warn('⚠️ Anonymous auth failed, proceeding without auth:', authError.message);
                    // Continue without auth - let Firestore rules handle it
                }
            }
            
            // Generate entry ID
            const entryId = `ENTRY_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            // Prepare entry document
            const entryDoc = {
                id: entryId,
                userId: entryData.userId,
                userName: entryData.userName,
                twitterHandle: entryData.twitterHandle || null,
                walletAddress: entryData.walletAddress || null,
                contestDate: entryData.contestDay,
                picks: entryData.picks,
                tiebreakerRuns: entryData.tiebreakerRuns,
                totalGames: Object.keys(entryData.picks).length,
                entryFee: entryData.entryFee,
                paymentTxHash: entryData.paymentTxHash,
                paymentTimestamp: entryData.paymentTimestamp,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                status: 'active',
                contestStatus: 'active', // New field to track contest state
                score: 0,
                prizeWon: 0
            };

            try {
                // Store main entry
                await db.collection('contest_entries').doc(entryId).set(entryDoc);
            
            // Store individual picks for easier querying
            const batch = db.batch();
            
            Object.keys(entryData.picks).forEach(gameId => {
                const pickRef = db.collection('game_picks').doc();
                batch.set(pickRef, {
                    entryId: entryId,
                    userId: entryData.userId,
                    gameId: gameId,
                    pickedTeam: entryData.picks[gameId],
                    contestDate: entryData.contestDay,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                });
            });
            
            await batch.commit();
            
            // Store payment record
            await db.collection('payments').doc(entryData.paymentTxHash).set({
                entryId: entryId,
                userId: entryData.userId,
                amount: entryData.entryFee,
                currency: 'NUTS',
                txHash: entryData.paymentTxHash,
                timestamp: entryData.paymentTimestamp,
                type: 'contest_entry',
                status: 'completed'
            });

                console.log('✅ Entry stored in Firebase:', entryId);
                
                return { success: true, entryId: entryId };
            } catch (firestoreError) {
                console.error('❌ Firestore write failed:', firestoreError);
                
                // If it's a permissions error, fall back to local storage
                if (firestoreError.code === 'permission-denied') {
                    console.warn('⚠️ Firebase permissions issue, falling back to local storage');
                    return this.storeInLocalStorage(entryData);
                }
                
                throw firestoreError;
            }
            
        } catch (error) {
            console.error('❌ Firebase storage failed:', error);
            
            // Fall back to local storage for any Firebase errors
            console.warn('⚠️ Falling back to local storage due to Firebase error');
            return this.storeInLocalStorage(entryData);
        }
    }

    /**
     * Store in local storage as fallback
     */
    storeInLocalStorage(entryData) {
        try {
            const entryId = `ENTRY_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            const entry = {
                id: entryId,
                ...entryData,
                contestStatus: 'active',
                timestamp: new Date().toISOString()
            };

            // Get existing entries
            const entries = JSON.parse(localStorage.getItem('contest_entries') || '[]');
            entries.push(entry);
            localStorage.setItem('contest_entries', JSON.stringify(entries));
            
            // Also store by date - using same key pattern as ContestBackend
            const dateKey = `contest_entries_${entryData.contestDay}`;
            const dateEntries = JSON.parse(localStorage.getItem(dateKey) || '[]');
            dateEntries.push(entry);
            localStorage.setItem(dateKey, JSON.stringify(dateEntries));
            
            console.log('✅ Entry stored in localStorage:', entryId);
            
            return { success: true, entryId: entryId };
            
        } catch (error) {
            console.error('❌ Local storage failed:', error);
            throw error;
        }
    }

    /**
     * Get contest entries for a specific date
     */
    async getContestEntries(contestDate) {
        console.log(`🔥 FirebaseXamanIntegration.getContestEntries called for date: ${contestDate}`);
        try {
            if (this.firebase && this.firebase.initialized) {
                console.log('🔥 Attempting to get entries from Firebase...');
                const db = this.firebase.db;
                const snapshot = await db.collection('contest_entries')
                    .where('contestDate', '==', contestDate)
                    .orderBy('timestamp', 'desc')
                    .get();
                
                const firebaseEntries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                console.log(`🔥 Found ${firebaseEntries.length} entries in Firebase`);
                return firebaseEntries;
            } else {
                console.log('⚠️ Firebase not initialized, falling back to localStorage');
                // Fallback to local storage - check both key patterns for compatibility
                const newDateKey = `contest_entries_${contestDate}`;
                const oldDateKey = `entries_${contestDate}`;
                
                console.log(`🔍 Checking localStorage keys: ${newDateKey} and ${oldDateKey}`);
                
                // Try new key pattern first
                let entries = JSON.parse(localStorage.getItem(newDateKey) || '[]');
                console.log(`📦 Found ${entries.length} entries with new key pattern`);
                
                // Also check old key pattern and merge if found
                const oldEntries = JSON.parse(localStorage.getItem(oldDateKey) || '[]');
                if (oldEntries.length > 0) {
                    console.log(`📦 Found ${oldEntries.length} entries with old key pattern, merging...`);
                    entries = [...entries, ...oldEntries];
                    // Migrate old entries to new key
                    localStorage.setItem(newDateKey, JSON.stringify(entries));
                    // Clean up old key
                    localStorage.removeItem(oldDateKey);
                }
                
                // Migrate data format for any entries with old games structure
                entries = entries.map(entry => {
                    if (typeof entry.games === 'number' && entry.picks) {
                        console.log(`🔄 Migrating entry ${entry.id} to new games format`);
                        return {
                            ...entry,
                            totalGames: entry.games,
                            games: Object.keys(entry.picks).map(gameId => ({
                                gameId: gameId,
                                pickedTeam: entry.picks[gameId],
                                result: null,
                                actualWinner: null
                            }))
                        };
                    }
                    return entry;
                });
                
                return entries;
            }
        } catch (error) {
            console.error('Failed to get entries:', error);
            return [];
        }
    }

    /**
     * Get contest statistics
     */
    async getContestStats(contestDate) {
        const entries = await this.getContestEntries(contestDate);
        
        return {
            totalEntries: entries.length,
            prizePool: entries.length * 50, // 50 NUTS per entry
            status: entries.length >= 2 ? 'active' : 'pending', // Min 2 entries
            avgScore: 0, // Will be calculated after games complete
            topScore: 0
        };
    }

    /**
     * Update game results and calculate winners
     */
    async updateGameResults(contestDate, gameResults) {
        try {
            console.log('📊 Updating game results for', contestDate);
            
            // Use ContestBackend for consistent winner calculation
            if (window.ContestBackend) {
                const backend = new ContestBackend();
                await backend.init();
                
                // Update game results and get winners
                const result = await backend.updateGameResults(contestDate, gameResults);
                
                // Handle cancelled contest (< 4 entries)
                if (result && result.status === 'cancelled') {
                    console.log('⚠️ Contest cancelled:', result.reason);
                    return result;
                }
                
                // Handle successful contest with winners
                if (result && result.winners) {
                    // Update winners in Firebase if available
                    if (this.firebase && this.firebase.initialized) {
                        for (const winner of result.winners) {
                            await this.updateWinnerInFirebase(winner.entry, winner.prize, winner.place);
                        }
                    }
                    
                    return result;
                }
                
                return null;
            } else {
                // Fallback to legacy calculation if backend not available
                console.warn('ContestBackend not available, using legacy calculation');
                
                const entries = await this.getContestEntries(contestDate);
                const updatedEntries = [];

                // Calculate scores for each entry
                for (const entry of entries) {
                    let score = 0;
                    
                    Object.keys(entry.picks).forEach(gameId => {
                        if (gameResults[gameId] && entry.picks[gameId] === gameResults[gameId].winner) {
                            score++;
                        }
                    });

                    entry.score = score;
                    updatedEntries.push(entry);
                }

                // Check minimum entries
                const minimumEntries = window.config?.contest?.minimumEntries || 4;
                if (updatedEntries.length < minimumEntries) {
                    return {
                        status: 'cancelled',
                        reason: 'insufficient_entries',
                        totalEntries: updatedEntries.length,
                        minimumRequired: minimumEntries,
                        refundRequired: true,
                        allEntries: updatedEntries
                    };
                }

                // Sort by score and tiebreaker
                const lastGameRuns = gameResults.lastGameRuns || 0;
                
                updatedEntries.sort((a, b) => {
                    if (b.score !== a.score) {
                        return b.score - a.score;
                    }
                    // Tiebreaker: closest to actual runs
                    const aDiff = Math.abs(a.tiebreakerRuns - lastGameRuns);
                    const bDiff = Math.abs(b.tiebreakerRuns - lastGameRuns);
                    return aDiff - bDiff;
                });

                // Calculate prizes for top 3
                const totalPrizePool = updatedEntries.length * 50;
                const distribution = window.config?.contest?.prizeDistribution || {
                    first: 0.5,
                    second: 0.3,
                    third: 0.2
                };

                const prizes = {
                    first: Math.floor(totalPrizePool * distribution.first),
                    second: Math.floor(totalPrizePool * distribution.second),
                    third: Math.floor(totalPrizePool * distribution.third)
                };

                const winners = [];

                // Assign prizes to top 3
                if (updatedEntries[0]) {
                    updatedEntries[0].prizeWon = prizes.first;
                    updatedEntries[0].status = 'won';
                    updatedEntries[0].place = 1;
                    winners.push({
                        place: 1,
                        entry: updatedEntries[0],
                        prize: prizes.first
                    });
                }

                if (updatedEntries[1]) {
                    updatedEntries[1].prizeWon = prizes.second;
                    updatedEntries[1].status = 'won';
                    updatedEntries[1].place = 2;
                    winners.push({
                        place: 2,
                        entry: updatedEntries[1],
                        prize: prizes.second
                    });
                }

                if (updatedEntries[2]) {
                    updatedEntries[2].prizeWon = prizes.third;
                    updatedEntries[2].status = 'won';
                    updatedEntries[2].place = 3;
                    winners.push({
                        place: 3,
                        entry: updatedEntries[2],
                        prize: prizes.third
                    });
                }

                // Update winners in Firebase if available
                if (this.firebase && this.firebase.initialized) {
                    for (const winner of winners) {
                        await this.updateWinnerInFirebase(winner.entry, winner.prize, winner.place);
                    }
                }
                
                return {
                    status: 'completed',
                    winners: winners,
                    totalEntries: updatedEntries.length,
                    prizePool: totalPrizePool,
                    prizes: prizes,
                    allEntries: updatedEntries
                };
            }
            
        } catch (error) {
            console.error('Failed to update results:', error);
            throw error;
        }
    }

    /**
     * Update winner in Firebase
     */
    async updateWinnerInFirebase(winner, prizeAmount, place = 1) {
        try {
            const db = this.firebase.db;
            
            // Update winner entry
            await db.collection('contest_entries').doc(winner.id).update({
                score: winner.score,
                status: 'won',
                prizeWon: prizeAmount,
                place: place,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Create payout record
            await db.collection('payouts').add({
                entryId: winner.id,
                userId: winner.userId,
                userName: winner.userName,
                walletAddress: winner.walletAddress,
                amount: prizeAmount,
                currency: 'NUTS',
                place: place,
                contestDate: winner.contestDate,
                status: 'pending',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            console.log(`✅ ${place === 1 ? '1st' : place === 2 ? '2nd' : '3rd'} place winner updated in Firebase`);
            
        } catch (error) {
            console.error('Failed to update winner:', error);
            throw error;
        }
    }
}

// Export for use
window.FirebaseXamanIntegration = FirebaseXamanIntegration;