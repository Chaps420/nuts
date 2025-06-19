// Contest Backend Integration
// Handles storing entries, tracking results, and managing payouts

class ContestBackend {
    constructor() {
        this.firebaseEnabled = false;
        this.localStorage = window.localStorage;
        console.log('🔧 Contest Backend initialized');
    }

    async init() {
        // Check if Firebase is available
        if (window.firebaseIntegration && window.firebaseIntegration.initialized) {
            this.firebaseEnabled = true;
            console.log('✅ Firebase backend enabled');
        } else {
            console.log('⚠️ Using local storage fallback');
        }
    }

    /**
     * Store a contest entry
     */
    async storeContestEntry(entryData) {
        const entry = {
            id: `ENTRY_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            userId: entryData.userId,
            userName: entryData.userName || 'Anonymous',
            twitterHandle: entryData.twitterHandle || null, // Store Twitter handle
            walletAddress: entryData.walletAddress || null, // Store wallet address from payment
            contestDate: entryData.contestDay,
            picks: entryData.picks,
            tiebreakerRuns: entryData.tiebreakerRuns,
            entryFee: entryData.entryFee,
            transactionId: entryData.transactionId,
            timestamp: new Date().toISOString(),
            status: 'pending', // pending, active, completed, won, lost
            score: 0,
            prizeWon: 0,
            totalGames: Object.keys(entryData.picks).length, // Track total games picked
            games: Object.keys(entryData.picks).map(gameId => ({
                gameId: gameId,
                pickedTeam: entryData.picks[gameId],
                result: null, // win, loss, pending
                actualWinner: null
            }))
        };

        try {
            if (this.firebaseEnabled) {
                // Store in Firebase
                await this.storeInFirebase(entry);
            } else {
                // Store in local storage
                this.storeInLocalStorage(entry);
            }

            console.log('✅ Contest entry stored:', entry.id);
            return { success: true, entryId: entry.id };
        } catch (error) {
            console.error('❌ Failed to store contest entry:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Store entry in Firebase
     */
    async storeInFirebase(entry) {
        if (!window.firebase) throw new Error('Firebase not initialized');
        
        const db = window.firebase.firestore();
        
        // Store main entry
        await db.collection('contest_entries').doc(entry.id).set(entry);
        
        // Store individual game picks for easier querying
        const batch = db.batch();
        entry.games.forEach(game => {
            const pickRef = db.collection('game_picks').doc();
            batch.set(pickRef, {
                entryId: entry.id,
                userId: entry.userId,
                gameId: game.gameId,
                pickedTeam: game.pickedTeam,
                contestDate: entry.contestDate,
                timestamp: entry.timestamp
            });
        });
        
        await batch.commit();
    }

    /**
     * Store entry in local storage
     */
    storeInLocalStorage(entry) {
        // Get existing entries
        const entries = this.getLocalStorageEntries();
        entries.push(entry);
        
        // Store updated entries
        this.localStorage.setItem('contest_entries', JSON.stringify(entries));
        
        // Also store by contest date for easy retrieval
        const dateKey = `contest_entries_${entry.contestDate}`;
        const dateEntries = JSON.parse(this.localStorage.getItem(dateKey) || '[]');
        dateEntries.push(entry);
        this.localStorage.setItem(dateKey, JSON.stringify(dateEntries));
    }

    /**
     * Get all entries from local storage
     */
    getLocalStorageEntries() {
        return JSON.parse(this.localStorage.getItem('contest_entries') || '[]');
    }

    /**
     * Get entries for a specific contest date
     */
    async getContestEntries(contestDate) {
        try {
            if (this.firebaseEnabled) {
                const db = window.firebase.firestore();
                const snapshot = await db.collection('contest_entries')
                    .where('contestDate', '==', contestDate)
                    .orderBy('timestamp', 'desc')
                    .get();
                
                return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            } else {
                const dateKey = `contest_entries_${contestDate}`;
                let entries = JSON.parse(this.localStorage.getItem(dateKey) || '[]');
                
                // Also check old key pattern from FirebaseXamanIntegration
                const oldDateKey = `entries_${contestDate}`;
                const oldEntries = JSON.parse(this.localStorage.getItem(oldDateKey) || '[]');
                
                if (oldEntries.length > 0) {
                    console.log(`📦 Found ${oldEntries.length} entries with old key pattern, migrating...`);
                    // Merge entries, avoiding duplicates
                    const entryIds = new Set(entries.map(e => e.id));
                    oldEntries.forEach(entry => {
                        if (!entryIds.has(entry.id)) {
                            entries.push(entry);
                        }
                    });
                    
                    // Save merged entries to new key
                    this.localStorage.setItem(dateKey, JSON.stringify(entries));
                    // Remove old key
                    this.localStorage.removeItem(oldDateKey);
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
            // Don't log permission errors as they're expected for non-authenticated users
            if (error.code !== 'permission-denied' && !error.message?.includes('permissions')) {
                console.error('Failed to get contest entries:', error);
            }
            // Fall back to localStorage on any Firebase error
            const dateKey = `contest_entries_${contestDate}`;
            return JSON.parse(this.localStorage.getItem(dateKey) || '[]');
        }
    }

    /**
     * Update game results and calculate scores
     */
    async updateGameResults(contestDate, gameResults) {
        console.log('📊 Updating game results for', contestDate);
        
        const entries = await this.getContestEntries(contestDate);
        const updatedEntries = [];

        for (const entry of entries) {
            let score = 0;
            const updatedGames = entry.games.map(game => {
                const result = gameResults[game.gameId];
                if (result) {
                    const isCorrect = game.pickedTeam === result.winner;
                    if (isCorrect) score++;
                    
                    return {
                        ...game,
                        result: isCorrect ? 'win' : 'loss',
                        actualWinner: result.winner
                    };
                }
                return game;
            });

            const updatedEntry = {
                ...entry,
                games: updatedGames,
                score: score,
                status: 'completed'
            };

            updatedEntries.push(updatedEntry);
            
            // Update storage
            if (this.firebaseEnabled) {
                await this.updateFirebaseEntry(updatedEntry);
            } else {
                this.updateLocalStorageEntry(updatedEntry);
            }
        }

        // Calculate winners
        return this.calculateWinners(updatedEntries);
    }

    /**
     * Calculate contest winners
     */
    calculateWinners(entries) {
        if (entries.length < 2) {
            console.log('⚠️ Not enough entries for contest');
            return null;
        }

        // Sort by score (descending), then by tiebreaker difference
        const lastGameActualRuns = 10; // This would come from actual game data
        
        entries.sort((a, b) => {
            // First sort by score
            if (b.score !== a.score) {
                return b.score - a.score;
            }
            
            // If tied, use tiebreaker (closest to actual runs)
            const aDiff = Math.abs(a.tiebreakerRuns - lastGameActualRuns);
            const bDiff = Math.abs(b.tiebreakerRuns - lastGameActualRuns);
            
            return aDiff - bDiff;
        });

        // Winner takes all
        const totalPrizePool = entries.length * 50; // 50 NUTS per entry
        const winner = entries[0];
        
        winner.prizeWon = totalPrizePool;
        winner.status = 'won';

        // Mark others as lost
        entries.slice(1).forEach(entry => {
            entry.status = 'lost';
            entry.prizeWon = 0;
        });

        console.log('🏆 Contest winner:', winner.userName, 'Score:', winner.score, 'Prize:', totalPrizePool);
        
        return {
            winner: winner,
            totalEntries: entries.length,
            prizePool: totalPrizePool,
            allEntries: entries
        };
    }

    /**
     * Process payouts to winners
     */
    async processPayout(winnerId, amount, walletAddress) {
        console.log('💰 Processing payout:', amount, 'NUTS to', walletAddress);
        
        // In production, this would trigger an XRPL transaction
        // For now, we'll just record the payout
        const payout = {
            id: `PAYOUT_${Date.now()}`,
            winnerId: winnerId,
            amount: amount,
            currency: 'NUTS',
            walletAddress: walletAddress,
            status: 'pending',
            timestamp: new Date().toISOString()
        };

        if (this.firebaseEnabled) {
            await window.firebase.firestore()
                .collection('payouts')
                .doc(payout.id)
                .set(payout);
        } else {
            const payouts = JSON.parse(this.localStorage.getItem('payouts') || '[]');
            payouts.push(payout);
            this.localStorage.setItem('payouts', JSON.stringify(payouts));
        }

        return payout;
    }

    /**
     * Get contest statistics
     */
    async getContestStats(contestDate) {
        const entries = await this.getContestEntries(contestDate);
        
        return {
            totalEntries: entries.length,
            prizePool: entries.length * 50,
            status: entries.length > 0 ? entries[0].status : 'pending',
            averageScore: entries.reduce((sum, e) => sum + (e.score || 0), 0) / entries.length || 0,
            topScore: Math.max(...entries.map(e => e.score || 0), 0)
        };
    }

    /**
     * Update Firebase entry
     */
    async updateFirebaseEntry(entry) {
        await window.firebase.firestore()
            .collection('contest_entries')
            .doc(entry.id)
            .update(entry);
    }

    /**
     * Update local storage entry
     */
    updateLocalStorageEntry(updatedEntry) {
        // Update main entries
        const entries = this.getLocalStorageEntries();
        const index = entries.findIndex(e => e.id === updatedEntry.id);
        if (index !== -1) {
            entries[index] = updatedEntry;
            this.localStorage.setItem('contest_entries', JSON.stringify(entries));
        }

        // Update date-specific entries
        const dateKey = `contest_entries_${updatedEntry.contestDate}`;
        const dateEntries = JSON.parse(this.localStorage.getItem(dateKey) || '[]');
        const dateIndex = dateEntries.findIndex(e => e.id === updatedEntry.id);
        if (dateIndex !== -1) {
            dateEntries[dateIndex] = updatedEntry;
            this.localStorage.setItem(dateKey, JSON.stringify(dateEntries));
        }
    }
}

// Export for use in other modules
window.ContestBackend = ContestBackend;