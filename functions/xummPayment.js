const functions = require('firebase-functions');
const admin = require('firebase-admin');
const fetch = require('node-fetch');
const cors = require('cors')({ origin: true });

/**
 * Firebase Cloud Function to create XUMM payment payloads
 * Enhanced with NUTS token auto-population features
 */

// XUMM API credentials (store in Firebase config)
const XUMM_API_KEY = process.env.XUMM_API_KEY || '5ae8e69a-1b48-4f80-b5bb-20ae099e6f2f';
const XUMM_API_SECRET = process.env.XUMM_API_SECRET || '6b5d2831-aa58-4b5b-9b72-fe0f65de3e5c';

// NUTS Token configuration
const NUTS_TOKEN_CONFIG = {
    issuer: 'rBpdegD7kqHdczjKzTKNEUZj1Fg1eYZRbe',
    currency: 'NUTS',
    name: 'NUTS Token',
    symbol: 'NUTS',
    decimals: 6,
    description: 'NUTS Sports Pick\'em Token',
    icon: 'https://nuts-sports.com/assets/nuts-logo.png'
};

// Contest wallet configuration
const CONTEST_WALLET = 'rN2K1Tv6LEM94YN8Kxfe3QyWcGPQNgsD6d';

/**
 * Create a XUMM payment payload for contest entry
 */
exports.createXummPayment = functions.https.onCall(async (data, context) => {
    try {
        console.log('Creating XUMM payment payload...');
        
        // Validate input
        if (!data.userWallet) {
            throw new functions.https.HttpsError('invalid-argument', 'User wallet address is required');
        }

        // Contest payment details
        const entryFee = data.amount || '50';

        // Create the payment transaction with NUTS token details
        const paymentTx = {
            TransactionType: 'Payment',
            Account: data.userWallet, // From user's wallet
            Destination: CONTEST_WALLET, // To contest wallet
            Amount: {
                currency: NUTS_TOKEN_CONFIG.currency,
                value: entryFee,
                issuer: NUTS_TOKEN_CONFIG.issuer
            },
            Memos: [
                {
                    Memo: {
                        MemoType: Buffer.from('Contest Entry', 'utf8').toString('hex').toUpperCase(),
                        MemoData: Buffer.from(JSON.stringify({
                            contest: 'daily',
                            date: new Date().toISOString().split('T')[0],
                            userId: context.auth?.uid || 'anonymous'
                        }), 'utf8').toString('hex').toUpperCase()
                    }
                }
            ]
        };

        // Create XUMM payload
        const xummPayload = {
            txjson: paymentTx,
            options: {
                submit: true,
                expire: 5, // 5 minutes
                return_url: {
                    web: `${data.returnUrl || 'https://your-domain.com/daily-contest.html'}?payment=success`,
                    app: 'https://your-domain.com/daily-contest.html?payment=success'
                }
            },
            custom_meta: {
                instruction: 'Contest Entry Payment - 50 NUTS',
                identifier: `contest_${Date.now()}`
            }
        };

        // Call XUMM API
        const response = await fetch('https://xumm.app/api/v1/platform/payload', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': XUMM_API_KEY,
                'X-API-Secret': XUMM_API_SECRET
            },
            body: JSON.stringify(xummPayload)
        });

        if (!response.ok) {
            const error = await response.text();
            console.error('XUMM API error:', error);
            throw new functions.https.HttpsError('internal', 'Failed to create payment request');
        }

        const result = await response.json();
        console.log('XUMM payload created:', result.uuid);

        // Store payload info in Firestore for tracking
        if (context.auth?.uid) {
            await admin.firestore().collection('payment_requests').doc(result.uuid).set({
                userId: context.auth.uid,
                userWallet: data.userWallet,
                payloadId: result.uuid,
                status: 'pending',
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                amount: entryFee,
                currency: 'NUTS',
                type: 'contest_entry'
            });
        }

        // Return the payload data
        return {
            success: true,
            uuid: result.uuid,
            next: result.next,
            refs: result.refs,
            pushed: result.pushed,
            qr_png: result.refs.qr_png,
            websocket_status: result.refs.websocket_status
        };

    } catch (error) {
        console.error('Error creating XUMM payment:', error);
        
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        
        throw new functions.https.HttpsError('internal', 'Failed to create payment request');
    }
});

/**
 * Check XUMM payment status
 */
exports.checkXummPayment = functions.https.onCall(async (data, context) => {
    try {
        if (!data.payloadId) {
            throw new functions.https.HttpsError('invalid-argument', 'Payload ID is required');
        }

        // Get payload status from XUMM
        const response = await fetch(`https://xumm.app/api/v1/platform/payload/${data.payloadId}`, {
            method: 'GET',
            headers: {
                'X-API-Key': XUMM_API_KEY,
                'X-API-Secret': XUMM_API_SECRET
            }
        });

        if (!response.ok) {
            throw new functions.https.HttpsError('internal', 'Failed to check payment status');
        }

        const result = await response.json();
        
        // Update Firestore if payment is complete
        if (result.meta.signed && context.auth?.uid) {
            await admin.firestore().collection('payment_requests').doc(data.payloadId).update({
                status: 'completed',
                signedAt: admin.firestore.FieldValue.serverTimestamp(),
                txid: result.response.txid,
                resolved: true
            });
        }

        return {
            success: true,
            signed: result.meta.signed,
            resolved: result.meta.resolved,
            cancelled: result.meta.cancelled,
            expired: result.meta.expired,
            txid: result.response?.txid,
            account: result.response?.account
        };

    } catch (error) {
        console.error('Error checking payment status:', error);
        
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        
        throw new functions.https.HttpsError('internal', 'Failed to check payment status');
    }
});

