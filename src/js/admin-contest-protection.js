// Admin contest state protection and validation

window.protectPublishedContests = function() {
    console.log('🔒 Adding contest protection system...');
    
    // Monitor for UI updates and apply protection
    const applyProtection = () => {
        const contest = window.currentDailyContest;
        if (!contest) return;
        
        const isEditable = contest.status === 'draft' || !contest.published;
        console.log('Contest protection check:', { 
            status: contest.status, 
            published: contest.published, 
            editable: isEditable 
        });
        
        // Protect form fields
        const formElements = [
            'contest-title',
            'contest-date',
            'participant-limit',
            'entry-fee',
            'prize-pool'
        ];
        
        formElements.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.disabled = !isEditable;
                if (!isEditable) {
                    element.style.backgroundColor = '#f5f5f5';
                    element.style.cursor = 'not-allowed';
                } else {
                    element.style.backgroundColor = '';
                    element.style.cursor = '';
                }
            }
        });
        
        // Protect choice editing
        const choiceInputs = document.querySelectorAll('input[placeholder*="choice"], textarea[placeholder*="choice"]');
        choiceInputs.forEach(input => {
            input.disabled = !isEditable;
            if (!isEditable) {
                input.style.backgroundColor = '#f5f5f5';
                input.style.cursor = 'not-allowed';
            } else {
                input.style.backgroundColor = '';
                input.style.cursor = '';
            }
        });
        
        // Protect buttons
        const protectedButtons = [
            'publish-contest-btn',
            'save-contest-btn'
        ];
        
        protectedButtons.forEach(id => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.disabled = !isEditable;
                if (!isEditable) {
                    btn.style.opacity = '0.5';
                    btn.style.cursor = 'not-allowed';
                    btn.title = 'Cannot edit published contest';
                } else {
                    btn.style.opacity = '';
                    btn.style.cursor = '';
                    btn.title = '';
                }
            }
        });
        
        // Add protection warning
        addProtectionWarning(isEditable, contest);
    };
    
    // Add visual warning for protected contests
    const addProtectionWarning = (isEditable, contest) => {
        let warning = document.getElementById('contest-protection-warning');
        
        if (!isEditable && !warning) {
            warning = document.createElement('div');
            warning.id = 'contest-protection-warning';
            warning.style.cssText = `
                background: linear-gradient(45deg, #ff6b6b, #ee5a52);
                color: white;
                padding: 15px;
                margin: 10px 0;
                border-radius: 8px;
                border-left: 5px solid #ff4757;
                font-weight: bold;
                animation: slideIn 0.3s ease;
            `;
            
            warning.innerHTML = `
                <div style="display: flex; align-items: center;">
                    <span style="font-size: 20px; margin-right: 10px;">🔒</span>
                    <div>
                        <div style="font-size: 16px;">Contest is Protected</div>
                        <div style="font-size: 14px; opacity: 0.9; margin-top: 5px;">
                            Published contests cannot be edited. Status: ${contest.status || 'published'}
                        </div>
                    </div>
                </div>
            `;
            
            // Insert at top of contest details
            const detailsContainer = document.querySelector('.contest-details') || 
                                   document.querySelector('#contest-details') ||
                                   document.querySelector('main') ||
                                   document.body;
            
            detailsContainer.insertBefore(warning, detailsContainer.firstChild);
            
        } else if (isEditable && warning) {
            warning.remove();
        }
    };
    
    // Override save function to prevent editing
    const originalSave = window.saveDailyContest;
    if (originalSave) {
        window.saveDailyContest = function() {
            const contest = window.currentDailyContest;
            if (contest && contest.published && contest.status !== 'draft') {
                alert('Cannot save changes to a published contest!');
                return;
            }
            return originalSave.apply(this, arguments);
        };
    }
    
    // Override publish function to add confirmation
    const originalPublish = window.publishDailyContest;
    if (originalPublish) {
        window.publishDailyContest = function() {
            if (!confirm('Publishing will lock this contest from further editing. Continue?')) {
                return;
            }
            return originalPublish.apply(this, arguments);
        };
    }
    
    // Hook into UI updates
    const originalUpdateUI = window.updateDailyContestUI;
    if (originalUpdateUI) {
        window.updateDailyContestUI = function(contest) {
            originalUpdateUI(contest);
            setTimeout(applyProtection, 100);
        };
    }
    
    // Apply protection on load
    setTimeout(applyProtection, 1000);
    
    // Reapply every few seconds to catch any missed updates
    setInterval(applyProtection, 3000);
};

// CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateY(-20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
    }
    
    .protected-field {
        background-color: #f5f5f5 !important;
        cursor: not-allowed !important;
        opacity: 0.7;
    }
    
    .protection-tooltip {
        position: relative;
    }
    
    .protection-tooltip:hover::after {
        content: "This contest is published and cannot be edited";
        position: absolute;
        bottom: 100%;
        left: 50%;
        transform: translateX(-50%);
        background: #333;
        color: white;
        padding: 5px 10px;
        border-radius: 4px;
        white-space: nowrap;
        z-index: 1000;
        font-size: 12px;
    }
`;
document.head.appendChild(style);

// Initialize when ready
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('admin-contest.html')) {
        setTimeout(protectPublishedContests, 1000);
    }
});
