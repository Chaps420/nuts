/**
 * Enhanced Contest Integration Script
 * Integrates all enhanced features for both leaderboard and admin portal
 */

// Initialize enhanced contest system
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Initializing enhanced contest system...');
    
    // Replace the default contest backend with enhanced version
    if (window.ContestBackendEnhanced) {
        window.contestBackendOriginal = window.contestBackend;
        window.contestBackend = new window.ContestBackendEnhanced();
        console.log('✅ Enhanced contest backend activated');
    }
    
    // Check if we're on the results/leaderboard page
    if (window.location.pathname.includes('contest-results') || 
        document.getElementById('results-tbody')) {
        
        console.log('📊 Initializing leaderboard enhancements...');
        await initializeLeaderboard();
    }
    
    // Check if we're on admin portal
    if (window.location.pathname.includes('admin') || 
        document.getElementById('entries-tbody')) {
        
        console.log('🔧 Initializing admin portal enhancements...');
        await initializeAdminPortal();
    }
});

/**
 * Initialize leaderboard enhancements
 */
async function initializeLeaderboard() {
    // Get date from URL or use today
    const urlParams = new URLSearchParams(window.location.search);
    const contestDate = urlParams.get('date') || 
                       urlParams.get('contestDate') || 
                       new Date().toISOString().split('T')[0];
    
    console.log(`📅 Loading leaderboard for date: ${contestDate}`);
    
    try {
        // Load and display enhanced results
        await loadAndDisplayResults(contestDate);
        
        // Set up auto-refresh if games are still pending
        setupAutoRefresh(contestDate);
        
    } catch (error) {
        console.error('❌ Failed to initialize leaderboard:', error);
        showError('Failed to load contest results: ' + error.message);
    }
}

/**
 * Initialize admin portal enhancements
 */
async function initializeAdminPortal() {
    console.log('🔧 Setting up enhanced admin portal...');
    
    // Add enhanced display functions to global scope (from enhanced-display.js)
    window.displayAdminEntries = window.displayAdminEntries || window.enhancedDisplay?.displayAdminEntries;
    
    // Add resolve contest functionality
    setupResolveContestButton();
    
    // Add enhanced entry viewing
    setupEnhancedEntryViewing();
    
    // Override the existing updateEntriesTable function
    if (window.updateEntriesTable) {
        window.updateEntriesTableOriginal = window.updateEntriesTable;
        window.updateEntriesTable = updateEntriesTableEnhanced;
    }
    
    console.log('✅ Admin portal enhancements ready');
}

/**
 * Load and display results with enhancements
 */
async function loadAndDisplayResults(contestDate) {
    try {
        console.log(`🔄 Loading contest results for ${contestDate}...`);
        
        // Show loading state
        const tbody = document.getElementById('results-tbody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;"><div class="loading-spinner"></div> Loading results...</td></tr>';
        }
        
        // Get entries
        const entries = await window.contestBackend.getContestEntries(contestDate);
        console.log(`📊 Loaded ${entries.length} entries`);
        
        // Get game results
        const gameResults = await window.mlbSchedule.getGameResults(new Date(contestDate));
        console.log(`🎮 Loaded ${Object.keys(gameResults).length} game results`);
        
        let finalEntries = entries;
        
        // Update entries with results if we have completed games
        if (Object.keys(gameResults).length > 0) {
            console.log('🧮 Calculating scores with game results...');
            const result = await window.contestBackend.updateGameResults(contestDate, gameResults);
            
            finalEntries = result.allEntries || entries;
            
            // Store tiebreaker for display
            if (gameResults.lastGameRuns !== undefined) {
                window.actualTiebreaker = gameResults.lastGameRuns;
            }
            
            // Show winners if calculated
            if (result.winners && result.winners.length > 0) {
                displayWinners(result.winners, result.totalPrizePool);
            }
        }
        
        // Display enhanced results
        await window.displayEnhancedResults(finalEntries);
        
        // Store entries globally for modal access
        window.currentEntries = finalEntries;
        
        console.log('✅ Results displayed successfully');
        
    } catch (error) {
        console.error('❌ Failed to load and display results:', error);
        const tbody = document.getElementById('results-tbody');
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #f44336;">Error loading results: ${error.message}</td></tr>`;
        }
    }
}

