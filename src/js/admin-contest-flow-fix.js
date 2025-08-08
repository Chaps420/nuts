// Improved Daily Contest admin flow with clear instructions

window.initDailyContestFlow = function() {
    console.log('📋 Initializing Daily Contest workflow...');
    
    // Add workflow instructions to the Daily Contest section
    const dailySection = document.getElementById('daily-contest-section');
    if (!dailySection) return;
    
    // Find where to insert the instructions (after the date selector)
    const dateSelector = dailySection.querySelector('.contest-date-selector') || 
                        dailySection.querySelector('#daily-contest-date')?.parentNode;
    if (!dateSelector) return;
    
    // Create instructions panel
    const instructionsHTML = `
        <div class="admin-instructions" style="
            background: #1a1a1a;
            border: 1px solid #333;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            font-size: 14px;
        ">
            <h4 style="color: #4CAF50; margin-bottom: 15px;">📋 Daily Contest Workflow</h4>
            
            <div class="workflow-steps" style="display: grid; gap: 10px;">
                <div class="workflow-step" style="display: flex; align-items: center; gap: 10px;">
                    <span style="background: #4CAF50; color: white; padding: 2px 8px; border-radius: 4px; font-weight: bold;">1</span>
                    <span><b>Create Contest:</b> Add choices (A vs B options) and click "Start New Contest"</span>
                </div>
                
                <div class="workflow-step" style="display: flex; align-items: center; gap: 10px;">
                    <span style="background: #2196F3; color: white; padding: 2px 8px; border-radius: 4px; font-weight: bold;">2</span>
                    <span><b>Publish:</b> Click "Publish to Website" to make it live for users</span>
                </div>
                
                <div class="workflow-step" style="display: flex; align-items: center; gap: 10px;">
                    <span style="background: #FF9800; color: white; padding: 2px 8px; border-radius: 4px; font-weight: bold;">3</span>
                    <span><b>Lock Contest:</b> When contest starts, click "Lock Contest" to stop new entries</span>
                </div>
                
                <div class="workflow-step" style="display: flex; align-items: center; gap: 10px;">
                    <span style="background: #9C27B0; color: white; padding: 2px 8px; border-radius: 4px; font-weight: bold;">4</span>
                    <span><b>Set Winners:</b> Select correct answer (A or B) for each choice and click "Resolve Contest"</span>
                </div>
                
                <div class="workflow-step" style="display: flex; align-items: center; gap: 10px;">
                    <span style="background: #F44336; color: white; padding: 2px 8px; border-radius: 4px; font-weight: bold;">5</span>
                    <span><b>Calculate Winners:</b> Click "Calculate Winners" to see results and prize distribution</span>
                </div>
            </div>
            
            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #333;">
                <p style="color: #888; margin: 0;">💡 <b>Tip:</b> You can view entries at any time by clicking "Load Contest Entries" below</p>
            </div>
        </div>
    `;
    
    // Insert after date selector
    dateSelector.insertAdjacentHTML('afterend', instructionsHTML);
    
    // Improve button labels and add status indicators
    improveButtonLabels();
    addStatusIndicators();
};

function improveButtonLabels() {
    console.log('🏷️ Improving button labels...');
    
    // Update confusing button labels
    const buttons = {
        'publish-contest-btn': '📤 Publish to Website',
        'lock-contest-btn': '🔒 Lock Contest (Stop Entries)',
        'resolve-contest-btn': '✅ Set Correct Answers',
        'calculate-winners-btn': '🏆 Calculate Winners & Prizes'
    };
    
    Object.entries(buttons).forEach(([id, label]) => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.innerHTML = label;
            btn.style.minWidth = '200px';
        }
    });
}

function addStatusIndicators() {
    console.log('📊 Adding status indicators...');
    
    // Add visual status indicators
    const contestHeader = document.querySelector('#daily-contest-section h3') || 
                         document.querySelector('#daily-contest-section .section-title');
    if (!contestHeader) return;
    
    // Create status badge
    const statusBadge = document.createElement('div');
    statusBadge.id = 'contest-status-badge';
    statusBadge.className = 'status-badge';
    statusBadge.style.cssText = `
        display: inline-block;
        padding: 5px 15px;
        border-radius: 20px;
        font-weight: bold;
        margin-left: 10px;
        font-size: 12px;
    `;
    
    // Insert after header
    contestHeader.appendChild(statusBadge);
    
    // Update status badge based on contest state
    const updateStatusBadge = () => {
        const contest = window.currentDailyContest;
        if (!contest) {
            statusBadge.textContent = '⚪ No Contest';
            statusBadge.style.background = '#666';
            statusBadge.style.color = 'white';
            return;
        }
        
        if (contest.resolved) {
            statusBadge.textContent = '🏆 Completed';
            statusBadge.style.background = '#4CAF50';
            statusBadge.style.color = 'white';
        } else if (contest.locked) {
            statusBadge.textContent = '🔒 Locked';
            statusBadge.style.background = '#FF9800';
            statusBadge.style.color = '#333';
        } else if (contest.active) {
            statusBadge.textContent = '🟢 Live';
            statusBadge.style.background = '#2196F3';
            statusBadge.style.color = 'white';
        } else {
            statusBadge.textContent = '📝 Draft';
            statusBadge.style.background = '#9C27B0';
            statusBadge.style.color = 'white';
        }
    };
    
    // Update on page load
    updateStatusBadge();
    
    // Update on any contest change
    const originalUpdateUI = window.updateDailyContestUI;
    if (originalUpdateUI) {
        window.updateDailyContestUI = function(contest) {
            originalUpdateUI(contest);
            updateStatusBadge();
        };
    }
}

// Initialize when admin portal loads
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('admin-contest.html')) {
        setTimeout(initDailyContestFlow, 1000);
    }
});
