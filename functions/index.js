const admin = require('firebase-admin');
const functions = require('firebase-functions');
const cors = require('cors')({
  origin: true, // Allow all origins for now - restrict in production
  credentials: true
});

// Initialize admin SDK
admin.initializeApp();
const db = admin.firestore();

// Wrap functions with CORS
const corsHandler = (fn) => (req, res) => {
  return cors(req, res, () => fn(req, res));
};

// Export payment functions from new file
exports.createNutsPayment = require('./createNutsPayment').createNutsPayment;
exports.payloadStatus = require('./createNutsPayment').payloadStatus;

// Export XUMM payment functions from existing file
exports.createXummPayment = require('./xummPayment').createXummPayment;
exports.checkXummPayment = require('./xummPayment').checkXummPayment;
exports.xummWebhook = require('./xummPayment').xummWebhook;
exports.getNutsTokenInfo = require('./xummPayment').getNutsTokenInfo;

// Export contest payout functions (commented out for manual payouts only)
// exports.processContestPayouts = require('./processContestPayouts').processContestPayouts;
// exports.scheduledPayoutCheck = require('./processContestPayouts').scheduledPayoutCheck;

// NEW PRODUCTION FUNCTIONS FOR GITHUB PAGES

// Create Contest Entry
exports.createContestEntry = functions.https.onRequest(corsHandler(async (req, res) => {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const entryData = req.body;
    
    // Validate required fields
    if (!entryData.picks || !entryData.contestDay) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Add server timestamp
    entryData.serverTimestamp = admin.firestore.FieldValue.serverTimestamp();
    entryData.id = db.collection('contestEntries').doc().id;

    // Store in Firestore
    await db.collection('contestEntries').doc(entryData.id).set(entryData);

    res.status(200).json({ 
      success: true, 
      entryId: entryData.id,
      message: 'Contest entry created successfully' 
    });

  } catch (error) {
    console.error('Error creating contest entry:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}));

// Get Contest Entries
exports.getContestEntries = functions.https.onRequest(corsHandler(async (req, res) => {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { contestDay, sport, weekNumber } = req.query;
    
    let query = db.collection('contestEntries');
    
    if (contestDay) {
      query = query.where('contestDay', '==', contestDay);
    }
    
    if (sport) {
      query = query.where('sport', '==', sport);
    }
    
    if (weekNumber) {
      query = query.where('weekNumber', '==', parseInt(weekNumber));
    }

    const snapshot = await query.get();
    const entries = [];
    
    snapshot.forEach(doc => {
      entries.push({ id: doc.id, ...doc.data() });
    });

    res.status(200).json({ 
      success: true, 
      entries: entries,
      count: entries.length 
    });

  } catch (error) {
    console.error('Error getting contest entries:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}));

// Get Contest Stats
exports.getContestStats = functions.https.onRequest(corsHandler(async (req, res) => {
  try {
    const { sport, contestDay, weekNumber } = req.query;
    
    let query = db.collection('contestEntries');
    
    if (sport) {
      query = query.where('sport', '==', sport);
    }
    
    if (contestDay) {
      query = query.where('contestDay', '==', contestDay);
    }
    
    if (weekNumber) {
      query = query.where('weekNumber', '==', parseInt(weekNumber));
    }

    const snapshot = await query.get();
    const entries = snapshot.docs.map(doc => doc.data());
    
    const stats = {
      totalEntries: entries.length,
      totalPrizePool: entries.length * 50, // 50 NUTS per entry
      uniqueUsers: new Set(entries.map(e => e.userId)).size,
      sports: {
        mlb: entries.filter(e => e.sport === 'mlb' || !e.sport).length,
        nfl: entries.filter(e => e.sport === 'nfl').length
      }
    };

    res.status(200).json({ 
      success: true, 
      stats: stats 
    });

  } catch (error) {
    console.error('Error getting contest stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}));

// Health Check
exports.healthCheck = functions.https.onRequest(corsHandler((req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'NUTS Sports Pickem API'
  });
}));