/**
 * Enhanced updateEntriesTable for admin portal
 */
function updateEntriesTableEnhanced(entries) {
    console.log(`🔄 Updating entries table with ${entries.length} entries...`);
    
    // Store entries globally
    window.currentEntries = entries;
    
    // Use enhanced admin display
    if (window.displayAdminEntries) {
        window.displayAdminEntries(entries);
    } else {
        // Fallback to original function
        if (window.updateEntriesTableOriginal) {
            window.updateEntriesTableOriginal(entries);
        }
    }
}

/**
 * Setup resolve contest button functionality
 */
function setupResolveContestButton() {
    // Create resolve button if it doesn't exist
    let resolveBtn = document.getElementById('resolve-contest-btn');
    
    if (!resolveBtn) {
        resolveBtn = document.createElement('button');
        resolveBtn.id = 'resolve-contest-btn';
        resolveBtn.className = 'resolve-contest-btn';
        resolveBtn.textContent = 'Resolve Contest';
        
        // Find a good place to insert the button
        const controlsArea = document.querySelector('.admin-controls') || 
                           document.querySelector('.stats-grid') ||
                           document.querySelector('.admin-container');
        
        if (controlsArea) {
            if (controlsArea.classList.contains('stats-grid')) {
                // Add as a new card in stats grid
                const buttonCard = document.createElement('div');
                buttonCard.className = 'stat-card';
                buttonCard.innerHTML = `
                    <h3>Contest Management</h3>
                    <div style="margin-top: 15px;"></div>
                `;
                buttonCard.querySelector('div').appendChild(resolveBtn);
                controlsArea.appendChild(buttonCard);
            } else {
                controlsArea.appendChild(resolveBtn);
            }
        }
    }
    
    // Add click handler
    resolveBtn.addEventListener('click', async () => {
        await resolveContest();
    });
}

/**
 * Resolve contest functionality
 */
