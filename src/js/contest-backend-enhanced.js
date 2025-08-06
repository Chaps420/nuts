/**
 * Enhanced Contest Backend with Better Game Tracking
 * Extends the existing ContestBackend with improved game result handling
 */

class ContestBackendEnhanced extends ContestBackend {
    constructor() {
        super();
        console.log('🚀 Enhanced Contest Backend initialized');
    }

    /**
     * Store contest entry with enriched game details
     */
    async storeContestEntry(entryData) {
        console.log('📊 Storing enhanced contest entry for:', entryData.contestDate || entryData.contestDay);
        
        // Enrich picks with actual game details
        const enrichedGames = await this.enrichPicksWithGameDetails(
            entryData.picks, 
            entryData.contestDate || entryData.contestDay
        );
        
        const entry = {
            id: `ENTRY_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            userId: entryData.userId,
            userName: entryData.userName || 'Anonymous',
            twitterHandle: entryData.twitterHandle || null,
            walletAddress: entryData.walletAddress || null,
            sport: entryData.sport || 'mlb',
            contestDate: entryData.contestDate || entryData.contestDay,
            contestWeek: entryData.contestWeek || null,
            weekNumber: entryData.weekNumber || null,
            picks: entryData.picks, // Keep original picks for compatibility
            gamesDetailed: enrichedGames, // Add enriched game details
            tiebreakerRuns: entryData.tiebreakerRuns || null,
            tiebreakerPoints: entryData.tiebreakerPoints || null,
            entryFee: entryData.entryFee,
            transactionId: entryData.transactionId,
            timestamp: new Date().toISOString(),
            status: 'pending',
            contestStatus: 'active',
            score: 0,
            prizeWon: 0,
            totalGames: Object.keys(entryData.picks).length,
            // Legacy games format for compatibility
            games: Object.keys(entryData.picks).map(gameId => ({
                gameId: gameId,
                pickedTeam: entryData.picks[gameId],
                result: null,
                actualWinner: null
            }))
        };

        try {
            if (this.firebaseEnabled) {
                await this.storeInFirebase(entry);
            } else {
                this.storeInLocalStorage(entry);
            }

            console.log('✅ Enhanced contest entry stored:', entry.id);
            return { success: true, entryId: entry.id, entry: entry };
        } catch (error) {
            console.error('❌ Failed to store enhanced contest entry:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Enrich picks with actual game details from MLB schedule
     */
    async enrichPicksWithGameDetails(picks, contestDate) {
        const games = [];
        const scheduleDate = new Date(contestDate);
        
        try {
            // Get all games for the contest date
            const mlbGames = await window.mlbSchedule.getGamesForDate(scheduleDate);
            console.log(`📊 Enriching ${Object.keys(picks).length} picks with ${mlbGames.length} MLB games for ${contestDate}`);
            
            for (const [gameId, pickDirection] of Object.entries(picks)) {
                // Try multiple matching strategies for game ID
                const game = mlbGames.find(g => 
                    g.id === gameId || 
                    g.gameId === gameId ||
                    g.gameId === gameId.toString() ||
                    g.id === `mlb_${contestDate}_${gameId}` ||
                    gameId.includes(g.gameId) ||
                    gameId.endsWith(`_${g.gameId}`)
                );
                
                if (game) {
                    console.log(`✅ Matched pick ${gameId} to game: ${game.awayTeam} @ ${game.homeTeam}`);
                    games.push({
                        gameId: gameId,
                        originalGameId: game.id,
                        mlbGameId: game.gameId,
                        homeTeam: game.homeTeam,
                        awayTeam: game.awayTeam,
                        homeTeamFull: game.homeTeamFull || game.homeTeam,
                        awayTeamFull: game.awayTeamFull || game.awayTeam,
                        pickedDirection: pickDirection,
                        pickedTeam: pickDirection === 'home' ? game.homeTeam : game.awayTeam,
                        opposingTeam: pickDirection === 'home' ? game.awayTeam : game.homeTeam,
                        gameTime: game.gameTime,
                        venue: game.venue,
                        result: null,
                        actualWinner: null,
                        isCorrect: null,
                        homeScore: null,
                        awayScore: null,
                        status: 'pending'
                    });
                } else {
                    console.warn(`⚠️ Could not find game details for ID: ${gameId}`);
                    // Create fallback entry
                    games.push({
                        gameId: gameId,
                        pickedDirection: pickDirection,
                        pickedTeam: pickDirection,
                        opposingTeam: 'Unknown',
                        result: null,
                        actualWinner: null,
                        isCorrect: null,
                        status: 'unknown'
                    });
                }
            }
            
            return games;
        } catch (error) {
            console.error('❌ Failed to enrich picks with game details:', error);
            // Return fallback games array
            return Object.entries(picks).map(([gameId, pickDirection]) => ({
                gameId: gameId,
                pickedDirection: pickDirection,
                pickedTeam: pickDirection,
                result: null,
                actualWinner: null,
                isCorrect: null,
                status: 'error'
            }));
        }
    }

    /**
     * Update game results with enhanced scoring
     */
    async updateGameResults(contestDate, gameResults) {
        console.log('📊 Updating game results with enhanced details for', contestDate);
        console.log('🎮 Game Results Keys:', Object.keys(gameResults));
        
        const entries = await this.getContestEntries(contestDate);
        const updatedEntries = [];
        
        for (const entry of entries) {
            let score = 0;
            let updatedGames = [];
            
            // Handle new enriched format
            if (entry.gamesDetailed && Array.isArray(entry.gamesDetailed)) {
                console.log(`🔍 Processing enhanced entry ${entry.userName} with ${entry.gamesDetailed.length} detailed games`);
                
                updatedGames = entry.gamesDetailed.map(game => {
                    // Try to find result with multiple ID matching strategies
                    const result = gameResults[game.gameId] || 
                                 gameResults[game.originalGameId] ||
                                 gameResults[game.mlbGameId] ||
                                 gameResults[`mlb_${contestDate}_${game.gameId}`] ||
                                 gameResults[`mlb_${contestDate}_${game.mlbGameId}`];
                    
                    if (result && result.status === 'completed') {
                        const isCorrect = 
                            (game.pickedDirection === 'home' && result.winner === 'home') ||
                            (game.pickedDirection === 'away' && result.winner === 'away');
                        
                        if (isCorrect) {
                            score++;
                            console.log(`✅ ${entry.userName}: ${game.pickedTeam} WIN`);
                        } else {
                            console.log(`❌ ${entry.userName}: ${game.pickedTeam} LOSS (Winner: ${result.winner === 'home' ? result.homeTeam : result.awayTeam})`);
                        }
                        
                        return {
                            ...game,
                            result: isCorrect ? 'win' : 'loss',
                            actualWinner: result.winner === 'home' ? (result.homeTeam || game.homeTeam) : (result.awayTeam || game.awayTeam),
                            actualScore: `${result.awayScore}-${result.homeScore}`,
                            homeScore: result.homeScore,
                            awayScore: result.awayScore,
                            isCorrect: isCorrect,
                            status: 'completed'
                        };
                    }
                    
                    return {
                        ...game,
                        result: 'pending',
                        status: 'pending'
                    };
                });
            } 
            // Fallback for old format entries - enrich them on the fly
            else if (entry.picks) {
                console.log(`🔄 Converting legacy entry ${entry.userName} to enhanced format`);
                
                // Enrich the legacy entry
                const enrichedGames = await this.enrichPicksWithGameDetails(entry.picks, contestDate);
                
                updatedGames = enrichedGames.map(game => {
                    const result = gameResults[game.gameId] || 
                                 gameResults[game.originalGameId] ||
                                 gameResults[game.mlbGameId];
                    
                    if (result && result.status === 'completed') {
                        const isCorrect = 
                            (game.pickedDirection === 'home' && result.winner === 'home') ||
                            (game.pickedDirection === 'away' && result.winner === 'away');
                        
                        if (isCorrect) score++;
                        
                        return {
                            ...game,
                            result: isCorrect ? 'win' : 'loss',
                            actualWinner: result.winner === 'home' ? (result.homeTeam || game.homeTeam) : (result.awayTeam || game.awayTeam),
                            actualScore: `${result.awayScore}-${result.homeScore}`,
                            homeScore: result.homeScore,
                            awayScore: result.awayScore,
                            isCorrect: isCorrect,
                            status: 'completed'
                        };
                    }
                    
                    return {
                        ...game,
                        result: 'pending',
                        status: 'pending'
                    };
                });
            }
            
            const updatedEntry = {
                ...entry,
                gamesDetailed: updatedGames,
                score: score,
                status: 'completed',
                lastUpdated: new Date().toISOString()
            };
            
            updatedEntries.push(updatedEntry);
            
            // Update storage
            if (this.firebaseEnabled) {
                await this.updateFirebaseEntry(updatedEntry);
            } else {
                this.updateLocalStorageEntry(updatedEntry);
            }
        }
        
        console.log(`📊 Updated ${updatedEntries.length} entries with game results`);
        
        // Calculate winners
        const winnerResult = this.calculateWinners(updatedEntries, true, gameResults);
        
        return {
            ...winnerResult,
            allEntries: updatedEntries
        };
    }

    /**
     * Update Firebase entry
     */
    async updateFirebaseEntry(entry) {
        if (!window.firebase) return;
        
        const db = window.firebase.firestore();
        await db.collection('contest_entries').doc(entry.id).update(entry);
    }

    /**
     * Update localStorage entry
     */
    updateLocalStorageEntry(entry) {
        // Update in main entries array
        const entries = this.getLocalStorageEntries();
        const index = entries.findIndex(e => e.id === entry.id);
        if (index !== -1) {
            entries[index] = entry;
            this.localStorage.setItem('contest_entries', JSON.stringify(entries));
        }
        
        // Update in date-specific array
        const dateKey = `contest_entries_${entry.contestDate}`;
        const dateEntries = JSON.parse(this.localStorage.getItem(dateKey) || '[]');
        const dateIndex = dateEntries.findIndex(e => e.id === entry.id);
        if (dateIndex !== -1) {
            dateEntries[dateIndex] = entry;
            this.localStorage.setItem(dateKey, JSON.stringify(dateEntries));
        }
    }
}

// Export the enhanced backend
window.ContestBackendEnhanced = ContestBackendEnhanced;
console.log('✅ Enhanced Contest Backend module loaded');
