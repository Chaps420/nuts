#!/usr/bin/env node

/**
 * Firebase Setup Script for NUTS Sports Pick'em
 * Run this script to set up Firebase services
 */

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔥 Firebase Setup for NUTS Sports Pick\'em\n');

console.log('📋 Manual Setup Steps (do these in Firebase Console):');
console.log('   https://console.firebase.google.com/project/nuts-7b133\n');

console.log('1️⃣  AUTHENTICATION SETUP:');
console.log('   - Go to Authentication → Get Started');
console.log('   - Go to Sign-in method tab');
console.log('   - Enable "Custom" authentication provider');
console.log('   - For Xaman integration with OpenID Connect (advanced):');
console.log('     * Click "Add new provider"');
console.log('     * Select "OpenID Connect"');
console.log('     * Provider name: "Xaman"');
console.log('     * Client ID: (get from Xaman developer portal)');
console.log('     * Issuer URL: https://oauth2.xumm.app');
console.log('     * Client secret: (from Xaman)\n');

console.log('2️⃣  FIRESTORE DATABASE SETUP:');
console.log('   - Go to Firestore Database → Create database');
console.log('   - Choose "Start in test mode" (for now)');
console.log('   - Select region: us-central1 (recommended)');
console.log('   - The app will automatically create these collections:');
console.log('     * users (user profiles and stats)');
console.log('     * bets (individual user bets)');
console.log('     * contests (contest metadata)');
console.log('     * payouts (payout records)\n');

console.log('3️⃣  CLOUD FUNCTIONS SETUP (Optional for MVP):');
console.log('   - Go to Functions → Get Started');
console.log('   - We\'ll deploy functions later if needed\n');

console.log('4️⃣  SECURITY RULES (Important for production):');
console.log('   - Go to Firestore Database → Rules');
console.log('   - Replace default rules with production-ready rules\n');

rl.question('Have you completed steps 1 & 2 above? (y/n): ', (answer) => {
  if (answer.toLowerCase() === 'y') {
    console.log('\n✅ Great! Your Firebase is configured.');
    console.log('\n🚀 Next steps:');
    console.log('   1. Test the integration by running daily-contest.html');
    console.log('   2. Check browser console for Firebase connection status');
    console.log('   3. Try creating a test bet to verify Firestore works');
    console.log('   4. Use firebase-admin-portal.html to view stored data\n');
    
    console.log('📊 Firebase Collections Schema:');
    console.log(JSON.stringify({
      users: {
        "user-id": {
          xrplAddress: "rUserAddress...",
          createdAt: "timestamp",
          totalBets: 0,
          totalWins: 0,
          authMethod: "xaman"
        }
      },
      bets: {
        "bet-id": {
          userId: "user-id",
          userAddress: "rUserAddress...",
          contestId: "contest-1-2025-06-10",
          gameId: "game-123",
          selection: "home",
          amount: 100,
          status: "pending"
        }
      }
    }, null, 2));
  } else {
    console.log('\n⏸️  Please complete the Firebase setup steps first.');
    console.log('   Then run this script again or test the application.');
  }
  
  rl.close();
});

console.log('\n💡 Tips:');
console.log('   - Test mode allows read/write for 30 days');
console.log('   - Production rules should restrict access properly');
console.log('   - Custom auth tokens let us authenticate Xaman users');
console.log('   - Collections are created automatically when first used\n');
