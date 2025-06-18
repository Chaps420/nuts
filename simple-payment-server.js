/**
 * Simple Payment Server for NUTS Contest
 * A minimal Express server that creates XUMM payment requests
 * 
 * To run:
 * 1. npm install express cors node-fetch
 * 2. export XUMM_API_SECRET=your_secret_here
 * 3. node simple-payment-server.js
 */

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// XUMM Configuration
const XUMM_API_KEY = '5ae8e69a-1b48-4f80-b5bb-20ae099e6f2f';
const XUMM_API_SECRET = process.env.XUMM_API_SECRET || '7bdae91f-17cc-4d0b-b883-7c21628df06e';

// NUTS Configuration
const NUTS_ISSUER = 'rBpdegD7kqHdczjKzTKNEUZj1Fg1eYZRbe';
const CONTEST_WALLET = 'rN2K1Tv6LEM94YN8Kxfe3QyWcGPQNgsD6d';

console.log('🚀 Starting NUTS Payment Server...');
console.log('📍 Port:', PORT);
console.log('🔑 API Key:', XUMM_API_KEY.substring(0, 8) + '...');
console.log('🔐 API Secret:', XUMM_API_SECRET ? 'Configured' : 'MISSING!');
console.log('🏦 Contest Wallet:', CONTEST_WALLET);
console.log('🪙 NUTS Issuer:', NUTS_ISSUER);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'NUTS Payment Server is running',
        config: {
            hasApiKey: !!XUMM_API_KEY,
            hasApiSecret: !!XUMM_API_SECRET,
            contestWallet: CONTEST_WALLET
        }
    });
});

// Create NUTS payment endpoint
app.post('/create-nuts-payment', async (req, res) => {
    console.log('📱 Creating NUTS payment...');
    
    try {
        const { amount = 50, memo = 'Contest Entry' } = req.body;
        
        // Create XUMM payload
        const payload = {
            txjson: {
                TransactionType: 'Payment',
                Destination: CONTEST_WALLET,
                Amount: {
                    currency: '4E55545300000000000000000000000000000000', // NUTS in hex
                    value: amount.toString(),
                    issuer: NUTS_ISSUER
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
                    web: 'http://localhost:3000/daily-contest.html?payment=success',
                    app: 'http://localhost:3000/daily-contest.html?payment=success'
                }
            }
        };

        console.log('📡 Calling XUMM API...');
        
        // Import node-fetch dynamically
        const fetch = (await import('node-fetch')).default;
        
        const response = await fetch('https://xumm.app/api/v1/platform/payload', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': XUMM_API_KEY,
                'X-API-Secret': XUMM_API_SECRET
            },
            body: JSON.stringify(payload)
        });

        const responseData = await response.text();
        
        if (!response.ok) {
            console.error('❌ XUMM API Error:', response.status, responseData);
            return res.status(response.status).json({
                success: false,
                error: `XUMM API error: ${response.status}`,
                details: responseData
            });
        }

        const result = JSON.parse(responseData);
        console.log('✅ Payment created:', result.uuid);

        res.json({
            success: true,
            uuid: result.uuid,
            next: result.next,
            refs: result.refs,
            qr_png: result.refs.qr_png,
            websocket_status: result.refs.websocket_status
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Check payment status endpoint
app.get('/check-payment/:uuid', async (req, res) => {
    try {
        const { uuid } = req.params;
        console.log('🔍 Checking payment:', uuid);
        
        const fetch = (await import('node-fetch')).default;
        
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
        console.error('❌ Error:', error.message);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`✅ Server running at http://localhost:${PORT}`);
    console.log('');
    console.log('📝 Available endpoints:');
    console.log(`   GET  http://localhost:${PORT}/health`);
    console.log(`   POST http://localhost:${PORT}/create-nuts-payment`);
    console.log(`   GET  http://localhost:${PORT}/check-payment/:uuid`);
    console.log('');
    
    if (!XUMM_API_SECRET || XUMM_API_SECRET === '7bdae91f-17cc-4d0b-b883-7c21628df06e') {
        console.warn('⚠️  WARNING: Using default API secret. For production, set XUMM_API_SECRET environment variable!');
    }
});