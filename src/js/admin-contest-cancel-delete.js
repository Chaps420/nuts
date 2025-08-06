// Contest cancellation and deletion functionality

window.addContestCancelDelete = function() {
    console.log('🗑️ Adding cancel/delete functionality...');
    
    // Add cancel and delete buttons
    const addCancelDeleteButtons = () => {
        // Check if buttons already exist
        if (document.getElementById('cancel-contest-btn')) return;
        
        const buttonContainer = document.querySelector('.admin-actions') ||
                              document.querySelector('.contest-actions') ||
                              document.querySelector('#contest-actions') ||
                              createButtonContainer();
        
        // Cancel Contest Button
        const cancelBtn = document.createElement('button');
        cancelBtn.id = 'cancel-contest-btn';
        cancelBtn.className = 'btn btn-warning';
        cancelBtn.innerHTML = '⚠️ Cancel Contest';
        cancelBtn.style.cssText = `
            background: linear-gradient(45deg, #ff9800, #f57c00);
            border: none;
            color: white;
            padding: 10px 15px;
            margin: 5px;
            border-radius: 5px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s ease;
        `;
        
        cancelBtn.onclick = cancelContest;
        
        // Delete Contest Button
        const deleteBtn = document.createElement('button');
        deleteBtn.id = 'delete-contest-btn';
        deleteBtn.className = 'btn btn-danger';
        deleteBtn.innerHTML = '🗑️ Delete Contest';
        deleteBtn.style.cssText = `
            background: linear-gradient(45deg, #f44336, #d32f2f);
            border: none;
            color: white;
            padding: 10px 15px;
            margin: 5px;
            border-radius: 5px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s ease;
        `;
        
        deleteBtn.onclick = deleteContest;
        
        // Add hover effects
        [cancelBtn, deleteBtn].forEach(btn => {
            btn.onmouseover = function() {
                this.style.transform = 'translateY(-2px)';
                this.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
            };
            
            btn.onmouseout = function() {
                this.style.transform = 'translateY(0)';
                this.style.boxShadow = 'none';
            };
        });
        
        buttonContainer.appendChild(cancelBtn);
        buttonContainer.appendChild(deleteBtn);
        
        // Update button visibility based on contest state
        updateButtonVisibility();
    };
    
    const createButtonContainer = () => {
        const container = document.createElement('div');
        container.className = 'contest-actions';
        container.style.cssText = `
            margin: 20px 0;
            padding: 15px;
            border-top: 2px solid #eee;
            background: #f9f9f9;
            border-radius: 8px;
        `;
        
        const title = document.createElement('h4');
        title.textContent = 'Contest Management';
        title.style.margin = '0 0 10px 0';
        container.appendChild(title);
        
        // Insert before the load contest section or at end of main content
        const loadSection = document.querySelector('.load-contest') ||
                           document.querySelector('#load-contest') ||
                           document.querySelector('main');
        
        if (loadSection) {
            loadSection.parentNode.insertBefore(container, loadSection);
        } else {
            document.body.appendChild(container);
        }
        
        return container;
    };
    
    const updateButtonVisibility = () => {
        const contest = window.currentDailyContest;
        const cancelBtn = document.getElementById('cancel-contest-btn');
        const deleteBtn = document.getElementById('delete-contest-btn');
        
        if (!cancelBtn || !deleteBtn || !contest) return;
        
        // Cancel button: available for published but not locked contests
        if (contest.published && !contest.locked && !contest.resolved && contest.status !== 'cancelled') {
            cancelBtn.style.display = 'inline-block';
            cancelBtn.disabled = false;
        } else {
            cancelBtn.style.display = 'none';
        }
        
        // Delete button: available for draft or cancelled contests only
        if (!contest.published || contest.status === 'cancelled' || contest.status === 'draft') {
            deleteBtn.style.display = 'inline-block';
            deleteBtn.disabled = false;
        } else {
            deleteBtn.style.display = 'none';
        }
    };
    
    const cancelContest = async () => {
        const contest = window.currentDailyContest;
        if (!contest) {
            alert('No contest loaded');
            return;
        }
        
        if (contest.locked) {
            alert('Cannot cancel a locked contest');
            return;
        }
        
        if (contest.resolved) {
            alert('Cannot cancel a resolved contest');
            return;
        }
        
        if (contest.status === 'cancelled') {
            alert('Contest is already cancelled');
            return;
        }
        
        const confirmMessage = `Are you sure you want to cancel "${contest.title}"?\n\n` +
                             `This will:\n` +
                             `• Refund all participants\n` +
                             `• Mark the contest as cancelled\n` +
                             `• Prevent new entries\n\n` +
                             `This action cannot be undone.`;
        
        if (!confirm(confirmMessage)) return;
        
        try {
            const cancelBtn = document.getElementById('cancel-contest-btn');
            cancelBtn.disabled = true;
            cancelBtn.innerHTML = '⏳ Cancelling...';
            
            // Call Firebase function to cancel contest
            const cancelContestFunction = firebase.functions().httpsCallable('cancelDailyContest');
            const result = await cancelContestFunction({ contestId: contest.id });
            
            if (result.data.success) {
                alert('Contest cancelled successfully! All participants have been refunded.');
                
                // Update local contest data
                contest.status = 'cancelled';
                contest.cancelled = true;
                window.currentDailyContest = contest;
                
                // Refresh UI
                if (window.updateDailyContestUI) {
                    window.updateDailyContestUI(contest);
                }
                
                updateButtonVisibility();
            } else {
                throw new Error(result.data.error || 'Failed to cancel contest');
            }
            
        } catch (error) {
            console.error('Error cancelling contest:', error);
            alert('Error cancelling contest: ' + error.message);
            
            const cancelBtn = document.getElementById('cancel-contest-btn');
            cancelBtn.disabled = false;
            cancelBtn.innerHTML = '⚠️ Cancel Contest';
        }
    };
    
    const deleteContest = async () => {
        const contest = window.currentDailyContest;
        if (!contest) {
            alert('No contest loaded');
            return;
        }
        
        if (contest.published && contest.status !== 'cancelled' && contest.status !== 'draft') {
            alert('Cannot delete a published contest that is not cancelled');
            return;
        }
        
        const confirmMessage = `⚠️ PERMANENT DELETION ⚠️\n\n` +
                             `Are you sure you want to DELETE "${contest.title}"?\n\n` +
                             `This will:\n` +
                             `• Permanently remove all contest data\n` +
                             `• Delete all participant entries\n` +
                             `• Remove from all systems\n\n` +
                             `THIS CANNOT BE UNDONE!\n\n` +
                             `Type "DELETE" to confirm:`;
        
        const confirmation = prompt(confirmMessage);
        if (confirmation !== 'DELETE') {
            alert('Deletion cancelled');
            return;
        }
        
        try {
            const deleteBtn = document.getElementById('delete-contest-btn');
            deleteBtn.disabled = true;
            deleteBtn.innerHTML = '⏳ Deleting...';
            
            // Call Firebase function to delete contest
            const deleteContestFunction = firebase.functions().httpsCallable('deleteDailyContest');
            const result = await deleteContestFunction({ contestId: contest.id });
            
            if (result.data.success) {
                alert('Contest deleted permanently!');
                
                // Clear current contest
                window.currentDailyContest = null;
                
                // Clear the UI
                clearContestUI();
                
                // Hide buttons
                document.getElementById('cancel-contest-btn').style.display = 'none';
                document.getElementById('delete-contest-btn').style.display = 'none';
                
            } else {
                throw new Error(result.data.error || 'Failed to delete contest');
            }
            
        } catch (error) {
            console.error('Error deleting contest:', error);
            alert('Error deleting contest: ' + error.message);
            
            const deleteBtn = document.getElementById('delete-contest-btn');
            deleteBtn.disabled = false;
            deleteBtn.innerHTML = '🗑️ Delete Contest';
        }
    };
    
    const clearContestUI = () => {
        // Clear form fields
        const fields = ['contest-title', 'contest-date', 'participant-limit', 'entry-fee', 'prize-pool'];
        fields.forEach(id => {
            const field = document.getElementById(id);
            if (field) field.value = '';
        });
        
        // Clear choices display
        const choicesContainer = document.getElementById('choices-container');
        if (choicesContainer) {
            choicesContainer.innerHTML = '';
        }
        
        // Clear status displays
        const statusElements = document.querySelectorAll('.contest-status, .participant-count');
        statusElements.forEach(el => el.textContent = '');
        
        // Show success message
        const successDiv = document.createElement('div');
        successDiv.style.cssText = `
            background: #4CAF50;
            color: white;
            padding: 15px;
            margin: 20px 0;
            border-radius: 5px;
            text-align: center;
            font-weight: bold;
        `;
        successDiv.innerHTML = '✅ Contest deleted successfully';
        
        const container = document.querySelector('.contest-details') || document.querySelector('main');
        container.insertBefore(successDiv, container.firstChild);
        
        setTimeout(() => successDiv.remove(), 5000);
    };
    
    // Hook into UI updates
    const originalUpdateUI = window.updateDailyContestUI;
    if (originalUpdateUI) {
        window.updateDailyContestUI = function(contest) {
            originalUpdateUI(contest);
            setTimeout(updateButtonVisibility, 100);
        };
    }
    
    // Initialize buttons
    setTimeout(addCancelDeleteButtons, 1000);
};

// Initialize when ready
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('admin-contest.html')) {
        setTimeout(addContestCancelDelete, 1500);
    }
});
