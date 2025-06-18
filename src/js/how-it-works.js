/**
 * How It Works page functionality for $NUTS Sports Pick'em
 * Handles FAQ interactions, collapsible sections, and smooth scrolling
 */

class HowItWorksManager {
    constructor() {
        this.init();
    }

    init() {
        this.initFAQAccordions();
        this.initSmoothScrolling();
        this.initAnimationObserver();
        console.log('HowItWorksManager initialized');
    }

    initFAQAccordions() {
        const faqItems = document.querySelectorAll('.faq-item');
        
        faqItems.forEach(item => {
            const question = item.querySelector('.faq-question');
            const answer = item.querySelector('.faq-answer');
            
            if (question && answer) {
                question.addEventListener('click', () => {
                    this.toggleFAQItem(item);
                });
            }
        });
    }

    toggleFAQItem(item) {
        const isActive = item.classList.contains('active');
        
        // Close all other FAQ items
        document.querySelectorAll('.faq-item').forEach(faqItem => {
            if (faqItem !== item) {
                faqItem.classList.remove('active');
                const answer = faqItem.querySelector('.faq-answer');
                if (answer) {
                    answer.style.maxHeight = null;
                }
            }
        });

        // Toggle current item
        if (isActive) {
            item.classList.remove('active');
            const answer = item.querySelector('.faq-answer');
            if (answer) {
                answer.style.maxHeight = null;
            }
        } else {
            item.classList.add('active');
            const answer = item.querySelector('.faq-answer');
            if (answer) {
                answer.style.maxHeight = answer.scrollHeight + 'px';
            }
        }
    }

    initSmoothScrolling() {
        // Add smooth scrolling to anchor links
        const anchorLinks = document.querySelectorAll('a[href^="#"]');
        
        anchorLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');
                if (href === '#') return;
                
                const target = document.querySelector(href);
                if (target) {
                    e.preventDefault();
                    this.smoothScrollTo(target);
                }
            });
        });
    }

    smoothScrollTo(target) {
        const targetPosition = target.offsetTop - 100; // Account for fixed header
        const startPosition = window.pageYOffset;
        const distance = targetPosition - startPosition;
        const duration = 800;
        let start = null;

        const animation = (currentTime) => {
            if (start === null) start = currentTime;
            const timeElapsed = currentTime - start;
            const run = this.easeInOutQuad(timeElapsed, startPosition, distance, duration);
            window.scrollTo(0, run);
            if (timeElapsed < duration) requestAnimationFrame(animation);
        };

        requestAnimationFrame(animation);
    }

    easeInOutQuad(t, b, c, d) {
        t /= d / 2;
        if (t < 1) return c / 2 * t * t + b;
        t--;
        return -c / 2 * (t * (t - 2) - 1) + b;
    }

    initAnimationObserver() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, observerOptions);

        // Observe sections for animation
        const sections = document.querySelectorAll('.quick-start, .contest-types, .scoring-system, .tips-section, .faq-section');
        sections.forEach(section => {
            observer.observe(section);
        });

        // Observe step items
        const stepItems = document.querySelectorAll('.step-item');
        stepItems.forEach((item, index) => {
            item.style.animationDelay = `${index * 0.2}s`;
            observer.observe(item);
        });

        // Observe contest cards
        const contestCards = document.querySelectorAll('.contest-type-card');
        contestCards.forEach((card, index) => {
            card.style.animationDelay = `${index * 0.3}s`;
            observer.observe(card);
        });
    }

    // Utility method for showing notifications
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <span class="notification-icon">${this.getNotificationIcon(type)}</span>
            <span class="notification-message">${message}</span>
            <button class="notification-close" onclick="this.parentElement.remove()">×</button>
        `;

        document.body.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    getNotificationIcon(type) {
        const icons = {
            'info': 'ℹ️',
            'success': '✅',
            'warning': '⚠️',
            'error': '❌'
        };
        return icons[type] || icons.info;
    }

    // Method to handle external links
    handleExternalLinks() {
        const externalLinks = document.querySelectorAll('a[href^="http"]');
        
        externalLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const url = link.getAttribute('href');
                
                // Show confirmation for external links
                if (confirm('You are about to visit an external website. Continue?')) {
                    window.open(url, '_blank', 'noopener,noreferrer');
                }
            });
        });
    }

    // Method to track user engagement
    trackScrollProgress() {
        let maxScroll = 0;
        
        window.addEventListener('scroll', () => {
            const scrollPercent = Math.round(
                (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
            );
            
            if (scrollPercent > maxScroll) {
                maxScroll = scrollPercent;
                
                // Track major milestones
                if (maxScroll >= 25 && !this.milestones?.quarter) {
                    this.milestones = { ...this.milestones, quarter: true };
                    console.log('User scrolled 25% of How It Works page');
                }
                if (maxScroll >= 50 && !this.milestones?.half) {
                    this.milestones = { ...this.milestones, half: true };
                    console.log('User scrolled 50% of How It Works page');
                }
                if (maxScroll >= 75 && !this.milestones?.threeQuarters) {
                    this.milestones = { ...this.milestones, threeQuarters: true };
                    console.log('User scrolled 75% of How It Works page');
                }
                if (maxScroll >= 90 && !this.milestones?.complete) {
                    this.milestones = { ...this.milestones, complete: true };
                    console.log('User read most of How It Works page');
                }
            }
        });
    }

    // Method to handle contest type comparisons
    initContestComparison() {
        const compareButtons = document.querySelectorAll('.compare-contest-btn');
        
        compareButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const contestType = e.target.dataset.contest;
                this.showContestDetails(contestType);
            });
        });
    }

    showContestDetails(contestType) {
        const details = this.getContestDetails(contestType);
        
        const modal = document.createElement('div');
        modal.className = 'contest-detail-modal';
        modal.innerHTML = `
            <div class="modal-overlay" onclick="this.parentElement.remove()"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${details.title}</h3>
                    <button class="modal-close" onclick="this.closest('.contest-detail-modal').remove()">×</button>
                </div>
                <div class="modal-body">
                    ${details.content}
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="this.closest('.contest-detail-modal').remove()">
                        Close
                    </button>
                    <a href="${details.link}" class="btn btn-primary">
                        Enter Contest
                    </a>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }

    getContestDetails(contestType) {
        const details = {
            daily: {
                title: 'Daily Pick\'em Contest',
                link: 'daily-contest.html',
                content: `
                    <div class="contest-details">
                        <h4>How to Play:</h4>
                        <ul>
                            <li>Pay 50 $NUTS entry fee</li>
                            <li>Pick winners of 10 games</li>
                            <li>No point spreads - just winners</li>
                            <li>Submit picks before first game starts</li>
                        </ul>
                        
                        <h4>Prize Structure:</h4>
                        <ul>
                            <li>1st Place: 50% of prize pool</li>
                            <li>2nd Place: 30% of prize pool</li>
                            <li>3rd Place: 20% of prize pool</li>
                        </ul>
                        
                        <h4>Entry Requirements:</h4>
                        <ul>
                            <li>Connected XUMM wallet</li>
                            <li>Sufficient $NUTS balance</li>
                            <li>Valid picks submitted</li>
                        </ul>
                    </div>
                `
            },
            weekly: {
                title: 'Weekly NFT Holder Contest',
                link: 'nft-contest.html',
                content: `
                    <div class="contest-details">
                        <h4>How to Play:</h4>
                        <ul>
                            <li>Hold $NUTS NFTs in your wallet</li>
                            <li>Pick winners of 15 games</li>
                            <li>Free entry for NFT holders</li>
                            <li>Contest runs Monday to Sunday</li>
                        </ul>
                        
                        <h4>Prize Structure:</h4>
                        <ul>
                            <li>1st Place: 500 $NUTS</li>
                            <li>2nd Place: 300 $NUTS</li>
                            <li>3rd Place: 200 $NUTS</li>
                        </ul>
                        
                        <h4>NFT Requirements:</h4>
                        <ul>
                            <li>Must hold at least 1 $NUTS NFT</li>
                            <li>NFT must be in connected wallet</li>
                            <li>Verification required before entry</li>
                        </ul>
                    </div>
                `
            }
        };

        return details[contestType] || details.daily;
    }
}