/**
 * Webhook to receive XUMM payload updates
 */
exports.xummWebhook = functions.https.onRequest(async (req, res) => {
    try {
        // Verify webhook signature (implement based on XUMM docs)
        const payload = req.body;
        
        if (payload.meta?.signed) {
            // Update payment status in Firestore
            await admin.firestore().collection('payment_requests').doc(payload.meta.uuid).update({
                status: 'completed',
                signedAt: admin.firestore.FieldValue.serverTimestamp(),
                txid: payload.response?.txid,
                resolved: true,
                webhookReceived: true
            });
            
            console.log('Payment completed:', payload.meta.uuid);
        }
        
        res.status(200).send('OK');
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).send('Error processing webhook');
    }
});

/**
 * Get NUTS token information for auto-population in Xaman
 */
exports.getNutsTokenInfo = functions.https.onCall(async (data, context) => {
    try {
        console.log('Fetching NUTS token information...');
        
        return {
            success: true,
            tokenInfo: {
                ...NUTS_TOKEN_CONFIG,
                // Add dynamic token information if needed
                currentSupply: null, // Could be fetched from XRPL
                holders: null, // Could be fetched from XRPL
                lastUpdated: new Date().toISOString()
            }
        };
    } catch (error) {
        console.error('Error fetching NUTS token info:', error);
        throw new functions.https.HttpsError('internal', 'Failed to fetch token information');
    }
});

/**
 * Create an enhanced NUTS payment with auto-populated token details
 */
exports.createNutsPayment = functions.https.onCall(async (data, context) => {
    try {
        console.log('Creating enhanced NUTS payment payload...');
        
        // Validate input
        if (!data.userWallet) {
            throw new functions.https.HttpsError('invalid-argument', 'User wallet address is required');
        }
        
        if (!data.amount) {
            throw new functions.https.HttpsError('invalid-argument', 'Payment amount is required');
        }

        const destination = data.destination || CONTEST_WALLET;
        const memo = data.memo || 'NUTS Payment';
        const returnUrl = data.returnUrl || 'https://nuts-sports.com';

        // Create enhanced payment transaction with token metadata
        const paymentTx = {
            TransactionType: 'Payment',
            Account: data.userWallet,
            Destination: destination,
            Amount: {
                currency: NUTS_TOKEN_CONFIG.currency,
                value: data.amount.toString(),
                issuer: NUTS_TOKEN_CONFIG.issuer
            },
            Memos: [
                {
                    Memo: {
                        MemoType: Buffer.from('NUTS Payment', 'utf8').toString('hex').toUpperCase(),
                        MemoData: Buffer.from(JSON.stringify({
                            memo: memo,
                            timestamp: new Date().toISOString(),
                            userId: context.auth?.uid || 'anonymous',
                            tokenSymbol: NUTS_TOKEN_CONFIG.symbol
                        }), 'utf8').toString('hex').toUpperCase()
                    }
                }
            ]
        };

        // Enhanced XUMM payload with token branding
        const xummPayload = {
            txjson: paymentTx,
            options: {
                submit: true,
                expire: 10, // 10 minutes
                return_url: {
                    web: `${returnUrl}?payment=success`,
                    app: `${returnUrl}?payment=success`
                }
            },
            custom_meta: {
                instruction: `${memo} - ${data.amount} ${NUTS_TOKEN_CONFIG.symbol}`,
                identifier: `nuts_payment_${Date.now()}`,
                blob: {
                    purpose: 'NUTS Token Payment',
                    token: NUTS_TOKEN_CONFIG.symbol
                }
            },
            // Enhanced user experience with token details
            user_token: {
                user_token: context.auth?.uid || null
            }
        };

        // Call XUMM API
        const response = await fetch('https://xumm.app/api/v1/platform/payload', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': XUMM_API_KEY,
                'X-API-Secret': XUMM_API_SECRET
            },
            body: JSON.stringify(xummPayload)
        });

        if (!response.ok) {
            const error = await response.text();
            console.error('XUMM API error:', error);
            throw new functions.https.HttpsError('internal', 'Failed to create NUTS payment request');
        }

        const result = await response.json();
        console.log('Enhanced NUTS payment payload created:', result.uuid);

        // Store enhanced payment info in Firestore
        if (context.auth?.uid) {
            await admin.firestore().collection('nuts_payments').doc(result.uuid).set({
                userId: context.auth.uid,
                userWallet: data.userWallet,
                destination: destination,
                payloadId: result.uuid,
                status: 'pending',
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                amount: data.amount.toString(),
                currency: NUTS_TOKEN_CONFIG.currency,
                tokenIssuer: NUTS_TOKEN_CONFIG.issuer,
                memo: memo,
                type: 'nuts_payment',
                tokenMetadata: NUTS_TOKEN_CONFIG
            });
        }

        // Return enhanced payload data
        return {
            success: true,
            uuid: result.uuid,
            next: result.next,
            refs: result.refs,
            pushed: result.pushed,
            qr_png: result.refs.qr_png,
            websocket_status: result.refs.websocket_status,
            tokenInfo: NUTS_TOKEN_CONFIG,
            paymentDetails: {
                amount: data.amount,
                currency: NUTS_TOKEN_CONFIG.currency,
                destination: destination,
                memo: memo
            }
        };

    } catch (error) {
        console.error('Error creating enhanced NUTS payment:', error);
        
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        
        throw new functions.https.HttpsError('internal', 'Failed to create NUTS payment request');
    }
});