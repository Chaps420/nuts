/**
 * Enhanced QR Modal with Animations and Real Xaman Integration
 * Professional UI with smooth animations and real-time status updates
 */

class EnhancedQRModal {
    constructor() {
        this.modal = null;
        this.currentQRData = null;
        this.connectionTimeout = null;
        this.pulseInterval = null;
        
        console.log('🎨 Enhanced QR Modal initialized');
    }

    /**
     * Show the enhanced QR modal with animations
     */
    async show() {
        try {
            this.createModal();
            this.showLoadingState();
            
            // Get real QR data from Xaman
            console.log('📱 Requesting real Xaman QR code...');
            const qrData = await window.xamanQR.connectWallet();
            
            // Display the real QR code
            this.displayQRCode(qrData);
            this.startConnectionMonitoring();
            
        } catch (error) {
            console.error('❌ Failed to show QR modal:', error);
            this.showError('Failed to generate QR code: ' + error.message);
        }
    }

    /**
     * Create the enhanced modal with animations
     */
    createModal() {
        // Remove existing modal if present
        this.hide();
        
        this.modal = document.createElement('div');
        this.modal.id = 'enhanced-xaman-qr-modal';
        this.modal.className = 'enhanced-qr-overlay';
        
        this.modal.innerHTML = `
            <div class="enhanced-qr-modal">
                <div class="modal-backdrop"></div>
                <div class="modal-container">
                    <div class="modal-header">
                        <div class="header-content">
                            <div class="xaman-logo">
                                <div class="logo-icon">🔗</div>
                                <div class="logo-text">
                                    <h3>Connect with Xaman</h3>
                                    <p>Secure wallet connection</p>
                                </div>
                            </div>
                            <button class="modal-close" onclick="window.enhancedQRModal.hide()">
                                <span>×</span>
                            </button>
                        </div>
                        <div class="connection-progress">
                            <div class="progress-bar">
                                <div class="progress-fill" id="connection-progress"></div>
                            </div>
                            <div class="progress-steps">
                                <div class="step active" id="step-1">
                                    <div class="step-dot"></div>
                                    <span>Generate QR</span>
                                </div>
                                <div class="step" id="step-2">
                                    <div class="step-dot"></div>
                                    <span>Scan Code</span>
                                </div>
                                <div class="step" id="step-3">
                                    <div class="step-dot"></div>
                                    <span>Approve</span>
                                </div>
                                <div class="step" id="step-4">
                                    <div class="step-dot"></div>
                                    <span>Connected</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="modal-body">
                        <div class="qr-section">
                            <div class="qr-container" id="qr-container">
                                <div class="qr-loading" id="qr-loading">
                                    <div class="loading-spinner">
                                        <div class="spinner-ring"></div>
                                        <div class="spinner-ring"></div>
                                        <div class="spinner-ring"></div>
                                    </div>
                                    <h4>Generating QR Code</h4>
                                    <p>Creating secure connection request...</p>
                                </div>
                                
                                <div class="qr-display hidden" id="qr-display">
                                    <div class="qr-frame">
                                        <div class="qr-corners">
                                            <div class="corner corner-tl"></div>
                                            <div class="corner corner-tr"></div>
                                            <div class="corner corner-bl"></div>
                                            <div class="corner corner-br"></div>
                                        </div>
                                        <img id="qr-image" alt="Xaman QR Code" />
                                        <div class="qr-overlay">
                                            <div class="scan-line"></div>
                                        </div>
                                    </div>
                                    <div class="qr-info">
                                        <div class="qr-status" id="qr-status">
                                            <div class="status-icon">📱</div>
                                            <span>Ready to scan</span>
                                        </div>
                                        <div class="qr-timer" id="qr-timer">
                                            <div class="timer-icon">⏱️</div>
                                            <span id="timer-text">5:00</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="qr-error hidden" id="qr-error">
                                    <div class="error-icon">⚠️</div>
                                    <h4>Connection Failed</h4>
                                    <p id="error-message">Unable to create QR code</p>
                                </div>
                            </div>
                        </div>
                        
                        <div class="instructions-section">
                            <div class="instructions-header">
                                <h4>📋 How to Connect</h4>
                            </div>
                            <div class="instructions-list">
                                <div class="instruction-item">
                                    <div class="instruction-number">1</div>
                                    <div class="instruction-content">
                                        <strong>Open Xaman App</strong>
                                        <p>Launch the Xaman wallet app on your mobile device</p>
                                    </div>
                                </div>
                                <div class="instruction-item">
                                    <div class="instruction-number">2</div>
                                    <div class="instruction-content">
                                        <strong>Scan QR Code</strong>
                                        <p>Tap the scan button and point your camera at the QR code</p>
                                    </div>
                                </div>
                                <div class="instruction-item">
                                    <div class="instruction-number">3</div>
                                    <div class="instruction-content">
                                        <strong>Approve Connection</strong>
                                        <p>Review and approve the sign-in request in your app</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="connection-status" id="xaman-connection-status">
                            <div class="status-waiting">
                                <div class="pulse-dots">
                                    <div class="pulse-dot"></div>
                                    <div class="pulse-dot"></div>
                                    <div class="pulse-dot"></div>
                                </div>
                                <span>Waiting for connection...</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="modal-footer">
                        <div class="footer-actions">
                            <button class="btn-secondary" onclick="window.enhancedQRModal.refreshQR()">
                                <span class="btn-icon">🔄</span>
                                <span>Refresh QR</span>
                            </button>
                            <button class="btn-secondary" onclick="window.enhancedQRModal.hide()">
                                <span class="btn-icon">❌</span>
                                <span>Cancel</span>
                            </button>
                        </div>
                        <div class="footer-info">
                            <p>🔒 Secure connection powered by Xaman</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Add enhanced styles
        this.addEnhancedStyles();
        
        // Add to page with entrance animation
        document.body.appendChild(this.modal);
        
        // Trigger entrance animation
        requestAnimationFrame(() => {
            this.modal.classList.add('show');
        });
        
        // Set up event listeners
        this.setupEventListeners();
    }

    /**
     * Add enhanced CSS styles with animations
     */
    addEnhancedStyles() {
        if (document.getElementById('enhanced-qr-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'enhanced-qr-styles';
        style.textContent = `
            .enhanced-qr-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                z-index: 10000;
                opacity: 0;
                visibility: hidden;
                transition: all 0.3s ease;
            }
            