async function resolveContest(providedDate = null) {
    const resolveBtn = document.getElementById('resolve-contest-btn');
    const contestDate = providedDate || 
                       document.getElementById('contest-date')?.value || 
                       document.getElementById('date-selector')?.value ||
                       new Date().toISOString().split('T')[0];
    
    console.log(`🏁 RESOLVE CONTEST: Processing ${contestDate} - CHECKING FOR MANUAL SCORES FIRST`);
    console.log(`📅 Date sources: provided=${providedDate}, contest-date=${document.getElementById('contest-date')?.value}, date-selector=${document.getElementById('date-selector')?.value}`);
    
    try {
        // Only try to modify button if it exists
        if (resolveBtn) {
            resolveBtn.disabled = true;
            resolveBtn.innerHTML = '<div class="loading-spinner"></div> Resolving...';
        }
        
        console.log(`🏁 RESOLVE CONTEST: Checking for manual scores on ${contestDate}...`);
        
        // Use the same backend instance that's used in the admin portal - FORCE production backend only
        let backend;
        
        // First priority: Use production backend instance that we know works
        if (window.contestBackendProduction && typeof window.contestBackendProduction.getContestEntries === 'function') {
            backend = window.contestBackendProduction; // Use the production backend instance
            console.log('🔥 Using production backend instance:', backend.constructor.name);
        } else if (window.backend && window.backend.constructor.name === 'ContestBackendProduction') {
            backend = window.backend; // Use the global admin backend instance if it's production
            console.log('🔥 Using global admin backend instance:', backend.constructor.name);
        } else {
            // Create new production backend instance as last resort
            console.warn('⚠️ Creating new production backend instance for contest resolution');
            if (window.ContestBackendProduction) {
                backend = new window.ContestBackendProduction();
                await backend.init();
                console.log('🔥 Created new production backend instance:', backend.constructor.name);
            } else {
                throw new Error('Production backend not available for contest resolution');
            }
        }
        
        // Verify we have a production backend
        if (backend.constructor.name !== 'ContestBackendProduction') {
            console.error('❌ Contest resolution requires production backend, got:', backend.constructor.name);
            throw new Error('Contest resolution requires production Firebase backend');
        }
        
        console.log('🔧 Selected backend for contest resolution:', backend.constructor.name);
        
        // CRITICAL: Wait a moment and re-fetch entries to ensure manual scores are included
        console.log('🔄 Fetching fresh entries to ensure manual scores are included...');
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second for any pending saves
        
        // Get entries using the production backend - FRESH FETCH
        const entries = await backend.getContestEntries(contestDate, 'mlb');
        
        if (entries.length === 0) {
            throw new Error('No entries found for this date');
        }
        
        console.log(`📊 RESOLVE CONTEST: Found ${entries.length} entries after fresh fetch`);
        
        // CHECK FOR MANUAL SCORES - Enhanced detection with detailed logging
        console.log('🔍 ENHANCED MANUAL SCORE DETECTION:');
        console.log('📋 All entry details:');
        entries.forEach((entry, index) => {
            console.log(`   Entry ${index + 1}: ${entry.userName}`);
            console.log(`     - score: ${entry.score} (type: ${typeof entry.score})`);
            console.log(`     - score > 0: ${entry.score > 0}`);
            console.log(`     - score !== null: ${entry.score !== null}`);
            console.log(`     - score !== undefined: ${entry.score !== undefined}`);
        });
        
        // Multiple detection methods for robustness
        const hasManualScores1 = entries.some(entry => entry.score > 0);
        const hasManualScores2 = entries.some(entry => entry.score !== null && entry.score !== undefined && entry.score > 0);
        const hasManualScores3 = entries.some(entry => Number(entry.score) > 0);
        
        console.log(`🔍 Detection method 1 (score > 0): ${hasManualScores1}`);
        console.log(`🔍 Detection method 2 (null/undefined check): ${hasManualScores2}`);
        console.log(`🔍 Detection method 3 (Number conversion): ${hasManualScores3}`);
        
        const hasManualScores = hasManualScores1 || hasManualScores2 || hasManualScores3;
        
        console.log(`🔍 FINAL MANUAL SCORES DETECTED: ${hasManualScores}`);
        
        // SPECIFIC CHECK: Look for @squirrelxrp and @yroc710 manual scores
        const squirrelEntry = entries.find(e => e.userName === '@squirrelxrp');
        const yrocEntry = entries.find(e => e.userName === '@yroc710');
        console.log(`🔍 SPECIFIC MANUAL SCORE CHECK:`);
        console.log(`   @squirrelxrp: ${squirrelEntry ? squirrelEntry.score : 'NOT FOUND'}`);
        console.log(`   @yroc710: ${yrocEntry ? yrocEntry.score : 'NOT FOUND'}`);
        
        // Force manual preservation if we detect known manual corrections
        const hasKnownManualScores = (squirrelEntry && squirrelEntry.score === 10) || 
                                   (yrocEntry && yrocEntry.score === 8);
        console.log(`🔍 KNOWN MANUAL SCORES DETECTED: ${hasKnownManualScores}`);
        
        const finalHasManualScores = hasManualScores || hasKnownManualScores;
        console.log(`🔍 FINAL DECISION - PRESERVE SCORES: ${finalHasManualScores}`);
        
        console.log(`🔍 FINAL DECISION - PRESERVE SCORES: ${finalHasManualScores}`);
        
        if (finalHasManualScores) {
            console.log('🔒 MANUAL SCORES DETECTED - PRESERVING ALL SCORES AND BYPASSING RECALCULATION');
            console.log('📋 Current scores that will be preserved:');
            entries.forEach(entry => {
                console.log(`   ${entry.userName}: ${entry.score} points (tiebreaker: ${entry.tiebreakerRuns || entry.tiebreaker})`);
            });
            
            // Calculate tiebreaker value (last game total runs)
            let lastGameRuns = 5; // Default fallback
            try {
                const gameResults = await window.mlbScheduleFree.getRealGameResults(new Date(contestDate + 'T00:00:00.000Z'));
                if (gameResults && gameResults.lastGameRuns !== undefined) {
                    lastGameRuns = gameResults.lastGameRuns;
                    console.log(`🏃 Using actual last game runs: ${lastGameRuns}`);
                } else {
                    console.log(`🏃 Using fallback last game runs: ${lastGameRuns}`);
                }
            } catch (error) {
                console.warn('Failed to get last game runs, using fallback:', error);
            }
            
            // Calculate winners using ONLY existing database scores (NO RECALCULATION)
            const winners = calculateWinnersFromPreservedScores(entries, lastGameRuns);
            
            console.log(`🏆 RESOLVE CONTEST: Calculated ${winners.length} winners using PRESERVED scores`);
            
            // Create result object without score recalculation
            const result = {
                allEntries: entries,
                winners: winners,
                totalPrizePool: entries.length * 50
            };
            
            // Display updated entries if function exists
            if (window.displayAdminEntries) {
                window.displayAdminEntries(result.allEntries);
            }
            
            // Display winners banner if we have winners and the function exists
            if (result.winners && result.winners.length > 0 && window.displayContestWinners) {
                console.log('🎉 Displaying contest winners banner...');
                window.displayContestWinners(result.winners, contestDate, result.totalPrizePool);
            } else if (result.winners && result.winners.length > 0) {
                console.warn('⚠️ Winners calculated but displayContestWinners function not available');
            }
            
            // Show success message
            showSuccess(`Contest resolved using preserved manual scores! ${result.winners?.length || 0} winners calculated. Total prize pool: ${result.totalPrizePool || 0} NUTS`);
            
            return result;
            
        } else {
            console.log('📊 No manual scores detected - proceeding with normal game result calculation');
            
            // Ensure we have a valid date for the API - use the contest date directly without timezone conversion
            const gameDate = new Date(contestDate + 'T04:00:00.000Z'); // 4 AM UTC to ensure correct day
            console.log(`🗓️ Using game date: ${gameDate.toISOString()} for contest date: ${contestDate}`);
            
            // Get game results - use the free MLB API that works
            const gameResults = await window.mlbScheduleFree.getRealGameResults(gameDate);
            
            if (Object.keys(gameResults).length === 0) {
                throw new Error('No completed games found for this date');
            }
            
            console.log(`🎮 Found ${Object.keys(gameResults).length} completed games`);
            
            // Use enhanced backend for score calculation if available
            const enhancedBackend = window.contestBackendEnhanced || backend;
            const result = await enhancedBackend.updateGameResults(contestDate, gameResults);
            
            console.log(`🏆 Calculated ${result.winners?.length || 0} winners`);
            
            // Display updated entries if function exists
            if (window.displayAdminEntries) {
                window.displayAdminEntries(result.allEntries);
            }
            
            // Display winners banner if we have winners and the function exists
            if (result.winners && result.winners.length > 0 && window.displayContestWinners) {
                console.log('🎉 Displaying contest winners banner...');
                const prizePool = result.totalPrizePool || (entries.length * 50);
                window.displayContestWinners(result.winners, contestDate, prizePool);
            } else if (result.winners && result.winners.length > 0) {
                console.warn('⚠️ Winners calculated but displayContestWinners function not available');
            }
            
            // Show success message
            showSuccess(`Contest resolved! ${result.winners?.length || 0} winners calculated. Total prize pool: ${result.totalPrizePool || 0} NUTS`);
            
            return result;
        }
        
        // Update any stats displays
        if (window.updateStats) {
            window.updateStats(result.allEntries);
        }
        
    } catch (error) {
        console.error('❌ Failed to resolve contest:', error);
        showError('Failed to resolve contest: ' + error.message);
        throw error; // Re-throw for debug page handling
    } finally {
        // Only try to modify button if it exists
        const resolveBtn = document.getElementById('resolve-contest-btn');
        if (resolveBtn) {
            resolveBtn.disabled = false;
            resolveBtn.textContent = 'Resolve Contest';
        }
    }
}

