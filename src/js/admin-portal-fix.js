// Admin Portal Fix - Clean JavaScript Functions
// This file provides Daily Contest functionality only

// Daily Contest Management for Admin Portal
// Global variables (defined in admin-contest.html)
// let currentDailyContest = null; // Already declared in admin-contest.html
// let dailyChoices = []; // Already declared in admin-contest.html

// Initialize Daily Contest
function initializeDailyContest() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('daily-contest-date').value = today;
    loadDailyContestData();
}

// Load existing daily contest
async function loadDailyContestData() {
    const date = document.getElementById('daily-contest-date').value;
    if (!date) {
        alert('Please select a date');
        return;
    }
    
    try {
        console.log('📅 Loading daily contest for:', date);
        
        // Load from Firebase with localStorage fallback
        const contest = await window.smartDailyContestAPI.getDailyContest(date);
        
        if (contest) {
            currentDailyContest = contest;
            dailyChoices = currentDailyContest.choices || [];
            updateDailyContestUI();
            console.log('✅ Loaded daily contest:', contest);
        } else {
            currentDailyContest = null;
            dailyChoices = [];
            updateDailyContestUI();
            console.log('ℹ️ No contest found for date:', date);
        }
        
    } catch (error) {
        console.error('Failed to load daily contest:', error);
        alert('Failed to load daily contest: ' + error.message);
    }
}

// Create new daily contest
async function createNewDailyContest() {
    const date = document.getElementById('daily-contest-date').value;
    if (!date) {
        alert('Please select a date');
        return;
    }
    
    currentDailyContest = {
        contestDate: date,
        sport: 'daily',
        status: 'draft',
        choices: [],
        createdAt: new Date().toISOString(),
        active: false
    };
    
    dailyChoices = [];
    updateDailyContestUI();
    console.log('📝 Created new daily contest for:', date);
}

// Add choice to contest
function addDailyChoice() {
    const optionA = document.getElementById('option-a').value.trim();
    const optionB = document.getElementById('option-b').value.trim();
    const category = document.getElementById('choice-category').value.trim();
    const description = document.getElementById('choice-description').value.trim();
    
    if (!optionA || !optionB) {
        alert('Please enter both Option A and Option B');
        return;
    }
    
    const choice = {
        id: `choice_${Date.now()}`,
        optionA: optionA,
        optionB: optionB,
        category: category || 'General',
        description: description,
        correctAnswer: null
    };
    
    dailyChoices.push(choice);
    
    if (currentDailyContest) {
        currentDailyContest.choices = dailyChoices;
    }
    
    // Clear form
    clearChoiceForm();
    updateDailyContestUI();
    console.log('➕ Added choice:', choice);
}

// Clear choice form
function clearChoiceForm() {
    document.getElementById('option-a').value = '';
    document.getElementById('option-b').value = '';
    document.getElementById('choice-category').value = '';
    document.getElementById('choice-description').value = '';
}

// Remove choice
function removeDailyChoice(choiceId) {
    dailyChoices = dailyChoices.filter(c => c.id !== choiceId);
    
    if (currentDailyContest) {
        currentDailyContest.choices = dailyChoices;
    }
    
    updateDailyContestUI();
    console.log('❌ Removed choice:', choiceId);
}

// Publish contest
async function publishDailyContest() {
    if (!currentDailyContest) {
        alert('Please create a contest first');
        return;
    }
    
    if (dailyChoices.length === 0) {
        alert('Please add at least one choice before publishing');
        return;
    }
    
    try {
        currentDailyContest.status = 'active';
        currentDailyContest.active = true;
        currentDailyContest.choices = dailyChoices;
        currentDailyContest.publishedAt = new Date().toISOString();
        
        // Save to Firebase with localStorage fallback
        const result = await window.smartDailyContestAPI.saveDailyContest(currentDailyContest);
        
        if (result.success) {
            updateDailyContestUI();
            alert('✅ Daily contest published successfully!');
            console.log('🚀 Published daily contest:', currentDailyContest);
        } else {
            throw new Error('Failed to publish contest');
        }
        
    } catch (error) {
        console.error('Failed to publish contest:', error);
        alert('Failed to publish contest: ' + error.message);
    }
}

