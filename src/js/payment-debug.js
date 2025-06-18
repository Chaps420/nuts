/**
 * Payment System Debug Helper
 * Adds console logging and error handling to help debug payment issues
 */

(function() {
    'use strict';
    
    console.log('🔍 Payment Debug Helper loaded');
    
    // Monitor when payment system loads
    let checkCount = 0;
    const maxChecks = 20;
    
    const checkPaymentSystem = () => {
        checkCount++;
        console.log(`🔍 Check #${checkCount}: window.xamanPayment =`, window.xamanPayment ? 'LOADED ✅' : 'NOT LOADED ❌');
        
        if (window.xamanPayment) {
            console.log('✅ Payment system details:', {
                type: typeof window.xamanPayment,
                constructor: window.xamanPayment.constructor.name,
                hasCreateContestPayment: typeof window.xamanPayment.createContestPayment === 'function',
                contestWallet: window.xamanPayment.contestWallet,
                nutsIssuer: window.xamanPayment.nutsIssuer
            });
            
            // Test if it's callable
            try {
                const testCall = window.xamanPayment.createContestPayment;
                console.log('✅ createContestPayment is callable');
            } catch (error) {
                console.error('❌ createContestPayment test failed:', error);
            }
        } else if (checkCount < maxChecks) {
            // Keep checking
            setTimeout(checkPaymentSystem, 500);
        } else {
            console.error('❌ Payment system failed to load after 10 seconds');
            
            // Check what scripts loaded
            const scripts = Array.from(document.scripts).map(s => s.src);
            console.log('📜 Loaded scripts:', scripts.filter(s => s.includes('xaman') || s.includes('payment')));
        }
    };
    
    // Start checking after DOM loads
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', checkPaymentSystem);
    } else {
        checkPaymentSystem();
    }
    
    // Override console.error to catch payment errors
    const originalError = console.error;
    console.error = function(...args) {
        if (args[0] && args[0].toString().includes('xamanPayment')) {
            console.log('🚨 PAYMENT ERROR DETECTED:', ...args);
            
            // Add visual error indicator
            const errorDiv = document.createElement('div');
            errorDiv.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #ff4444;
                color: white;
                padding: 15px;
                border-radius: 8px;
                z-index: 10000;
                max-width: 400px;
            `;
            errorDiv.innerHTML = `
                <strong>Payment Error:</strong><br>
                ${args[0]}<br>
                <small>Check console for details</small>
            `;
            document.body.appendChild(errorDiv);
            
            setTimeout(() => errorDiv.remove(), 10000);
        }
        
        // Call original console.error
        originalError.apply(console, args);
    };
    
    // Add global error handler for uncaught errors
    window.addEventListener('error', (event) => {
        if (event.message && event.message.includes('xamanPayment')) {
            console.log('🚨 UNCAUGHT PAYMENT ERROR:', event.message);
            console.log('📍 Error location:', event.filename, 'line', event.lineno);
        }
    });
    
    // Add button click interceptor
    document.addEventListener('click', (event) => {
        const target = event.target;
        if (target.id === 'enter-contest-btn' || target.textContent.includes('Enter Contest')) {
            console.log('🎯 Contest entry button clicked');
            console.log('💰 Payment system status:', window.xamanPayment ? 'Ready' : 'Not Ready');
            
            if (!window.xamanPayment) {
                event.preventDefault();
                event.stopPropagation();
                alert('Payment system not loaded! Please refresh the page and try again.');
            }
        }
    }, true);
    
    console.log('✅ Payment debug helper initialized');
    
})();