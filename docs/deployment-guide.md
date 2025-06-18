# Deployment Guide for $NUTS Sports Pick'em

This guide walks through deploying the $NUTS Sports Pick'em platform to production.

## Prerequisites

### Required Accounts and Services

1. **Firebase Project**
   - Create a new Firebase project at https://console.firebase.google.com
   - Enable Firestore Database
   - Enable Authentication (Anonymous auth)
   - Enable Cloud Functions
   - Enable Cloud Storage

2. **The Odds API Account**
   - Sign up at https://the-odds-api.com
   - Get API key for sports data
   - Choose appropriate tier (free tier provides limited requests)

3. **XRPL Wallet**
   - Create a contest wallet for receiving entry fees
   - Create an admin wallet for prize distributions
   - Fund wallets with sufficient XRP for transaction fees

4. **Domain and Hosting**
   - Domain name for the platform
   - Web hosting service (Vercel, Netlify, or Firebase Hosting)
   - SSL certificate (usually provided by hosting service)

### Development Tools

1. **Node.js** (v18 or higher)
2. **Firebase CLI** (`npm install -g firebase-tools`)
3. **Git** for version control
4. **VS Code** or preferred editor

## Environment Setup

### 1. Clone and Setup Project

```bash
git clone <your-repo-url>
cd nuts-sports-pickem
npm install
```

### 2. Firebase Configuration

1. **Initialize Firebase in your project:**
```bash
firebase login
firebase init
```

2. **Select these Firebase features:**
   - Firestore: Configure security rules and indexes
   - Functions: Configure Cloud Functions
   - Hosting: Configure files for Firebase Hosting
   - Storage: Configure security rules for Cloud Storage

3. **Create production environment file:**
```bash
cp .env.example .env.production
```

4. **Update `.env.production` with real values:**
```env
# The Odds API Configuration
VITE_ODDS_API_KEY=your_actual_odds_api_key
VITE_ODDS_API_BASE_URL=https://api.the-odds-api.com/v4

# XRPL Configuration
VITE_XRPL_SERVER=wss://xrplcluster.com/
VITE_CONTEST_WALLET_ADDRESS=rYourContestWalletAddress
VITE_ADMIN_WALLET_ADDRESS=rYourAdminWalletAddress

# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123456

# Contest Configuration
VITE_DAILY_ENTRY_FEE=50
VITE_MAX_PICKS=10
VITE_PRIZE_DISTRIBUTION_FIRST=0.5
VITE_PRIZE_DISTRIBUTION_SECOND=0.3
VITE_PRIZE_DISTRIBUTION_THIRD=0.2

# NFT Configuration
VITE_NFT_COLLECTION_URL=https://xrp.cafe/collection/nutsmlb
VITE_NFT_ISSUER_ADDRESS=rNFTIssuerWalletAddress

# Platform Configuration
VITE_PLATFORM_NAME=$NUTS Sports Pick'em
VITE_PLATFORM_URL=https://your-domain.com
VITE_SUPPORT_EMAIL=support@your-domain.com
```

### 3. Firestore Setup

1. **Deploy Firestore rules:**
```bash
firebase deploy --only firestore:rules
```

2. **Create required indexes:**
```bash
firebase deploy --only firestore:indexes
```

3. **Set up security rules** (see `docs/firebase-schema.md` for complete rules)

### 4. Cloud Functions Setup

1. **Navigate to functions directory:**
```bash
cd functions
npm install
```

2. **Set environment variables for functions:**
```bash
firebase functions:config:set \
  odds.api_key="your_odds_api_key" \
  xrpl.server="wss://xrplcluster.com/" \
  xrpl.contest_wallet_seed="your_contest_wallet_seed" \
  xrpl.admin_wallet_seed="your_admin_wallet_seed" \
  contest.daily_entry_fee=50 \
  contest.max_picks=10 \
  nft.collection_address="your_nft_collection_address"
```

3. **Deploy Cloud Functions:**
```bash
firebase deploy --only functions
```

## Production Deployment

### 1. Build Production Assets

```bash
npm run build
```

### 2. Deploy to Firebase Hosting

```bash
firebase deploy --only hosting
```

### 3. Set Custom Domain (Optional)

1. In Firebase Console, go to Hosting
2. Click "Add custom domain"
3. Follow DNS setup instructions
4. Wait for SSL certificate provisioning

### 4. Verify Deployment

1. **Test wallet connection**
2. **Test contest entry flow**
3. **Verify API integrations**
4. **Check database writes**
5. **Test NFT verification**

## Post-Deployment Configuration

### 1. Admin User Setup

Create an admin user with elevated permissions:

