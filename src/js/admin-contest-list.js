// Admin Daily Contest List Management

window.AdminContestList = {
    contests: [],
    currentPage: 1,
    contestsPerPage: 10,
    
    async init() {
        console.log('🏆 Initializing Admin Contest List...');
        this.createContestListUI();
        await this.loadAllContests();
    },
    
    createContestListUI() {
        // Check if UI already exists
        if (document.getElementById('admin-contest-list')) return;
        
        const container = document.querySelector('.admin-container') || 
                         document.querySelector('main') || 
                         document.body;
        
        const listHTML = `
            <div id="admin-contest-list" style="margin: 30px 0;">
                <div class="contest-list-header" style="
                    background: linear-gradient(135deg, #1a1a1a, #2d2d2d);
                    padding: 20px;
                    border-radius: 12px;
                    margin-bottom: 20px;
                    border: 1px solid #333;
                ">
                    <h2 style="color: #4CAF50; margin: 0 0 10px 0; font-size: 24px;">
                        📊 Daily Contest Management
                    </h2>
                    <p style="color: #ccc; margin: 0;">
                        Manage all daily contests from creation to winner payouts
                    </p>
                    
                    <div class="list-controls" style="margin-top: 15px; display: flex; gap: 15px; align-items: center; flex-wrap: wrap;">
                        <button id="refresh-contests" class="btn btn-primary" style="
                            background: #4CAF50;
                            border: none;
                            padding: 8px 16px;
                            border-radius: 6px;
                            color: white;
                            cursor: pointer;
                        ">🔄 Refresh</button>
                        
                        <select id="contest-filter" style="
                            background: #333;
                            color: white;
                            border: 1px solid #555;
                            padding: 8px 12px;
                            border-radius: 6px;
                        ">
                            <option value="all">All Contests</option>
                            <option value="draft">Draft</option>
                            <option value="published">Published</option>
                            <option value="locked">Locked</option>
                            <option value="resolved">Resolved</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                        
                        <div id="contest-stats" style="color: #ccc; font-size: 14px;">
                            Loading...
                        </div>
                    </div>
                </div>
                
                <div id="contests-table-container" style="
                    background: #1a1a1a;
                    border-radius: 12px;
                    padding: 20px;
                    border: 1px solid #333;
                    overflow-x: auto;
                ">
                    <div id="contests-loading" style="
                        text-align: center;
                        padding: 40px;
                        color: #ccc;
                    ">
                        <div style="font-size: 20px; margin-bottom: 10px;">⏳</div>
                        Loading contests...
                    </div>
                    
                    <table id="contests-table" style="
                        width: 100%;
                        border-collapse: collapse;
                        color: white;
                        display: none;
                    ">
                        <thead>
                            <tr style="border-bottom: 2px solid #333;">
                                <th style="padding: 12px; text-align: left; color: #4CAF50;">Contest</th>
                                <th style="padding: 12px; text-align: center; color: #4CAF50;">Date</th>
                                <th style="padding: 12px; text-align: center; color: #4CAF50;">Status</th>
                                <th style="padding: 12px; text-align: center; color: #4CAF50;">Participants</th>
                                <th style="padding: 12px; text-align: center; color: #4CAF50;">Prize Pool</th>
                                <th style="padding: 12px; text-align: center; color: #4CAF50;">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="contests-tbody">
                        </tbody>
                    </table>
                    
                    <div id="pagination" style="
                        margin-top: 20px;
                        text-align: center;
                        display: none;
                    ">
                        <button id="prev-page" class="btn btn-secondary" style="margin: 0 5px;">← Previous</button>
                        <span id="page-info" style="color: #ccc; margin: 0 15px;"></span>
                        <button id="next-page" class="btn btn-secondary" style="margin: 0 5px;">Next →</button>
                    </div>
                </div>
            </div>
        `;
        
        container.insertAdjacentHTML('beforeend', listHTML);
        this.attachEventListeners();
    },
    
    attachEventListeners() {
        // Refresh button
        document.getElementById('refresh-contests').onclick = () => {
            this.loadAllContests();
        };
        
        // Filter dropdown
        document.getElementById('contest-filter').onchange = (e) => {
            this.filterContests(e.target.value);
        };
        
        // Pagination
        document.getElementById('prev-page').onclick = () => {
            if (this.currentPage > 1) {
                this.currentPage--;
                this.renderContests();
            }
        };
        
        document.getElementById('next-page').onclick = () => {
            const totalPages = Math.ceil(this.contests.length / this.contestsPerPage);
            if (this.currentPage < totalPages) {
                this.currentPage++;
                this.renderContests();
            }
        };
    },
    
    async loadAllContests() {
        try {
            document.getElementById('contests-loading').style.display = 'block';
            document.getElementById('contests-table').style.display = 'none';
            
            console.log('📊 Loading all daily contests...');
            
            // Load contests from Firestore
            const db = firebase.firestore();
            const contestsRef = db.collection('dailyContests');
            const snapshot = await contestsRef.orderBy('contestDate', 'desc').get();
            
            this.contests = [];
            snapshot.forEach(doc => {
                const contest = { id: doc.id, ...doc.data() };
                this.contests.push(contest);
            });
            
            console.log(`📊 Loaded ${this.contests.length} contests`);
            
            // Update stats
            this.updateStats();
            
            // Show table and render contests
            document.getElementById('contests-loading').style.display = 'none';
            document.getElementById('contests-table').style.display = 'table';
            document.getElementById('pagination').style.display = 'block';
            
            this.renderContests();
            
        } catch (error) {
            console.error('Error loading contests:', error);
            document.getElementById('contests-loading').innerHTML = `
                <div style="color: #ff6b6b;">
                    <div style="font-size: 20px; margin-bottom: 10px;">❌</div>
                    Error loading contests: ${error.message}
                </div>
            `;
        }
    },
    
    updateStats() {
        const stats = {
            total: this.contests.length,
            draft: this.contests.filter(c => c.status === 'draft').length,
            published: this.contests.filter(c => c.published && !c.locked).length,
            locked: this.contests.filter(c => c.locked && !c.resolved).length,
            resolved: this.contests.filter(c => c.resolved).length,
            cancelled: this.contests.filter(c => c.status === 'cancelled').length
        };
        
        document.getElementById('contest-stats').innerHTML = `
            📊 Total: ${stats.total} | 
            📝 Draft: ${stats.draft} | 
            🟢 Published: ${stats.published} | 
            🔒 Locked: ${stats.locked} | 
            ✅ Resolved: ${stats.resolved} | 
            ❌ Cancelled: ${stats.cancelled}
        `;
    },
    
    filterContests(status) {
        if (status === 'all') {
            this.contests = [...this.contests]; // Reset to all contests
        } else {
            // Re-load all contests and filter
            this.loadAllContests().then(() => {
                this.contests = this.contests.filter(contest => {
                    switch(status) {
                        case 'draft': return contest.status === 'draft';
                        case 'published': return contest.published && !contest.locked;
                        case 'locked': return contest.locked && !contest.resolved;
                        case 'resolved': return contest.resolved;
                        case 'cancelled': return contest.status === 'cancelled';
                        default: return true;
                    }
                });
                this.currentPage = 1;
                this.renderContests();
            });
        }
    },
    
    renderContests() {
        const tbody = document.getElementById('contests-tbody');
        const startIndex = (this.currentPage - 1) * this.contestsPerPage;
        const endIndex = startIndex + this.contestsPerPage;
        const contestsToShow = this.contests.slice(startIndex, endIndex);
        
        tbody.innerHTML = '';
        
        contestsToShow.forEach(contest => {
            const row = this.createContestRow(contest);
            tbody.appendChild(row);
        });
        
        // Update pagination info
        const totalPages = Math.ceil(this.contests.length / this.contestsPerPage);
        document.getElementById('page-info').textContent = 
            `Page ${this.currentPage} of ${totalPages} (${this.contests.length} contests)`;
        
        // Update pagination buttons
        document.getElementById('prev-page').disabled = this.currentPage === 1;
        document.getElementById('next-page').disabled = this.currentPage === totalPages;
    },
    
    createContestRow(contest) {
        const row = document.createElement('tr');
        row.style.borderBottom = '1px solid #333';
        row.style.transition = 'background-color 0.2s ease';
        
        row.onmouseover = () => row.style.backgroundColor = '#2a2a2a';
        row.onmouseout = () => row.style.backgroundColor = '';
        
        const statusBadge = this.getStatusBadge(contest);
        const actions = this.createActionButtons(contest);
        const contestDate = contest.contestDate ? new Date(contest.contestDate.seconds * 1000).toLocaleDateString() : 'N/A';
        
        row.innerHTML = `
            <td style="padding: 12px;">
                <div style="font-weight: bold; margin-bottom: 4px;">${contest.title || 'Untitled Contest'}</div>
                <div style="font-size: 12px; color: #888;">ID: ${contest.id}</div>
            </td>
            <td style="padding: 12px; text-align: center;">${contestDate}</td>
            <td style="padding: 12px; text-align: center;">${statusBadge}</td>
            <td style="padding: 12px; text-align: center;">
                <span style="font-weight: bold; color: #4CAF50;">${contest.participantCount || 0}</span>
                <div style="font-size: 11px; color: #888;">/ ${contest.participantLimit || '∞'}</div>
            </td>
            <td style="padding: 12px; text-align: center;">
                <span style="color: #ffd700;">${contest.prizePool || contest.entryFee || 0} $NUTS</span>
            </td>
            <td style="padding: 12px; text-align: center;">
                ${actions}
            </td>
        `;
        
        return row;
    },
    
    getStatusBadge(contest) {
        if (contest.status === 'cancelled') {
            return '<span style="background: #ff6b6b; color: white; padding: 3px 8px; border-radius: 12px; font-size: 11px;">❌ CANCELLED</span>';
        }
        if (contest.resolved) {
            return '<span style="background: #4CAF50; color: white; padding: 3px 8px; border-radius: 12px; font-size: 11px;">✅ RESOLVED</span>';
        }
        if (contest.locked) {
            return '<span style="background: #ff9800; color: white; padding: 3px 8px; border-radius: 12px; font-size: 11px;">🔒 LOCKED</span>';
        }
        if (contest.published) {
            return '<span style="background: #2196F3; color: white; padding: 3px 8px; border-radius: 12px; font-size: 11px;">🟢 PUBLISHED</span>';
        }
        return '<span style="background: #666; color: white; padding: 3px 8px; border-radius: 12px; font-size: 11px;">📝 DRAFT</span>';
    },
    
    createActionButtons(contest) {
        const buttons = [];
        
        // Edit/View button (always available)
        buttons.push(`
            <button onclick="AdminContestList.editContest('${contest.id}')" 
                    class="action-btn" style="background: #2196F3; margin: 2px;">
                📝 Edit
            </button>
        `);
        
        // Set Answers button (for locked contests)
        if (contest.locked && !contest.resolved) {
            buttons.push(`
                <button onclick="AdminContestList.setAnswers('${contest.id}')" 
                        class="action-btn" style="background: #ff9800; margin: 2px;">
                    ✏️ Set Answers
                </button>
            `);
        }
        
        // Calculate Winners button (for contests with answers set)
        if (contest.locked && contest.choices && contest.choices.some(c => c.correctAnswer)) {
            buttons.push(`
                <button onclick="AdminContestList.calculateWinners('${contest.id}')" 
                        class="action-btn" style="background: #4CAF50; margin: 2px;">
                    🏆 Calculate Winners
                </button>
            `);
        }
        
        // Get Winners button (for resolved contests)
        if (contest.resolved) {
            buttons.push(`
                <button onclick="AdminContestList.getWinners('${contest.id}')" 
                        class="action-btn" style="background: #ffd700; margin: 2px;">
                    💰 Get Winners
                </button>
            `);
        }
        
        return buttons.join('<br>');
    },
    
    async editContest(contestId) {
        console.log('✏️ Editing contest:', contestId);
        
        // Load the contest data
        try {
            const db = firebase.firestore();
            const contestDoc = await db.collection('dailyContests').doc(contestId).get();
            
            if (!contestDoc.exists) {
                alert('Contest not found!');
                return;
            }
            
            const contest = { id: contestDoc.id, ...contestDoc.data() };
            
            // Set the global contest variable
            window.currentDailyContest = contest;
            
            // Update the edit UI if it exists
            if (window.updateDailyContestUI) {
                window.updateDailyContestUI(contest);
            }
            
            // Scroll to top or focus edit area
            const editArea = document.querySelector('.contest-details') || 
                           document.querySelector('#contest-details') ||
                           document.querySelector('.admin-container');
            
            if (editArea) {
                editArea.scrollIntoView({ behavior: 'smooth' });
            }
            
            alert(`Loaded contest: ${contest.title}`);
            
        } catch (error) {
            console.error('Error loading contest:', error);
            alert('Error loading contest: ' + error.message);
        }
    },
    
    async setAnswers(contestId) {
        console.log('✏️ Setting answers for contest:', contestId);
        
        try {
            const db = firebase.firestore();
            const contestDoc = await db.collection('dailyContests').doc(contestId).get();
            
            if (!contestDoc.exists) {
                alert('Contest not found!');
                return;
            }
            
            const contest = contestDoc.data();
            
            if (!contest.choices || contest.choices.length === 0) {
                alert('No choices found for this contest!');
                return;
            }
            
            // Create answer setting modal
            this.showAnswerModal(contestId, contest);
            
        } catch (error) {
            console.error('Error loading contest for answers:', error);
            alert('Error: ' + error.message);
        }
    },
    
    showAnswerModal(contestId, contest) {
        // Remove existing modal if any
        const existingModal = document.getElementById('answer-modal');
        if (existingModal) existingModal.remove();
        
        const modal = document.createElement('div');
        modal.id = 'answer-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
        `;
        
        const choicesHTML = contest.choices.map((choice, index) => `
            <div style="margin: 15px 0; padding: 15px; background: #2a2a2a; border-radius: 8px; border: 1px solid #333;">
                <div style="font-weight: bold; margin-bottom: 10px; color: #4CAF50;">
                    Choice ${index + 1}: ${choice.question || 'No question'}
                </div>
                <div style="margin: 10px 0;">
                    <strong>Option A:</strong> ${choice.optionA || 'No option A'}
                </div>
                <div style="margin: 10px 0;">
                    <strong>Option B:</strong> ${choice.optionB || 'No option B'}
                </div>
                <div style="margin: 10px 0;">
                    <label style="color: #ffd700; font-weight: bold;">Correct Answer:</label>
                    <select id="answer-${index}" style="
                        background: #333;
                        color: white;
                        border: 1px solid #555;
                        padding: 8px;
                        border-radius: 4px;
                        margin-left: 10px;
                    ">
                        <option value="">Select Winner...</option>
                        <option value="A" ${choice.correctAnswer === 'A' ? 'selected' : ''}>A - ${choice.optionA}</option>
                        <option value="B" ${choice.correctAnswer === 'B' ? 'selected' : ''}>B - ${choice.optionB}</option>
                    </select>
                </div>
            </div>
        `).join('');
        
        modal.innerHTML = `
            <div style="
                background: #1a1a1a;
                border: 1px solid #333;
                border-radius: 12px;
                padding: 30px;
                max-width: 800px;
                max-height: 80vh;
                overflow-y: auto;
                color: white;
            ">
                <h2 style="color: #4CAF50; margin-bottom: 20px;">Set Correct Answers</h2>
                <p style="color: #ccc; margin-bottom: 20px;">Contest: ${contest.title}</p>
                
                ${choicesHTML}
                
                <div style="margin-top: 30px; text-align: center;">
                    <button id="save-answers" style="
                        background: #4CAF50;
                        color: white;
                        border: none;
                        padding: 12px 24px;
                        border-radius: 6px;
                        font-weight: bold;
                        cursor: pointer;
                        margin-right: 10px;
                    ">💾 Save Answers</button>
                    
                    <button id="cancel-answers" style="
                        background: #666;
                        color: white;
                        border: none;
                        padding: 12px 24px;
                        border-radius: 6px;
                        cursor: pointer;
                    ">❌ Cancel</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Attach event listeners
        document.getElementById('save-answers').onclick = () => {
            this.saveAnswers(contestId, contest);
        };
        
        document.getElementById('cancel-answers').onclick = () => {
            modal.remove();
        };
        
        // Close on background click
        modal.onclick = (e) => {
            if (e.target === modal) modal.remove();
        };
    },
    
    async saveAnswers(contestId, contest) {
        try {
            // Collect answers
            const updatedChoices = contest.choices.map((choice, index) => {
                const select = document.getElementById(`answer-${index}`);
                return {
                    ...choice,
                    correctAnswer: select.value || null
                };
            });
            
            // Validate all answers are set
            const missingAnswers = updatedChoices.filter(choice => !choice.correctAnswer);
            if (missingAnswers.length > 0) {
                alert('Please set correct answers for all choices!');
                return;
            }
            
            // Save to Firestore
            const db = firebase.firestore();
            await db.collection('dailyContests').doc(contestId).update({
                choices: updatedChoices,
                answersSet: true,
                answersSetAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            // Close modal
            document.getElementById('answer-modal').remove();
            
            alert('✅ Answers saved successfully!');
            
            // Refresh the list
            this.loadAllContests();
            
        } catch (error) {
            console.error('Error saving answers:', error);
            alert('Error saving answers: ' + error.message);
        }
    },
    
    async calculateWinners(contestId) {
        if (!confirm('Calculate winners for this contest? This will score all entries and determine winners.')) {
            return;
        }
        
        try {
            console.log('🏆 Calculating winners for contest:', contestId);
            
            // Call the Firebase function
            const calculateWinnersFunction = firebase.functions().httpsCallable('calculateDailyContestWinners');
            const result = await calculateWinnersFunction({ contestId });
            
            if (result.data.success) {
                alert(`✅ Winners calculated successfully!\n\nWinners: ${result.data.winnerCount}\nTotal Entries: ${result.data.totalEntries}`);
                this.loadAllContests(); // Refresh
            } else {
                throw new Error(result.data.error || 'Failed to calculate winners');
            }
            
        } catch (error) {
            console.error('Error calculating winners:', error);
            alert('Error calculating winners: ' + error.message);
        }
    },
    
    async getWinners(contestId) {
        try {
            console.log('💰 Getting winners for contest:', contestId);
            
            const db = firebase.firestore();
            
            // Get contest data
            const contestDoc = await db.collection('dailyContests').doc(contestId).get();
            const contest = contestDoc.data();
            
            // Get winner entries
            const winnersSnapshot = await db.collection('dailyContestParticipants')
                .where('contestId', '==', contestId)
                .where('isWinner', '==', true)
                .orderBy('winnerRank')
                .get();
            
            if (winnersSnapshot.empty) {
                alert('No winners found for this contest. Make sure to calculate winners first.');
                return;
            }
            
            let winnersInfo = `🏆 WINNERS for "${contest.title}"\n\n`;
            
            winnersSnapshot.forEach(doc => {
                const winner = doc.data();
                winnersInfo += `${this.getRankEmoji(winner.winnerRank)} Place ${winner.winnerRank}: ${winner.walletAddress}\n`;
                winnersInfo += `   Score: ${winner.finalScore}/${contest.choices?.length || 0}\n`;
                winnersInfo += `   Prize: ${winner.prizeAmount} $NUTS\n\n`;
            });
            
            // Show in a modal for easy copying
            this.showWinnersModal(winnersInfo, contestId);
            
        } catch (error) {
            console.error('Error getting winners:', error);
            alert('Error getting winners: ' + error.message);
        }
    },
    
    getRankEmoji(rank) {
        switch(rank) {
            case 1: return '🥇';
            case 2: return '🥈';
            case 3: return '🥉';
            default: return '🏆';
        }
    },
    
    showWinnersModal(winnersInfo, contestId) {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
        `;
        
        modal.innerHTML = `
            <div style="
                background: #1a1a1a;
                border: 1px solid #333;
                border-radius: 12px;
                padding: 30px;
                max-width: 600px;
                color: white;
            ">
                <h2 style="color: #ffd700; margin-bottom: 20px;">💰 Contest Winners</h2>
                
                <textarea readonly style="
                    width: 100%;
                    height: 300px;
                    background: #2a2a2a;
                    border: 1px solid #555;
                    border-radius: 6px;
                    padding: 15px;
                    color: white;
                    font-family: monospace;
                    font-size: 14px;
                    resize: none;
                ">${winnersInfo}</textarea>
                
                <div style="margin-top: 20px; text-align: center;">
                    <button onclick="navigator.clipboard.writeText(\`${winnersInfo.replace(/`/g, '\\`')}\`).then(() => alert('Winners info copied to clipboard!'))" style="
                        background: #4CAF50;
                        color: white;
                        border: none;
                        padding: 12px 24px;
                        border-radius: 6px;
                        font-weight: bold;
                        cursor: pointer;
                        margin-right: 10px;
                    ">📋 Copy to Clipboard</button>
                    
                    <button onclick="this.closest('div[style*=\"position: fixed\"]').remove()" style="
                        background: #666;
                        color: white;
                        border: none;
                        padding: 12px 24px;
                        border-radius: 6px;
                        cursor: pointer;
                    ">❌ Close</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Close on background click
        modal.onclick = (e) => {
            if (e.target === modal) modal.remove();
        };
    }
};

// Add action button styles
const style = document.createElement('style');
style.textContent = `
    .action-btn {
        padding: 6px 12px;
        border: none;
        border-radius: 4px;
        color: white;
        font-size: 11px;
        font-weight: bold;
        cursor: pointer;
        transition: all 0.2s ease;
        white-space: nowrap;
    }
    
    .action-btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    }
    
    .action-btn:active {
        transform: translateY(0);
    }
`;
document.head.appendChild(style);

// Initialize when ready
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('admin-contest.html')) {
        // Wait a bit for other scripts to load
        setTimeout(() => {
            window.AdminContestList.init();
        }, 2000);
    }
});
