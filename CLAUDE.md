# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

$NUTS Sports Pick'em Platform - A daily sports pick'em platform powered by $NUTS token on the XRP Ledger. Features daily paid contests (50 $NUTS entry) and weekly free contests for NFT holders.

## Key Commands

```bash
# Development
npm start           # Start live-server on localhost:3000
npm run dev         # Same as npm start

# Build
npm run build       # Build CSS with PostCSS

# Testing
node scripts/test-production-readiness.js  # Run production readiness tests

# Firebase Functions (from /functions directory)
npm run serve       # Start Firebase emulators
npm run deploy      # Deploy functions to Firebase
npm run logs        # View function logs
```

## Architecture Overview

### Frontend Structure
- **Static HTML Pages**: Each feature has its own HTML page (index.html, daily-contest.html, etc.)
- **Modular JavaScript**: Each page has corresponding JS module in src/js/ with browser and node versions
- **Dual Config System**: config.js for ES modules, config-browser.js for browser globals
- **XUMM/Xaman Integration**: Wallet connectivity through xaman-auth.js and xaman-qr.js

### Key Integration Points

1. **XRPL/XUMM Wallet**
   - Payment flows handle $NUTS token transactions
   - NFT verification for weekly contests
   - Contest wallet: `rN2K1Tv6LEM94YN8Kxfe3QyWcGPQNgsD6d`

2. **The Odds API**
   - Live sports data with fallback to mock data
   - Configured sports: NFL, NBA, MLB, NHL
   - Rate limiting considerations

3. **Firebase Integration**
   - Firestore for contest data, entries, users, leaderboards
   - Cloud Functions for contest scoring and payouts
   - Security rules in firestore.rules

### Contest System Architecture
- **Daily Contests**: 50 $NUTS entry, top 3 prize split (50%/30%/20%)
- **NFT Contests**: Free for holders, weekly format, 1000 $NUTS minimum prize
- **Entry Flow**: Wallet connect → Payment → Pick games → Submit → Results

### Development Considerations
- All environment variables use VITE_ prefix
- Mock data available for development without API keys
- Browser compatibility: Modern ES6+ with module support
- Mobile-first responsive design with dark theme

## Critical Files to Understand

1. **config/config.js** - Central configuration with environment variables
2. **src/js/contests.js** - Core contest management logic
3. **src/js/wallet.js** - XUMM wallet integration
4. **docs/firebase-schema.md** - Complete database structure
5. **scripts/test-production-readiness.js** - Production deployment checklist