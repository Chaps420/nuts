const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Calculate Daily Contest Winners Function
exports.calculateDailyContestWinners = functions.https.onCall(async (data, context) => {
  try {
    const { contestId } = data;
    
    if (!contestId) {
      throw new functions.https.HttpsError('invalid-argument', 'Contest ID is required');
    }
    
    console.log(`🏆 Starting winner calculation for contest: ${contestId}`);
    
    const db = admin.firestore();
    
    // Get contest data
    const contestRef = db.collection('dailyContests').doc(contestId);
    const contestDoc = await contestRef.get();
    
    if (!contestDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Contest not found');
    }
    
    const contest = contestDoc.data();
    
    // Validation checks
    if (!contest.locked) {
      throw new functions.https.HttpsError('failed-precondition', 'Contest must be locked before calculating winners');
    }
    
    if (!contest.choices || !contest.choices.some(c => c.correctAnswer)) {
      throw new functions.https.HttpsError('failed-precondition', 'Contest must have correct answers set');
    }
    
    // Get all participants
    const participantsSnapshot = await db.collection('dailyContestParticipants')
      .where('contestId', '==', contestId)
      .get();
    
    if (participantsSnapshot.empty) {
      throw new functions.https.HttpsError('failed-precondition', 'No participants found for this contest');
    }
    
    console.log(`📊 Found ${participantsSnapshot.size} participants to score`);
    
    // Score all entries
    const scoredEntries = [];
    
    participantsSnapshot.forEach(doc => {
      const participant = doc.data();
      const score = calculateParticipantScore(participant, contest.choices);
      
      scoredEntries.push({
        docRef: doc.ref,
        participantId: doc.id,
        userId: participant.userId,
        walletAddress: participant.walletAddress,
        choices: participant.choices,
        score: score,
        entryTime: participant.entryTime
      });
    });
    
    // Sort by score (highest first), then by entry time (earliest first) for tiebreaking
    scoredEntries.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score; // Higher score wins
      }
      // Tiebreaker: earlier entry time wins
      const aTime = a.entryTime?.toDate?.() || new Date(a.entryTime);
      const bTime = b.entryTime?.toDate?.() || new Date(b.entryTime);
      return aTime - bTime;
    });
    
    console.log(`🏆 Top scores: ${scoredEntries.slice(0, 3).map(e => `${e.score}/${contest.choices.length}`).join(', ')}`);
    
    // Determine winners (top 3, minimum 4 participants)
    const minParticipants = 4;
    const winners = [];
    
    if (scoredEntries.length >= minParticipants) {
      // Calculate prize distribution
      const totalPrizePool = parseFloat(contest.prizePool || 0);
      const prizeDistribution = [0.5, 0.3, 0.2]; // 50%, 30%, 20%
      
      for (let i = 0; i < Math.min(3, scoredEntries.length); i++) {
        const entry = scoredEntries[i];
        const prizeAmount = totalPrizePool * prizeDistribution[i];
        
        winners.push({
          ...entry,
          rank: i + 1,
          prizeAmount: prizeAmount
        });
      }
    }
    
    console.log(`🏅 ${winners.length} winners determined`);
    
    // Update database in a transaction
    await db.runTransaction(async (transaction) => {
      // Clear any existing winner flags
      scoredEntries.forEach(entry => {
        transaction.update(entry.docRef, {
          finalScore: entry.score,
          isWinner: false,
          winnerRank: null,
          prizeAmount: 0,
          scoredAt: admin.firestore.FieldValue.serverTimestamp()
        });
      });
      
      // Set winners
      winners.forEach(winner => {
        transaction.update(winner.docRef, {
          finalScore: winner.score,
          isWinner: true,
          winnerRank: winner.rank,
          prizeAmount: winner.prizeAmount,
          scoredAt: admin.firestore.FieldValue.serverTimestamp()
        });
      });
      
      // Update contest status
      transaction.update(contestRef, {
        resolved: true,
        resolvedAt: admin.firestore.FieldValue.serverTimestamp(),
        winnersCalculated: true,
        winnersCalculatedAt: admin.firestore.FieldValue.serverTimestamp(),
        totalEntries: scoredEntries.length,
        winnerCount: winners.length,
        status: 'resolved',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });
    
    console.log(`✅ Contest ${contestId} resolved with ${winners.length} winners`);
    
    return {
      success: true,
      message: 'Winners calculated successfully',
      contestId: contestId,
      totalEntries: scoredEntries.length,
      winnerCount: winners.length,
      winners: winners.map(w => ({
        rank: w.rank,
        score: w.score,
        walletAddress: w.walletAddress,
        prizeAmount: w.prizeAmount
      }))
    };
    
  } catch (error) {
    console.error('Error calculating winners:', error);
    
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    
    throw new functions.https.HttpsError('internal', 'Failed to calculate winners: ' + error.message);
  }
});

// Helper function to calculate participant score
function calculateParticipantScore(participant, correctChoices) {
  if (!participant.choices || !correctChoices) {
    return 0;
  }
  
  let score = 0;
  
  for (let i = 0; i < correctChoices.length; i++) {
    const correctAnswer = correctChoices[i]?.correctAnswer;
    const participantAnswer = participant.choices[i];
    
    if (correctAnswer && participantAnswer === correctAnswer) {
      score++;
    }
  }
  
  return score;
}
