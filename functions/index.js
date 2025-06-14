/**
 * Firebase Cloud Functions for NUTS Sports Pick'em Platform
 * Integrates with existing Xaman Firebase Auth package
 * Handles user management, bet storage, and payout QR generation
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();
const auth = admin.auth();

/**
 * Process Xaman authentication using the existing auth flow
 * This function works with the Xaman Firebase Auth package
 */
exports.processXamanAuth = functions.https.onRequest(async (req, res) => {
    // Enable CORS
    cors(req, res, async () => {
        try {
            console.log('🔄 Processing Xaman authentication with enhanced flow...');

            const { payloadId, userAddress, signedTx, authorizationCode } = req.body;

            // If we have an authorization code, use the OAuth2 flow
            if (authorizationCode) {
                // This would integrate with the xaman_firebase_auth package
                // For now, we'll create a user directly
                console.log('📱 OAuth2 flow detected');
            }

        // Validate input
        if (!userAddress) {
            throw new functions.https.HttpsError('invalid-argument', 'Missing user address');
        }

        // Validate XRPL address format
        if (!userAddress.startsWith('r') || userAddress.length < 25) {
            throw new functions.https.HttpsError('invalid-argument', 'Invalid XRPL address format');
        }

        // Generate consistent user ID from XRPL address
        const uid = generateUserId(userAddress);

        // Check if user already exists
        let user;
        try {
            user = await auth.getUser(uid);
            console.log('✅ Existing user found:', user.uid);
        } catch (error) {
            // User doesn't exist, create new one
            console.log('🔄 Creating new Firebase user...');
            
            user = await auth.createUser({
                uid: uid,
                displayName: `NUTS Player ${userAddress.substring(0, 8)}`,
                emailVerified: true
            });

            console.log('✅ New user created:', user.uid);
        }

        // Create/update Firestore user document
        await db.collection('users').doc(user.uid).set({
            xrplAddress: userAddress,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
            totalBets: 0,
            totalWins: 0,
            totalNutsWon: 0,
            authMethod: 'xaman_qr',
            payloadHistory: admin.firestore.FieldValue.arrayUnion(payloadId || 'direct_auth')
        }, { merge: true });

        // Set custom claims for XRPL address
        await auth.setCustomUserClaims(uid, {
            xrplAddress: userAddress,
            authProvider: 'xaman'
        });

        // Generate custom token for Firebase authentication
        const customToken = await auth.createCustomToken(uid, {
            xrplAddress: userAddress,
            authMethod: 'xaman'
        });

        console.log('✅ Custom token generated for user:', user.uid);

        return {
            success: true,
            customToken: customToken,
            userData: {
                uid: user.uid,
                xrplAddress: userAddress,
                displayName: user.displayName
            }
        };

    } catch (error) {
        console.error('❌ Xaman authentication error:', error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});

/**
 * Create a user bet (enhanced version)
 */
exports.createUserBet = functions.https.onCall(async (data, context) => {
    try {
        // Verify authentication
        if (!context.auth) {
            throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
        }

        console.log('💰 Creating bet for user:', context.auth.uid);

        const { contestId, gameId, selection, odds, amount, txHash, gameTime, sport } = data;

        // Validate required fields
        if (!contestId || !gameId || !selection) {
            throw new functions.https.HttpsError('invalid-argument', 'Missing required bet fields');
        }

        // Get user data
        const userDoc = await db.collection('users').doc(context.auth.uid).get();
        if (!userDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'User not found');
        }

        const userData = userDoc.data();

        // Create bet document with enhanced data
        const bet = {
            userId: context.auth.uid,
            userAddress: userData.xrplAddress,
            contestId: contestId,
            gameId: gameId,
            selection: selection,
            selectedTeam: data.selectedTeam || 'Unknown',
            opposingTeam: data.opposingTeam || 'Unknown',
            odds: odds || 'N/A',
            amount: amount || 100,
            txHash: txHash || null,
            gameTime: gameTime || null,
            sport: sport || 'MLB',
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            status: 'pending',
            result: null,
            metadata: {
                userAgent: context.rawRequest.headers['user-agent'] || 'Unknown',
                ipAddress: context.rawRequest.ip || 'Unknown',
                timestamp: new Date().toISOString()
            }
        };

        const betRef = await db.collection('bets').add(bet);

        // Update user stats
        await db.collection('users').doc(context.auth.uid).update({
            totalBets: admin.firestore.FieldValue.increment(1),
            lastBetAt: admin.firestore.FieldValue.serverTimestamp()
        });

        console.log('✅ Bet created:', betRef.id);

        return {
            success: true,
            betId: betRef.id,
            bet: bet
        };

    } catch (error) {
        console.error('❌ Create bet error:', error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});

/**
 * Generate payout QR code for admin (enhanced version)
 */
exports.generatePayoutQR = functions.https.onCall(async (data, context) => {
    try {
        console.log('💸 Generating payout QR:', data);

        const { recipientAddress, amount, contestId, memo, betId } = data;

        if (!recipientAddress || !amount) {
            throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
        }

        // Validate XRPL address
        if (!recipientAddress.startsWith('r')) {
            throw new functions.https.HttpsError('invalid-argument', 'Invalid XRPL address');
        }

        // Create enhanced payout payload
        const payloadId = 'payout-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        
        // In production, this would create a real Xaman payment request
        const simulatedPayload = {
            uuid: payloadId,
            qr_png: generateEnhancedPayoutQR(recipientAddress, amount, contestId),
            pushed: true,
            expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
            metadata: {
                recipientAddress,
                amount,
                contestId,
                memo: memo || `NUTS Prize - Contest ${contestId}`,
                createdAt: new Date().toISOString()
            }
        };

        // Log payout attempt with enhanced tracking
        await db.collection('payouts').add({
            recipientAddress: recipientAddress,
            amount: amount,
            contestId: contestId,
            betId: betId || null,
            memo: memo || `NUTS Prize - Contest ${contestId}`,
            payloadId: simulatedPayload.uuid,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            status: 'pending',
            metadata: {
                adminUser: context.auth?.uid || 'system',
                ipAddress: context.rawRequest?.ip || 'Unknown',
                userAgent: context.rawRequest?.headers['user-agent'] || 'Unknown'
            }
        });

        console.log('✅ Enhanced payout QR generated');

        return {
            success: true,
            qrData: simulatedPayload.qr_png,
            payloadId: simulatedPayload.uuid,
            metadata: simulatedPayload.metadata
        };

    } catch (error) {
        console.error('❌ Generate payout QR error:', error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});

/**
 * Get user betting statistics
 */
exports.getUserStats = functions.https.onCall(async (data, context) => {
    try {
        if (!context.auth) {
            throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
        }

        const userId = context.auth.uid;
        
        // Get user document
        const userDoc = await db.collection('users').doc(userId).get();
        const userData = userDoc.data();

        // Get user's bets
        const betsSnapshot = await db.collection('bets')
            .where('userId', '==', userId)
            .orderBy('timestamp', 'desc')
            .limit(50)
            .get();

        const bets = [];
        betsSnapshot.forEach(doc => {
            bets.push({ id: doc.id, ...doc.data() });
        });

        // Calculate stats
        const stats = {
            totalBets: bets.length,
            pendingBets: bets.filter(bet => bet.status === 'pending').length,
            wonBets: bets.filter(bet => bet.result === 'win').length,
            lostBets: bets.filter(bet => bet.result === 'loss').length,
            totalNutsWon: userData?.totalNutsWon || 0,
            winPercentage: bets.length > 0 ? (bets.filter(bet => bet.result === 'win').length / bets.filter(bet => bet.result !== null).length * 100).toFixed(1) : 0
        };

        return {
            success: true,
            userData: userData,
            stats: stats,
            recentBets: bets.slice(0, 10)
        };

    } catch (error) {
        console.error('❌ Get user stats error:', error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});

/**
 * Resolve contest results (enhanced version)
 */
exports.resolveContest = functions.https.onCall(async (data, context) => {
    try {
        console.log('🏆 Resolving contest:', data);

        const { contestId, gameResults } = data;

        if (!contestId || !gameResults) {
            throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
        }

        // Get all bets for this contest
        const betsSnapshot = await db.collection('bets')
            .where('contestId', '==', contestId)
            .where('status', '==', 'pending')
            .get();

        const batch = db.batch();
        let winnersCount = 0;
        let losersCount = 0;
        let pushCount = 0;

        betsSnapshot.forEach(doc => {
            const bet = doc.data();
            const gameResult = gameResults[bet.gameId];
            
            if (gameResult) {
                let result = 'loss';
                let payout = 0;
                
                if (gameResult.winner === bet.selection) {
                    result = 'win';
                    payout = bet.amount * 2; // 2x payout for wins
                    winnersCount++;
                } else if (gameResult.status === 'postponed' || gameResult.status === 'cancelled') {
                    result = 'push';
                    payout = bet.amount; // Return original amount
                    pushCount++;
                } else {
                    losersCount++;
                }

                batch.update(doc.ref, {
                    result: result,
                    status: 'resolved',
                    payout: payout,
                    resolvedAt: admin.firestore.FieldValue.serverTimestamp(),
                    finalScore: gameResult.score || null,
                    gameStatus: gameResult.status || 'completed'
                });

                // Update user stats for wins
                if (result === 'win') {
                    const userRef = db.collection('users').doc(bet.userId);
                    batch.update(userRef, {
                        totalWins: admin.firestore.FieldValue.increment(1),
                        totalNutsWon: admin.firestore.FieldValue.increment(payout)
                    });
                }
            }
        });

        await batch.commit();

        // Create contest result summary
        await db.collection('contest_results').doc(contestId).set({
            contestId: contestId,
            resolvedAt: admin.firestore.FieldValue.serverTimestamp(),
            totalBets: betsSnapshot.size,
            winnersCount: winnersCount,
            losersCount: losersCount,
            pushCount: pushCount,
            gameResults: gameResults,
            resolvedBy: context.auth?.uid || 'system'
        });

        console.log(`✅ Contest resolved: ${winnersCount} winners, ${losersCount} losers, ${pushCount} pushes`);

        return {
            success: true,
            winnersCount: winnersCount,
            losersCount: losersCount,
            pushCount: pushCount,
            totalBets: betsSnapshot.size
        };

    } catch (error) {
        console.error('❌ Resolve contest error:', error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});

/**
 * Helper Functions
 */

function generateUserId(xrplAddress) {
    // Generate consistent user ID from XRPL address
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(xrplAddress).digest('hex').substring(0, 28);
}

function generateEnhancedPayoutQR(address, amount, contestId) {
    // Enhanced QR generation with better visual design
    const qrData = `xrpl:${address}?amount=${amount}&memo=NUTS-Prize-${contestId}`;
    
    // This would use a real QR library in production
    // For now, return a base64 data URL
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAYAAABccqhmAAAACXBIWXMAAA7EAAAOxAGVKw4bAAABnUlEQVR4nO3BMQEAAAjAoNu/tCE+IBAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA4A3AcAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
}

console.log('🔥 Enhanced Cloud Functions module loaded');

/**
 * Process Xaman authentication and create Firebase user
 */
exports.processXamanAuth = functions.https.onCall(async (data, context) => {
    try {
        console.log('🔄 Processing Xaman authentication:', data);

        const { payloadId, userAddress, signedTx } = data;

        // Validate input
        if (!payloadId || !userAddress) {
            throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
        }

        // Validate XRPL address format
        if (!userAddress.startsWith('r') || userAddress.length < 25) {
            throw new functions.https.HttpsError('invalid-argument', 'Invalid XRPL address format');
        }

        // Check if user already exists
        let user;
        try {
            user = await auth.getUserByEmail(`${userAddress}@nuts.local`);
            console.log('✅ Existing user found:', user.uid);
        } catch (error) {
            // User doesn't exist, create new one
            console.log('🔄 Creating new Firebase user...');
            
            user = await auth.createUser({
                uid: generateUserId(userAddress),
                email: `${userAddress}@nuts.local`,
                displayName: userAddress,
                emailVerified: true
            });

            // Create Firestore user document
            await db.collection('users').doc(user.uid).set({
                xrplAddress: userAddress,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
                totalBets: 0,
                totalWins: 0,
                totalNutsWon: 0,
                authMethod: 'xaman',
                payloadHistory: [payloadId]
            });

            console.log('✅ New user created:', user.uid);
        }

        // Update last login
        await db.collection('users').doc(user.uid).update({
            lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
            payloadHistory: admin.firestore.FieldValue.arrayUnion(payloadId)
        });

        // Generate custom token for Firebase authentication
        const customToken = await auth.createCustomToken(user.uid, {
            xrplAddress: userAddress,
            authMethod: 'xaman'
        });

        console.log('✅ Custom token generated for user:', user.uid);

        return {
            success: true,
            customToken: customToken,
            userData: {
                uid: user.uid,
                xrplAddress: userAddress,
                email: user.email
            }
        };

    } catch (error) {
        console.error('❌ Xaman authentication error:', error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});

/**
 * Create a user bet
 */
exports.createUserBet = functions.https.onCall(async (data, context) => {
    try {
        // Verify authentication
        if (!context.auth) {
            throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
        }

        console.log('💰 Creating bet for user:', context.auth.uid);

        const { contestId, gameId, selection, odds, amount, txHash } = data;

        // Validate required fields
        if (!contestId || !gameId || !selection) {
            throw new functions.https.HttpsError('invalid-argument', 'Missing required bet fields');
        }

        // Get user data
        const userDoc = await db.collection('users').doc(context.auth.uid).get();
        if (!userDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'User not found');
        }

        const userData = userDoc.data();

        // Create bet document
        const bet = {
            userId: context.auth.uid,
            userAddress: userData.xrplAddress,
            contestId: contestId,
            gameId: gameId,
            selection: selection,
            odds: odds || 'N/A',
            amount: amount || 100,
            txHash: txHash || null,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            status: 'pending',
            result: null
        };

        const betRef = await db.collection('bets').add(bet);

        // Update user stats
        await db.collection('users').doc(context.auth.uid).update({
            totalBets: admin.firestore.FieldValue.increment(1),
            lastBetAt: admin.firestore.FieldValue.serverTimestamp()
        });

        console.log('✅ Bet created:', betRef.id);

        return {
            success: true,
            betId: betRef.id,
            bet: bet
        };

    } catch (error) {
        console.error('❌ Create bet error:', error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});

/**
 * Generate payout QR code for admin
 */
exports.generatePayoutQR = functions.https.onCall(async (data, context) => {
    try {
        // In production, you'd want to verify admin permissions here
        console.log('💸 Generating payout QR:', data);

        const { recipientAddress, amount, contestId, memo } = data;

        if (!recipientAddress || !amount) {
            throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
        }

        // Create Xaman payload for NUTS token transfer
        const payloadData = {
            txjson: {
                TransactionType: 'Payment',
                Destination: recipientAddress,
                Amount: {
                    currency: 'NUTS',
                    value: amount.toString(),
                    issuer: 'rNutsTokenIssuerAddressHere' // Replace with actual NUTS token issuer
                },
                Memos: memo ? [{
                    Memo: {
                        MemoData: Buffer.from(memo, 'utf8').toString('hex').toUpperCase()
                    }
                }] : undefined
            },
            options: {
                submit: true,
                expire: 10 // 10 minutes
            }
        };

        // In production, you'd make actual Xaman API call here
        // For now, return simulated data
        const simulatedPayload = {
            uuid: 'payout-' + Date.now(),
            qr_png: generateSimulatedPayoutQR(recipientAddress, amount),
            pushed: true,
            expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString()
        };

        // Log payout attempt
        await db.collection('payouts').add({
            recipientAddress: recipientAddress,
            amount: amount,
            contestId: contestId,
            memo: memo,
            payloadId: simulatedPayload.uuid,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            status: 'pending'
        });

        console.log('✅ Payout QR generated');

        return {
            success: true,
            qrData: simulatedPayload.qr_png,
            payloadId: simulatedPayload.uuid
        };

    } catch (error) {
        console.error('❌ Generate payout QR error:', error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});

/**
 * Get contest results and update bet statuses
 */
exports.resolveContest = functions.https.onCall(async (data, context) => {
    try {
        console.log('🏆 Resolving contest:', data);

        const { contestId, gameResults } = data;

        if (!contestId || !gameResults) {
            throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
        }

        // Get all bets for this contest
        const betsSnapshot = await db.collection('bets')
            .where('contestId', '==', contestId)
            .get();

        const batch = db.batch();
        let winnersCount = 0;
        let losersCount = 0;

        betsSnapshot.forEach(doc => {
            const bet = doc.data();
            const gameResult = gameResults[bet.gameId];
            
            if (gameResult) {
                let result = 'loss';
                if (gameResult.winner === bet.selection) {
                    result = 'win';
                    winnersCount++;
                } else if (gameResult.status === 'postponed' || gameResult.status === 'cancelled') {
                    result = 'push';
                } else {
                    losersCount++;
                }

                batch.update(doc.ref, {
                    result: result,
                    status: 'resolved',
                    resolvedAt: admin.firestore.FieldValue.serverTimestamp(),
                    finalScore: gameResult.score
                });

                // Update user stats for wins
                if (result === 'win') {
                    const userRef = db.collection('users').doc(bet.userId);
                    batch.update(userRef, {
                        totalWins: admin.firestore.FieldValue.increment(1),
                        totalNutsWon: admin.firestore.FieldValue.increment(bet.amount * 2) // 2x payout
                    });
                }
            }
        });

        await batch.commit();

        console.log(`✅ Contest resolved: ${winnersCount} winners, ${losersCount} losers`);

        return {
            success: true,
            winnersCount: winnersCount,
            losersCount: losersCount,
            totalBets: betsSnapshot.size
        };

    } catch (error) {
        console.error('❌ Resolve contest error:', error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});

/**
 * Helper Functions
 */

function generateUserId(xrplAddress) {
    // Generate consistent user ID from XRPL address
    return crypto.createHash('sha256').update(xrplAddress).digest('hex').substring(0, 28);
}

function generateSimulatedPayoutQR(address, amount) {
    // Generate a simple base64 data URL for QR simulation
    const canvas = createCanvas(256, 256);
    const ctx = canvas.getContext('2d');
    
    // Fill with white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 256, 256);
    
    // Draw simple QR pattern
    ctx.fillStyle = '#000000';
    for (let i = 0; i < 256; i += 8) {
        for (let j = 0; j < 256; j += 8) {
            if ((i + j) % 16 === 0) {
                ctx.fillRect(i, j, 8, 8);
            }
        }
    }
    
    // Add payout info as text overlay
    ctx.fillStyle = '#ff0000';
    ctx.font = '12px Arial';
    ctx.fillText(`${amount} NUTS`, 10, 20);
    ctx.fillText(`To: ${address.substring(0, 10)}...`, 10, 35);
    
    return canvas.toDataURL();
}

function createCanvas(width, height) {
    // Simplified canvas creation for server environment
    return {
        width: width,
        height: height,
        getContext: () => ({
            fillStyle: '#ffffff',
            fillRect: () => {},
            font: '',
            fillText: () => {}
        }),
        toDataURL: () => 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
    };
}

console.log('🔥 Cloud Functions module loaded');
