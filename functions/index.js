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
    
    // Calculate average score if entries have results
    let avgScore = 0;
    const entriesWithScores = entries.filter(e => e.score !== undefined && e.score !== null);
    if (entriesWithScores.length > 0) {
      avgScore = entriesWithScores.reduce((sum, e) => sum + (e.score || 0), 0) / entriesWithScores.length;
    }
    
    const stats = {
      totalEntries: entries.length,
      prizePool: entries.length * 50, // 50 NUTS per entry
      avgScore: avgScore,
      uniqueUsers: new Set(entries.map(e => e.userId || e.username)).size,
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

// DAILY CONTEST FUNCTIONS

// Create or Update Daily Contest
exports.createDailyContest = functions.https.onRequest(corsHandler(async (req, res) => {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const contestData = req.body;
    
    // Validate required fields
    if (!contestData.contestDate || !contestData.choices) {
      return res.status(400).json({ error: 'Missing required fields: contestDate, choices' });
    }

    // Add server timestamp
    contestData.updatedAt = admin.firestore.FieldValue.serverTimestamp();
    if (!contestData.createdAt) {
      contestData.createdAt = admin.firestore.FieldValue.serverTimestamp();
    }

    // Use contestDate as document ID for easy retrieval
    const contestId = contestData.contestDate;
    
    // Store in Firestore
    await db.collection('dailyContests').doc(contestId).set(contestData, { merge: true });

    res.status(200).json({ 
      success: true, 
      contestId: contestId,
      message: 'Daily contest saved successfully' 
    });

  } catch (error) {
    console.error('Error creating daily contest:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}));

// Get Daily Contest by Date
exports.getDailyContest = functions.https.onRequest(corsHandler(async (req, res) => {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { date } = req.query;
    
    if (!date) {
      return res.status(400).json({ error: 'Date parameter required' });
    }

    const doc = await db.collection('dailyContests').doc(date).get();
    
    if (!doc.exists) {
      return res.status(404).json({ 
        success: false, 
        message: 'No contest found for this date' 
      });
    }

    res.status(200).json({ 
      success: true, 
      contest: { id: doc.id, ...doc.data() }
    });

  } catch (error) {
    console.error('Error getting daily contest:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}));

// Create Daily Contest Entry
exports.createDailyContestEntry = functions.https.onRequest(corsHandler(async (req, res) => {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const entryData = req.body;
    
    // Validate required fields
    if (!entryData.picks || !entryData.contestDate) {
      return res.status(400).json({ error: 'Missing required fields: picks, contestDate' });
    }

    // Check if contest exists and is active
    const contestDoc = await db.collection('dailyContests').doc(entryData.contestDate).get();
    if (!contestDoc.exists) {
      return res.status(404).json({ error: 'Contest not found for this date' });
    }

    const contest = contestDoc.data();
    if (contest.status !== 'active') {
      return res.status(400).json({ error: 'Contest is not accepting entries' });
    }

    // Add server timestamp and entry ID
    entryData.serverTimestamp = admin.firestore.FieldValue.serverTimestamp();
    entryData.id = db.collection('dailyContestEntries').doc().id;
    entryData.sport = 'daily';

    // Store in Firestore
    await db.collection('dailyContestEntries').doc(entryData.id).set(entryData);

    res.status(200).json({ 
      success: true, 
      entryId: entryData.id,
      message: 'Daily contest entry created successfully' 
    });

  } catch (error) {
    console.error('Error creating daily contest entry:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}));

// Get Daily Contest Entries
exports.getDailyContestEntries = functions.https.onRequest(corsHandler(async (req, res) => {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { contestDate } = req.query;
    
    if (!contestDate) {
      return res.status(400).json({ error: 'contestDate parameter required' });
    }

    const snapshot = await db.collection('dailyContestEntries')
      .where('contestDate', '==', contestDate)
      .get();
    
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
    console.error('Error getting daily contest entries:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}));

// Resolve Daily Contest (Admin sets winners)
exports.resolveDailyContest = functions.https.onRequest(corsHandler(async (req, res) => {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { contestDate, choiceResults } = req.body;
    
    if (!contestDate || !choiceResults) {
      return res.status(400).json({ error: 'Missing required fields: contestDate, choiceResults' });
    }

    // Update contest status to resolved
    await db.collection('dailyContests').doc(contestDate).update({
      status: 'resolved',
      resolvedAt: admin.firestore.FieldValue.serverTimestamp(),
      choiceResults: choiceResults
    });

    // Get all entries for this contest
    const entriesSnapshot = await db.collection('dailyContestEntries')
      .where('contestDate', '==', contestDate)
      .get();

    // Calculate scores for each entry
    const batch = db.batch();
    
    entriesSnapshot.forEach(doc => {
      const entry = doc.data();
      let score = 0;
      
      // Calculate score based on correct picks
      Object.keys(entry.picks).forEach(choiceId => {
        const userPick = entry.picks[choiceId];
        const correctAnswer = choiceResults[choiceId];
        if (userPick === correctAnswer) {
          score += 1;
        }
      });
      
      // Update entry with score
      batch.update(doc.ref, {
        score: score,
        scoredAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });

    await batch.commit();

    res.status(200).json({ 
      success: true, 
      message: 'Daily contest resolved and scores calculated',
      entriesUpdated: entriesSnapshot.size
    });

  } catch (error) {
    console.error('Error resolving daily contest:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}));

// Update Entry Score - For Admin Panel
exports.updateEntryScore = functions.https.onRequest(corsHandler(async (req, res) => {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { entryId, score, contestDate } = req.body;
    
    // Validate required fields
    if (!entryId || score === undefined || score === null) {
      return res.status(400).json({ error: 'Missing required fields: entryId, score' });
    }

    // Validate score is a number
    const numericScore = parseInt(score);
    if (isNaN(numericScore)) {
      return res.status(400).json({ error: 'Score must be a valid number' });
    }

    console.log(`Updating entry ${entryId} with score ${numericScore}`);

    // Find and update the entry in Firestore
    const entryDoc = await db.collection('contestEntries').doc(entryId).get();
    
    if (!entryDoc.exists) {
      return res.status(404).json({ error: 'Contest entry not found' });
    }

    // Update the entry with the new score
    await db.collection('contestEntries').doc(entryId).update({
      score: numericScore,
      scoredAt: admin.firestore.FieldValue.serverTimestamp(),
      lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`Successfully updated entry ${entryId} with score ${numericScore}`);

    res.status(200).json({ 
      success: true, 
      message: `Entry ${entryId} updated with score ${numericScore}`,
      entryId: entryId,
      score: numericScore
    });

  } catch (error) {
    console.error('Error updating entry score:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      details: error.message 
    });
  }
}));