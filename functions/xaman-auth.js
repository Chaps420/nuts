import * as admin from 'firebase-admin';
import { onRequest } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';

// Define secrets for Xaman API credentials
const xamanApiKey = defineSecret('XAMAN_CLIENT_ID');
const xamanApiSecret = defineSecret('XAMAN_CLIENT_SECRET');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * Cloud Function to exchange Xaman OAuth2 authorization code for Firebase custom token
 */
export const xamanAuth = onRequest(
  { 
    secrets: [xamanApiKey, xamanApiSecret],
    cors: true,
    maxInstances: 10,
  },
  async (req, res) => {
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

      const tokenData = await tokenResponse.json() as any;
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

      const userInfo = await userInfoResponse.json() as any;
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
      } catch {
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

    } catch (error: any) {
      console.error('Error in xamanAuth:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        message: error.message || 'Unknown error occurred',
      });
    }
  }
);