/**
 * Simple Node.js server to create XUMM payloads
 * This handles the XUMM API calls that can't be done from the browser due to CORS
 */

const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const port = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// XUMM API Configuration
const XUMM_API_KEY = '5ae8e69a-1b48-4f80-b5bb-20ae099e6f2f';
const XUMM_API_SECRET = process.env.XUMM_API_SECRET || '7bdae91f-17cc-4d0b-b883-7c21628df06e';
const XUMM_API_URL = 'https://xumm.app/api/v1/platform/payload';

// Check if API secret is provided
if (!XUMM_API_SECRET) {
    console.error('❌ XUMM_API_SECRET environment variable is required!');
    console.log('💡 Please set the XUMM API secret:');
    console.log('   export XUMM_API_SECRET=your_xumm_api_secret_here');
    console.log('   node xumm-server.js');
}

// NUTS Token Configuration
const NUTS_TOKEN_ISSUER = 'rBpdegD7kqHdczjKzTKNEUZj1Fg1eYZRbe';
const CONTEST_WALLET = 'rN2K1Tv6LEM94YN8Kxfe3QyWcGPQNgsD6d';
const NUTS_HEX_CODE = '4E75747300000000000000000000000000000000'; // "Nuts" from trust line

/**
 * Create NUTS payment payload
 */
app.post('/create-nuts-payment', async (req, res) => {
    try {
        console.log('🎯 Creating NUTS payment payload...');
        
        const { amount = 50, memo = 'Contest Entry' } = req.body;
        
        // Create transaction with proper NUTS currency using standard format
        // XUMM should accept standard 3-char codes, but let's try uppercase NUTS
        const payload = {
            txjson: {
                TransactionType: 'Payment',
                Destination: CONTEST_WALLET,
                DestinationTag: 2024,
                Amount: {
                    currency: NUTS_HEX_CODE, // Use exact hex from trust line
                    value: amount.toString(),
                    issuer: NUTS_TOKEN_ISSUER
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
                    web: 'http://localhost:3000?payment=success',
                    app: 'http://localhost:3000?payment=success'
                }
            },
            custom_meta: {
                identifier: `contest_${Date.now()}`,
                instruction: `${memo} - ${amount} NUTS`, // Display as NUTS in UI
                blob: {
                    purpose: 'Contest Entry Payment',
                    amount: amount,
                    currency: 'NUTS'
                }
            }
        };

        // Check if we have API secret
        if (!XUMM_API_SECRET) {
            throw new Error('XUMM API Secret not configured. Please provide XUMM_API_SECRET environment variable.');
        }

        console.log('📡 Calling XUMM API with payload:', JSON.stringify(payload, null, 2));
        console.log('🔑 Using API Key:', XUMM_API_KEY.substring(0, 8) + '...');
        console.log('🔐 API Secret provided:', XUMM_API_SECRET ? 'Yes' : 'No');

        // Call XUMM API
        const response = await fetch(XUMM_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': XUMM_API_KEY,
                'X-API-Secret': XUMM_API_SECRET
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ XUMM API error:', response.status, errorText);
            throw new Error(`XUMM API error: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        console.log('✅ XUMM payload created successfully:', result.uuid);

        res.json({
            success: true,
            payload: {
                uuid: result.uuid,
                next: result.next,
                refs: result.refs,
                pushed: result.pushed
            }
        });

    } catch (error) {
        console.error('❌ Error creating NUTS payment:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * Check payment status
 */
app.get('/check-payment/:uuid', async (req, res) => {
    try {
        const { uuid } = req.params;
        
        console.log('🔍 Checking payment status for:', uuid);
        
        const response = await fetch(`https://xumm.app/api/v1/platform/payload/${uuid}`, {
            method: 'GET',
            headers: {
                'X-API-Key': XUMM_API_KEY,
                'X-API-Secret': XUMM_API_SECRET
            }
        });

        if (!response.ok) {
            throw new Error(`XUMM API error: ${response.status}`);
        }

        const result = await response.json();
        
        res.json({
            success: true,
            signed: result.meta.signed,
            resolved: result.meta.resolved,
            cancelled: result.meta.cancelled,
            expired: result.meta.expired,
            txid: result.response?.txid,
            account: result.response?.account
        });

    } catch (error) {
        console.error('❌ Error checking payment status:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'XUMM server running' });
});

app.listen(port, () => {
    console.log(`🚀 XUMM server running at http://localhost:${port}`);
    console.log('🔑 API Key configured:', XUMM_API_KEY.substring(0, 8) + '...');
    console.log('🏦 Contest wallet:', CONTEST_WALLET);
    console.log('🪙 NUTS issuer:', NUTS_TOKEN_ISSUER);
});