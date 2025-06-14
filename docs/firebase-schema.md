# Firebase Database Schema for $NUTS Sports Pick'em

This document outlines the Firebase Firestore database structure for the $NUTS Sports Pick'em platform.

## Collections Overview

### 1. Contests
Collection: `contests`

Document structure:
```json
{
  "id": "daily_2024-12-08",
  "type": "daily|weekly",
  "title": "Daily Sports Pick'em - December 8, 2024",
  "description": "Pick winners for today's top games",
  "entryFee": 50,
  "prizePool": 3750,
  "maxEntries": 1000,
  "entries": 75,
  "status": "open|locked|completed|cancelled",
  "startTime": "2024-12-08T00:00:00Z",
  "endTime": "2024-12-08T23:59:59Z",
  "lockTime": "2024-12-08T18:00:00Z",
  "games": [
    {
      "id": "game_1",
      "homeTeam": "Lakers",
      "awayTeam": "Warriors",
      "homeCity": "Los Angeles",
      "awayCity": "Golden State",
      "sport": "basketball",
      "startTime": "2024-12-08T20:00:00Z",
      "homeOdds": -110,
      "awayOdds": +105,
      "status": "scheduled|live|completed|cancelled",
      "winner": null,
      "homeScore": null,
      "awayScore": null
    }
  ],
  "requiresNFT": false,
  "prizeDistribution": {
    "first": 0.5,
    "second": 0.3,
    "third": 0.2
  },
  "createdAt": "2024-12-08T12:00:00Z",
  "updatedAt": "2024-12-08T15:30:00Z",
  "createdBy": "admin",
  "completedAt": null
}
```

### 2. Entries
Collection: `entries`

Document structure:
```json
{
  "id": "entry_123456789",
  "contestId": "daily_2024-12-08",
  "contestType": "daily|weekly",
  "userId": "user_abc123",
  "walletAddress": "rABC123DEF456GHI789JKL012MNO345PQR678STU",
  "picks": [
    {
      "gameId": "game_1",
      "selectedTeam": "Lakers",
      "confidence": 8,
      "isCorrect": null,
      "points": 0
    }
  ],
  "score": 0,
  "rank": null,
  "prize": 0,
  "status": "active|scoring|completed|disqualified",
  "entryFee": 50,
  "txHash": "ABC123DEF456...",
  "nftVerified": false,
  "submittedAt": "2024-12-08T17:30:00Z",
  "scoredAt": null,
  "paidOut": false,
  "payoutTxHash": null
}
```

### 3. Users
Collection: `users`

Document structure:
```json
{
  "id": "user_abc123",
  "walletAddress": "rABC123DEF456GHI789JKL012MNO345PQR678STU",
  "username": "SquirrelMaster",
  "email": null,
  "verified": false,
  "totalEntries": 25,
  "totalWinnings": 1250,
  "contestsWon": 3,
  "bestRank": 1,
  "averageScore": 6.8,
  "favoriteTeams": ["Lakers", "Cowboys"],
  "nftHoldings": [
    {
      "tokenId": "NFT123",
      "collection": "NUTS_MLB",
      "team": "Dodgers",
      "rarity": "rare",
      "verifiedAt": "2024-12-08T10:00:00Z"
    }
  ],
  "preferences": {
    "notifications": true,
    "emailUpdates": false,
    "theme": "dark"
  },
  "stats": {
    "winRate": 0.15,
    "averageScore": 6.8,
    "bestStreak": 5,
    "currentStreak": 2
  },
  "createdAt": "2024-11-15T09:00:00Z",
  "lastActive": "2024-12-08T17:45:00Z",
  "banned": false,
  "banReason": null
}
```

### 4. Leaderboards
Collection: `leaderboards`

Document structure:
```json
{
  "id": "daily_2024-12-08",
  "contestId": "daily_2024-12-08",
  "contestType": "daily",
  "rankings": [
    {
      "rank": 1,
      "userId": "user_abc123",
      "walletAddress": "rABC123...",
      "username": "SquirrelMaster",
      "score": 9,
      "correctPicks": 9,
      "totalPicks": 10,
      "prize": 1875,
      "entryId": "entry_123456789",
      "tieBreaker": null
    }
  ],
  "totalEntries": 75,
  "prizePool": 3750,
  "lastUpdated": "2024-12-08T23:00:00Z",
  "finalized": false,
  "payoutsCompleted": false
}
```

### 5. Games
Collection: `games`

Document structure:
```json
{
  "id": "game_20241208_LAL_GSW",
  "externalId": "odds_api_12345",
  "homeTeam": "Lakers",
  "awayTeam": "Warriors",
  "homeCity": "Los Angeles",
  "awayCity": "Golden State",
  "sport": "basketball",
  "league": "NBA",
  "startTime": "2024-12-08T20:00:00Z",
  "status": "scheduled|live|completed|cancelled|postponed",
  "homeScore": null,
  "awayScore": null,
  "winner": null,
  "period": null,
  "timeRemaining": null,
  "odds": {
    "home": -110,
    "away": +105,
    "spread": -2.5,
    "total": 225.5,
    "moneylineHome": -140,
    "moneylineAway": +120
  },
  "venue": "Crypto.com Arena",
  "weather": null,
  "injuries": [],
  "lastUpdated": "2024-12-08T19:55:00Z",
  "contestsUsed": ["daily_2024-12-08"],
  "pickCount": {
    "home": 45,
    "away": 30
  }
}
```

