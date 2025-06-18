#!/bin/bash

echo "🚀 Firebase Deployment Script for NUTS Sports Pick'em"
echo "====================================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo -e "${RED}❌ Firebase CLI not found!${NC}"
    echo "Please install it with: npm install -g firebase-tools"
    exit 1
fi

echo -e "${YELLOW}📋 Pre-deployment Checklist:${NC}"
echo "1. Have you upgraded to Firebase Blaze plan? (Required)"
echo "   Visit: https://console.firebase.google.com/project/nuts-7b133/usage/details"
echo ""
echo "2. Are you logged in to Firebase CLI?"
echo "   If not, run: firebase login"
echo ""
read -p "Ready to continue? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled."
    exit 1
fi

echo -e "\n${GREEN}✅ Starting deployment...${NC}\n"

# Navigate to functions directory
cd functions

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Deploy Firestore rules
echo -e "\n${YELLOW}🔒 Deploying Firestore security rules...${NC}"
cd ..
firebase deploy --only firestore:rules

# Deploy Firebase Functions
echo -e "\n${YELLOW}☁️  Deploying Cloud Functions...${NC}"
cd functions
firebase deploy --only functions

# Get the function URLs
echo -e "\n${GREEN}✅ Deployment complete!${NC}"
echo -e "\n${YELLOW}📝 Your Firebase Function URLs:${NC}"
echo "https://us-central1-nuts-7b133.cloudfunctions.net/createNutsPayment"
echo "https://us-central1-nuts-7b133.cloudfunctions.net/payloadStatus"

echo -e "\n${YELLOW}🧪 Test your deployment:${NC}"
echo "1. Visit: https://chaps420.github.io/nuts/"
echo "2. Try entering a contest"
echo "3. Check Firebase console for logs"

echo -e "\n${GREEN}🎉 All done!${NC}"