            .enhanced-qr-overlay.show {
                opacity: 1;
                visibility: visible;
            }
            
            .enhanced-qr-modal {
                width: 100%;
                height: 100%;
                display: flex;
                justify-content: center;
                align-items: center;
                padding: 20px;
                box-sizing: border-box;
            }
            
            .modal-backdrop {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.8);
                backdrop-filter: blur(5px);
                animation: backdropFadeIn 0.3s ease;
            }
            
            @keyframes backdropFadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            .modal-container {
                position: relative;
                background: linear-gradient(145deg, #2a2a2a, #1a1a1a);
                border-radius: 20px;
                max-width: 500px;
                width: 100%;
                max-height: 90vh;
                overflow: hidden;
                border: 2px solid #ffa500;
                box-shadow: 0 20px 60px rgba(255, 165, 0, 0.3);
                transform: scale(0.8) translateY(20px);
                animation: modalSlideIn 0.4s ease forwards;
            }
            
            @keyframes modalSlideIn {
                to {
                    transform: scale(1) translateY(0);
                }
            }
            
            .modal-header {
                padding: 25px;
                border-bottom: 1px solid #333;
                background: linear-gradient(135deg, #333, #2a2a2a);
            }
            
            .header-content {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
            }
            
            .xaman-logo {
                display: flex;
                align-items: center;
                gap: 15px;
            }
            
            .logo-icon {
                width: 50px;
                height: 50px;
                background: linear-gradient(135deg, #ffa500, #ff8c00);
                border-radius: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 24px;
                animation: logoGlow 2s ease-in-out infinite alternate;
            }
            
            @keyframes logoGlow {
                from { box-shadow: 0 0 20px rgba(255, 165, 0, 0.5); }
                to { box-shadow: 0 0 30px rgba(255, 165, 0, 0.8); }
            }
            
            .logo-text h3 {
                margin: 0;
                color: #ffa500;
                font-size: 1.3em;
                font-weight: 600;
            }
            
            .logo-text p {
                margin: 2px 0 0 0;
                color: #888;
                font-size: 0.9em;
            }
            
            .modal-close {
                background: rgba(255, 255, 255, 0.1);
                border: none;
                color: #888;
                font-size: 24px;
                cursor: pointer;
                width: 40px;
                height: 40px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s ease;
                backdrop-filter: blur(10px);
            }
            
            .modal-close:hover {
                background: rgba(255, 255, 255, 0.2);
                color: #fff;
                transform: rotate(90deg);
            }
            
            .connection-progress {
                margin-top: 20px;
            }
            
            .progress-bar {
                background: #333;
                height: 4px;
                border-radius: 2px;
                overflow: hidden;
                margin-bottom: 15px;
            }
            
            .progress-fill {
                background: linear-gradient(90deg, #4CAF50, #00ff88);
                height: 100%;
                width: 0%;
                transition: width 0.5s ease;
                position: relative;
            }
            
            .progress-fill::after {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
                animation: shimmer 2s infinite;
            }
            
            @keyframes shimmer {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(100%); }
            }
            
            .progress-steps {
                display: flex;
                justify-content: space-between;
                gap: 10px;
            }
            
            .step {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 5px;
                flex: 1;
                transition: all 0.3s ease;
            }
            
            .step-dot {
                width: 12px;
                height: 12px;
                border-radius: 50%;
                background: #333;
                border: 2px solid #555;
                transition: all 0.3s ease;
            }
            
            .step.active .step-dot {
                background: #4CAF50;
                border-color: #4CAF50;
                animation: stepPulse 1.5s ease-in-out infinite;
            }
            
            .step.completed .step-dot {
                background: #4CAF50;
                border-color: #4CAF50;
            }
            
            @keyframes stepPulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.2); }
            }
            
            .step span {
                font-size: 0.8em;
                color: #666;
                text-align: center;
                transition: color 0.3s ease;
            }
            
            .step.active span {
                color: #4CAF50;
                font-weight: 600;
            }
            
            .modal-body {
                padding: 25px;
                max-height: 60vh;
                overflow-y: auto;
            }
            
            .qr-container {
                position: relative;
                min-height: 300px;
                display: flex;
                justify-content: center;
                align-items: center;
                margin-bottom: 25px;
            }
            
            .qr-loading {
                text-align: center;
                animation: fadeIn 0.5s ease;
            }
            
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            
            .loading-spinner {
                position: relative;
                width: 80px;
                height: 80px;
                margin: 0 auto 20px;
            }
            
            .spinner-ring {
                position: absolute;
                width: 100%;
                height: 100%;
                border: 3px solid transparent;
                border-top: 3px solid #ffa500;
                border-radius: 50%;
                animation: spin 1.5s linear infinite;
            }
            
            .spinner-ring:nth-child(2) {
                width: 60px;
                height: 60px;
                top: 10px;
                left: 10px;
                border-top-color: #4CAF50;
                animation-duration: 2s;
                animation-direction: reverse;
            }
            
            .spinner-ring:nth-child(3) {
                width: 40px;
                height: 40px;
                top: 20px;
                left: 20px;
                border-top-color: #2196F3;
                animation-duration: 1s;
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            .qr-display {
                text-align: center;
                animation: slideInUp 0.5s ease;
            }
            
            @keyframes slideInUp {
                from { opacity: 0; transform: translateY(30px); }
                to { opacity: 1; transform: translateY(0); }
            }
            
            .qr-frame {
                position: relative;
                display: inline-block;
                padding: 20px;
                background: #fff;
                border-radius: 15px;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                margin-bottom: 20px;
            }
            
            .qr-corners {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                pointer-events: none;
            }
            
            .corner {
                position: absolute;
                width: 20px;
                height: 20px;
                border: 3px solid #ffa500;
            }
            
            .corner-tl {
                top: 5px;
                left: 5px;
                border-bottom: none;
                border-right: none;
                animation: cornerGlow 2s ease-in-out infinite alternate;
            }
            
            .corner-tr {
                top: 5px;
                right: 5px;
                border-bottom: none;
                border-left: none;
                animation: cornerGlow 2s ease-in-out infinite alternate;
                animation-delay: 0.5s;
            }
            
            .corner-bl {
                bottom: 5px;
                left: 5px;
                border-top: none;
                border-right: none;
                animation: cornerGlow 2s ease-in-out infinite alternate;
                animation-delay: 1s;
            }
            
            .corner-br {
                bottom: 5px;
                right: 5px;
                border-top: none;
                border-left: none;
                animation: cornerGlow 2s ease-in-out infinite alternate;
                animation-delay: 1.5s;
            }
            
            @keyframes cornerGlow {
                from { border-color: #ffa500; }
                to { border-color: #4CAF50; }
            }
            
            .qr-overlay {
                position: absolute;
                top: 20px;
                left: 20px;
                right: 20px;
                bottom: 20px;
                pointer-events: none;
            }
            
            .scan-line {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 2px;
                background: linear-gradient(90deg, transparent, #4CAF50, transparent);
                animation: scanMove 3s ease-in-out infinite;
            }
            
            @keyframes scanMove {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(200px); }
            }
            
            #qr-image {
                display: block;
                max-width: 200px;
                max-height: 200px;
                width: auto;
                height: auto;
            }
            
            .qr-info {
                display: flex;
                justify-content: space-between;
                align-items: center;
                background: rgba(255, 255, 255, 0.05);
                padding: 15px;
                border-radius: 10px;
                backdrop-filter: blur(10px);
            }
            
            .qr-status, .qr-timer {
                display: flex;
                align-items: center;
                gap: 8px;
                color: #888;
                font-size: 0.9em;
            }
            
            .status-icon, .timer-icon {
                font-size: 1.2em;
            }
            
            .instructions-section {
                margin-bottom: 25px;
            }
            
            .instructions-header h4 {
                color: #ffa500;
                margin: 0 0 15px 0;
                font-size: 1.1em;
            }
            
            .instruction-item {
                display: flex;
                align-items: flex-start;
                gap: 15px;
                margin-bottom: 15px;
                padding: 15px;
                background: rgba(255, 255, 255, 0.03);
                border-radius: 10px;
                border-left: 3px solid #ffa500;
                transition: all 0.3s ease;
            }
            
            .instruction-item:hover {
                background: rgba(255, 165, 0, 0.1);
                transform: translateX(5px);
            }
            
            .instruction-number {
                background: linear-gradient(135deg, #ffa500, #ff8c00);
                color: #000;
                width: 24px;
                height: 24px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                font-size: 0.9em;
                flex-shrink: 0;
            }
            
            .instruction-content strong {
                color: #fff;
                display: block;
                margin-bottom: 3px;
            }
            
            .instruction-content p {
                color: #888;
                margin: 0;
                font-size: 0.9em;
                line-height: 1.4;
            }
            
            .connection-status {
                text-align: center;
                padding: 20px;
                background: rgba(255, 255, 255, 0.03);
                border-radius: 10px;
                border: 1px solid #333;
            }
            
            .pulse-dots {
                display: flex;
                justify-content: center;
                gap: 5px;
                margin-bottom: 10px;
            }
            
            .pulse-dot {
                width: 8px;
                height: 8px;
                background: #ffa500;
                border-radius: 50%;
                animation: pulseDot 1.5s ease-in-out infinite;
            }
            
            .pulse-dot:nth-child(2) {
                animation-delay: 0.3s;
            }
            
            .pulse-dot:nth-child(3) {
                animation-delay: 0.6s;
            }
            
            @keyframes pulseDot {
                0%, 100% { opacity: 0.3; transform: scale(1); }
                50% { opacity: 1; transform: scale(1.2); }
            }
            
            .status-opened .pulse-dot {
                background: #4CAF50;
            }
            
            .checkmark-animation {
                display: inline-block;
                animation: checkmarkBounce 0.6s ease;
                color: #4CAF50;
                font-size: 2em;
                margin-bottom: 10px;
            }
            
            @keyframes checkmarkBounce {
                0% { transform: scale(0); }
                50% { transform: scale(1.3); }
                100% { transform: scale(1); }
            }
            
            .modal-footer {
                padding: 25px;
                border-top: 1px solid #333;
                background: rgba(255, 255, 255, 0.02);
            }
            
            .footer-actions {
                display: flex;
                gap: 10px;
                justify-content: center;
                margin-bottom: 15px;
            }
            
            .btn-secondary {
                background: rgba(255, 255, 255, 0.1);
                color: #fff;
                border: 1px solid #555;
                padding: 12px 20px;
                border-radius: 8px;
                cursor: pointer;
                font-size: 0.9em;
                display: flex;
                align-items: center;
                gap: 8px;
                transition: all 0.3s ease;
                backdrop-filter: blur(10px);
            }
            
            .btn-secondary:hover {
                background: rgba(255, 255, 255, 0.2);
                border-color: #777;
                transform: translateY(-2px);
            }
            
            .btn-icon {
                font-size: 1.1em;
            }
            
            .footer-info {
                text-align: center;
            }
            
            .footer-info p {
                margin: 0;
                color: #666;
                font-size: 0.85em;
            }
            
            .hidden {
                display: none !important;
            }
            
            .qr-error {
                text-align: center;
                color: #f44336;
                animation: fadeIn 0.5s ease;
            }
            
            .error-icon {
                font-size: 3em;
                margin-bottom: 15px;
            }
            
            /* Mobile responsiveness */
            @media (max-width: 768px) {
                .modal-container {
                    margin: 10px;
                    max-height: 95vh;
                }
                
                .modal-header, .modal-body, .modal-footer {
                    padding: 20px;
                }
                
                .progress-steps {
                    gap: 5px;
                }
                
                .step span {
                    font-size: 0.7em;
                }
                
                .instruction-item {
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                }
                
                .footer-actions {
                    flex-direction: column;
                }
            }
        `;
        
        document.head.appendChild(style);
    }

    /**
     * Show loading state
     */
    showLoadingState() {
        this.updateProgress(25);
        this.setActiveStep(1);
    }

    /**
     * Display the real QR code
     */
    displayQRCode(qrData) {
        const qrLoading = document.getElementById('qr-loading');
        const qrDisplay = document.getElementById('qr-display');
        const qrImage = document.getElementById('qr-image');
        const qrTimer = document.getElementById('qr-timer');
        
        if (qrLoading) qrLoading.classList.add('hidden');
        if (qrDisplay) qrDisplay.classList.remove('hidden');
        
        // Set the real QR code image
        if (qrImage && qrData.qr_png) {
            qrImage.src = qrData.qr_png;
        }
        
        // Start countdown timer
        if (qrData.expires) {
            this.startCountdown(new Date(qrData.expires));
        }
        
        this.updateProgress(50);
        this.setActiveStep(2);
        
        this.currentQRData = qrData;
        console.log('✅ Real QR code displayed');
    }

    /**
     * Start connection monitoring
     */
    startConnectionMonitoring() {
        // Listen for Xaman events
        window.addEventListener('xamanQRSuccess', this.onConnectionSuccess.bind(this));
        window.addEventListener('xamanQRError', this.onConnectionError.bind(this));
        
        // Start pulse animation
        this.startPulseAnimation();
    }

    /**
     * Handle successful connection
     */
    onConnectionSuccess(event) {
        console.log('🎉 QR Modal: Connection successful');
        
        this.updateProgress(100);
        this.setActiveStep(4);
        
        const statusElement = document.getElementById('xaman-connection-status');
        if (statusElement) {
            statusElement.innerHTML = `
                <div class="status-signed">
                    <div class="checkmark-animation">✓</div>
                    <span>Wallet connected successfully!</span>
                </div>
            `;
        }
        
        // Close modal after short delay
        setTimeout(() => {
            this.hide();
        }, 2000);
    }

    /**
     * Handle connection error
     */
    onConnectionError(event) {
        console.error('❌ QR Modal: Connection error', event.detail);
        this.showError(event.detail.error);
    }

    /**
     * Show error state
     */
    showError(message) {
        const qrContainer = document.getElementById('qr-container');
        if (qrContainer) {
            qrContainer.innerHTML = `
                <div class="qr-error">
                    <div class="error-icon">⚠️</div>
                    <h4>Connection Failed</h4>
                    <p id="error-message">${message}</p>
                </div>
            `;
        }
    }

    /**
     * Refresh QR code
     */
    async refreshQR() {
        try {
            console.log('🔄 Refreshing QR code...');
            this.showLoadingState();
            
            // Cancel current connection
            if (window.xamanQR) {
                await window.xamanQR.cancelConnection();
            }
            
            // Generate new QR
            const qrData = await window.xamanQR.connectWallet();
            this.displayQRCode(qrData);
            
        } catch (error) {
            console.error('❌ Failed to refresh QR:', error);
            this.showError('Failed to refresh QR code: ' + error.message);
        }
    }

    /**
     * Update progress bar
     */
    updateProgress(percentage) {
        const progressFill = document.getElementById('connection-progress');
        if (progressFill) {
            progressFill.style.width = percentage + '%';
        }
    }

    /**
     * Set active step
     */
    setActiveStep(stepNumber) {
        // Remove active from all steps
        document.querySelectorAll('.step').forEach(step => {
            step.classList.remove('active', 'completed');
        });
        
        // Set completed for previous steps
        for (let i = 1; i < stepNumber; i++) {
            const step = document.getElementById(`step-${i}`);
            if (step) step.classList.add('completed');
        }
        
        // Set active for current step
        const activeStep = document.getElementById(`step-${stepNumber}`);
        if (activeStep) activeStep.classList.add('active');
    }

    /**
     * Start countdown timer
     */
    startCountdown(expiresAt) {
        const timerText = document.getElementById('timer-text');
        if (!timerText) return;
        
        const updateTimer = () => {
            const now = new Date();
            const timeLeft = expiresAt - now;
            
            if (timeLeft <= 0) {
                timerText.textContent = '0:00';
                this.showError('QR code expired. Please refresh to generate a new one.');
                return;
            }
            
            const minutes = Math.floor(timeLeft / 60000);
            const seconds = Math.floor((timeLeft % 60000) / 1000);
            timerText.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        };
        
        updateTimer();
        this.connectionTimeout = setInterval(updateTimer, 1000);
    }

    /**
     * Start pulse animation
     */
    startPulseAnimation() {
        const pulseDots = document.querySelectorAll('.pulse-dot');
        if (pulseDots.length > 0) {
            this.pulseInterval = setInterval(() => {
                pulseDots.forEach((dot, index) => {
                    setTimeout(() => {
                        dot.style.transform = 'scale(1.5)';
                        setTimeout(() => {
                            dot.style.transform = 'scale(1)';
                        }, 150);
                    }, index * 100);
                });
            }, 2000);
        }
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Close modal on backdrop click
        const backdrop = this.modal.querySelector('.modal-backdrop');
        if (backdrop) {
            backdrop.addEventListener('click', () => this.hide());
        }
        
        // Prevent modal close on container click
        const container = this.modal.querySelector('.modal-container');
        if (container) {
            container.addEventListener('click', (e) => e.stopPropagation());
        }
        
        // ESC key to close
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
    }

    /**
     * Handle keyboard events
     */
    handleKeyDown(event) {
        if (event.key === 'Escape') {
            this.hide();
        }
    }

    /**
     * Hide modal with animation
     */
    hide() {
        if (!this.modal) return;
        
        // Clean up
        this.cleanup();
        
        // Animate out
        this.modal.classList.remove('show');
        
        // Remove from DOM after animation
        setTimeout(() => {
            if (this.modal && this.modal.parentNode) {
                this.modal.parentNode.removeChild(this.modal);
            }
            this.modal = null;
        }, 300);
        
        // Remove event listeners
        document.removeEventListener('keydown', this.handleKeyDown.bind(this));
        window.removeEventListener('xamanQRSuccess', this.onConnectionSuccess.bind(this));
        window.removeEventListener('xamanQRError', this.onConnectionError.bind(this));
    }

    /**
     * Clean up timers and intervals
     */
    cleanup() {
        if (this.connectionTimeout) {
            clearInterval(this.connectionTimeout);
            this.connectionTimeout = null;
        }
        
        if (this.pulseInterval) {
            clearInterval(this.pulseInterval);
            this.pulseInterval = null;
        }
        
        // Cancel Xaman connection
        if (window.xamanQR) {
            window.xamanQR.cancelConnection();
        }
    }
}

// Initialize global instance
window.enhancedQRModal = new EnhancedQRModal();

console.log('🎨 Enhanced QR Modal with animations loaded');