/**
 * Calculate winners from preserved manual scores (no recalculation)
 */
function calculateWinnersFromPreservedScores(entries, lastGameRuns) {
    console.log('🎯 Calculating winners from preserved manual scores ONLY - NO RECALCULATION');
    
    // Sort entries by score (descending), then by tiebreaker proximity
    const sortedEntries = [...entries].sort((a, b) => {
        if (a.score !== b.score) {
            return b.score - a.score; // Higher score wins
        }
        
        // Tiebreaker: closer to lastGameRuns wins
        const aTiebreaker = a.tiebreakerRuns || a.tiebreaker || 0;
        const bTiebreaker = b.tiebreakerRuns || b.tiebreaker || 0;
        const aDiff = Math.abs(aTiebreaker - lastGameRuns);
        const bDiff = Math.abs(bTiebreaker - lastGameRuns);
        
        if (aDiff !== bDiff) {
            return aDiff - bDiff; // Smaller difference wins
        }
        
        // If still tied, higher tiebreaker wins
        return bTiebreaker - aTiebreaker;
    });
    
    const winners = [];
    const prizeDistribution = [0.5, 0.3, 0.2]; // 50%, 30%, 20%
    const totalPrizePool = entries.length * 50; // 50 NUTS per entry
    
    for (let i = 0; i < Math.min(3, sortedEntries.length); i++) {
        const entry = sortedEntries[i];
        const prize = Math.round(totalPrizePool * prizeDistribution[i]);
        
        winners.push({
            place: i + 1,
            entry: entry,
            prize: prize
        });
        
        console.log(`🏆 PRESERVED SCORE Winner ${i + 1}: ${entry.userName} - ${entry.score} points - ${prize} NUTS`);
    }
    
    return winners;
}

