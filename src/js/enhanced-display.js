/**
 * Enhanced Display Functions for Contest Results
 * Provides improved visualization for both leaderboard and admin portal
 */

/**
 * Enhanced results display for leaderboard
 */
async function displayEnhancedResults(entries, sport = 'mlb') {
    const tbody = document.getElementById('results-tbody');
    if (!tbody) {
        console.warn('⚠️ results-tbody element not found');
        return;
    }
    
    if (entries.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #888;">No entries found</td></tr>';
        return;
    }
    
    // Sort by score descending, then by tiebreaker
    entries.sort((a, b) => {
        const scoreA = a.score || 0;
        const scoreB = b.score || 0;
        if (scoreA !== scoreB) return scoreB - scoreA;
        
        // Tiebreaker
        const tiebreakerA = a.tiebreakerRuns || a.tiebreakerPoints || 0;
        const tiebreakerB = b.tiebreakerRuns || b.tiebreakerPoints || 0;
        return Math.abs(tiebreakerA - (window.actualTiebreaker || 0)) - 
               Math.abs(tiebreakerB - (window.actualTiebreaker || 0));
    });
    
    tbody.innerHTML = entries.map((entry, index) => {
        const rank = index + 1;
        const rankClass = rank <= 3 ? `rank-${rank}` : '';
        const rankIcon = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;
        
        // Format picks display with actual team names and results
        let picksDisplay = '';
        if (entry.gamesDetailed && Array.isArray(entry.gamesDetailed)) {
            picksDisplay = entry.gamesDetailed.slice(0, 8).map(game => {
                let resultIcon = '';
                let resultClass = '';
                
                if (game.isCorrect === true) {
                    resultIcon = '✅';
                    resultClass = 'correct';
                } else if (game.isCorrect === false) {
                    resultIcon = '❌';
                    resultClass = 'incorrect';
                } else {
                    resultIcon = '⏳';
                    resultClass = 'pending';
                }
                
                const teamDisplay = game.pickedTeam || game.pickedDirection;
                
                return `
                    <span class="pick-badge ${resultClass}" title="${teamDisplay} vs ${game.opposingTeam || 'Unknown'} - ${game.actualScore || 'Pending'}">
                        ${teamDisplay} ${resultIcon}
                    </span>
                `;
            }).join(' ');
            
            if (entry.gamesDetailed.length > 8) {
                picksDisplay += `<span class="pick-badge more">+${entry.gamesDetailed.length - 8}</span>`;
            }
        } else if (entry.picks) {
            // Fallback for old format
            picksDisplay = Object.entries(entry.picks).slice(0, 8).map(([gameId, pick]) => 
                `<span class="pick-badge">${pick}</span>`
            ).join(' ');
            
            if (Object.keys(entry.picks).length > 8) {
                picksDisplay += `<span class="pick-badge more">+${Object.keys(entry.picks).length - 8}</span>`;
            }
        }
        
        const highlightClass = window.highlightEntryId === entry.id ? 'highlight-row' : '';
        const tiebreakerLabel = sport === 'nfl' ? 'Points' : 'Runs';
        
        return `
            <tr class="${highlightClass} ${rankClass}" onclick="showEntryDetails('${entry.id}')">
                <td style="text-align: center; font-weight: bold; font-size: 1.1em;">${rankIcon}</td>
                <td>
                    <div style="font-weight: 600; color: #ffa500;">${entry.userName}</div>
                    ${entry.twitterHandle ? `<div style="font-size: 0.9em; color: #1DA1F2;">@${entry.twitterHandle}</div>` : ''}
                    ${rank <= 3 ? `<div style="font-size: 0.8em; color: #4CAF50;">🏆 ${rank === 1 ? 'WINNER' : rank === 2 ? '2nd Place' : '3rd Place'}</div>` : ''}
                </td>
                <td>
                    <div class="picks-container">
                        ${picksDisplay}
                    </div>
                </td>
                <td style="text-align: center;">
                    <strong style="font-size: 1.2em; color: ${rank <= 3 ? '#4CAF50' : '#ffa500'};">${entry.score || 0}</strong> 
                    <span style="color: #888;">/ ${entry.totalGames || entry.gamesDetailed?.length || Object.keys(entry.picks || {}).length}</span>
                </td>
                <td style="text-align: center;">
                    <span style="color: #888;">${entry.tiebreakerRuns || entry.tiebreakerPoints || '-'}</span>
                    ${entry.tiebreakerRuns || entry.tiebreakerPoints ? `<br><small style="color: #666;">${tiebreakerLabel}</small>` : ''}
                </td>
                <td style="text-align: center;">
                    ${entry.prizeWon > 0 ? `<strong style="color: #4CAF50; font-size: 1.1em;">${entry.prizeWon} NUTS</strong>` : '-'}
                </td>
            </tr>
        `;
    }).join('');
}

