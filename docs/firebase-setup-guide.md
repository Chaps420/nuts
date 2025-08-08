# Firebase Setup Guide for NUTS Sports Pick'em

This guide walks you through setting up Firebase for the NUTS Sports Pick'em platform.

## 🔥 Firebase Project Setup

### 1. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Name it "nuts-sports-pickems" (or your preferred name)
4. Enable Google Analytics (optional)
5. Create project

### 2. Enable Authentication
1. In Firebase Console, go to **Authentication**
2. Click **Get Started**
3. Go to **Sign-in method** tab
4. Enable **Custom** authentication (for Xaman integration)

### 3. Set up Firestore Database
1. Go to **Firestore Database**
2. Click **Create database**
3. Choose **Start in test mode** (for development)
4. Select your preferred location
5. Create database

### 4. Configure Web App
1. Go to **Project Settings** (gear icon)
2. Scroll to **Your apps** section
3. Click **Web app** icon (`</>`)
4. Register app name: "nuts-contest-web"
5. Copy the Firebase config object

### 5. Update Configuration
Replace the placeholder values in `config/config-browser.js`:

```javascript
firebase: {
    apiKey: "your-actual-firebase-api-key",
    authDomain: "your-project-id.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project-id.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:your-app-id"
}
```

## 🛠️ Cloud Functions Setup

### 1. Install Firebase CLI
```bash
npm install -g firebase-tools
```

### 2. Login to Firebase
```bash
firebase login
```

### 3. Initialize Functions
```bash
cd functions
firebase init functions
```
- Select your Firebase project
- Choose JavaScript
- Install dependencies

### 4. Deploy Functions
```bash
firebase deploy --only functions
```

## 📊 Firestore Collections Structure

The system automatically creates these collections:

### `users` Collection
```javascript
{
  xrplAddress: "rUserXRPLAddress...",
  createdAt: timestamp,
  lastLoginAt: timestamp,
  totalBets: 0,
  totalWins: 0,
  totalNutsWon: 0,
  authMethod: "xaman",
  payloadHistory: ["payload-id-1", "payload-id-2"]
}
```

### `bets` Collection
```javascript
{
  userId: "firebase-user-id",
  userAddress: "rUserXRPLAddress...",
  contestId: "contest-0-2025-06-10",
  gameId: "game-123",
  selection: "home", // or "away"
  selectedTeam: "Yankees",
  opposingTeam: "Red Sox",
  odds: "-150",
  amount: 100,
  txHash: "transaction-hash",
  timestamp: timestamp,
  status: "pending", // "resolved"
  result: null // "win", "loss", "push"
}
```

### `payouts` Collection
```javascript
{
  recipientAddress: "rWinnerAddress...",
  amount: 200,
  contestId: "contest-0-2025-06-10",
  memo: "NUTS Prize - Contest contest-0-2025-06-10",
  payloadId: "payout-12345",
  createdAt: timestamp,
  status: "pending"
}
```

## 🚀 Testing the Integration

### 1. Test User Authentication
1. Open `daily-contest.html`
2. Click "Connect Wallet"
3. Complete Xaman authentication
4. Check Firebase Console > Authentication for new user

### 2. Test Bet Creation
1. Make picks in the contest
2. Click "Enter Contest"
3. Complete entry fee transaction
4. Check Firestore > bets collection for new bet documents

### 3. Test Admin Portal
1. Open `firebase-admin-portal.html`
2. Click "Load All Bets"
3. Verify bets display correctly
4. Test "Generate Payout QR" functionality

## 🔒 Security Rules

### Firestore Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Users can create bets, admins can read all
    match /bets/{betId} {
      allow create: if request.auth != null;
      allow read: if request.auth != null;
      allow update: if request.auth != null; // For admin resolution
    }
    
    // Only authenticated users can read payouts
    match /payouts/{payoutId} {
      allow read: if request.auth != null;
    }
  }
}
```

## 📱 Admin Functions

### Key Admin Capabilities:
- **Load All Bets**: View all user bets across contests
- **Resolve Contests**: Mark bets as win/loss based on game results
- **Generate Payout QRs**: Create Xaman QR codes to send NUTS to winners
- **User Management**: View user stats and betting history

### Admin Portal Features:
- Real-time bet monitoring
- Contest resolution tools
- Manual payout QR generation
- User search and statistics

## 🔧 Development vs Production

### Development Mode
- Uses CORS-aware simulation for Xaman API
- Simulated Firebase Cloud Functions
- Local development testing

### Production Mode
- Real Xaman API integration
- Deployed Firebase Cloud Functions
- Live Firestore database
- Production security rules

## 🌐 Environment Variables

For production deployment, set these environment variables in your hosting platform:

```
FIREBASE_API_KEY=your-firebase-api-key
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_PROJECT_ID=your-project-id
XAMAN_API_KEY=your-xaman-api-key
XAMAN_API_SECRET=your-xaman-api-secret
```

## 📈 Monitoring and Analytics

1. **Firebase Console**: Monitor authentication, database usage
2. **Functions Logs**: Check Cloud Function execution logs
3. **Performance**: Monitor response times and errors
4. **Usage**: Track bet volume and user growth

## ⚠️ Important Notes

1. **API Keys**: Never expose Firebase private keys in client-side code
2. **Security**: Configure proper Firestore security rules before production
3. **Scaling**: Monitor Firestore read/write limits as user base grows
4. **Backup**: Set up regular Firestore backups for data protection

## 🆘 Troubleshooting

### Common Issues:
- **CORS Errors**: Expected in development, handled by fallback simulation
- **Authentication Failures**: Check Firebase config and Xaman API keys
- **Permission Denied**: Update Firestore security rules
- **Functions Not Deploying**: Check Firebase CLI authentication

### Debug Tools:
- Browser console for client-side errors
- Firebase Console for backend monitoring
- Network tab for API call inspection

This setup provides a robust, scalable backend for the NUTS Sports Pick'em platform with real-time data synchronization and secure user management.