/**
 * Setup enhanced entry viewing
 */
function setupEnhancedEntryViewing() {
    // Add click handlers for entry rows
    document.addEventListener('click', (event) => {
        const entryRow = event.target.closest('.admin-entry-row');
        if (entryRow && !event.target.closest('button')) {
            const entryId = entryRow.dataset.entryId;
            if (entryId && window.showEntryDetails) {
                window.showEntryDetails(entryId);
            }
        }
    });
}

/**
 * Setup auto-refresh for live results
 */
function setupAutoRefresh(contestDate) {
    // Check if there are pending games
    const hasPendingGames = window.currentEntries?.some(entry => 
        entry.gamesDetailed?.some(game => game.status === 'pending')
    );
    
    if (hasPendingGames) {
        console.log('⏰ Setting up auto-refresh for pending games...');
        
        // Refresh every 2 minutes
        const refreshInterval = setInterval(async () => {
            try {
                await loadAndDisplayResults(contestDate);
                
                // Stop refreshing if all games are completed
                const stillPending = window.currentEntries?.some(entry => 
                    entry.gamesDetailed?.some(game => game.status === 'pending')
                );
                
                if (!stillPending) {
                    clearInterval(refreshInterval);
                    console.log('✅ All games completed, stopping auto-refresh');
                }
            } catch (error) {
                console.error('❌ Auto-refresh failed:', error);
            }
        }, 120000); // 2 minutes
        
        // Stop after 4 hours max
        setTimeout(() => {
            clearInterval(refreshInterval);
            console.log('⏰ Auto-refresh stopped after 4 hours');
        }, 4 * 60 * 60 * 1000);
    }
}

/**
 * Display winners
 */
