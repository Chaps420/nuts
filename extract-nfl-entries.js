const admin = require('firebase-admin');
const fs = require('fs');

// Initialize Firebase Admin
const serviceAccount = require('./config/contest-wallet.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://nuts-sports-pickem-default-rtdb.firebaseio.com/'
});

const db = admin.firestore();

async function extractNFLEntries() {
  try {
    console.log('🔍 Fetching NFL entries from Firebase...');
    
    // Get all NFL entries
    const snapshot = await db.collection('contestEntries')
      .where('sport', '==', 'nfl')
      .get();
    
    const entries = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      entries.push({
        documentId: doc.id,
        ...data,
        timestamp: data.timestamp ? (data.timestamp.toDate ? data.timestamp.toDate() : data.timestamp) : null
      });
    });
    
    console.log(`📊 Found ${entries.length} total NFL entries`);
    
    // Group by week for analysis
    const byWeek = {};
    const week1Entries = [];
    
    entries.forEach(entry => {
      const week = entry.weekNumber || 'unknown';
      if (!byWeek[week]) byWeek[week] = [];
      byWeek[week].push(entry);
      
      if (entry.weekNumber === 1 || entry.weekNumber === '1') {
        week1Entries.push(entry);
      }
    });
    
    console.log('📋 Summary by week:');
    Object.keys(byWeek).sort().forEach(week => {
      console.log(`  Week ${week}: ${byWeek[week].length} entries`);
    });
    
    console.log(`\n🎯 Week 1 entries to delete: ${week1Entries.length}`);
    
    // Prepare backup data
    const backupData = {
      extractedAt: new Date().toISOString(),
      totalEntries: entries.length,
      week1EntriesToDelete: week1Entries.length,
      entriesByWeek: Object.keys(byWeek).reduce((acc, week) => {
        acc[week] = byWeek[week].length;
        return acc;
      }, {}),
      week1Entries: week1Entries,
      allEntries: entries
    };
    
    // Save to file
    fs.writeFileSync('nfl-entries-backup.json', JSON.stringify(backupData, null, 2));
    console.log('✅ NFL entries backup saved to nfl-entries-backup.json');
    
    // Create summary file
    const summary = {
      extractedAt: new Date().toISOString(),
      summary: {
        totalNFLEntries: entries.length,
        week1Entries: week1Entries.length,
        entriesByWeek: Object.keys(byWeek).reduce((acc, week) => {
          acc[week] = byWeek[week].length;
          return acc;
        }, {}),
        userCount: new Set(entries.map(e => e.userId || e.username || e.walletAddress)).size
      },
      week1UserData: week1Entries.map(entry => ({
        documentId: entry.documentId,
        userId: entry.userId,
        username: entry.username,
        walletAddress: entry.walletAddress,
        twitterHandle: entry.twitterHandle,
        timestamp: entry.timestamp,
        picks: entry.picks,
        score: entry.score
      }))
    };
    
    fs.writeFileSync('nfl-week1-summary.json', JSON.stringify(summary, null, 2));
    console.log('✅ Week 1 summary saved to nfl-week1-summary.json');
    
    return { entries, week1Entries, backupData };
    
  } catch (error) {
    console.error('❌ Error extracting NFL entries:', error);
    throw error;
  }
}

// Run extraction
extractNFLEntries().then(() => {
  console.log('🎉 Extraction complete!');
  process.exit(0);
}).catch(error => {
  console.error('💥 Failed:', error);
  process.exit(1);
});
