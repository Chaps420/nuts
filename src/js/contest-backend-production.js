/**
 * Contest Backend for GitHub Pages + Firebase
 * Handles API calls to Firebase Cloud Functions
 */

class ContestBackendProduction {
    constructor() {
        this.baseUrl = 'https://us-central1-nuts-sports-pickem.cloudfunctions.net';
        this.config = window.config?.firebase || {};
        console.log('🔥 Production Contest Backend initialized');
    }

    async init() {
        // Test connection to Firebase
        try {
            const response = await fetch(`${this.baseUrl}/healthCheck`);
            const data = await response.json();
            console.log('✅ Firebase connection test:', data);
            return true;
        } catch (error) {
            console.warn('⚠️ Firebase connection test failed:', error);
            return false;
        }
    }

    /**
     * Create a new contest entry
     */
    async createContestEntry(entryData) {
        try {
            console.log('📝 Creating contest entry via Firebase...', entryData);
            
            const response = await fetch(`${this.baseUrl}/createContestEntry`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(entryData)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log('✅ Contest entry created:', result);
            
            // Also store locally as backup
            this.storeEntryLocally(entryData);
            
            return result;
        } catch (error) {
            console.error('❌ Failed to create contest entry:', error);
            
            // Fallback to local storage
            console.log('📱 Falling back to local storage...');
            return this.storeEntryLocally(entryData);
        }
    }

    /**
     * Get contest entries
     */
    async getContestEntries(contestDay, sport = null, weekNumber = null) {
        try {
            let url = `${this.baseUrl}/getContestEntries?contestDay=${encodeURIComponent(contestDay)}`;
            
            if (sport) {
                url += `&sport=${sport}`;
            }
            
            if (weekNumber) {
                url += `&weekNumber=${weekNumber}`;
            }

            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log('📊 Retrieved contest entries:', result);
            
            return result.entries || [];
        } catch (error) {
            console.error('❌ Failed to get contest entries:', error);
            
            // Fallback to local storage
            return this.getEntriesLocally(contestDay, sport, weekNumber);
        }
    }

    /**
     * Get contest statistics
     */
    async getContestStats(sport = null, contestDay = null, weekNumber = null) {
        try {
            let url = `${this.baseUrl}/getContestStats?`;
            const params = new URLSearchParams();
            
            if (sport) params.append('sport', sport);
            if (contestDay) params.append('contestDay', contestDay);
            if (weekNumber) params.append('weekNumber', weekNumber.toString());
            
            url += params.toString();

            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log('📈 Retrieved contest stats:', result);
            
            return result.stats || {};
        } catch (error) {
            console.error('❌ Failed to get contest stats:', error);
            
            // Fallback to local calculation
            return this.calculateStatsLocally(sport, contestDay, weekNumber);
        }
    }

    /**
     * Store entry locally as backup
     */
    storeEntryLocally(entryData) {
        try {
            const timestamp = new Date().toISOString();
            const entryId = `entry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            const entry = {
                ...entryData,
                id: entryId,
                localTimestamp: timestamp,
                source: 'local_backup'
            };

            // Store in localStorage
            const existingEntries = JSON.parse(localStorage.getItem('contest_entries') || '[]');
            existingEntries.push(entry);
            localStorage.setItem('contest_entries', JSON.stringify(existingEntries));
            
            console.log('💾 Entry stored locally:', entryId);
            
            return {
                success: true,
                entryId: entryId,
                message: 'Entry stored locally (backup)',
                isLocal: true
            };
        } catch (error) {
            console.error('❌ Failed to store entry locally:', error);
            return {
                success: false,
                error: 'Failed to store entry'
            };
        }
    }

    /**
     * Get entries from local storage
     */
    getEntriesLocally(contestDay, sport = null, weekNumber = null) {
        try {
            const allEntries = JSON.parse(localStorage.getItem('contest_entries') || '[]');
            
            let filteredEntries = allEntries.filter(entry => {
                if (contestDay && entry.contestDay !== contestDay) return false;
                if (sport && entry.sport !== sport) return false;
                if (weekNumber && entry.weekNumber !== weekNumber) return false;
                return true;
            });
            
            console.log(`📱 Retrieved ${filteredEntries.length} entries from local storage`);
            return filteredEntries;
        } catch (error) {
            console.error('❌ Failed to get local entries:', error);
            return [];
        }
    }

    /**
     * Calculate stats from local data
     */
    calculateStatsLocally(sport = null, contestDay = null, weekNumber = null) {
        try {
            const entries = this.getEntriesLocally(contestDay, sport, weekNumber);
            
            const stats = {
                totalEntries: entries.length,
                totalPrizePool: entries.length * 50,
                uniqueUsers: new Set(entries.map(e => e.userId)).size,
                sports: {
                    mlb: entries.filter(e => e.sport === 'mlb' || !e.sport).length,
                    nfl: entries.filter(e => e.sport === 'nfl').length
                },
                isLocal: true
            };
            
            console.log('🧮 Calculated local stats:', stats);
            return stats;
        } catch (error) {
            console.error('❌ Failed to calculate local stats:', error);
            return {
                totalEntries: 0,
                totalPrizePool: 0,
                uniqueUsers: 0,
                sports: { mlb: 0, nfl: 0 },
                isLocal: true
            };
        }
    }

    /**
     * Sync local entries to Firebase (when connection is restored)
     */
    async syncLocalEntries() {
        try {
            const localEntries = JSON.parse(localStorage.getItem('contest_entries') || '[]');
            const unsyncedEntries = localEntries.filter(entry => entry.source === 'local_backup');
            
            if (unsyncedEntries.length === 0) {
                console.log('✅ No local entries to sync');
                return { synced: 0, failed: 0 };
            }
            
            console.log(`🔄 Syncing ${unsyncedEntries.length} local entries to Firebase...`);
            
            let synced = 0;
            let failed = 0;
            
            for (const entry of unsyncedEntries) {
                try {
                    const result = await this.createContestEntry({
                        ...entry,
                        source: 'synced_from_local',
                        originalLocalId: entry.id
                    });
                    
                    if (result.success) {
                        synced++;
                        // Mark as synced in local storage
                        entry.synced = true;
                        entry.firebaseId = result.entryId;
                    } else {
                        failed++;
                    }
                } catch (error) {
                    console.error('Failed to sync entry:', entry.id, error);
                    failed++;
                }
            }
            
            // Update local storage
            localStorage.setItem('contest_entries', JSON.stringify(localEntries));
            
            console.log(`✅ Sync complete: ${synced} synced, ${failed} failed`);
            return { synced, failed };
            
        } catch (error) {
            console.error('❌ Failed to sync local entries:', error);
            return { synced: 0, failed: 0 };
        }
    }
}

// Export for use in other modules
window.ContestBackendProduction = ContestBackendProduction;
