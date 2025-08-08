const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Cancel Daily Contest Function
exports.cancelDailyContest = functions.https.onCall(async (data, context) => {
  try {
    const { contestId } = data;
    
    if (!contestId) {
      throw new functions.https.HttpsError('invalid-argument', 'Contest ID is required');
    }
    
    console.log(`Starting cancellation for contest: ${contestId}`);
    
    const db = admin.firestore();
    const contestRef = db.collection('dailyContests').doc(contestId);
    const contestDoc = await contestRef.get();
    
    if (!contestDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Contest not found');
    }
    
    const contest = contestDoc.data();
    
    // Validation checks
    if (contest.locked) {
      throw new functions.https.HttpsError('failed-precondition', 'Cannot cancel a locked contest');
    }
    
    if (contest.resolved) {
      throw new functions.https.HttpsError('failed-precondition', 'Cannot cancel a resolved contest');
    }
    
    if (contest.status === 'cancelled') {
      throw new functions.https.HttpsError('failed-precondition', 'Contest is already cancelled');
    }
    
    console.log(`Contest validation passed. Status: ${contest.status}, Participants: ${contest.participantCount || 0}`);
    
    // Start transaction to cancel contest and refund participants
    await db.runTransaction(async (transaction) => {
      // Update contest status
      transaction.update(contestRef, {
        status: 'cancelled',
        cancelled: true,
        cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      // Get all participants for refunds
      const participantsSnapshot = await db.collection('dailyContestParticipants')
        .where('contestId', '==', contestId)
        .get();
      
      console.log(`Found ${participantsSnapshot.size} participants to refund`);
      
      // Process refunds for each participant
      for (const participantDoc of participantsSnapshot.docs) {
        const participant = participantDoc.data();
        const userId = participant.userId;
        const entryFee = parseFloat(participant.entryFee || 0);
        
        if (entryFee > 0) {
          // Add refund to user's balance
          const userRef = db.collection('users').doc(userId);
          
          transaction.update(userRef, {
            nutsBalance: admin.firestore.FieldValue.increment(entryFee),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
          
          // Log the refund transaction
          const refundRef = db.collection('transactions').doc();
          transaction.set(refundRef, {
            userId: userId,
            type: 'refund',
            amount: entryFee,
            contestId: contestId,
            contestType: 'daily',
            description: `Refund for cancelled daily contest: ${contest.title}`,
            status: 'completed',
            createdAt: admin.firestore.FieldValue.serverTimestamp()
          });
          
          console.log(`Refunding ${entryFee} NUTS to user ${userId}`);
        }
        
        // Update participant status
        transaction.update(participantDoc.ref, {
          status: 'refunded',
          refundedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }
    });
    
    console.log(`Contest ${contestId} cancelled successfully`);
    
    return {
      success: true,
      message: 'Contest cancelled and participants refunded',
      contestId: contestId
    };
    
  } catch (error) {
    console.error('Error cancelling contest:', error);
    
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    
    throw new functions.https.HttpsError('internal', 'Failed to cancel contest: ' + error.message);
  }
});

// Delete Daily Contest Function
exports.deleteDailyContest = functions.https.onCall(async (data, context) => {
  try {
    const { contestId } = data;
    
    if (!contestId) {
      throw new functions.https.HttpsError('invalid-argument', 'Contest ID is required');
    }
    
    console.log(`Starting deletion for contest: ${contestId}`);
    
    const db = admin.firestore();
    const contestRef = db.collection('dailyContests').doc(contestId);
    const contestDoc = await contestRef.get();
    
    if (!contestDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Contest not found');
    }
    
    const contest = contestDoc.data();
    
    // Validation checks - only allow deletion of draft or cancelled contests
    if (contest.published && contest.status !== 'cancelled' && contest.status !== 'draft') {
      throw new functions.https.HttpsError('failed-precondition', 
        'Can only delete draft or cancelled contests');
    }
    
    console.log(`Contest validation passed for deletion. Status: ${contest.status}`);
    
    // Delete all related data in a transaction
    await db.runTransaction(async (transaction) => {
      // Delete all participants
      const participantsSnapshot = await db.collection('dailyContestParticipants')
        .where('contestId', '==', contestId)
        .get();
      
      console.log(`Deleting ${participantsSnapshot.size} participant records`);
      
      participantsSnapshot.docs.forEach(doc => {
        transaction.delete(doc.ref);
      });
      
      // Delete all related transactions (if any)
      const transactionsSnapshot = await db.collection('transactions')
        .where('contestId', '==', contestId)
        .get();
      
      console.log(`Deleting ${transactionsSnapshot.size} transaction records`);
      
      transactionsSnapshot.docs.forEach(doc => {
        transaction.delete(doc.ref);
      });
      
      // Delete the contest itself
      transaction.delete(contestRef);
    });
    
    console.log(`Contest ${contestId} deleted successfully`);
    
    return {
      success: true,
      message: 'Contest and all related data deleted permanently',
      contestId: contestId
    };
    
  } catch (error) {
    console.error('Error deleting contest:', error);
    
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    
    throw new functions.https.HttpsError('internal', 'Failed to delete contest: ' + error.message);
  }
});
