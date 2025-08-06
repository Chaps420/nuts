// Simplified contest completion flow

window.simplifyContestCompletion = function() {
    console.log('🏁 Adding simplified contest completion...');
    
    // Add a single "Complete Contest" button that does everything
    const resolveBtn = document.getElementById('resolve-contest-btn');
    if (!resolveBtn) return;
    
    // Check if button already exists
    if (document.getElementById('complete-contest-btn')) return;
    
    // Create simplified complete button
    const completeBtn = document.createElement('button');
    completeBtn.id = 'complete-contest-btn';
    completeBtn.className = 'btn btn-success';
    completeBtn.innerHTML = '🏁 Complete Contest & Calculate Winners';
    completeBtn.style.cssText = `
        margin-left: 10px;
        background: linear-gradient(45deg, #4CAF50, #45a049);
        border: none;
        padding: 10px 20px;
        font-weight: bold;
        border-radius: 5px;
        color: white;
        cursor: pointer;
        transition: all 0.3s ease;
    `;
    
    completeBtn.onmouseover = function() {
        this.style.transform = 'translateY(-2px)';
        this.style.boxShadow = '0 4px 8px rgba(76, 175, 80, 0.3)';
    };
    
    completeBtn.onmouseout = function() {
        this.style.transform = 'translateY(0)';
        this.style.boxShadow = 'none';
    };
    
    completeBtn.onclick = async function() {
        const contest = window.currentDailyContest;
        if (!contest) {
            alert('No contest loaded');
            return;
        }
        
        if (!contest.locked) {
            alert('Contest must be locked first!');
            return;
        }
        
        if (contest.resolved) {
            alert('Contest already completed!');
            return;
        }
        
        // Check if all choices have correct answers selected
        const choices = contest.choices || [];
        let allAnswered = true;
        
        choices.forEach((choice, index) => {
            const select = document.querySelector(`select[data-choice-index="${index}"]`);
            if (!select || !select.value) {
                allAnswered = false;
            }
        });
        
        if (!allAnswered) {
            alert('Please select the correct answer (A or B) for each choice first!');
            return;
        }
        
        if (!confirm('Complete this contest and calculate winners? This cannot be undone.')) {
            return;
        }
        
        try {
            // Step 1: Resolve contest (set correct answers)
            completeBtn.disabled = true;
            completeBtn.innerHTML = '⏳ Setting correct answers...';
            
            // Call the resolve function if it exists
            let resolveResult = false;
            if (window.resolveDailyContest) {
                resolveResult = await window.resolveDailyContest();
            } else {
                // Fallback: trigger the resolve button click
                const resolveButton = document.getElementById('resolve-contest-btn');
                if (resolveButton && !resolveButton.disabled) {
                    resolveButton.click();
                    // Wait a bit for the resolve to complete
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    resolveResult = true;
                }
            }
            
            if (!resolveResult) {
                throw new Error('Failed to resolve contest');
            }
            
            // Step 2: Calculate winners automatically
            completeBtn.innerHTML = '⏳ Calculating winners...';
            
            setTimeout(async () => {
                try {
                    if (window.calculateWinners) {
                        await window.calculateWinners();
                    } else {
                        // Fallback: trigger the calculate button click
                        const calcButton = document.querySelector('button[onclick="calculateWinners()"]');
                        if (calcButton) {
                            calcButton.click();
                        }
                    }
                    
                    completeBtn.innerHTML = '✅ Contest Completed!';
                    completeBtn.style.background = '#4CAF50';
                    
                    // Show success message
                    alert('Contest completed successfully! Winners have been calculated.');
                    
                    // Refresh the display
                    if (window.loadDailyContestData) {
                        await window.loadDailyContestData();
                    }
                } catch (error) {
                    console.error('Error calculating winners:', error);
                    alert('Contest resolved but error calculating winners. Please click "Calculate Winners" manually.');
                }
            }, 1000);
            
        } catch (error) {
            console.error('Error completing contest:', error);
            alert('Error completing contest: ' + error.message);
            completeBtn.disabled = false;
            completeBtn.innerHTML = '🏁 Complete Contest & Calculate Winners';
        }
    };
    
    // Add after resolve button
    resolveBtn.parentNode.insertBefore(completeBtn, resolveBtn.nextSibling);
    
    // Hide the separate calculate winners button if contest is not resolved
    const calcBtn = document.querySelector('button[onclick="calculateWinners()"]');
    if (calcBtn) {
        const updateCalcBtnVisibility = () => {
            const contest = window.currentDailyContest;
            if (contest && contest.resolved) {
                calcBtn.style.display = 'inline-block';
                completeBtn.style.display = 'none';
            } else {
                calcBtn.style.display = 'none';
                if (contest && contest.locked) {
                    completeBtn.style.display = 'inline-block';
                } else {
                    completeBtn.style.display = 'none';
                }
            }
        };
        
        // Update visibility on contest change
        const originalUpdateUI = window.updateDailyContestUI;
        if (originalUpdateUI) {
            window.updateDailyContestUI = function(contest) {
                originalUpdateUI(contest);
                updateCalcBtnVisibility();
            };
        }
        
        updateCalcBtnVisibility();
    }
};

// Initialize when ready
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('admin-contest.html')) {
        setTimeout(simplifyContestCompletion, 1500);
    }
});
