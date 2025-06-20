const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { XummSdk } = require('xumm-sdk');

// Initialize XUMM SDK
const xumm = new XummSdk(
    process.env.XUMM_API_KEY,
    process.env.XUMM_API_SECRET
);

/**
 * Process contest payouts for winners
 * Can be triggered manually or via scheduled function
 */
exports.processContestPayouts = functions.https.onCall(async (data, context) => {
    console.log('🏆 Processing contest payouts...');
    
    // Verify admin access
    if (!context.auth || !context.auth.token.admin) {
        throw new functions.https.HttpsError(
            'permission-denied',
            'Only admins can process payouts'
        );
    }
    
    const { contestDate } = data;
    if (!contestDate) {
        throw new functions.https.HttpsError(
            'invalid-argument',
            'Contest date is required'
        );
    }
    
    try {
        const db = admin.firestore();
        
        // Get all contest entries for the date
        const entriesSnapshot = await db.collection('contest_entries')
            .where('contestDate', '==', contestDate)
            .get();
        
        const entries = [];
        entriesSnapshot.forEach(doc => {
            entries.push({ id: doc.id, ...doc.data() });
        });
        
        console.log(`Found ${entries.length} entries for ${contestDate}`);
        
        // Check minimum entries requirement
        const minimumEntries = 4;
        if (entries.length < minimumEntries) {
            console.log(`❌ Contest cancelled: Only ${entries.length} entries (minimum ${minimumEntries} required)`);
            
            // Process refunds
            return await processRefunds(entries, contestDate);
        }
        
        // Get winners (top 3)
        const winners = entries
            .filter(e => e.status === 'won' && e.place <= 3)
            .sort((a, b) => a.place - b.place);
        
        if (winners.length === 0) {
            throw new functions.https.HttpsError(
                'failed-precondition',
                'No winners found. Run calculate winners first.'
            );
        }
        
        console.log(`Processing payouts for ${winners.length} winners`);
        
        const payoutResults = [];
        
        for (const winner of winners) {
            try {
                // Create payout transaction
                const payoutResult = await createPayout(winner);
                payoutResults.push(payoutResult);
                
                // Update payout status
                await db.collection('payouts').doc(payoutResult.payoutId).update({
                    status: 'completed',
                    transactionHash: payoutResult.transactionHash,
                    completedAt: admin.firestore.FieldValue.serverTimestamp()
                });
                
                // Update contest entry
                await db.collection('contest_entries').doc(winner.id).update({
                    payoutStatus: 'completed',
                    payoutTransactionHash: payoutResult.transactionHash,
                    payoutCompletedAt: admin.firestore.FieldValue.serverTimestamp()
                });
                
            } catch (error) {
                console.error(`Failed to process payout for ${winner.userName}:`, error);
                payoutResults.push({
                    success: false,
                    winnerId: winner.id,
                    error: error.message
                });
            }
        }
        
        return {
            success: true,
            contestDate: contestDate,
            totalEntries: entries.length,
            payouts: payoutResults
        };
        
    } catch (error) {
        console.error('Payout processing failed:', error);
        throw new functions.https.HttpsError(
            'internal',
            'Failed to process payouts: ' + error.message
        );
    }
});

/**
 * Create a payout transaction using XUMM
 */
async function createPayout(winner) {
    const payload = {
        TransactionType: 'Payment',
        Destination: winner.walletAddress,
        Amount: {
            currency: '4E555453000000000000000000000000000000000', // NUTS currency code
            value: winner.prizeWon.toString(),
            issuer: 'rGicRjhWCUxTCWVJtCJL8Dz3bgbZz5LTXz' // NUTS issuer
        },
        Memos: [{
            Memo: {
                MemoType: Buffer.from('Contest Prize', 'utf8').toString('hex'),
                MemoData: Buffer.from(`${winner.place} place - ${winner.contestDate}`, 'utf8').toString('hex')
            }
        }]
    };
    
    // In production, this would create a real XUMM payload
    // For now, simulate the transaction
    console.log(`💰 Creating payout: ${winner.prizeWon} NUTS to ${winner.userName} (${winner.place} place)`);
    
    // Simulate transaction hash
    const transactionHash = generateTransactionHash();
    
    return {
        success: true,
        payoutId: `PAYOUT_${Date.now()}_${winner.id}`,
        winnerId: winner.id,
        userName: winner.userName,
        place: winner.place,
        amount: winner.prizeWon,
        walletAddress: winner.walletAddress,
        transactionHash: transactionHash,
        timestamp: new Date().toISOString()
    };
}

/**
 * Process refunds for cancelled contest
 */
async function processRefunds(entries, contestDate) {
    console.log(`💸 Processing refunds for ${entries.length} entries`);
    
    const db = admin.firestore();
    const refundResults = [];
    
    for (const entry of entries) {
        if (!entry.walletAddress || !entry.transactionId) {
            console.warn(`Skipping refund for ${entry.userName}: Missing wallet info`);
            continue;
        }
        
        try {
            // Create refund record
            const refundDoc = await db.collection('refunds').add({
                entryId: entry.id,
                userId: entry.userId,
                userName: entry.userName,
                walletAddress: entry.walletAddress,
                amount: entry.entryFee || 50,
                currency: 'NUTS',
                reason: 'insufficient_entries',
                originalTxId: entry.transactionId,
                contestDate: contestDate,
                status: 'pending',
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });
            
            // In production, create XUMM refund transaction here
            
            refundResults.push({
                success: true,
                entryId: entry.id,
                userName: entry.userName,
                refundId: refundDoc.id
            });
            
            // Update entry status
            await db.collection('contest_entries').doc(entry.id).update({
                status: 'refunded',
                refundId: refundDoc.id,
                refundedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            
        } catch (error) {
            console.error(`Failed to process refund for ${entry.userName}:`, error);
            refundResults.push({
                success: false,
                entryId: entry.id,
                error: error.message
            });
        }
    }
    
    return {
        success: true,
        type: 'refunds',
        contestDate: contestDate,
        reason: 'insufficient_entries',
        totalEntries: entries.length,
        refunds: refundResults
    };
}

/**
 * Generate a mock transaction hash (in production, would be real XRPL hash)
 */
function generateTransactionHash() {
    const chars = '0123456789ABCDEF';
    let hash = '';
    for (let i = 0; i < 64; i++) {
        hash += chars[Math.floor(Math.random() * chars.length)];
    }
    return hash;
}

/**
 * Scheduled function to check for contests that need payouts
 */
exports.scheduledPayoutCheck = functions.pubsub
    .schedule('0 1 * * *') // Run at 1 AM daily
    .timeZone('America/New_York')
    .onRun(async (context) => {
        console.log('🕐 Running scheduled payout check...');
        
        const db = admin.firestore();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        
        try {
            // Check for unpaid winners
            const unpaidWinners = await db.collection('contest_entries')
                .where('contestDate', '==', yesterdayStr)
                .where('status', '==', 'won')
                .where('payoutStatus', '!=', 'completed')
                .get();
            
            if (!unpaidWinners.empty) {
                console.log(`Found ${unpaidWinners.size} unpaid winners for ${yesterdayStr}`);
                
                // Send notification to admin
                // In production, send email or push notification
                console.log('⚠️ Admin notification: Unpaid winners require attention');
            }
            
            return null;
            
        } catch (error) {
            console.error('Scheduled payout check failed:', error);
            return null;
        }
    });