// Lock contest
async function lockDailyContest() {
    if (!currentDailyContest) {
        alert('No contest loaded');
        return;
    }
    
    try {
        currentDailyContest.status = 'locked';
        currentDailyContest.lockedAt = new Date().toISOString();
        
        const result = await window.smartDailyContestAPI.saveDailyContest(currentDailyContest);
        
        if (result.success) {
            updateDailyContestUI();
            alert('✅ Daily contest locked successfully!');
            console.log('🔒 Locked daily contest');
        } else {
            throw new Error('Failed to lock contest');
        }
        
    } catch (error) {
        console.error('Failed to lock contest:', error);
        alert('Failed to lock contest: ' + error.message);
    }
}

// Resolve contest
async function resolveDailyContest() {
    if (!currentDailyContest) {
        alert('No contest loaded');
        return;
    }
    
    const unresolvedChoices = dailyChoices.filter(c => !c.correctAnswer);
    if (unresolvedChoices.length > 0) {
        alert(`Please set results for all choices. Missing: ${unresolvedChoices.length} choices`);
        return;
    }
    
    try {
        const choiceResults = {};
        dailyChoices.forEach(choice => {
            choiceResults[choice.id] = choice.correctAnswer;
        });
        
        const result = await window.smartDailyContestAPI.resolveDailyContest(
            currentDailyContest.contestDate, 
            choiceResults
        );
        
        if (result.success) {
            currentDailyContest.status = 'resolved';
            currentDailyContest.resolvedAt = new Date().toISOString();
            currentDailyContest.choiceResults = choiceResults;
            
            updateDailyContestUI();
            alert(`✅ Contest resolved and ${result.entriesUpdated || 0} entries scored!`);
            console.log('🏆 Resolved daily contest');
        } else {
            throw new Error('Failed to resolve contest');
        }
        
    } catch (error) {
        console.error('Failed to resolve contest:', error);
        alert('Failed to resolve contest: ' + error.message);
    }
}

// Set choice result
function setChoiceResult(choiceId, result) {
    const choice = dailyChoices.find(c => c.id === choiceId);
    if (choice) {
        choice.correctAnswer = result;
        
        if (currentDailyContest) {
            currentDailyContest.choices = dailyChoices;
        }
        
        updateResolutionInterface();
        console.log(`✅ Set result for ${choiceId}: ${result}`);
    }
}

