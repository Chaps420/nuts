/**
 * Leaderboard functionality for $NUTS Sports Pick'em
 * Handles tab switching, leaderboard data loading, and real-time updates
 */

class LeaderboardManager {
    constructor() {
        this.currentTab = 'daily';
        this.refreshInterval = null;
        this.init();
    }

    init() {
        this.initTabSwitching();
        this.loadLeaderboardData();
        this.startAutoRefresh();
        console.log('LeaderboardManager initialized');
    }

    initTabSwitching() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.leaderboard-tab');

        tabButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const tabId = e.target.dataset.tab;
                this.switchTab(tabId);
            });
        });
    }

    switchTab(tabId) {
        // Update active tab button
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');

        // Update active tab content
        document.querySelectorAll('.leaderboard-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.getElementById(`${tabId}-tab`).classList.add('active');

        this.currentTab = tabId;
        this.loadLeaderboardData();
    }

    async loadLeaderboardData() {
        try {
            switch (this.currentTab) {
                case 'daily':
                    await this.loadDailyLeaderboard();
                    break;
                case 'weekly':
                    await this.loadWeeklyLeaderboard();
                    break;
                case 'all-time':
                    await this.loadAllTimeLeaderboard();
                    break;
            }
        } catch (error) {
            console.error('Error loading leaderboard data:', error);
            this.showError('Failed to load leaderboard data');
        }
    }

    async loadDailyLeaderboard() {
        const container = document.getElementById('daily-leaderboard');
        this.showLoading(container);

        // Mock data - replace with actual API call
        const mockData = await this.getMockDailyData();
        
        this.renderLeaderboard(container, mockData, 'daily');
    }

    async loadWeeklyLeaderboard() {
        const container = document.getElementById('weekly-leaderboard');
        this.showLoading(container);

        // Mock data - replace with actual API call
        const mockData = await this.getMockWeeklyData();
        
        this.renderLeaderboard(container, mockData, 'weekly');
    }

    async loadAllTimeLeaderboard() {
        const container = document.getElementById('all-time-leaderboard');
        this.showLoading(container);

        // Mock data - replace with actual API call
        const mockData = await this.getMockAllTimeData();
        
        this.renderLeaderboard(container, mockData, 'all-time');
    }

    showLoading(container) {
        container.innerHTML = `
            <div class="loading-row">
                <div class="spinner"></div>
                <span>Loading leaderboard...</span>
            </div>
        `;
    }

    renderLeaderboard(container, data, type) {
        let html = '';

        data.forEach((player, index) => {
            const rank = index + 1;
            const rankClass = rank <= 3 ? `rank-${rank}` : '';
            
            html += `
                <div class="leaderboard-row ${rankClass}">
                    <div class="rank-col">
                        <span class="rank-number">${rank}</span>
                        ${rank <= 3 ? `<span class="rank-medal">${this.getRankMedal(rank)}</span>` : ''}
                    </div>
                    <div class="player-col">
                        <div class="player-info">
                            <div class="player-avatar">${player.avatar || '🐿️'}</div>
                            <div class="player-details">
                                <div class="player-name">${player.name}</div>
                                <div class="player-address">${this.truncateAddress(player.address)}</div>
                            </div>
                        </div>
                    </div>
                    ${type === 'weekly' ? `
                        <div class="nft-col">
                            <div class="nft-info">
                                <span class="nft-count">${player.nftCount}</span>
                                <span class="nft-label">NFTs</span>
                            </div>
                        </div>
                    ` : ''}
                    <div class="score-col">
                        <span class="score">${player.score}</span>
                        ${type !== 'all-time' ? `<span class="score-label">/ ${type === 'daily' ? '10' : '15'}</span>` : ''}
                    </div>
                    <div class="prize-col">
                        <span class="prize-amount">${player.prize}</span>
                        ${player.prizeUsd ? `<span class="prize-usd">($${player.prizeUsd})</span>` : ''}
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    getRankMedal(rank) {
        const medals = ['🥇', '🥈', '🥉'];
        return medals[rank - 1] || '';
    }

    truncateAddress(address) {
        if (!address) return 'Anonymous';
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }

    async getMockDailyData() {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        return [
            {
                name: 'PickMaster',
                address: 'rXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
                avatar: '🏆',
                score: 9,
                prize: '1,250 $NUTS',
                prizeUsd: '105.88'
            },
            {
                name: 'SportsGuru',
                address: 'rYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY',
                avatar: '🎯',
                score: 8,
                prize: '750 $NUTS',
                prizeUsd: '63.53'
            },
            {
                name: 'LuckyStreak',
                address: 'rZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ',
                avatar: '🍀',
                score: 8,
                prize: '500 $NUTS',
                prizeUsd: '42.35'
            },
            {
                name: 'GameChanger',
                address: 'rAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
                avatar: '⚡',
                score: 7,
                prize: '0 $NUTS',
                prizeUsd: null
            },
            {
                name: 'ProPicker',
                address: 'rBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB',
                avatar: '🎲',
                score: 7,
                prize: '0 $NUTS',
                prizeUsd: null
            }
        ];
    }

    async getMockWeeklyData() {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        return [
            {
                name: 'NFTChampion',
                address: 'rXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
                avatar: '👑',
                nftCount: 15,
                score: 12,
                prize: '500 $NUTS',
                prizeUsd: '42.35'
            },
            {
                name: 'SquirrelKing',
                address: 'rYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY',
                avatar: '🐿️',
                nftCount: 8,
                score: 11,
                prize: '300 $NUTS',
                prizeUsd: '25.41'
            },
            {
                name: 'NutCollector',
                address: 'rZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ',
                avatar: '🥜',
                nftCount: 12,
                score: 10,
                prize: '200 $NUTS',
                prizeUsd: '16.94'
            }
        ];
    }

    async getMockAllTimeData() {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        return [
            {
                name: 'LegendaryPicker',
                address: 'rXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
                avatar: '👑',
                score: '15,750 $NUTS',
                prize: '47 Wins',
                prizeUsd: null
            },
            {
                name: 'SportsMaster',
                address: 'rYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY',
                avatar: '🏆',
                score: '12,340 $NUTS',
                prize: '32 Wins',
                prizeUsd: null
            },
            {
                name: 'PickemPro',
                address: 'rZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ',
                avatar: '⭐',
                score: '9,820 $NUTS',
                prize: '28 Wins',
                prizeUsd: null
            }
        ];
    }

    startAutoRefresh() {
        // Refresh leaderboard every 30 seconds
        this.refreshInterval = setInterval(() => {
            this.loadLeaderboardData();
        }, 30000);
    }

    showError(message) {
        const activeTab = document.querySelector('.leaderboard-tab.active .table-body');
        if (activeTab) {
            activeTab.innerHTML = `
                <div class="error-row">
                    <div class="error-icon">⚠️</div>
                    <span>${message}</span>
                    <button class="retry-btn" onclick="leaderboard.loadLeaderboardData()">Retry</button>
                </div>
            `;
        }
    }

    destroy() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
    }
}

// Initialize leaderboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.leaderboard = new LeaderboardManager();
});

// Clean up on page unload
window.addEventListener('beforeunload', () => {
    if (window.leaderboard) {
        window.leaderboard.destroy();
    }
});
