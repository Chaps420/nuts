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
            contestStatus: 'active', // active, completed, cancelled
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
        console.log(`📊 Getting contest entries for date: ${contestDate}`);
        
        try {
            if (this.firebaseEnabled) {
                console.log('🔥 Using Firebase to get entries for:', contestDate);
                const db = window.firebase.firestore();
                const snapshot = await db.collection('contest_entries')
                    .where('contestDate', '==', contestDate)
                    .orderBy('timestamp', 'desc')
                    .get();
                
                console.log(`🔥 Firebase query returned ${snapshot.size} documents`);
                
                // Filter out entries without proper payment data at the backend level
                const firestoreEntries = [];
                snapshot.docs.forEach(doc => {
                    const data = doc.data();
                    
                    // Only include entries with valid payment data
                    // walletAddress is optional since some entries may use userName only
                    if (data.transactionId && data.userName) {
                        firestoreEntries.push({ id: doc.id, ...data });
                    } else {
                        console.warn(`🚫 Skipping invalid entry ${doc.id}: missing payment data`, {
                            hasTransactionId: !!data.transactionId,
                            hasWalletAddress: !!data.walletAddress,
                            hasUserName: !!data.userName
                        });
                    }
                });
                
                console.log(`🔥 After filtering: ${firestoreEntries.length} valid entries from ${snapshot.size} total`);
                
                if (firestoreEntries.length > 0) {
                    console.log('🔥 Sample valid Firebase entry:', firestoreEntries[0]);
                }
                
                return firestoreEntries;
            } else {
                const dateKey = `contest_entries_${contestDate}`;
                console.log(`🔍 Checking localStorage key: ${dateKey}`);
                
                const rawData = this.localStorage.getItem(dateKey);
                console.log(`📦 Raw localStorage data for ${dateKey}:`, rawData ? `Found ${rawData.length} chars` : 'NULL');
                
                let entries = JSON.parse(rawData || '[]');
                console.log(`📋 Parsed entries count: ${entries.length}`);
                
                if (entries.length > 0) {
                    console.log('🔍 First entry sample:', entries[0]);
                }
                
                // Double-check that entries are actually for the requested date
                entries = entries.filter(entry => {
                    const entryDate = entry.contestDate || entry.contestDay;
                    const matches = entryDate === contestDate;
                    if (!matches) {
                        console.warn(`⚠️ Filtering out entry with date ${entryDate} (requested ${contestDate})`);
                    }
                    return matches;
                });
                
                console.log(`📊 After date filtering: ${entries.length} entries for ${contestDate}`);
                
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
     * Complete a contest (mark all entries as completed)
     */
    async completeContest(contestDate) {
        console.log(`🏁 Completing contest for ${contestDate}`);
        
        try {
            const entries = await this.getContestEntries(contestDate);
            
            if (this.firebaseEnabled) {
                const db = window.firebase.firestore();
                const batch = db.batch();
                
                entries.forEach(entry => {
                    if (entry.contestStatus === 'active') {
                        const ref = db.collection('contest_entries').doc(entry.id);
                        batch.update(ref, { 
                            contestStatus: 'completed',
                            completedAt: firebase.firestore.FieldValue.serverTimestamp()
                        });
                    }
                });
                
                await batch.commit();
                console.log(`✅ Marked ${entries.length} entries as completed in Firebase`);
            } else {
                // Update localStorage entries
                const dateKey = `contest_entries_${contestDate}`;
                const updatedEntries = entries.map(entry => ({
                    ...entry,
                    contestStatus: 'completed',
                    completedAt: new Date().toISOString()
                }));
                
                this.localStorage.setItem(dateKey, JSON.stringify(updatedEntries));
                console.log(`✅ Marked ${entries.length} entries as completed in localStorage`);
            }
            
            return { success: true, entriesCompleted: entries.length };
            
        } catch (error) {
            console.error('Failed to complete contest:', error);
            return { success: false, error: error.message };
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

        // Calculate winners (force calculation since admin is processing results)
        return this.calculateWinners(updatedEntries, true);
    }

    /**
     * Calculate contest winners
     */
    calculateWinners(entries, forceCalculation = false) {
        const minimumEntries = window.config?.contest?.minimumEntries || 4;
        
        // Only allow winner calculation if forced (admin action) or contest is completed
        if (!forceCalculation) {
            const isContestCompleted = entries.some(e => e.contestStatus === 'completed');
            if (!isContestCompleted) {
                console.log('⚠️ Cannot calculate winners - contest is still active');
                return {
                    status: 'active',
                    totalEntries: entries.length,
                    allEntries: entries
                };
            }
        }
        
        if (entries.length < minimumEntries) {
            console.log(`⚠️ Not enough entries for contest. Required: ${minimumEntries}, Got: ${entries.length}`);
            return {
                status: 'cancelled',
                reason: 'insufficient_entries',
                totalEntries: entries.length,
                minimumRequired: minimumEntries,
                refundRequired: true,
                allEntries: entries
            };
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

        // Calculate prize pool and distribution
        const totalPrizePool = entries.length * 50; // 50 NUTS per entry
        const distribution = window.config?.contest?.prizeDistribution || {
            first: 0.5,
            second: 0.3,
            third: 0.2
        };

        // Calculate prizes
        const prizes = {
            first: Math.floor(totalPrizePool * distribution.first),
            second: Math.floor(totalPrizePool * distribution.second),
            third: Math.floor(totalPrizePool * distribution.third)
        };

        // Assign prizes to top 3
        const winners = [];
        
        // 1st place
        if (entries[0]) {
            entries[0].prizeWon = prizes.first;
            entries[0].status = 'won';
            entries[0].place = 1;
            winners.push({
                place: 1,
                entry: entries[0],
                prize: prizes.first
            });
        }
        
        // 2nd place
        if (entries[1]) {
            entries[1].prizeWon = prizes.second;
            entries[1].status = 'won';
            entries[1].place = 2;
            winners.push({
                place: 2,
                entry: entries[1],
                prize: prizes.second
            });
        }
        
        // 3rd place
        if (entries[2]) {
            entries[2].prizeWon = prizes.third;
            entries[2].status = 'won';
            entries[2].place = 3;
            winners.push({
                place: 3,
                entry: entries[2],
                prize: prizes.third
            });
        }

        // Mark others as lost
        entries.slice(3).forEach(entry => {
            entry.status = 'lost';
            entry.prizeWon = 0;
            entry.place = null;
        });

        console.log('🏆 Contest winners calculated:');
        winners.forEach(w => {
            console.log(`   ${w.place}st place: ${w.entry.userName} - ${w.prize} NUTS (Score: ${w.entry.score})`);
        });
        console.log(`💰 Total prize pool: ${totalPrizePool} NUTS`);
        
        return {
            status: 'completed',
            winners: winners,
            totalEntries: entries.length,
            prizePool: totalPrizePool,
            prizes: prizes,
            allEntries: entries
        };
    }

    /**
     * Process payouts to winners
     */
    async processPayout(winnerId, amount, walletAddress, place = 1) {
        console.log(`💰 Processing ${place === 1 ? '1st' : place === 2 ? '2nd' : '3rd'} place payout:`, amount, 'NUTS to', walletAddress);
        
        // In production, this would trigger an XRPL transaction
        // For now, we'll just record the payout
        const payout = {
            id: `PAYOUT_${Date.now()}_${winnerId}`,
            winnerId: winnerId,
            amount: amount,
            currency: 'NUTS',
            walletAddress: walletAddress,
            place: place,
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
     * Process refunds for cancelled contest
     */
    async processRefunds(contestDate) {
        console.log(`💸 Processing refunds for cancelled contest on ${contestDate}`);
        
        try {
            const entries = await this.getContestEntries(contestDate);
            const refunds = [];
            
            for (const entry of entries) {
                if (entry.walletAddress && entry.transactionId) {
                    const refund = {
                        id: `REFUND_${Date.now()}_${entry.id}`,
                        entryId: entry.id,
                        userId: entry.userId,
                        userName: entry.userName,
                        walletAddress: entry.walletAddress,
                        amount: entry.entryFee || 50,
                        currency: 'NUTS',
                        reason: 'insufficient_entries',
                        originalTxId: entry.transactionId,
                        contestDate: contestDate,
                        status: 'pending',
                        timestamp: new Date().toISOString()
                    };
                    
                    refunds.push(refund);
                    
                    // Store refund record
                    if (this.firebaseEnabled) {
                        await window.firebase.firestore()
                            .collection('refunds')
                            .doc(refund.id)
                            .set(refund);
                    } else {
                        const storedRefunds = JSON.parse(this.localStorage.getItem('refunds') || '[]');
                        storedRefunds.push(refund);
                        this.localStorage.setItem('refunds', JSON.stringify(storedRefunds));
                    }
                    
                    // Update entry status
                    entry.status = 'refunded';
                    entry.refundId = refund.id;
                    
                    if (this.firebaseEnabled) {
                        await this.updateFirebaseEntry(entry);
                    } else {
                        this.updateLocalStorageEntry(entry);
                    }
                }
            }
            
            console.log(`✅ Created ${refunds.length} refund records`);
            
            return {
                success: true,
                refunds: refunds,
                totalRefundAmount: refunds.length * 50,
                entriesRefunded: refunds.length
            };
            
        } catch (error) {
            console.error('❌ Failed to process refunds:', error);
            return {
                success: false,
                error: error.message
            };
        }
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