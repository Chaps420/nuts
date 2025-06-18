const functions = require('firebase-functions');
const cors = require('cors');
const fetch = require('node-fetch');

// Enable CORS for all origins (you can restrict this later)
const corsHandler = cors({ origin: true });

// Get config from Firebase Functions environment
const getConfig = () => ({
    apiKey: functions.config().xumm?.api_key || '5ae8e69a-1b48-4f80-b5bb-20ae099e6f2f',
    apiSecret: functions.config().xumm?.api_secret || '7bdae91f-17cc-4d0b-b883-7c21628df06e'
});

// NUTS Token Configuration
const NUTS_CONFIG = {
    issuer: 'rBpdegD7kqHdczjKzTKNEUZj1Fg1eYZRbe',
    contestWallet: 'rN2K1Tv6LEM94YN8Kxfe3QyWcGPQNgsD6d',
    hexCode: '4E75747300000000000000000000000000000000' // "Nuts" from trust line
};

/**
 * Create NUTS payment - HTTP endpoint for compatibility with existing code
 */
exports.createNutsPayment = functions.https.onRequest((req, res) => {
    return corsHandler(req, res, async () => {
        if (req.method !== 'POST') {
            return res.status(405).json({ error: 'Method not allowed' });
        }

        try {
            const { amount = 50, memo = 'Contest Entry', destination = null } = req.body;
            const config = getConfig();
            
            // Use provided destination or default to contest wallet
            const paymentDestination = destination || NUTS_CONFIG.contestWallet;
            const isPayoutMode = destination !== null;
            
            console.log('Creating NUTS payment:', {
                amount,
                destination: paymentDestination,
                type: isPayoutMode ? 'Payout' : 'Contest Entry'
            });

            // Create XUMM payload
            const payload = {
                txjson: {
                    TransactionType: 'Payment',
                    Destination: paymentDestination,
                    DestinationTag: isPayoutMode ? undefined : 2024,
                    Amount: {
                        currency: NUTS_CONFIG.hexCode,
                        value: amount.toString(),
                        issuer: NUTS_CONFIG.issuer
                    },
                    Memos: [
                        {
                            Memo: {
                                MemoData: Buffer.from(memo, 'utf8').toString('hex').toUpperCase()
                            }
                        }
                    ]
                },
                options: {
                    submit: true,
                    expire: 300, // 5 minutes
                    return_url: {
                        web: req.headers.origin || 'https://chaps420.github.io/nuts',
                        app: req.headers.origin || 'https://chaps420.github.io/nuts'
                    }
                },
                custom_meta: {
                    identifier: isPayoutMode ? `payout_${Date.now()}` : `contest_${Date.now()}`,
                    instruction: `${memo} - ${amount} NUTS`,
                    blob: {
                        purpose: isPayoutMode ? 'Prize Payout' : 'Contest Entry Payment',
                        amount: amount,
                        currency: 'NUTS'
                    }
                }
            };

            // Call XUMM API
            const response = await fetch('https://xumm.app/api/v1/platform/payload', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': config.apiKey,
                    'X-API-Secret': config.apiSecret
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`XUMM API error: ${response.status} - ${errorText}`);
            }

            const result = await response.json();
            
            res.json({
                success: true,
                payload: result
            });

        } catch (error) {
            console.error('Payment creation error:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });
});

/**
 * Check payment status - HTTP endpoint
 */
exports.payloadStatus = functions.https.onRequest((req, res) => {
    return corsHandler(req, res, async () => {
        try {
            const uuid = req.params.uuid || req.path.split('/').pop();
            const config = getConfig();
            
            if (!uuid || uuid === 'payloadStatus') {
                throw new Error('UUID parameter required');
            }

            const response = await fetch(`https://xumm.app/api/v1/platform/payload/${uuid}`, {
                method: 'GET',
                headers: {
                    'X-API-Key': config.apiKey,
                    'X-API-Secret': config.apiSecret
                }
            });

            if (!response.ok) {
                throw new Error(`XUMM API error: ${response.status}`);
            }

            const result = await response.json();
            
            res.json({
                success: true,
                meta: {
                    signed: result.meta.signed,
                    resolved: result.meta.resolved,
                    cancelled: result.meta.cancelled,
                    expired: result.meta.expired
                },
                response: {
                    txid: result.response?.txid,
                    account: result.response?.account
                }
            });

        } catch (error) {
            console.error('Status check error:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });
});