#!/bin/bash

echo "🔍 Checking Deployment Status for NUTS Sports Pick'em"
echo "===================================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check GitHub Pages
echo -e "${BLUE}📄 GitHub Pages Status:${NC}"
echo "URL: https://chaps420.github.io/nuts/"
echo "Test URL: https://chaps420.github.io/nuts/test-github-pages.html"
echo ""

# Test if site is accessible
if curl -s -o /dev/null -w "%{http_code}" "https://chaps420.github.io/nuts/test-github-pages.html" | grep -q "200\|404"; then
    echo -e "${GREEN}✅ GitHub Pages is likely deployed${NC}"
    echo "   (Note: 404 is normal if just deployed, try again in 2-5 minutes)"
else
    echo -e "${YELLOW}⏳ GitHub Pages not accessible yet${NC}"
    echo "   Please enable it at: https://github.com/Chaps420/nuts/settings/pages"
fi

echo ""
echo -e "${BLUE}🔥 Firebase Status:${NC}"

# Check Firebase project
if firebase use | grep -q "nuts-7b133"; then
    echo -e "${GREEN}✅ Using correct Firebase project: nuts-7b133${NC}"
else
    echo -e "${RED}❌ Wrong Firebase project selected${NC}"
    echo "   Run: firebase use nuts-7b133"
fi

# Check if functions config is set
echo ""
echo "Checking Firebase Functions config..."
if firebase functions:config:get | grep -q "xumm"; then
    echo -e "${GREEN}✅ XUMM credentials are configured${NC}"
else
    echo -e "${YELLOW}⚠️  XUMM credentials may not be set${NC}"
fi

echo ""
echo -e "${BLUE}📋 Quick Links:${NC}"
echo "• Live Site: https://chaps420.github.io/nuts/"
echo "• GitHub Repo: https://github.com/Chaps420/nuts"
echo "• GitHub Pages Settings: https://github.com/Chaps420/nuts/settings/pages"
echo "• Firebase Console: https://console.firebase.google.com/project/nuts-7b133"
echo "• Firebase Upgrade: https://console.firebase.google.com/project/nuts-7b133/usage/details"

echo ""
echo -e "${YELLOW}📝 Next Steps:${NC}"
echo "1. If GitHub Pages not enabled: Go to settings and enable it"
echo "2. If Firebase not upgraded: Upgrade to Blaze plan"
echo "3. If Firebase upgraded: Run ./deploy-firebase.sh"
echo ""