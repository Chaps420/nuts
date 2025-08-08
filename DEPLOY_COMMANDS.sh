#!/bin/bash

# Firebase Functions Deployment Script
echo "🚀 Deploying Firebase Functions for NUTS Sports Pick'em..."

# Navigate to project root
cd /home/chaps/Documents/nuts-main

# Login to Firebase (interactive - you'll need to authenticate)
echo "📝 Please login to Firebase..."
npx firebase login

# Deploy functions only
echo "🔧 Deploying functions..."
npx firebase deploy --only functions

echo "✅ Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Update daily-contest.html to use xaman-payment-firebase.js"
echo "2. Test the payment flow with pre-filled fields"