/**
 * Enhanced admin portal display
 */
function displayAdminEntries(entries) {
    const container = document.getElementById('entries-tbody') || document.getElementById('entries-container');
    if (!container) {
        console.warn('⚠️ Admin entries container not found');
        return;
    }
    
    if (entries.length === 0) {
        container.innerHTML = '<tr><td colspan="8" style="text-align: center; color: #888;">No entries found</td></tr>';
        return;
    }
    
    // Sort by score descending
    const sortedEntries = [...entries].sort((a, b) => (b.score || 0) - (a.score || 0));
    
    const html = sortedEntries.map((entry, index) => {
        const rank = index + 1;
        const rankStyle = rank === 1 ? 'color: #FFD700; font-weight: bold;' : 
                         rank === 2 ? 'color: #C0C0C0; font-weight: bold;' : 
                         rank === 3 ? 'color: #CD7F32; font-weight: bold;' : 
                         'color: #888;';
        
        // Build enhanced picks display
        let picksDisplay = '';
        
        if (entry.gamesDetailed && Array.isArray(entry.gamesDetailed)) {
            picksDisplay = `
                <div class="admin-picks-grid">
                    ${entry.gamesDetailed.map(game => {
                        let statusClass = '';
                        let statusIcon = '';
                        let statusText = '';
                        
                        if (game.isCorrect === true) {
                            statusClass = 'correct';
                            statusIcon = '✅';
                            statusText = 'WIN';
                        } else if (game.isCorrect === false) {
                            statusClass = 'incorrect';
                            statusIcon = '❌';
                            statusText = `LOSS (${game.actualWinner})`;
                        } else {
                            statusClass = 'pending';
                            statusIcon = '⏳';
                            statusText = 'Pending';
                        }
                        
                        return `
                            <div class="admin-pick-item ${statusClass}">
                                <div class="pick-teams">
                                    <strong>${game.pickedTeam || game.pickedDirection}</strong> 
                                    ${game.opposingTeam ? `vs ${game.opposingTeam}` : ''}
                                </div>
                                <div class="pick-result">
                                    ${statusIcon} ${statusText}
                                </div>
                                ${game.actualScore ? `
                                    <div class="pick-score">Score: ${game.actualScore}</div>
                                ` : ''}
                                ${game.venue ? `
                                    <div class="pick-venue">${game.venue}</div>
                                ` : ''}
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
        } else if (entry.picks) {
            // Fallback for old format - show basic picks
            picksDisplay = `
                <div class="admin-picks-simple">
                    ${Object.entries(entry.picks).map(([gameId, pick]) => {
                        // Try to extract team info from gameId
                        const teamInfo = extractTeamInfoFromGameId(gameId);
                        return `
                            <div class="admin-pick-basic">
                                <span class="pick-team">${pick}</span>
                                ${teamInfo ? `<span class="pick-game">${teamInfo}</span>` : ''}
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
        }
        
        const statusClass = entry.status === 'won' ? 'status-won' : 
                           entry.status === 'lost' ? 'status-lost' : 
                           'status-pending';
        
        return `
            <tr class="admin-entry-row" style="${rank <= 3 ? 'background: rgba(255, 215, 0, 0.05);' : ''}">
                <td style="font-family: monospace; font-size: 0.85em;">
                    <span style="${rankStyle}">#${rank}</span><br>
                    ${entry.id.substring(0, 8)}...
                </td>
                <td>
                    <div class="player-info">
                        <strong>${entry.userName}</strong>
                        ${rank <= 3 ? `<br><small style="${rankStyle}">${rank === 1 ? '👑 Leader' : rank === 2 ? '🥈 2nd Place' : '🥉 3rd Place'}</small>` : ''}
                        ${entry.twitterHandle ? `<br><span style="color: #1DA1F2;">@${entry.twitterHandle}</span>` : ''}
                        ${entry.walletAddress ? `<br><span class="wallet-addr" title="${entry.walletAddress}">${entry.walletAddress.substring(0, 8)}...</span>` : ''}
                    </div>
                </td>
                <td style="max-width: 400px; overflow: auto;">
                    ${picksDisplay}
                </td>
                <td style="text-align: center;">
                    <strong style="font-size: 1.1em; ${rank <= 3 ? 'color: #4CAF50;' : ''}">${entry.score || 0}</strong> 
                    <br><small>/ ${entry.totalGames || entry.gamesDetailed?.length || Object.keys(entry.picks || {}).length}</small>
                </td>
                <td style="text-align: center;">
                    <strong>${entry.tiebreakerRuns || entry.tiebreakerPoints || 0}</strong>
                </td>
                <td style="text-align: center;">
                    <span class="status-badge ${statusClass}">
                        ${entry.status || 'Active'}
                    </span>
                </td>
                <td style="text-align: center;">
                    ${entry.prizeWon > 0 ? `<strong style="color: #4CAF50;">${entry.prizeWon} NUTS</strong>` : '-'}
                </td>
                <td style="text-align: center;">
                    <button onclick="viewEntryDetails('${entry.id}')" class="btn-small">View</button>
                    ${entry.score !== undefined ? '' : `<br><button onclick="calculateEntryScore('${entry.id}')" class="btn-small" style="margin-top: 4px;">Score</button>`}
                </td>
            </tr>
        `;
    }).join('');
    
    container.innerHTML = html;
}

