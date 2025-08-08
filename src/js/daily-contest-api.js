// Firebase Configuration and API Helper Functions
// This file contains the Firebase setup and helper functions for Daily Contest operations

// Firebase configuration (you'll need to replace with your actual config)
const firebaseConfig = {
    // These should match your Firebase project settings
    // You can find these in Firebase Console > Project Settings > Web apps
    apiKey: "your-api-key",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "your-app-id"
};

// Firebase API endpoints (Cloud Functions)
const FIREBASE_FUNCTIONS_URL = 'https://us-central1-nuts-sports-pickem.cloudfunctions.net';

// Daily Contest API Helper Functions
class DailyContestAPI {
    constructor() {
        this.baseUrl = FIREBASE_FUNCTIONS_URL;
    }

    // Create or update a daily contest (admin only)
    async saveDailyContest(contestData) {
        try {
            const response = await fetch(`${this.baseUrl}/createDailyContest`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(contestData)
            });

            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.error || 'Failed to save contest');
            }

            return result;
        } catch (error) {
            console.error('Error saving daily contest:', error);
            throw error;
        }
    }

    // Get daily contest by date
    async getDailyContest(date) {
        try {
            const response = await fetch(`${this.baseUrl}/getDailyContest?date=${date}`);
            const result = await response.json();
            
            if (response.status === 404) {
                return null; // No contest found
            }
            
            if (!response.ok) {
                throw new Error(result.error || 'Failed to get contest');
            }

            return result.contest;
        } catch (error) {
            console.error('Error getting daily contest:', error);
            throw error;
        }
    }

    // Submit a daily contest entry
    async submitDailyContestEntry(entryData) {
        try {
            const response = await fetch(`${this.baseUrl}/createDailyContestEntry`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(entryData)
            });

            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.error || 'Failed to submit entry');
            }

            return result;
        } catch (error) {
            console.error('Error submitting daily contest entry:', error);
            throw error;
        }
    }

    // Get daily contest entries
    async getDailyContestEntries(contestDate) {
        try {
            const response = await fetch(`${this.baseUrl}/getDailyContestEntries?contestDate=${contestDate}`);
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.error || 'Failed to get entries');
            }

            return result.entries;
        } catch (error) {
            console.error('Error getting daily contest entries:', error);
            throw error;
        }
    }

    // Resolve daily contest (admin only)
    async resolveDailyContest(contestDate, choiceResults) {
        try {
            const response = await fetch(`${this.baseUrl}/resolveDailyContest`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contestDate: contestDate,
                    choiceResults: choiceResults
                })
            });

            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.error || 'Failed to resolve contest');
            }

            return result;
        } catch (error) {
            console.error('Error resolving daily contest:', error);
            throw error;
        }
    }
}

// Create global instance
window.dailyContestAPI = new DailyContestAPI();

// Backward compatibility: provide fallback to localStorage if Firebase is unavailable
class LocalStorageFallback {
    async saveDailyContest(contestData) {
        const key = `daily_contest_${contestData.contestDate}`;
        localStorage.setItem(key, JSON.stringify(contestData));
        return { success: true, contestId: contestData.contestDate };
    }

    async getDailyContest(date) {
        const key = `daily_contest_${date}`;
        const stored = localStorage.getItem(key);
        return stored ? JSON.parse(stored) : null;
    }

    async submitDailyContestEntry(entryData) {
        const key = `daily_entry_${entryData.userId || Date.now()}`;
        localStorage.setItem(key, JSON.stringify(entryData));
        return { success: true, entryId: entryData.userId || Date.now() };
    }

    async getDailyContestEntries(contestDate) {
        const entries = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('daily_entry_')) {
                const entry = JSON.parse(localStorage.getItem(key));
                if (entry.contestDate === contestDate) {
                    entries.push(entry);
                }
            }
        }
        return entries;
    }

    async resolveDailyContest(contestDate, choiceResults) {
        // Update contest
        const contestKey = `daily_contest_${contestDate}`;
        const contest = JSON.parse(localStorage.getItem(contestKey));
        if (contest) {
            contest.status = 'resolved';
            contest.resolvedAt = new Date().toISOString();
            contest.choiceResults = choiceResults;
            localStorage.setItem(contestKey, JSON.stringify(contest));
        }

        // Update entries with scores
        const entries = await this.getDailyContestEntries(contestDate);
        entries.forEach(entry => {
            let score = 0;
            Object.keys(entry.picks).forEach(choiceId => {
                const userPick = entry.picks[choiceId];
                const correctAnswer = choiceResults[choiceId];
                if (userPick === correctAnswer) {
                    score += 1;
                }
            });
            entry.score = score;
            entry.scoredAt = new Date().toISOString();
            
            const entryKey = `daily_entry_${entry.userId}`;
            localStorage.setItem(entryKey, JSON.stringify(entry));
        });

        return { success: true, entriesUpdated: entries.length };
    }
}

// Create fallback instance
window.dailyContestFallback = new LocalStorageFallback();

// Smart API that tries Firebase first, falls back to localStorage
window.smartDailyContestAPI = {
    async saveDailyContest(contestData) {
        try {
            return await window.dailyContestAPI.saveDailyContest(contestData);
        } catch (error) {
            console.warn('Firebase unavailable, using localStorage fallback:', error.message);
            return await window.dailyContestFallback.saveDailyContest(contestData);
        }
    },

    async getDailyContest(date) {
        try {
            return await window.dailyContestAPI.getDailyContest(date);
        } catch (error) {
            console.warn('Firebase unavailable, using localStorage fallback:', error.message);
            return await window.dailyContestFallback.getDailyContest(date);
        }
    },

    async submitDailyContestEntry(entryData) {
        try {
            return await window.dailyContestAPI.submitDailyContestEntry(entryData);
        } catch (error) {
            console.warn('Firebase unavailable, using localStorage fallback:', error.message);
            return await window.dailyContestFallback.submitDailyContestEntry(entryData);
        }
    },

    async getDailyContestEntries(contestDate) {
        try {
            return await window.dailyContestAPI.getDailyContestEntries(contestDate);
        } catch (error) {
            console.warn('Firebase unavailable, using localStorage fallback:', error.message);
            return await window.dailyContestFallback.getDailyContestEntries(contestDate);
        }
    },

    async resolveDailyContest(contestDate, choiceResults) {
        try {
            return await window.dailyContestAPI.resolveDailyContest(contestDate, choiceResults);
        } catch (error) {
            console.warn('Firebase unavailable, using localStorage fallback:', error.message);
            return await window.dailyContestFallback.resolveDailyContest(contestDate, choiceResults);
        }
    }
};

console.log('✅ Daily Contest API initialized with Firebase and localStorage fallback');
