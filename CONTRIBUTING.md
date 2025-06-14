# Contributing to $NUTS Sports Pick'em Platform

## Development Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/yourusername/nuts-sports-pickem.git
   cd nuts-sports-pickem
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   - Copy `.env.example` to `.env`
   - Fill in your API keys and configuration

4. **Start Development Server**
   ```bash
   npm start
   ```

## Project Structure

### Core Application Files
- `index.html` - Homepage
- `daily-contest.html` - Daily contest interface
- `nft-contest.html` - NFT holder contest
- `leaderboard.html` - Contest results and rankings
- `how-it-works.html` - FAQ and instructions
- `buy-nuts.html` - Token purchase page

### JavaScript Modules (`src/js/`)
- `main.js` - Core application logic
- `wallet.js` - XUMM wallet integration
- `odds-api.js` - Sports data API integration
- `contests.js` - Contest management
- `daily-contest.js` - Daily contest functionality
- `nft-contest.js` - NFT contest functionality
- `leaderboard.js` - Ranking and results
- `firebase.js` - Database integration

### Configuration
- `config/config.js` - Application settings
- `.env` - Environment variables (not committed)
- `firebase.json` - Firebase configuration
- `firestore.rules` - Database security rules

## Development Guidelines

### Code Style
- Use consistent indentation (2 spaces)
- Follow modern JavaScript ES6+ conventions
- Add comments for complex logic
- Keep functions small and focused

### Testing
- Test all wallet integration flows
- Verify responsive design on multiple devices
- Test with XRPL testnet before mainnet

### Git Workflow
1. Create feature branch from `main`
2. Make focused commits with clear messages
3. Test thoroughly before pushing
4. Create pull request with description

## API Integration

### The Odds API
- Used for live sports data
- Mock data available for development
- Rate limiting considerations

### XRPL Integration
- XUMM wallet for payments
- Testnet for development
- Real $NUTS token transactions

### Firebase
- Real-time database
- User data and contest results
- Authentication and security

## Deployment

The platform is designed for easy deployment with:
- Static file hosting capability
- Environment-based configuration
- Firebase backend integration
- CDN-ready asset structure
