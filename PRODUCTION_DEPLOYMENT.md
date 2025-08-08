# 🚀 NUTS Sports Pick'em - Production Deployment Guide

## 📋 Overview
This guide shows how to deploy the NUTS Sports Pick'em platform using:
- **GitHub Pages** for frontend hosting (free, fast CDN)
- **Firebase** for backend services (database, auth, cloud functions)

## 🌐 Part 1: GitHub Pages Setup

### 1. Enable GitHub Pages
1. Go to your GitHub repository
2. Click **Settings** tab
3. Scroll to **Pages** section
4. **Source**: Deploy from a branch
5. **Branch**: `master` (or `main`)
6. **Folder**: `/ (root)`
7. Click **Save**

### 2. Update Configuration
Replace `yourusername` in these files with your actual GitHub username:
- `config/config-browser.js` (line 115)
- Update the `allowedOrigins` array

### 3. Your Live URLs
After GitHub Pages is enabled (takes 5-10 minutes):
- **Admin Portal**: `https://yourusername.github.io/NUTS/admin-contest.html`
- **MLB Contest**: `https://yourusername.github.io/NUTS/daily-contest.html`
- **NFL Contest**: `https://yourusername.github.io/NUTS/nfl-contest.html`
- **Main Page**: `https://yourusername.github.io/NUTS/`

## 🔥 Part 2: Firebase Backend Setup

### 1. Install Firebase CLI
```bash
npm install -g firebase-tools
firebase login
```

### 2. Initialize Firebase (if not done)
```bash
cd /path/to/NUTS
firebase init
# Select: Functions, Firestore, Hosting
# Use existing project: nuts-sports-pickem
```

### 3. Install Dependencies
```bash
cd functions
npm install
```

### 4. Deploy Functions
```bash
firebase deploy --only functions
```

### 5. Deploy Firestore Rules
```bash
firebase deploy --only firestore:rules
```

## 🎯 Part 3: Production Configuration

### 1. Update CORS Origins
Edit `functions/index.js` and replace the CORS origins with your actual GitHub Pages URL:
```javascript
const cors = require('cors')({
  origin: [
    'https://yourusername.github.io', // YOUR GITHUB USERNAME HERE
    'https://nuts-sports-pickem.web.app'
  ],
  credentials: true
});
```

### 2. Test Backend Connection
Visit: `https://us-central1-nuts-sports-pickem.cloudfunctions.net/healthCheck`

Should return:
```json
{
  "status": "healthy",
  "timestamp": "2025-08-01T...",
  "service": "NUTS Sports Pickem API"
}
```

## 📊 Part 4: Admin Access

### Admin Portal URLs:
- **Production**: `https://yourusername.github.io/NUTS/admin-contest.html`
- **Local Dev**: `http://localhost:8080/admin-contest.html`

### Admin Features:
- View all MLB/NFL contest entries
- Real-time statistics
- Debug tools
- Export contest data

## 🔧 Part 5: Local Development

### Quick Start:
```bash
git clone https://github.com/yourusername/NUTS.git
cd NUTS
./start-platform.sh
```

### Manual Start:
```bash
python3 -m http.server 8080
# Open: http://localhost:8080
```

## 🚨 Part 6: Security & Production Notes

### 1. API Keys
- The Odds API key in config is for development
- Replace with your production API key
- Consider rate limiting

### 2. Firebase Security
- Review Firestore security rules
- Set up proper authentication
- Monitor usage and costs

### 3. XRPL/Xaman
- Update with production wallet addresses
- Test payment flows thoroughly
- Set up proper error handling

## 📈 Part 7: Monitoring & Maintenance

### Firebase Console:
- **Functions**: Monitor performance and errors
- **Firestore**: View database usage
- **Analytics**: Track user engagement

### GitHub Pages:
- **Actions**: Monitor deployments
- **Settings**: Manage custom domains

## 🎉 Part 8: Going Live Checklist

- [ ] GitHub Pages enabled and working
- [ ] Firebase functions deployed
- [ ] Admin portal accessible
- [ ] Contest entries working
- [ ] Payment system tested
- [ ] Mobile responsive
- [ ] Error handling in place
- [ ] Analytics configured

## 🆘 Troubleshooting

### Common Issues:

1. **404 on GitHub Pages**
   - Check repository is public
   - Verify Pages is enabled
   - Wait 5-10 minutes for propagation

2. **CORS Errors**
   - Update allowed origins in Firebase functions
   - Redeploy functions after changes

3. **Firebase Functions Not Working**
   - Check function logs: `firebase functions:log`
   - Verify project ID matches
   - Ensure billing is enabled (Blaze plan)

4. **Admin Portal Not Loading Data**
   - Check browser console for errors
   - Verify Firebase config
   - Test backend health check endpoint

## 💡 Tips for Success

1. **Test Locally First**: Always test changes locally before deploying
2. **Monitor Costs**: Keep an eye on Firebase usage
3. **Backup Data**: Export contest data regularly
4. **User Feedback**: Monitor user experience and errors
5. **Performance**: Optimize images and minimize API calls

---

## 🏆 Result: Production-Ready Sports Pick'em Platform

With this setup, you'll have:
- ✅ Free, fast frontend hosting on GitHub Pages
- ✅ Scalable backend on Firebase
- ✅ Real-time contest management
- ✅ Mobile-responsive design
- ✅ Admin portal for contest oversight
- ✅ Automated deployments

**Your platform will be live at**: `https://yourusername.github.io/NUTS/`