// Initialize How It Works manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.howItWorksManager = new HowItWorksManager();
});

// Add CSS for animations and modals
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(30px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .animate-in {
        animation: fadeInUp 0.6s ease-out forwards;
    }

    .step-item,
    .contest-type-card {
        opacity: 0;
        transform: translateY(30px);
        transition: all 0.6s ease-out;
    }

    .step-item.animate-in,
    .contest-type-card.animate-in {
        opacity: 1;
        transform: translateY(0);
    }

    .faq-item {
        border-bottom: 1px solid #333;
        margin-bottom: 1rem;
    }

    .faq-question {
        cursor: pointer;
        padding: 1rem 0;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-weight: 600;
        transition: color 0.3s ease;
    }

    .faq-question:hover {
        color: #f39c12;
    }

    .faq-question::after {
        content: '+';
        font-size: 1.5rem;
        transition: transform 0.3s ease;
    }

    .faq-item.active .faq-question::after {
        transform: rotate(45deg);
    }

    .faq-answer {
        max-height: 0;
        overflow: hidden;
        transition: max-height 0.3s ease;
        padding: 0;
    }

    .faq-item.active .faq-answer {
        padding: 0 0 1rem 0;
    }

    .contest-detail-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .modal-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        backdrop-filter: blur(4px);
    }

    .modal-content {
        position: relative;
        background: #1a1a1a;
        border-radius: 12px;
        max-width: 500px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
        border: 1px solid #333;
    }

    .modal-header {
        padding: 1.5rem;
        border-bottom: 1px solid #333;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .modal-close {
        background: none;
        border: none;
        color: #fff;
        font-size: 1.5rem;
        cursor: pointer;
        padding: 0;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background-color 0.3s ease;
    }

    .modal-close:hover {
        background-color: #333;
    }

    .modal-body {
        padding: 1.5rem;
    }

    .modal-footer {
        padding: 1.5rem;
        border-top: 1px solid #333;
        display: flex;
        gap: 1rem;
        justify-content: flex-end;
    }

    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        background: #1a1a1a;
        border: 1px solid #333;
        border-radius: 8px;
        padding: 1rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        z-index: 10001;
        max-width: 400px;
        animation: slideInRight 0.3s ease-out;
    }

    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    .notification-close {
        background: none;
        border: none;
        color: #fff;
        cursor: pointer;
        margin-left: auto;
    }
`;

document.head.appendChild(style);
