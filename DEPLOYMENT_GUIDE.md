# Firebase Functions Deployment Guide - NUTS Payment System

## Prerequisites ✅
- [x] Firebase project created: `nuts-7b133`
- [x] Functions code ready in `/functions` directory
- [x] Dependencies installed
- [x] Firebase configuration files created

## Deployment Steps 🚀

### 1. Open Terminal
Navigate to your project directory:
```bash
cd /home/chaps/Documents/nuts-main
```

### 2. Login to Firebase
```bash
npx firebase login
```
This will open a browser window. Log in with the Google account associated with your Firebase project.

### 3. Deploy Functions
```bash
npx firebase deploy --only functions
```

This will deploy:
- `createXummPayment` - Creates pre-filled payment requests
- `checkXummPayment` - Monitors payment status
- `xummWebhook` - Receives payment confirmations

### 4. Update Frontend
After successful deployment, update `daily-contest.html`:
```html
<!-- Change this line: -->
<script src="src/js/xaman-payment-only.js"></script>
<!-- To: -->
<script src="src/js/xaman-payment-firebase.js"></script>
```

## Expected Output 📋
```
=== Deploying to 'nuts-7b133'...

i  deploying functions
i  functions: ensuring required API cloudfunctions.googleapis.com is enabled...
i  functions: ensuring required API cloudbuild.googleapis.com is enabled...
✔  functions: required API cloudfunctions.googleapis.com is enabled
✔  functions: required API cloudbuild.googleapis.com is enabled
i  functions: preparing functions directory for uploading...
i  functions: packaged functions (XXX KB) for uploading
✔  functions: functions folder uploaded successfully
i  functions: creating Node.js 18 function createXummPayment(us-central1)...
i  functions: creating Node.js 18 function checkXummPayment(us-central1)...
i  functions: creating Node.js 18 function xummWebhook(us-central1)...
✔  functions[createXummPayment(us-central1)]: Successful create operation.
✔  functions[checkXummPayment(us-central1)]: Successful create operation.
✔  functions[xummWebhook(us-central1)]: Successful create operation.

✔  Deploy complete!
```

## Troubleshooting 🔧

### If you get permission errors:
```bash
firebase projects:list
```
Make sure `nuts-7b133` is listed.

### If functions fail to deploy:
1. Check Node.js version: `node --version` (should be 18+)
2. Check functions logs: `npx firebase functions:log`

### If CORS errors persist after deployment:
The functions are already configured with CORS headers. The errors should disappear once deployed.

## Testing 🧪

1. Open your app
2. Make 10 picks
3. Click "Submit Your Picks"
4. You should see:
   - Official XUMM QR code
   - When scanned: **50 NUTS pre-filled** ✅
   - Real-time payment status updates

## What's Different Now? 🎯

Before (Simple URL):
- ❌ Opens Xaman but user must manually select NUTS and enter 50

After (Firebase Functions):
- ✅ Opens Xaman with 50 NUTS pre-filled
- ✅ Real-time payment tracking
- ✅ Official XUMM integration
- ✅ Secure API key handling

## Need Help?
- Firebase Console: https://console.firebase.google.com/project/nuts-7b133
- Function Logs: `npx firebase functions:log`
- XUMM Dashboard: https://apps.xumm.dev/