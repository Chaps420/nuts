# Quick Start Guide

## Running the $NUTS Sports Pick'em Platform

### Option 1: One-Command Start (Recommended)
```bash
./start-platform.sh
```

This will automatically:
- Start the XUMM payment server (required for QR codes)
- Start the web server
- Open your browser to the platform

### Option 2: Manual Start
```bash
# Terminal 1: Start payment server
node xumm-server.js

# Terminal 2: Start web server  
npm run dev
```

### What You'll Get
- 🌐 **Website**: http://localhost:3000
- 💳 **Payment API**: http://localhost:3001
- 🏈 **NFL Contest**: http://localhost:3000/nfl-contest.html
- ⚾ **MLB Contest**: http://localhost:3000/daily-contest.html

### Payment System
Both NFL and MLB contests use the same XUMM payment system:
- **With server running**: One-scan QR codes with real-time payment tracking
- **Without server**: Fallback to manual payment instructions

### Notes
- The XUMM server is **required** for proper QR code generation
- Both contests use the same payment wallet and 50 NUTS entry fee
- Payment QR codes are pre-filled with the correct amount and destination
- Mobile users get optimized payment flows with "Open in Xaman" buttons

### Stopping the Platform
Press `Ctrl+C` in the terminal where you ran `./start-platform.sh`
