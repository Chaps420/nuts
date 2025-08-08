# Firebase Deployment Guide for NUTS Sports Pick'em

## Overview
This guide will help you deploy the Firebase Cloud Functions that enable auto-population of NUTS token details in Xaman payments.

## Prerequisites
1. Firebase CLI installed: `npm install -g firebase-tools`
2. Access to the Firebase project: `nuts-sports-pickem`
3. Node.js version 18 or higher

## Setup Steps

### 1. Initialize Firebase (if not already done)
```bash
cd /home/chaps/Documents/nuts-main
firebase login
firebase init
```

When prompted:
- Select "Functions" and "Firestore"
- Choose existing project: `nuts-sports-pickem`
- Use JavaScript for functions
- Use existing functions directory
- Install dependencies: Yes

### 2. Install Function Dependencies
```bash
cd functions
npm install
```

### 3. Configure XUMM API Keys (Security)
```bash
firebase functions:config:set xumm.api_key="14242c23-a236-43bd-9126-6490cbd4001d"
firebase functions:config:set xumm.api_secret="6b5d2831-aa58-4b5b-9b72-fe0f65de3e5c"
```

### 4. Deploy Functions
```bash
firebase deploy --only functions
```

## Functions Deployed

### 1. `createXummPayload`
- **Purpose**: Creates XUMM payment requests with NUTS token auto-population
- **URL**: `https://us-central1-nuts-sports-pickem.cloudfunctions.net/createXummPayload`
- **Usage**: Called by frontend when users enter contests

### 2. `xummWebhook`
- **Purpose**: Handles payment confirmations from XUMM
- **URL**: `https://us-central1-nuts-sports-pickem.cloudfunctions.net/xummWebhook`
- **Usage**: Webhook endpoint for XUMM to confirm payments

### 3. `getContestStats`
- **Purpose**: Get contest statistics and entries
- **URL**: `https://us-central1-nuts-sports-pickem.cloudfunctions.net/getContestStats`
- **Usage**: Admin interface to view contest data

### 4. `calculateWinners`
- **Purpose**: Calculate contest winners and distribute prizes
- **URL**: `https://us-central1-nuts-sports-pickem.cloudfunctions.net/calculateWinners`
- **Usage**: Called after games complete to determine winners

## Frontend Integration

Update your Firebase integration to use the deployed functions:

```javascript
// In src/js/firebase-xaman-integration.js
if (window.firebaseIntegration.functions) {
    const createPayload = window.firebaseIntegration.functions.httpsCallable('createXummPayload');
    const result = await createPayload({
        amount: 50,
        currency: 'NUTS',
        destination: 'rN2K1Tv6LEM94YN8Kxfe3QyWcGPQNgsD6d',
        issuer: 'rBpdegD7kqHdczjKzTKNEUZj1Fg1eYZRbe',
        memo: 'Contest Entry',
        userId: contestEntry.userId,
        contestDay: contestEntry.contestDay
    });
    
    if (result.data && result.data.xamanUrl) {
        // This URL will have NUTS token details pre-filled!
        console.log('Xaman URL with NUTS auto-population:', result.data.xamanUrl);
    }
}
```

## Benefits of Deployment

1. **Auto-Population**: NUTS token details are automatically filled in Xaman
2. **Better UX**: Users don't need to manually find and select NUTS token
3. **Reduced Errors**: No more "NaN XRP" or wrong currency issues
4. **Real Payment Tracking**: Payments are tracked in Firebase with webhooks
5. **Contest Integration**: Automatic contest entry creation after payment

## Testing

After deployment, test the integration:

1. Go to the daily contest page
2. Make picks for all games
3. Click "Enter Contest"
4. The QR code should open Xaman with NUTS pre-selected and 50 NUTS amount pre-filled

## Monitoring

Monitor function execution:
```bash
firebase functions:log
```

View function URLs:
```bash
firebase functions:list
```

## Troubleshooting

### Common Issues

1. **Function deployment fails**
   - Check Node.js version: `node --version` (should be 18+)
   - Check Firebase CLI version: `firebase --version`

2. **XUMM API errors**
   - Verify API keys are set correctly
   - Check XUMM API quota limits

3. **Frontend not calling functions**
   - Ensure Firebase is initialized in frontend
   - Check browser console for errors
   - Verify function URLs in network tab

### Logs and Debugging

```bash
# View function logs
firebase functions:log --only createXummPayload

# View all logs
firebase functions:log

# Test functions locally
cd functions
npm run serve
```

## Security Notes

- API keys are stored securely in Firebase Functions config
- Never commit API keys to version control
- Functions run in a secure Google Cloud environment
- All payments are verified through XUMM webhooks

## Next Steps

1. Deploy the functions using the commands above
2. Test the NUTS auto-population in Xaman
3. Monitor the admin dashboard for contest entries
4. Set up automated game result updates for winner calculation

The Firebase integration will now provide seamless NUTS token payments with auto-population, solving the "NaN XRP" issue and improving the user experience significantly.