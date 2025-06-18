# $NUTS Sports Pick'em Platform

A daily sports pick'em platform powered by $NUTS token on the XRP Ledger.

## Features

- 🏆 Daily sports contests with NUTS token entry fees
- 💰 Automated prize distribution to winners
- 🎫 Free weekly contests for NFT holders
- 📱 Xaman/XUMM wallet integration
- 📊 Real-time leaderboards
- 🔧 Admin panel for contest management

## Live Demo

Visit: [https://chaps420.github.io/nuts/](https://chaps420.github.io/nuts/)

## Technology Stack

- **Frontend**: HTML, CSS, JavaScript (Vanilla)
- **Hosting**: GitHub Pages (free)
- **Backend**: Firebase Functions
- **Database**: Firebase Firestore
- **Payments**: XUMM/Xaman API
- **Blockchain**: XRP Ledger

## Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/Chaps420/nuts.git
   cd nuts
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start local server**
   ```bash
   npm start
   ```

4. **Start XUMM server (for local payments)**
   ```bash
   node xumm-server.js
   ```

## Deployment

The project uses GitHub Pages for frontend hosting and Firebase for backend services.

### Frontend (GitHub Pages)

Automatically deployed via GitHub Actions when you push to main:

```bash
git push origin main
```

### Backend (Firebase)

**Note**: Firebase project needs to be on Blaze (pay-as-you-go) plan.

```bash
cd functions
firebase deploy --only functions
```

## Admin Access

Access the admin panel at: `/admin-contest.html`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Submit a pull request

## License

MIT License

---

Built with ❤️ for the $NUTS community