### 6. Transactions
Collection: `transactions`

Document structure:
```json
{
  "id": "tx_123456789",
  "type": "entry_payment|prize_payout|refund",
  "txHash": "ABC123DEF456GHI789JKL012MNO345PQR678STU901VWX234YZ",
  "fromWallet": "rABC123...",
  "toWallet": "rDEF456...",
  "amount": 50,
  "currency": "NUTS",
  "status": "pending|confirmed|failed",
  "contestId": "daily_2024-12-08",
  "entryId": "entry_123456789",
  "userId": "user_abc123",
  "memo": "Daily Contest Entry",
  "blockNumber": 12345678,
  "confirmations": 6,
  "fee": 0.1,
  "createdAt": "2024-12-08T17:30:00Z",
  "confirmedAt": "2024-12-08T17:35:00Z",
  "failedReason": null
}
```

### 7. Admin Logs
Collection: `admin_logs`

Document structure:
```json
{
  "id": "log_123456789",
  "action": "contest_created|game_scored|user_banned|payout_processed",
  "adminId": "admin_user_123",
  "targetType": "contest|entry|user|game",
  "targetId": "daily_2024-12-08",
  "details": {
    "oldValue": null,
    "newValue": "completed",
    "reason": "All games completed"
  },
  "timestamp": "2024-12-08T23:30:00Z",
  "ipAddress": "192.168.1.100"
}
```

## Security Rules

### Firestore Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Contests - read-only for users
    match /contests/{contestId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.token.admin == true;
    }
    
    // Entries - users can create their own, read leaderboard data
    match /entries/{entryId} {
      allow read: if true;
      allow create: if request.auth != null && 
                   request.auth.uid == resource.data.userId;
      allow update, delete: if request.auth != null && 
                           request.auth.token.admin == true;
    }
    
    // Users - users can read/update their own profile
    match /users/{userId} {
      allow read, write: if request.auth != null && 
                        request.auth.uid == userId;
      allow read: if request.auth != null && 
                 request.auth.token.admin == true;
    }
    
    // Leaderboards - read-only
    match /leaderboards/{leaderboardId} {
      allow read: if true;
      allow write: if request.auth != null && 
                  request.auth.token.admin == true;
    }
    
    // Games - read-only for users
    match /games/{gameId} {
      allow read: if true;
      allow write: if request.auth != null && 
                  request.auth.token.admin == true;
    }
    
    // Transactions - read-only, admin write
    match /transactions/{txId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
                  request.auth.token.admin == true;
    }
    
    // Admin logs - admin only
    match /admin_logs/{logId} {
      allow read, write: if request.auth != null && 
                        request.auth.token.admin == true;
    }
  }
}
```

## Indexes

### Composite Indexes Required

1. **Entries by Contest and Score**
   - Collection: `entries`
   - Fields: `contestId` (Ascending), `score` (Descending)

2. **Entries by User and Date**
   - Collection: `entries`
   - Fields: `userId` (Ascending), `submittedAt` (Descending)

3. **Games by Sport and Start Time**
   - Collection: `games`
   - Fields: `sport` (Ascending), `startTime` (Ascending)

4. **Contests by Type and Status**
   - Collection: `contests`
   - Fields: `type` (Ascending), `status` (Ascending), `startTime` (Descending)

5. **Transactions by User and Date**
   - Collection: `transactions`
   - Fields: `userId` (Ascending), `createdAt` (Descending)

## Cloud Functions

### Required Cloud Functions

1. **scoreContest** - Automatically score completed games and update leaderboards
2. **processPayouts** - Handle prize distributions to winners
3. **updateGameResults** - Sync game results from The Odds API
4. **validateNFTHoldings** - Verify user NFT ownership for weekly contests
5. **sendNotifications** - Send push notifications for contest updates
6. **cleanupExpiredData** - Archive old contests and entries

### Environment Variables for Cloud Functions

```bash
ODDS_API_KEY=your_odds_api_key
XRPL_SERVER=wss://xrplcluster.com/
XRPL_CONTEST_WALLET_SEED=your_contest_wallet_seed
FIREBASE_PROJECT_ID=your_project_id
NFT_COLLECTION_ADDRESS=your_nft_collection_address
ADMIN_WALLET_ADDRESS=your_admin_wallet
```

## Migration Scripts

When deploying to production, use these scripts to set up initial data:

1. **setup-admin-user.js** - Create admin user with proper permissions
2. **import-teams.js** - Import team data and logos
3. **setup-contests.js** - Create initial contest templates
4. **migrate-test-data.js** - Import any test data if needed

## Monitoring and Analytics

### Key Metrics to Track

1. Daily active users
2. Contest participation rates
3. Average entry fees collected
4. Prize payout amounts
5. User retention rates
6. Game prediction accuracy
7. NFT holder engagement
8. Transaction success rates

### Alerts to Set Up

1. Failed transactions
2. Contest scoring errors
3. High error rates in Cloud Functions
4. Unusual betting patterns
5. Low contest participation
6. API rate limit approaching

## Backup Strategy

1. **Daily Firestore backups** to Cloud Storage
2. **Weekly full exports** for disaster recovery
3. **Real-time replication** to secondary region
4. **Encrypted backups** of sensitive wallet data
5. **Version control** for security rules and functions

This schema provides a solid foundation for the $NUTS Sports Pick'em platform with room for future enhancements and scaling.
