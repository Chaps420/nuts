#!/usr/bin/env node

/**
 * Prepare files for production deployment
 * Updates HTML files for GitHub Pages compatibility
 */

const fs = require('fs');
const path = require('path');

// Configuration
const ROOT_DIR = path.join(__dirname, '..');
const HTML_FILES = [
    'index.html',
    'daily-contest.html',
    'admin-contest.html',
    'contest-results.html',
    'nft-contest.html',
    'leaderboard.html',
    'how-it-works.html',
    'admin-games-upload.html'
];

console.log('🚀 Preparing for production deployment...\n');

// 1. Update HTML files to include environment configuration
function updateHTMLFiles() {
    console.log('📝 Updating HTML files...');
    
    HTML_FILES.forEach(file => {
        const filePath = path.join(ROOT_DIR, file);
        
        if (!fs.existsSync(filePath)) {
            console.log(`  ⚠️  ${file} not found, skipping...`);
            return;
        }
        
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Check if environment.js is already included
        if (content.includes('environment.js')) {
            console.log(`  ✅ ${file} already updated`);
            return;
        }
        
        // Add environment.js after config-browser.js
        const configRegex = /<script src="config\/config-browser\.js"><\/script>/;
        if (configRegex.test(content)) {
            content = content.replace(
                configRegex,
                '<script src="config/config-browser.js"></script>\n    <script src="config/environment.js"></script>'
            );
            
            // Remove leading slashes from asset paths for GitHub Pages
            content = content.replace(/href="\/src/g, 'href="src');
            content = content.replace(/src="\/src/g, 'src="src');
            content = content.replace(/href="\/(?!\/)/g, 'href="');
            
            fs.writeFileSync(filePath, content);
            console.log(`  ✅ ${file} updated`);
        } else {
            console.log(`  ⚠️  ${file} missing config-browser.js reference`);
        }
    });
}

// 2. Create 404.html for GitHub Pages SPA support
function create404Page() {
    console.log('\n📄 Creating 404.html...');
    const indexPath = path.join(ROOT_DIR, 'index.html');
    const notFoundPath = path.join(ROOT_DIR, '404.html');
    
    if (fs.existsSync(indexPath)) {
        fs.copyFileSync(indexPath, notFoundPath);
        console.log('  ✅ 404.html created');
    } else {
        console.log('  ❌ index.html not found');
    }
}

// 3. Update API endpoints in JavaScript files
function updateJavaScriptFiles() {
    console.log('\n🔧 Checking JavaScript files...');
    
    const jsFiles = [
        'src/js/xaman-payment-api.js',
        'src/js/firebase-xaman-integration.js',
        'src/js/contests.js'
    ];
    
    jsFiles.forEach(file => {
        const filePath = path.join(ROOT_DIR, file);
        
        if (!fs.existsSync(filePath)) {
            console.log(`  ⚠️  ${file} not found, skipping...`);
            return;
        }
        
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Check if already using ENV_CONFIG
        if (content.includes('window.ENV_CONFIG')) {
            console.log(`  ✅ ${file} already uses environment config`);
        } else {
            console.log(`  ⚠️  ${file} may need manual update for environment config`);
        }
    });
}

// 4. Create production checklist
function createChecklist() {
    console.log('\n📋 Production Deployment Checklist:\n');
    
    const checklist = [
        '1. Update config/environment.js with your GitHub username',
        '2. Set Firebase Functions environment variables:',
        '   firebase functions:config:set xumm.api_key="YOUR_KEY" xumm.api_secret="YOUR_SECRET"',
        '3. Update CORS origins in functions/xummPayment.js',
        '4. Deploy Firebase Functions: firebase deploy --only functions',
        '5. Enable GitHub Pages in repository settings',
        '6. Push to main branch to trigger deployment',
        '7. Test payment flow on live site',
        '8. Monitor Firebase Functions logs for errors'
    ];
    
    checklist.forEach(item => console.log(`  ${item}`));
}

// Run all tasks
console.log('Starting production preparation...\n');

updateHTMLFiles();
create404Page();
updateJavaScriptFiles();
createChecklist();

console.log('\n✅ Production preparation complete!');
console.log('📚 See docs/deployment-guide.md for detailed instructions.');