/**
 * Show detailed entry modal
 */
function showEntryDetails(entryId) {
    const entry = window.currentEntries?.find(e => e.id === entryId);
    if (!entry) {
        console.warn('Entry not found:', entryId);
        return;
    }
    
    let modalContent = `
        <div class="modal-header">
            <h3>${entry.userName}'s Picks</h3>
            <span class="close-modal" onclick="closeModal()">&times;</span>
        </div>
        <div class="modal-body">
            <div class="entry-summary">
                <div><strong>Score:</strong> ${entry.score || 0} / ${entry.totalGames || entry.gamesDetailed?.length || Object.keys(entry.picks || {}).length}</div>
                <div><strong>Tiebreaker:</strong> ${entry.tiebreakerRuns || entry.tiebreakerPoints || 'N/A'}</div>
                <div><strong>Status:</strong> ${entry.status || 'Pending'}</div>
            </div>
            <div class="picks-detailed">
    `;
    
    if (entry.gamesDetailed && Array.isArray(entry.gamesDetailed)) {
        modalContent += entry.gamesDetailed.map(game => `
            <div class="pick-detail-row ${game.isCorrect === true ? 'correct' : game.isCorrect === false ? 'incorrect' : 'pending'}">
                <div class="pick-teams">
                    <strong>${game.awayTeam || 'Away'}</strong> @ <strong>${game.homeTeam || 'Home'}</strong>
                </div>
                <div class="pick-selection">
                    Picked: <strong>${game.pickedTeam || game.pickedDirection}</strong>
                </div>
                <div class="pick-result">
                    ${game.isCorrect === true ? '✅ Correct' : 
                      game.isCorrect === false ? `❌ Wrong (Winner: ${game.actualWinner})` : 
                      '⏳ Pending'}
                </div>
                ${game.actualScore ? `<div class="pick-score">Final: ${game.actualScore}</div>` : ''}
            </div>
        `).join('');
    } else if (entry.picks) {
        modalContent += Object.entries(entry.picks).map(([gameId, pick]) => `
            <div class="pick-detail-row">
                <div class="pick-game">${gameId}</div>
                <div class="pick-selection">Picked: <strong>${pick}</strong></div>
            </div>
        `).join('');
    }
    
    modalContent += `
            </div>
        </div>
    `;
    
    // Show modal
    const modal = document.getElementById('entry-modal') || createModal();
    modal.innerHTML = modalContent;
    modal.style.display = 'block';
}

/**
 * Create modal if it doesn't exist
 */
function createModal() {
    const modal = document.createElement('div');
    modal.id = 'entry-modal';
    modal.className = 'modal';
    modal.style.cssText = `
        display: none;
        position: fixed;
        z-index: 1000;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0,0,0,0.8);
    `;
    
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    modalContent.style.cssText = `
        background-color: #1a1a1a;
        margin: 5% auto;
        padding: 0;
        border: 1px solid #444;
        border-radius: 8px;
        width: 80%;
        max-width: 800px;
        max-height: 80vh;
        overflow-y: auto;
        color: white;
    `;
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Close modal when clicking outside
    modal.onclick = function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };
    
    return modalContent;
}

/**
 * Close modal
 */
function closeModal() {
    const modal = document.getElementById('entry-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

/**
 * Extract team info from game ID
 */
function extractTeamInfoFromGameId(gameId) {
    if (!gameId) return null;
    
    // Try to extract team names from various game ID formats
    if (gameId.includes('_')) {
        const parts = gameId.split('_');
        if (parts.length >= 2) {
            const lastPart = parts[parts.length - 1];
            // Could be a game number or team info
            return lastPart;
        }
    }
    
    return null;
}

// Export functions to global scope
window.displayEnhancedResults = displayEnhancedResults;
window.displayAdminEntries = displayAdminEntries;
window.showEntryDetails = showEntryDetails;
window.closeModal = closeModal;

console.log('✅ Enhanced display functions loaded');
