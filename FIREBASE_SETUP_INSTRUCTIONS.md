# Firebase Setup Instructions for $NUTS Sports Pick'em

## Step 1: Create Firebase Account

1. Go to https://firebase.google.com
2. Click "Get started" 
3. Sign in with a Google account (or create one if needed)

## Step 2: Create a New Project

1. Click "Create a project"
2. Name your project: `nuts-sports-pickem` (or similar)
3. Accept the terms and click "Continue"
4. **DISABLE Google Analytics** (uncheck the box) - not needed
5. Click "Create project"
6. Wait for project creation to complete

## Step 3: Add Billing ($25 Credit)

1. In your Firebase project, click the gear icon ⚙️ → "Project settings"
2. Click on "Usage and billing" tab
3. Click "Details & settings" under Spark plan
4. Click "Upgrade" to upgrade to Blaze plan
5. Follow prompts to:
   - Add a credit card
   - Set a budget alert at $25
   - Complete billing setup

**Note:** Firebase gives you generous free tier limits. The $25 is just a safety buffer - you likely won't be charged anything for initial usage.

## Step 4: Enable Required Services

1. In the left sidebar, click "Authentication"
   - Click "Get started"
   - Enable "Anonymous" sign-in method
   
2. In the left sidebar, click "Firestore Database"
   - Click "Create database"
   - Choose "Start in production mode"
   - Select your region (choose closest to your users)
   - Click "Create"

3. In the left sidebar, click "Functions"
   - You may need to upgrade to Blaze plan here if not already done
   - Click "Get started" if prompted

## Step 5: Get Configuration Details

1. Go to Project Settings (gear icon ⚙️)
2. Scroll down to "Your apps" section
3. Click "</>" (Web) icon
4. Register app with nickname: `nuts-web`
5. Copy the Firebase configuration object that appears

## What to Send to Developer

Please send the following information:

### Option 1: Add Developer as Admin (Recommended)
1. Go to Project Settings → Users and permissions
2. Click "Add member"
3. Add developer's email address
4. Give "Owner" role
5. Click "Add member"

### Option 2: Share Credentials (Less Secure)
Send these details securely:
1. The Firebase configuration object from Step 5
2. Your Firebase project ID
3. Optional: Create a separate Google account for this project and share login

### Required Information to Share:
```
Firebase Project ID: [your-project-id]
Firebase Configuration:
{
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
}
```

## Important Notes

- Keep your billing notifications on to monitor usage
- The $25 budget alert will notify you before any charges
- Most small apps stay within free tier limits
- Never share API keys publicly (only with trusted developer)

## Support

If you encounter any issues during setup:
1. Firebase Support: https://firebase.google.com/support
2. Contact your developer with screenshots of any errors

---

**Time Required:** 15-20 minutes
**Cost:** $0 initially (just adding payment method with $25 budget alert)