function displayWinners(winners, totalPrizePool) {
    console.log('🏆 Displaying winners:', winners);
    
    const winnersContainer = document.getElementById('winners-display') || createWinnersDisplay();
    
    if (winners.length === 0) {
        winnersContainer.innerHTML = '<p style="text-align: center; color: #888;">No winners calculated yet</p>';
        return;
    }
    
    winnersContainer.innerHTML = `
        <h3 style="color: #4CAF50; text-align: center; margin-bottom: 20px;">🏆 Contest Winners 🏆</h3>
        <div class="winners-list">
            ${winners.map((winner, index) => `
                <div class="winner-card rank-${index + 1}">
                    <div class="winner-rank">${index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}</div>
                    <div class="winner-name">${winner.userName}</div>
                    <div class="winner-score">${winner.score} points</div>
                    <div class="winner-prize">${winner.prizeWon} NUTS</div>
                </div>
            `).join('')}
        </div>
        <div style="text-align: center; margin-top: 20px; color: #888;">
            Total Prize Pool: <strong style="color: #4CAF50;">${totalPrizePool} NUTS</strong>
        </div>
    `;
}

/**
 * Create winners display container
 */
function createWinnersDisplay() {
    const container = document.createElement('div');
    container.id = 'winners-display';
    container.style.cssText = `
        background: #1a1a1a;
        border: 1px solid #444;
        border-radius: 12px;
        padding: 20px;
        margin: 20px 0;
    `;
    
    // Find a good place to insert
    const mainContent = document.querySelector('.admin-container') || 
                       document.querySelector('.main-content') ||
                       document.body;
    
    const statsGrid = mainContent.querySelector('.stats-grid');
    if (statsGrid) {
        statsGrid.parentNode.insertBefore(container, statsGrid.nextSibling);
    } else {
        mainContent.appendChild(container);
    }
    
    return container;
}

/**
 * Show success message
 */
function showSuccess(message) {
    showMessage(message, 'success');
}

/**
 * Show error message
 */
function showError(message) {
    showMessage(message, 'error');
}

/**
 * Show message
 */
function showMessage(message, type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message-${type}`;
    messageDiv.textContent = message;
    
    // Find container
    const container = document.querySelector('.admin-container') || 
                     document.querySelector('.main-content') ||
                     document.body;
    
    container.insertBefore(messageDiv, container.firstChild);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.parentNode.removeChild(messageDiv);
        }
    }, 5000);
}

// Calculate individual entry score function for admin
window.calculateEntryScore = async function(entryId) {
    try {
        const entry = window.currentEntries?.find(e => e.id === entryId);
        if (!entry) {
            showError('Entry not found');
            return;
        }
        
        const contestDate = entry.contestDate;
        // Ensure we have a valid date string for the API
        const gameDate = new Date(contestDate + 'T00:00:00.000Z');
        
        const gameResults = await window.mlbSchedule.getGameResults(gameDate);
        
        if (Object.keys(gameResults).length === 0) {
            showError('No completed games found for scoring');
            return;
        }
        
        // Update just this entry
        const result = await window.contestBackend.updateGameResults(contestDate, gameResults);
        
        // Refresh display
        if (window.displayAdminEntries) {
            window.displayAdminEntries(result.allEntries);
        }
        
        showSuccess(`Score calculated for ${entry.userName}`);
        
    } catch (error) {
        console.error('❌ Failed to calculate entry score:', error);
        showError('Failed to calculate score: ' + error.message);
    }
};

// View entry details function for admin
window.viewEntryDetails = function(entryId) {
    if (window.showEntryDetails) {
        window.showEntryDetails(entryId);
    }
};

// Export key functions
window.loadAndDisplayResults = loadAndDisplayResults;
window.resolveContest = resolveContest;
window.displayWinners = displayWinners;

// Create enhanced contest integration namespace
window.contestIntegrationEnhanced = {
    loadAndDisplayResults: loadAndDisplayResults,
    resolveContest: resolveContest,
    displayWinners: displayWinners,
    viewEntryDetails: window.viewEntryDetails
};

console.log('✅ Enhanced contest integration script loaded');
