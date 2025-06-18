# Admin Payout System Guide

## Overview
The admin payout system allows contest administrators to pay winners their prizes in NUTS tokens. The system provides both manual and automated (QR code) payout options.

## Features Implemented

### 1. Wallet Address Capture
- **During Contest Entry**: When a user pays the 50 NUTS entry fee, their wallet address is automatically captured from the payment transaction
- **Storage**: Wallet addresses are stored with each contest entry in the database
- **Display**: Admin panel shows truncated wallet addresses (first 8 and last 4 characters) with full address on hover

### 2. Admin Panel Enhancements
- **Pay Winner Button**: Appears next to winning entries with prize amounts > 0
- **Wallet Column**: New column displays contestant wallet addresses
- **Export**: CSV export includes wallet addresses for record keeping

### 3. Payout Modal
When clicking "Pay Winner", admins see:
- Winner details (name, prize amount, contest date, score)
- Two payout options:
  1. **Manual Payment Instructions**
  2. **QR Code Generation**

### 4. Manual Payout Option
Provides step-by-step instructions:
- Recipient wallet address (if captured)
- Prize amount in NUTS
- Contest date for memo
- Instructions for sending via Xaman wallet
- "Mark as Complete" button to track payout

### 5. QR Code Payout Option
- Generates a QR code for the exact payout amount
- Pre-fills destination wallet and memo
- Admin scans with their Xaman wallet to send
- Automatic tracking when payment completes
- Error handling if wallet address not available

### 6. Payout Tracking
- Payout status stored in database
- Timestamp recorded when payout completed
- Admin can mark manual payouts as complete

## Technical Implementation

### Files Modified:
1. **xumm-server.js**: Updated to support destination parameter for payouts
2. **xaman-payment-api.js**: Captures wallet address from payment response
3. **firebase-xaman-integration.js**: Stores wallet address with contest entry
4. **contest-backend.js**: Added wallet address field to entry schema
5. **admin-contest.html**: Added payout UI and wallet display
6. **contest-results.html**: Shows winner announcements

### Database Schema:
```javascript
contest_entry: {
  id: string,
  userName: string,
  twitterHandle: string,      // Optional social handle
  walletAddress: string,       // Captured from payment
  contestDate: string,
  picks: object,
  score: number,
  prizeWon: number,
  payoutStatus: string,        // 'pending' | 'completed'
  payoutTimestamp: string
}
```

## Usage Instructions

### For Admins:
1. Navigate to Admin Contest page
2. Select contest date and click "Load Data"
3. Run "Calculate Winners" to determine contest winners
4. Click "Pay Winner" button next to winning entries
5. Choose manual or QR code payment method
6. Complete payment and mark as done

### Testing:
A test page is available at `/test-payout.html` to:
- Test wallet address capture during payment
- Test payout QR generation with custom addresses

## Edge Cases Handled:
- Missing wallet addresses (older entries)
- Failed QR generation
- Network errors
- Manual payout tracking

## Future Enhancements:
- Automated payout scheduling
- Batch payouts for multiple winners
- Payout history/audit trail
- Email notifications to winners