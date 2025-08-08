# Payment Flow Restoration

## Changes Made
Reverted the wallet connection requirement and restored the original **"payment-on-submission"** flow.

## What Was Removed

### 1. Wallet Connection UI Section
- Removed the entire wallet connection section from `daily-contest.html`
- No more "Connect Wallet" button
- No more wallet status display

### 2. Wallet Connection Logic  
- Removed `handleWalletConnection()` method
- Removed `onWalletConnected()` / `onWalletDisconnected()` methods
- Removed `updateWalletUI()` and `updateContestStatus()` methods
- Removed wallet connection event listeners

### 3. Script Dependencies
- Removed `xaman-wallet.js` script (no longer needed)
- Kept `xaman-payment-api.js` for payment processing

## Current Flow ✅

### Simple Contest Entry Process:
1. **Browse upcoming games** → Multi-day tabs show all available contests
2. **Make picks** → Click team buttons to select winners for all games  
3. **Enter tiebreaker** → Predict total runs in the last game
4. **Submit picks** → Click "Submit Your Picks" button
5. **💳 Payment QR appears** → `window.xamanPayment.createContestPayment()` shows QR modal
6. **Pay with Xaman** → Scan QR or use deeplink to pay 50 $NUTS
7. **Contest entered** → Entry stored in Firebase with transaction hash

### Key Benefits:
- ✅ **No wallet connection required upfront**
- ✅ **Simpler user experience** 
- ✅ **Payment happens only when submitting**
- ✅ **Works on all devices** (QR + deeplink)
- ✅ **Multi-day contest support maintained**

## Payment Integration
The payment system uses:
- **`xaman-payment-api.js`** → Creates XUMM payment requests
- **QR Code Modal** → Shows QR + deeplink for 50 $NUTS payment
- **Transaction tracking** → Stores txHash with contest entry

## Status: ✅ RESTORED
The original payment flow is now restored. Users can make picks and pay when they submit, without needing to connect wallet first.