// Update UI based on current contest state
function updateDailyContestUI() {
    const statusDiv = document.getElementById('daily-contest-status');
    const statusText = document.getElementById('daily-status-text');
    const builderDiv = document.getElementById('daily-choice-builder');
    const choicesDiv = document.getElementById('daily-choices-list');
    const publishSection = document.getElementById('daily-publish-section');
    const resolutionDiv = document.getElementById('daily-resolution');
    const lockBtn = document.getElementById('lock-contest-btn');
    
    if (!currentDailyContest) {
        statusDiv.style.display = 'none';
        builderDiv.style.display = 'none';
        choicesDiv.style.display = 'none';
        if (publishSection) publishSection.style.display = 'none';
        resolutionDiv.style.display = 'none';
        return;
    }
    
    // Show status
    statusDiv.style.display = 'block';
    const status = currentDailyContest.status || 'draft';
    const choiceCount = dailyChoices.length;
    
    let statusHtml = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
                <strong>Status:</strong> <span style="color: ${getStatusColor(status)}">${status.toUpperCase()}</span><br>
                <strong>Choices:</strong> ${choiceCount}<br>
                <strong>Date:</strong> ${currentDailyContest.contestDate}
            </div>
            <div style="text-align: right;">
                ${currentDailyContest.publishedAt ? `<div style="color: #4CAF50;">✅ Published: ${new Date(currentDailyContest.publishedAt).toLocaleString()}</div>` : ''}
                ${currentDailyContest.lockedAt ? `<div style="color: #ff6b00;">🔒 Locked: ${new Date(currentDailyContest.lockedAt).toLocaleString()}</div>` : ''}
                ${currentDailyContest.resolvedAt ? `<div style="color: #2196F3;">🏆 Resolved: ${new Date(currentDailyContest.resolvedAt).toLocaleString()}</div>` : ''}
            </div>
        </div>
    `;
    statusText.innerHTML = statusHtml;
    
    // Show appropriate sections based on status
    if (status === 'draft') {
        builderDiv.style.display = 'block';
        if (publishSection) publishSection.style.display = choiceCount > 0 ? 'block' : 'none';
        resolutionDiv.style.display = 'none';
    } else if (status === 'active') {
        builderDiv.style.display = 'block';
        if (publishSection) publishSection.style.display = 'block';
        if (lockBtn) lockBtn.style.display = 'inline-block';
        resolutionDiv.style.display = 'none';
    } else if (status === 'locked') {
        builderDiv.style.display = 'none';
        if (publishSection) publishSection.style.display = 'none';
        resolutionDiv.style.display = 'block';
        updateResolutionInterface();
    } else if (status === 'resolved') {
        builderDiv.style.display = 'none';
        if (publishSection) publishSection.style.display = 'none';
        resolutionDiv.style.display = 'block';
        updateResolutionInterface();
    }
    
    // Always show choices if they exist
    if (choiceCount > 0) {
        choicesDiv.style.display = 'block';
        updateChoicesDisplay();
    } else {
        choicesDiv.style.display = 'none';
    }
}

// Update choices display
function updateChoicesDisplay() {
    const container = document.getElementById('choices-container');
    if (!container) return;
    
    if (dailyChoices.length === 0) {
        container.innerHTML = '<p style="color: #888;">No choices added yet.</p>';
        return;
    }
    
    container.innerHTML = dailyChoices.map((choice, index) => `
        <div style="background: #1a1a1a; padding: 15px; border-radius: 8px; margin-bottom: 10px;">
            <div style="display: flex; justify-content: between; align-items: center;">
                <div style="flex: 1;">
                    <strong style="color: #ffa500;">Choice ${index + 1}</strong>
                    ${choice.category ? `<span style="color: #888;"> (${choice.category})</span>` : ''}
                    <br>
                    <span style="color: #4CAF50;">${choice.optionA}</span> vs <span style="color: #ff6b00;">${choice.optionB}</span>
                    ${choice.description ? `<br><small style="color: #888;">${choice.description}</small>` : ''}
                </div>
                <button onclick="removeDailyChoice('${choice.id}')" style="background: #ff4444; color: white; border: none; padding: 5px 10px; border-radius: 4px; margin-left: 10px;">Remove</button>
            </div>
        </div>
    `).join('');
}

// Update resolution interface
function updateResolutionInterface() {
    const container = document.getElementById('resolution-choices');
    if (!container) return;
    
    container.innerHTML = dailyChoices.map((choice, index) => `
        <div style="background: #1a1a1a; padding: 15px; border-radius: 8px; margin-bottom: 10px;">
            <div style="margin-bottom: 10px;">
                <strong style="color: #ffa500;">Choice ${index + 1}:</strong> ${choice.optionA} vs ${choice.optionB}
            </div>
            <div style="display: flex; gap: 10px;">
                <button onclick="setChoiceResult('${choice.id}', 'A')" 
                        style="background: ${choice.correctAnswer === 'A' ? '#4CAF50' : '#666'}; color: white; border: none; padding: 8px 15px; border-radius: 4px;">
                    ${choice.optionA} Wins
                </button>
                <button onclick="setChoiceResult('${choice.id}', 'B')" 
                        style="background: ${choice.correctAnswer === 'B' ? '#4CAF50' : '#666'}; color: white; border: none; padding: 8px 15px; border-radius: 4px;">
                    ${choice.optionB} Wins
                </button>
            </div>
        </div>
    `).join('');
    
    // Add resolve button
    const allResolved = dailyChoices.every(c => c.correctAnswer);
    if (allResolved && currentDailyContest.status !== 'resolved') {
        container.innerHTML += `
            <div style="text-align: center; margin-top: 20px;">
                <button onclick="resolveDailyContest()" style="background: #4CAF50; color: white; border: none; padding: 12px 24px; border-radius: 8px; font-size: 1.1em;">
                    🏆 Resolve Contest & Calculate Winners
                </button>
            </div>
        `;
    }
}

// Calculate Winners function (for Daily Contest)
async function calculateWinners() {
    if (!currentDailyContest) {
        alert('No contest loaded');
        return;
    }

    if (currentDailyContest.status !== 'resolved') {
        alert('Contest must be resolved first. Please set the correct answers for all choices.');
        return;
    }

    try {
        console.log('🏆 Loading entries to calculate winners...');
        
        // Load all entries for this contest
        const entries = await window.smartDailyContestAPI.getDailyContestEntries(currentDailyContest.id);
        
        if (!entries || entries.length === 0) {
            alert('No entries found for this contest');
            return;
        }

        console.log(`🎯 Found ${entries.length} entries, calculating scores...`);
        
        // Calculate scores for each entry
        const entriesWithScores = entries.map(entry => {
            let score = 0;
            
            // Check each choice against correct answers
            if (entry.choices && currentDailyContest.choices) {
                currentDailyContest.choices.forEach(choice => {
                    const userChoice = entry.choices[choice.id];
                    if (userChoice === choice.correctAnswer) {
                        score++;
                    }
                });
            }
            
            return {
                ...entry,
                score: score,
                totalQuestions: currentDailyContest.choices.length
            };
        });

        // Sort by score (highest first)
        entriesWithScores.sort((a, b) => b.score - a.score);
        
        // Display results in the admin panel
        displayDailyContestResults(entriesWithScores);
        
        console.log('✅ Winners calculated and displayed');
        
    } catch (error) {
        console.error('❌ Error calculating winners:', error);
        alert('Error calculating winners: ' + error.message);
    }
}

// Display Daily Contest Results in Admin Panel
function displayDailyContestResults(entries) {
    // Find or create results container
    let container = document.getElementById('daily-entries-container');
    if (!container) {
        // Create container if it doesn't exist
        const dailySection = document.getElementById('daily-controls');
        if (dailySection) {
            container = document.createElement('div');
            container.id = 'daily-entries-container';
            container.style.marginTop = '30px';
            dailySection.appendChild(container);
        } else {
            console.error('Could not find daily controls section');
            return;
        }
    }

    if (entries.length === 0) {
        container.innerHTML = '<p style="color: #888; text-align: center;">No entries found</p>';
        return;
    }

    const totalEntries = entries.length;
    const prizePool = totalEntries * 50; // 50 NUTS per entry
    const topScore = entries[0].score;
    const winners = entries.filter(entry => entry.score === topScore);
    const prizePerWinner = Math.floor(prizePool / winners.length);

    // Update stats if elements exist
    const totalEntriesEl = document.getElementById('daily-total-entries');
    const prizePoolEl = document.getElementById('daily-prize-pool');
    const statusEl = document.getElementById('daily-contest-status');
    
    if (totalEntriesEl) totalEntriesEl.textContent = totalEntries;
    if (prizePoolEl) prizePoolEl.textContent = `${prizePool} NUTS`;
    if (statusEl) statusEl.textContent = 'Completed';

    // Display results
    container.innerHTML = `
        <div style="background: #2a2a2a; border-radius: 8px; padding: 20px; margin-top: 20px;">
            <h3 style="color: #ffa500; margin-bottom: 20px;">🏆 Daily Contest Results</h3>
            
            ${winners.length > 0 ? `
                <div style="background: linear-gradient(135deg, #4CAF50, #00ff88); color: #000; padding: 15px; border-radius: 8px; margin-bottom: 20px; text-align: center; font-weight: bold;">
                    <div style="font-size: 1.2em;">
                        ${winners.length === 1 ? 
                            `🏆 Winner: ${winners[0].userName || winners[0].userId} (${winners[0].score}/${currentDailyContest.choices.length})` :
                            `🏆 ${winners.length} Winners tied with ${topScore}/${currentDailyContest.choices.length} points`
                        }
                    </div>
                    <div style="font-size: 1.5em; margin-top: 10px;">${prizePerWinner} NUTS each</div>
                </div>
            ` : ''}
            
            <table style="width: 100%; border-collapse: collapse; background: #1a1a1a;">
                <thead>
                    <tr style="background: #333; color: #ffa500;">
                        <th style="padding: 10px; border: 1px solid #555;">Rank</th>
                        <th style="padding: 10px; border: 1px solid #555;">User</th>
                        <th style="padding: 10px; border: 1px solid #555;">Score</th>
                        <th style="padding: 10px; border: 1px solid #555;">Choices</th>
                        <th style="padding: 10px; border: 1px solid #555;">Prize</th>
                        <th style="padding: 10px; border: 1px solid #555;">Time</th>
                    </tr>
                </thead>
                <tbody>
                    ${entries.map((entry, index) => {
                        const isWinner = entry.score === topScore;
                        const prize = isWinner ? prizePerWinner : 0;
                        
                        return `
                            <tr style="background: ${isWinner ? '#2d5a2d' : '#1a1a1a'}; color: ${isWinner ? '#00ff88' : '#ccc'};">
                                <td style="padding: 10px; border: 1px solid #555; text-align: center;">
                                    ${isWinner ? '🏆' : ''} ${index + 1}
                                </td>
                                <td style="padding: 10px; border: 1px solid #555;">
                                    ${entry.userName || entry.userId || 'Anonymous'}
                                </td>
                                <td style="padding: 10px; border: 1px solid #555; text-align: center; font-weight: bold;">
                                    ${entry.score}/${currentDailyContest.choices.length}
                                </td>
                                <td style="padding: 10px; border: 1px solid #555; font-size: 0.9em;">
                                    ${currentDailyContest.choices.map(choice => {
                                        const userChoice = entry.choices?.[choice.id];
                                        const isCorrect = userChoice === choice.correctAnswer;
                                        return `<span style="color: ${isCorrect ? '#4CAF50' : '#ff4444'};">${userChoice || '?'}</span>`;
                                    }).join(' | ')}
                                </td>
                                <td style="padding: 10px; border: 1px solid #555; text-align: center; font-weight: bold;">
                                    ${prize > 0 ? `${prize} NUTS` : '-'}
                                </td>
                                <td style="padding: 10px; border: 1px solid #555; font-size: 0.85em;">
                                    ${new Date(entry.timestamp || entry.createdAt).toLocaleTimeString()}
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
    `;
}

// Helper function for status colors
function getStatusColor(status) {
    switch(status) {
        case 'draft': return '#888';
        case 'active': return '#4CAF50';
        case 'locked': return '#ff6b00';
        case 'resolved': return '#2196F3';
        default: return '#888';
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('daily-contest-date');
    if (dateInput) {
        dateInput.value = today;
    }
    
    // Load MLB by default
    switchContestType('mlb');
    
    console.log('✅ Admin portal JavaScript initialized');
});

// Debug: Check if MLB/NFL functions are properly loaded
setTimeout(() => {
    const functions = ['loadContestData', 'loadNFLContestData'];
    functions.forEach(funcName => {
        if (typeof window[funcName] === 'function') {
            console.log(`✅ ${funcName} is available`);
        } else {
            console.warn(`❌ ${funcName} is NOT available - check for JavaScript syntax errors`);
        }
    });
}, 3000);

console.log('🔧 Admin portal fix loaded');
