// Admin Contest JavaScript - Fixed Version
// This fixes the JavaScript errors in admin-contest.html

// Add this at the end of admin-contest.html to fix the broken functions
function switchContestType(type) {
    // Hide all controls
    document.getElementById('mlb-controls').style.display = 'none';
    document.getElementById('nfl-controls').style.display = 'none';
    document.getElementById('daily-controls').style.display = 'none';
    
    // Remove active class from all tabs
    document.querySelectorAll('.contest-tab').forEach(tab => {
        tab.classList.remove('active-tab');
    });
    
    // Show selected control and activate tab
    if (type === 'mlb') {
        document.getElementById('mlb-controls').style.display = 'block';
        document.getElementById('mlb-tab').classList.add('active-tab');
    } else if (type === 'nfl') {
        document.getElementById('nfl-controls').style.display = 'block';
        document.getElementById('nfl-tab').classList.add('active-tab');
    } else if (type === 'daily') {
        document.getElementById('daily-controls').style.display = 'block';
        document.getElementById('daily-tab').classList.add('active-tab');
        initializeDailyContest();
    }
}

function initializeDailyContest() {
    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('daily-contest-date').value = today;
}

function clearChoiceForm() {
    document.getElementById('option-a').value = '';
    document.getElementById('option-b').value = '';
    document.getElementById('choice-category').value = '';
    document.getElementById('choice-description').value = '';
}

function updateChoicesDisplay() {
    const container = document.getElementById('choices-container');
    
    if (!dailyChoices || dailyChoices.length === 0) {
        container.innerHTML = '<p style="color: #888; text-align: center;">No choices added yet</p>';
        return;
    }
    
    container.innerHTML = dailyChoices.map((choice, index) => `
        <div style="margin-bottom: 15px; padding: 15px; background: #1a1a1a; border-radius: 8px; border-left: 4px solid #ffa500;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <h4 style="color: #ffa500; margin: 0;">Choice ${index + 1}</h4>
                <button onclick="removeDailyChoice('${choice.id}')" style="background: #ff4444; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">Remove</button>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px;">
                <div style="padding: 10px; background: #2a2a2a; border-radius: 4px;">
                    <strong style="color: #4CAF50;">Option A:</strong> ${choice.optionA}
                </div>
                <div style="padding: 10px; background: #2a2a2a; border-radius: 4px;">
                    <strong style="color: #ff6b00;">Option B:</strong> ${choice.optionB}
                </div>
            </div>
            <div style="color: #888; font-size: 0.9em;">
                <strong>Category:</strong> ${choice.category} 
                ${choice.description ? `| <strong>Description:</strong> ${choice.description}` : ''}
            </div>
        </div>
    `).join('');
}

function updateResolutionInterface() {
    const container = document.getElementById('resolution-choices');
    
    if (!dailyChoices || dailyChoices.length === 0) {
        container.innerHTML = '<p style="color: #888;">No choices to resolve</p>';
        return;
    }
    
    container.innerHTML = dailyChoices.map(choice => `
        <div style="margin-bottom: 15px; padding: 15px; background: #1a1a1a; border-radius: 8px;">
            <h4 style="color: #ffa500; margin-bottom: 10px;">${choice.category}</h4>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px;">
                <div style="padding: 10px; background: #2a2a2a; border-radius: 4px;">
                    <strong>Option A:</strong> ${choice.optionA}
                </div>
                <div style="padding: 10px; background: #2a2a2a; border-radius: 4px;">
                    <strong>Option B:</strong> ${choice.optionB}
                </div>
            </div>
            <div style="display: flex; gap: 10px; align-items: center;">
                <span style="color: #ccc;">Correct Answer:</span>
                <button onclick="setChoiceResult('${choice.id}', 'A')" 
                        style="background: ${choice.correctAnswer === 'A' ? '#4CAF50' : '#444'}; 
                               color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">
                    Option A
                </button>
                <button onclick="setChoiceResult('${choice.id}', 'B')" 
                        style="background: ${choice.correctAnswer === 'B' ? '#4CAF50' : '#444'}; 
                               color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">
                    Option B
                </button>
            </div>
        </div>
    `).join('');
    
    // Add resolve contest button at the bottom
    const allResolved = dailyChoices.every(c => c.correctAnswer);
    container.innerHTML += `
        <div style="text-align: center; margin-top: 20px;">
            <button onclick="resolveDailyContest()" 
                    style="background: ${allResolved ? '#4CAF50' : '#666'}; 
                           color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 1.1em;"
                    ${allResolved ? '' : 'disabled'}>
                🏆 Calculate Winners & Complete Contest
            </button>
        </div>
    `;
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Set default to MLB tab
    switchContestType('mlb');
});

console.log('✅ Admin contest functions loaded and fixed');
