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
            
            return result;
        } catch (error) {
            console.error('❌ Failed to create contest entry:', error);
            throw error; // Firebase-only mode: throw error instead of fallback
        }
    }

    /**
     * Get contest entries
     */
    async getContestEntries(contestDay, sport = null, weekNumber = null) {
        try {
            let url = `${this.baseUrl}/getContestEntries?`;
            const params = new URLSearchParams();
            
            if (contestDay) {
                params.append('contestDay', contestDay);
            }
            
            if (sport) {
                params.append('sport', sport);
            }
            
            if (weekNumber) {
                params.append('weekNumber', weekNumber.toString());
            }
            
            url += params.toString();
            
            console.log('🔍 Backend query URL:', url);

            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log('📊 Retrieved contest entries:', result);
            
            // If no entries found with sport filter and it's MLB, try without sport filter
            // This handles legacy entries that don't have the sport field
            if (result.entries.length === 0 && sport === 'mlb') {
                console.log('🔄 No MLB entries found with sport filter, trying without sport filter...');
                const fallbackUrl = `${this.baseUrl}/getContestEntries?contestDay=${encodeURIComponent(contestDay)}`;
                const fallbackResponse = await fetch(fallbackUrl);
                
                if (fallbackResponse.ok) {
                    const fallbackResult = await fallbackResponse.json();
                    console.log('📊 Fallback entries (no sport filter):', fallbackResult);
                    
                    // Filter client-side for MLB-like entries (contestDay matches and no sport field or sport=mlb)
                    const mlbEntries = fallbackResult.entries.filter(entry => {
                        // Include entries that don't have sport field (legacy MLB entries)
                        // or entries that explicitly have sport=mlb
                        return !entry.sport || entry.sport === 'mlb';
                    });
                    
                    console.log(`📊 Filtered ${mlbEntries.length} MLB entries from ${fallbackResult.entries.length} total entries`);
                    return mlbEntries;
                }
            }
            
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
            
            // Firebase-only mode: return empty stats on error
            return {
                totalEntries: 0,
                totalPlayers: 0,
                completedContests: 0,
                activeContests: 0
            };
        }
    }
}

// Export for use in other modules
window.ContestBackendProduction = ContestBackendProduction;