```javascript
// Run in Firebase Console or Cloud Functions
const admin = require('firebase-admin');
const auth = admin.auth();

await auth.setCustomUserClaims(adminUserId, { admin: true });
```

### 2. Initial Data Import

1. **Import team data:**
```bash
node scripts/import-teams.js
```

2. **Create contest templates:**
```bash
node scripts/setup-contests.js
```

3. **Verify game data sync:**
```bash
node scripts/test-odds-api.js
```

### 3. Monitoring Setup

1. **Enable Firebase Performance Monitoring**
2. **Set up Firestore monitoring rules**
3. **Configure error reporting**
4. **Set up uptime monitoring**

### 4. Analytics Configuration

1. **Google Analytics 4** for user behavior
2. **Firebase Analytics** for app-specific events
3. **Custom dashboard** for contest metrics

## Security Checklist

### 1. Environment Variables
- [ ] All sensitive data in environment variables
- [ ] No API keys in client-side code
- [ ] Environment files excluded from version control

### 2. Firebase Security
- [ ] Firestore security rules implemented
- [ ] Authentication enabled
- [ ] Admin-only functions protected
- [ ] Rate limiting configured

### 3. XRPL Security
- [ ] Wallet seeds stored securely
- [ ] Transaction signing server-side only
- [ ] Multi-signature wallet for large funds
- [ ] Regular security audits

### 4. API Security
- [ ] Rate limiting on all endpoints
- [ ] Input validation and sanitization
- [ ] CORS properly configured
- [ ] API key rotation schedule

## Maintenance Tasks

### Daily
- [ ] Monitor contest entry volumes
- [ ] Check for failed transactions
- [ ] Verify game data accuracy
- [ ] Review error logs

### Weekly
- [ ] Process NFT holder contest
- [ ] Update leaderboards
- [ ] Backup critical data
- [ ] Review user feedback

### Monthly
- [ ] Security audit
- [ ] Performance optimization
- [ ] Cost analysis
- [ ] Feature usage review

## Troubleshooting

### Common Issues

1. **Wallet Connection Failed**
   - Check XUMM app configuration
   - Verify XRPL server connectivity
   - Confirm wallet address format

2. **Contest Entry Failed**
   - Verify user $NUTS balance
   - Check transaction fees
   - Confirm contest is open

3. **NFT Verification Failed**
   - Check NFT collection address
   - Verify wallet holds required NFT
   - Confirm network connectivity

4. **Game Data Not Loading**
   - Check The Odds API status
   - Verify API key and limits
   - Check Firebase Functions logs

### Emergency Procedures

1. **Contest Cancellation**
   - Update contest status to "cancelled"
   - Process refunds to all participants
   - Notify users via email/notification

2. **Security Breach**
   - Immediately disable affected functions
   - Rotate all API keys and passwords
   - Audit all transactions
   - Notify users of any data exposure

3. **System Downtime**
   - Switch to maintenance mode
   - Redirect to status page
   - Monitor system recovery
   - Communicate with users

## Performance Optimization

### 1. Caching Strategy
- Cache game data for 15 minutes
- Cache leaderboards for 5 minutes
- Use CDN for static assets
- Implement browser caching

### 2. Database Optimization
- Use compound indexes for queries
- Implement pagination for large datasets
- Archive old contest data
- Optimize security rules

### 3. Frontend Optimization
- Code splitting for route-based loading
- Image optimization and lazy loading
- Minify and compress assets
- Use service workers for offline support

## Support and Documentation

### User Support
- Comprehensive FAQ section
- Video tutorials for wallet setup
- Live chat support (optional)
- Community Discord/Telegram

### Developer Documentation
- API documentation
- Database schema reference
- Security guidelines
- Contribution guidelines

## Legal Considerations

### Terms of Service
- Age verification (18+)
- Prohibited jurisdictions
- Dispute resolution process
- Prize distribution terms

### Privacy Policy
- Data collection practices
- Cookie usage
- Third-party integrations
- User rights and controls

### Compliance
- Gaming/gambling regulations by jurisdiction
- Tax reporting requirements
- KYC/AML considerations for large prizes
- Data protection regulations (GDPR, CCPA)

## Scaling Considerations

### Infrastructure Scaling
- Auto-scaling Cloud Functions
- Database sharding strategies
- CDN geographical distribution
- Load balancing implementation

### Feature Scaling
- Multi-sport support
- Tournament brackets
- Social features
- Mobile app development

This deployment guide provides a comprehensive roadmap for taking the $NUTS Sports Pick'em platform from development to production. Follow each section carefully and test thoroughly before launching to users.
