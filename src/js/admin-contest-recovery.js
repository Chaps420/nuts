// Recovery file for MLB/NFL admin contest functions
// This restores loadContestData and loadNFLContestData for admin-contest.html

window.loadContestData = async function() {
    console.log('⚾ Loading MLB contest data...');
    const dateElement = document.getElementById('contest-date');
    if (!dateElement || !dateElement.value) {
        alert('Please select a date');
        return;
    }
    const selectedDate = dateElement.value;
    console.log('📊 Loading MLB data for date:', selectedDate);
    try {
        // Use the global backend variable from admin-contest.html
        if (!window.backend) {
            throw new Error('Backend not initialized');
        }
        const response = await window.backend.getContestResults(selectedDate, 'mlb');
        displayMLBEntries(response);
    } catch (error) {
        console.error('Error loading MLB data:', error);
        alert('Error loading MLB contest data');
    }
};

window.loadNFLContestData = async function() {
    console.log('🏈 Loading NFL contest data...');
    const weekElement = document.getElementById('nfl-week-selector');
    if (!weekElement || !weekElement.value) {
        alert('Please select an NFL week');
        return;
    }
    const selectedWeek = weekElement.value;
    console.log('📊 Loading NFL data for week:', selectedWeek);
    try {
        // Use the global backend variable from admin-contest.html
        if (!window.backend) {
            throw new Error('Backend not initialized');
        }
        const response = await window.backend.getContestResults(selectedWeek, 'nfl');
        displayNFLEntries(response);
    } catch (error) {
        console.error('Error loading NFL data:', error);
        alert('Error loading NFL contest data');
    }
};

function displayMLBEntries(entries) {
    const tbody = document.getElementById('entries-tbody');
    if (!tbody) return;
    tbody.innerHTML = entries.map(entry => {
        // Simplify the picks display for MLB
        let picksDisplay = '-';
        if (entry.picks && typeof entry.picks === 'object') {
            const picksList = Object.entries(entry.picks).map(([game, pick]) => 
                `${game}: ${pick}`
            );
            picksDisplay = picksList.join(', ');
        }
        
        return `
            <tr>
                <td>${entry.id}</td>
                <td>${entry.userName || entry.user || 'Anonymous'}</td>
                <td>${entry.twitterHandle || entry.twitter || '-'}</td>
                <td>${entry.walletAddress || entry.wallet || '-'}</td>
                <td>${picksDisplay}</td>
                <td>${entry.tiebreakerRuns || entry.tiebreaker || '-'}</td>
                <td>${entry.score || '-'}</td>
                <td>${entry.prizeWon || entry.prize || '-'}</td>
                <td>${entry.status || 'pending'}</td>
                <td>${new Date(entry.timestamp || entry.createdAt).toLocaleString()}</td>
            </tr>
        `;
    }).join('');
}

function displayNFLEntries(entries) {
    const tbody = document.getElementById('entries-tbody');
    if (!tbody) return;
    tbody.innerHTML = entries.map(entry => {
        // Simplify the picks display for NFL
        let picksDisplay = '-';
        if (entry.picks && typeof entry.picks === 'object') {
            const picksList = Object.entries(entry.picks).map(([game, pick]) => 
                `${game}: ${pick}`
            );
            picksDisplay = picksList.join(', ');
        }
        
        return `
            <tr>
                <td>${entry.id}</td>
                <td>${entry.userName || entry.user || 'Anonymous'}</td>
                <td>${entry.twitterHandle || entry.twitter || '-'}</td>
                <td>${entry.walletAddress || entry.wallet || '-'}</td>
                <td>${picksDisplay}</td>
                <td>${entry.tiebreakerPoints || entry.tiebreaker || '-'}</td>
                <td>${entry.score || '-'}</td>
                <td>${entry.prizeWon || entry.prize || '-'}</td>
                <td>${entry.status || 'pending'}</td>
                <td>${new Date(entry.timestamp || entry.createdAt).toLocaleString()}</td>
            </tr>
        `;
    }).join('');
}

// Add Daily Contest entry loading function
window.loadDailyContestEntries = async function() {
    console.log('🎯 Loading Daily Contest entries...');
    
    // Get currentDailyContest from global scope (defined in admin-contest.html)
    const dailyContest = window.currentDailyContest || currentDailyContest;
    
    if (!dailyContest || !dailyContest.id) {
        alert('Please load a Daily Contest first');
        return;
    }
    
    try {
        console.log('📊 Loading entries for Daily Contest:', dailyContest.id);
        console.log('📅 Contest date:', dailyContest.contestDate);
        
        // Use the daily contest API to get entries - NOT the backend
        if (!window.smartDailyContestAPI) {
            throw new Error('Daily Contest API not available');
        }
        
        const entries = await window.smartDailyContestAPI.getDailyContestEntries(dailyContest.id);
        
        if (!entries || entries.length === 0) {
            console.log('ℹ️ No entries found for this Daily Contest');
            displayDailyContestEntries([]);
            alert('No entries found for this Daily Contest');
            return;
        }
        
        console.log('✅ Found Daily Contest entries:', entries.length);
        displayDailyContestEntries(entries);
        
    } catch (error) {
        console.error('Error loading Daily Contest entries:', error);
        alert('Error loading Daily Contest entries: ' + error.message);
    }
};

function displayDailyContestEntries(entries) {
    const tbody = document.getElementById('entries-tbody');
    if (!tbody) return;
    
    tbody.innerHTML = entries.map(entry => {
        // Simplify the picks display
        let picksDisplay = '-';
        if (entry.choices && Array.isArray(entry.choices)) {
            picksDisplay = entry.choices.map((choice, index) => 
                `Choice ${index + 1}: ${choice.pickedOption}`
            ).join(', ');
        } else if (entry.picks) {
            picksDisplay = JSON.stringify(entry.picks);
        }
        
        return `
            <tr>
                <td>${entry.id}</td>
                <td>${entry.user || 'Anonymous'}</td>
                <td>${entry.twitter || '-'}</td>
                <td>${entry.walletAddress || entry.wallet || '-'}</td>
                <td>${picksDisplay}</td>
                <td>-</td>
                <td>${entry.score || '-'}</td>
                <td>${entry.prize || '-'}</td>
                <td>${entry.status || 'pending'}</td>
                <td>${new Date(entry.timestamp).toLocaleString()}</td>
            </tr>
        `;
    }).join('');
}
