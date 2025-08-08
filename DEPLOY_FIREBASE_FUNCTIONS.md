# Firebase Functions Deployment Guide

This guide will help you deploy the Firebase Functions that enable pre-filled XUMM/Xaman payments.

## Prerequisites

1. Firebase CLI installed: `npm install -g firebase-tools`
2. Firebase project created and configured
3. Node.js 18 or higher

## Setup Steps

### 1. Initialize Firebase Functions

```bash
# From the project root
firebase init functions

# Select:
# - Use an existing project
# - JavaScript
# - Yes to ESLint (optional)
# - Yes to install dependencies
```

### 2. Install Dependencies

```bash
cd functions
npm install
```

### 3. Set Firebase Config

Set your XUMM API credentials as Firebase environment variables:

```bash
firebase functions:config:set xumm.api_key="14242c23-a236-43bd-9126-6490cbd4001d"
firebase functions:config:set xumm.api_secret="6b5d2831-aa58-4b5b-9b72-fe0f65de3e5c"
```

### 4. Deploy Functions

```bash
# Deploy only functions
firebase deploy --only functions

# Or deploy specific functions
firebase deploy --only functions:createXummPayment,functions:checkXummPayment
```

### 5. Update CORS Settings (if needed)

If you encounter CORS issues, update your Firebase project settings to allow your domain.

## How It Works

1. **User submits picks** → Browser calls `createXummPayment` function
2. **Function creates XUMM payload** → Returns QR code and payment URL
3. **User scans QR** → Opens in Xaman with all fields pre-filled:
   - Amount: 50
   - Currency: NUTS
   - Destination: Contest wallet
4. **User confirms** → Payment is sent
5. **Function monitors status** → Updates UI when complete

## Testing

1. Test locally with emulator:
```bash
firebase emulators:start --only functions
```

2. Update your frontend to use local functions:
```javascript
firebase.functions().useEmulator("localhost", 5001);
```

## Benefits

- ✅ All payment fields pre-filled (50 NUTS)
- ✅ No manual entry required
- ✅ Real-time payment status
- ✅ Secure server-side API handling
- ✅ Transaction tracking in Firestore

## Troubleshooting

1. **Function timeout**: Increase timeout in function config
2. **CORS errors**: Add your domain to Firebase allowed origins
3. **API errors**: Check XUMM API key and secret are correct
4. **Payment not pre-filled**: Ensure contest wallet has NUTS trustline

## Next Steps

After deployment:
1. Test the payment flow end-to-end
2. Monitor Firebase Functions logs
3. Set up webhook URL in XUMM dashboard (optional)