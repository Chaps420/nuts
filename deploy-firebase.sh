#!/bin/bash

echo "🚀 Firebase Deployment Script for NUTS Payment System"
echo "=================================================="

# Load nvm
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Use Node 20
echo "📦 Using Node.js 20..."
nvm use 20

# Show versions
echo "✅ Node version: $(node --version)"
echo "✅ npm version: $(npm --version)"

# Navigate to project
cd /home/chaps/Documents/nuts-main

# Try to deploy
echo ""
echo "🔐 Attempting to deploy Firebase functions..."
echo "If prompted, please login with your Google account."
echo ""

# Use npx to run firebase-tools without installing globally
npx firebase-tools@latest deploy --only functions

echo ""
echo "✅ Deployment script complete!"
echo ""
echo "Next steps:"
echo "1. If deployment succeeded, update daily-contest.html to use xaman-payment-firebase.js"
echo "2. Test the payment flow - should show 50 NUTS pre-filled!"