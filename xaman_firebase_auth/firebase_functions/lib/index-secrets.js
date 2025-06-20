"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.xamanAuth = void 0;
const admin = __importStar(require("firebase-admin"));
const https_1 = require("firebase-functions/v2/https");
const params_1 = require("firebase-functions/params");
// Define secrets for Xaman API credentials
const xamanApiKey = (0, params_1.defineSecret)('XAMAN_API_KEY');
const xamanApiSecret = (0, params_1.defineSecret)('XAMAN_API_SECRET');
// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
    admin.initializeApp();
}
/**
 * Cloud Function to exchange Xaman OAuth2 authorization code for Firebase custom token
 */
exports.xamanAuth = (0, https_1.onRequest)({
    secrets: [xamanApiKey, xamanApiSecret],
    cors: true,
    maxInstances: 10,
}, async (req, res) => {
    // Only allow POST
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }
    try {
        const { authorizationCode, redirectUri } = req.body;
        if (!authorizationCode) {
            res.status(400).json({ error: 'Missing authorization code' });
            return;
        }
        // Exchange authorization code for access token
        console.log('Exchanging authorization code for access token');
        const tokenResponse = await fetch('https://oauth2.xumm.app/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code: authorizationCode,
                redirect_uri: redirectUri || '',
                client_id: xamanApiKey.value(),
                client_secret: xamanApiSecret.value(),
            }).toString(),
        });
        if (!tokenResponse.ok) {
            const error = await tokenResponse.text();
            console.error('Token exchange failed:', error);
            res.status(400).json({ error: 'Failed to exchange authorization code' });
            return;
        }
        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token || tokenData.id_token;
        if (!accessToken) {
            res.status(400).json({ error: 'No access token received' });
            return;
        }
        // Get user info from Xaman
        console.log('Fetching user info from Xaman');
        const userInfoResponse = await fetch('https://oauth2.xumm.app/userinfo', {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
        });
        if (!userInfoResponse.ok) {
            console.error('Failed to fetch user info');
            res.status(400).json({ error: 'Failed to fetch user info' });
            return;
        }
        const userInfo = await userInfoResponse.json();
        console.log('User info received:', { sub: userInfo.sub, account: userInfo.account });
        // Extract user ID and XRPL address
        const uid = userInfo.sub || userInfo.usertoken_uuidv4;
        const xrplAddress = userInfo.account || userInfo.sub;
        if (!uid) {
            res.status(400).json({ error: 'No user ID found in token' });
            return;
        }
        // Create or update Firebase user
        try {
            await admin.auth().getUser(uid);
            console.log('Existing Firebase user found:', uid);
        }
        catch (_a) {
            // User doesn't exist, create new one
            await admin.auth().createUser({
                uid: uid,
                displayName: userInfo.name || `User ${uid.substring(0, 8)}`,
            });
            console.log('New Firebase user created:', uid);
        }
        // Update user document in Firestore
        const userDoc = {
            uid: uid,
            xrplAddress: xrplAddress,
            lastLogin: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        await admin.firestore()
            .collection('users')
            .doc(uid)
            .set(userDoc, { merge: true });
        // Set custom claims for XRPL address
        await admin.auth().setCustomUserClaims(uid, {
            xrplAddress: xrplAddress,
        });
        // Create Firebase custom token
        const firebaseToken = await admin.auth().createCustomToken(uid, {
            xrplAddress: xrplAddress,
        });
        console.log('Authentication successful for user:', uid);
        res.status(200).json({
            firebaseToken,
            xamanAccount: xrplAddress,
            uid: uid,
        });
    }
    catch (error) {
        console.error('Error in xamanAuth:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message || 'Unknown error occurred',
        });
    }
});
//# sourceMappingURL=index-secrets.js.map