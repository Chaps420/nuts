/**
 * Firebase Score Updater
 * Direct Firebase Firestore integration for updating contest entry scores
 * Avoids CORS issues by using Firebase SDK directly instead of HTTP calls
 */

class FirebaseScoreUpdater {
    constructor() {
        this.db = null;
        this.initialized = false;
    }

    async init() {
        if (this.initialized) return true;
        
        // Wait for Firebase to be initialized
        if (!window.firebaseIntegration || !window.firebaseIntegration.db) {
            console.error('❌ Firebase not initialized');
            return false;
        }
        
        this.db = window.firebaseIntegration.db;
        this.initialized = true;
        console.log('✅ Firebase Score Updater initialized');
        return true;
    }

    async updateEntryScores(contestDate, entries, gameResults) {
        if (!this.initialized) {
            const initSuccess = await this.init();
            if (!initSuccess) {
                return {
                    success: false,
                    error: 'Failed to initialize Firebase',
                    updatedCount: 0,
                    updatedEntries: []
                };
            }
        }

        if (!this.db) {
            return {
                success: false,
                error: 'Firebase database not available',
                updatedCount: 0,
                updatedEntries: []
            };
        }

        try {
            console.log(`🔄 Updating scores for ${entries.length} entries in Firebase...`);
            
            // Use batch operations for atomic updates
            const batch = this.db.batch();
            const updatedEntries = [];
            let updateCount = 0;
            
            for (const entry of entries) {
                if (!entry.picks || !entry.id) continue;
                
                // Calculate score for this entry
                let newScore = 0;
                Object.entries(entry.picks).forEach(([gameId, pick]) => {
                    const gameResult = gameResults[gameId];
                    if (gameResult && pick === gameResult.winner) {
                        newScore++;
                    }
                });
                
                // Update in contest_entries collection (main collection)
                const entryRef = this.db.collection('contest_entries').doc(entry.id);
                batch.update(entryRef, {
                    score: newScore,
                    lastUpdated: new Date().toISOString(),
                    scoredAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                
                updatedEntries.push({
                    entryId: entry.id,
                    userName: entry.userName,
                    score: newScore
                });
                
                console.log(`📝 Queued score update for ${entry.userName}: ${newScore} points`);
                updateCount++;
            }
            
            if (updateCount === 0) {
                console.warn('⚠️ No entries to update');
                return {
                    success: true,
                    updatedCount: 0,
                    updatedEntries: []
                };
            }
            
            // Commit the batch update
            console.log(`🔥 Committing batch update for ${updateCount} entries...`);
            await batch.commit();
            console.log(`✅ Successfully saved ${updateCount} scores to Firebase!`);
            
            return {
                success: true,
                updatedCount: updateCount,
                updatedEntries: updatedEntries
            };
            
        } catch (error) {
            console.error('❌ Failed to update scores in Firebase:', error);
            
            // Try individual updates as fallback
            console.log('🔄 Attempting individual updates as fallback...');
            const fallbackResult = await this.updateEntriesIndividually(entries, gameResults);
            
            return {
                success: fallbackResult.success,
                error: fallbackResult.error,
                updatedCount: fallbackResult.updatedCount,
                updatedEntries: fallbackResult.updatedEntries
            };
        }
    }

    async updateEntriesIndividually(entries, gameResults) {
        let successCount = 0;
        let failCount = 0;
        const updatedEntries = [];

        for (const entry of entries) {
            if (!entry.picks || !entry.id) continue;
            
            try {
                // Calculate score for this entry
                let newScore = 0;
                Object.entries(entry.picks).forEach(([gameId, pick]) => {
                    const gameResult = gameResults[gameId];
                    if (gameResult && pick === gameResult.winner) {
                        newScore++;
                    }
                });
                
                const entryRef = this.db.collection('contest_entries').doc(entry.id);
                await entryRef.update({
                    score: newScore,
                    lastUpdated: new Date().toISOString(),
                    scoredAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                
                updatedEntries.push({
                    entryId: entry.id,
                    userName: entry.userName,
                    score: newScore
                });
                
                console.log(`✅ Updated ${entry.userName}: ${newScore}`);
                successCount++;
            } catch (error) {
                console.error(`❌ Failed to update ${entry.userName}:`, error);
                failCount++;
            }
        }

        console.log(`📊 Individual updates: ${successCount} success, ${failCount} failed`);
        
        return {
            success: successCount > 0,
            error: failCount > 0 ? `${failCount} entries failed to update` : null,
            updatedCount: successCount,
            updatedEntries: updatedEntries
        };
    }

    async calculateAndUpdateScores(contestDate, gameResults) {
        if (!this.initialized) {
            const initSuccess = await this.init();
            if (!initSuccess) return false;
        }

        try {
            console.log('🧮 Calculating scores based on game results...');
            
            // Get entries from the production backend
            if (!window.backend) {
                console.error('❌ Production backend not available');
                return false;
            }

            const entries = await window.backend.getContestEntries(contestDate, 'mlb');
            if (entries.length === 0) {
                console.warn('⚠️ No entries found for date:', contestDate);
                return false;
            }

            // Calculate scores for each entry
            const updatedEntries = entries.map(entry => {
                let score = 0;
                if (entry.picks && gameResults) {
                    Object.entries(entry.picks).forEach(([gameId, pick]) => {
                        // Try exact match first
                        let gameResult = gameResults[gameId];
                        
                        // If no exact match, try to find similar game ID
                        if (!gameResult) {
                            const possibleMatches = Object.keys(gameResults).filter(resultGameId => {
                                if (resultGameId.includes(gameId) || gameId.includes(resultGameId)) {
                                    return true;
                                }
                                
                                const extractGamePk = (id) => {
                                    const match = id.match(/(\d+)$/);
                                    return match ? match[1] : null;
                                };
                                
                                const userGamePk = extractGamePk(gameId);
                                const resultGamePk = extractGamePk(resultGameId);
                                
                                return userGamePk && resultGamePk && userGamePk === resultGamePk;
                            });
                            
                            if (possibleMatches.length > 0) {
                                gameResult = gameResults[possibleMatches[0]];
                                console.log(`  🔄 Matched ${gameId} to ${possibleMatches[0]}`);
                            }
                        }
                        
                        if (gameResult && (gameResult.status === 'completed' || gameResult.status === 'Final')) {
                            const isCorrect = pick === gameResult.winner;
                            if (isCorrect) {
                                score++;
                            }
                        }
                    });
                }
                
                return { ...entry, score };
            });

            // Update scores in Firebase
            const success = await this.updateEntryScores(contestDate, updatedEntries);
            
            if (success) {
                console.log(`🎉 Successfully calculated and saved scores for ${updatedEntries.length} entries`);
                return { success: true, entries: updatedEntries };
            } else {
                console.error('❌ Failed to save calculated scores');
                return { success: false, entries: updatedEntries };
            }
            
        } catch (error) {
            console.error('❌ Error in calculateAndUpdateScores:', error);
            return { success: false, error: error.message };
        }
    }
}

// Export for global use
window.FirebaseScoreUpdater = FirebaseScoreUpdater;
console.log('📊 Firebase Score Updater module loaded');
