# Deployment Instructions for NUTS Sports Pick'em

## Current Status

✅ **GitHub Repository**: Code pushed to https://github.com/Chaps420/nuts
✅ **XUMM Credentials**: Configured in Firebase Functions
✅ **Frontend**: Ready for GitHub Pages deployment
⚠️ **Firebase Functions**: Requires Blaze plan upgrade

## Next Steps

### 1. Enable GitHub Pages (5 minutes)

1. Go to: https://github.com/Chaps420/nuts/settings/pages
2. Under "Source", select "Deploy from a branch"
3. Select "master" branch and "/" (root) folder
4. Click "Save"
5. Wait 2-3 minutes for deployment
6. Your site will be live at: https://chaps420.github.io/nuts/

### 2. Upgrade Firebase to Blaze Plan (Required for Backend)

1. Visit: https://console.firebase.google.com/project/nuts-sports-pickem/usage/details
2. Click "Upgrade to Blaze"
3. Add billing information (you only pay for usage above free tier)
4. Free tier includes:
   - 2M function invocations/month
   - 1GB Firestore storage
   - 10GB bandwidth

### 3. Deploy Firebase Functions (After Upgrade)

```bash
cd functions
firebase deploy --only functions
```

This will deploy:
- Payment processing endpoints
- Contest management functions
- Database operations

### 4. Test the Live Site

1. Visit: https://chaps420.github.io/nuts/
2. Test features:
   - Enter a contest
   - Payment QR code should appear
   - Admin panel at /admin-contest.html

## Important URLs

- **Live Site**: https://chaps420.github.io/nuts/
- **GitHub Repo**: https://github.com/Chaps420/nuts
- **Firebase Console**: https://console.firebase.google.com/project/nuts-sports-pickem
- **GitHub Pages Settings**: https://github.com/Chaps420/nuts/settings/pages

## Temporary Solution (Without Firebase)

The site will partially work without Firebase Functions:
- ✅ Frontend will load
- ✅ UI will be functional
- ❌ Payments won't process (needs Firebase)
- ❌ Data won't save (needs Firestore)

For full functionality, Firebase upgrade is required.

## Support

If you encounter issues:
1. Check browser console for errors
2. Verify GitHub Pages is enabled
3. Ensure Firebase Functions are deployed
4. Check CORS configuration

## Estimated Costs

- **GitHub Pages**: FREE
- **Firebase (Monthly)**:
  - Small usage: $0-5
  - Medium usage: $5-20
  - Large usage: $20-50

Most small projects stay within free tier.