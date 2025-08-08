import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:firebase_auth/firebase_auth.dart';
import '../core/xaman_config.dart';
import '../core/exceptions.dart';
import '../utils/logger.dart';

/// Bridges Xaman authentication with Firebase
class XamanFirebaseBridge {
  static final _logger = AuthLogger('XamanFirebaseBridge');

  /// Exchange Xaman authorization code for Firebase custom token
  static Future<UserCredential> exchangeCodeForToken({
    required String authCode,
    required XamanAuthConfig config,
  }) async {
    try {
      _logger.debug('Exchanging auth code for Firebase token');
      
      final response = await http.post(
        Uri.parse(config.firebaseFunctionUrl),
        headers: {
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'authorizationCode': authCode,
          'redirectUri': config.redirectUri,
        }),
      ).timeout(config.timeout);

      _logger.debug('Firebase function response: ${response.statusCode}');
      
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final customToken = data['firebaseToken'] ?? data['customToken'];
        final xrplAddress = data['xamanAccount'] ?? data['xrplAddress'];
        
        if (customToken == null) {
          throw const XamanFirebaseException(
            message: 'No custom token received from server',
            code: 'no_token',
          );
        }
        
        _logger.info('Successfully obtained Firebase custom token');
        
        // Sign in with Firebase using custom token
        final userCredential = await FirebaseAuth.instance
            .signInWithCustomToken(customToken);
        
        // Store XRPL address in user metadata if available
        if (xrplAddress != null && userCredential.user != null) {
          await _updateUserMetadata(userCredential.user!, xrplAddress);
        }
        
        _logger.info('Firebase authentication successful');
        return userCredential;
        
      } else {
        final errorBody = response.body;
        _logger.error('Firebase function error: $errorBody');
        
        throw XamanFirebaseException(
          message: 'Failed to exchange auth code: ${response.statusCode}',
          code: response.statusCode.toString(),
          originalError: errorBody,
        );
      }
    } catch (e) {
      if (e is XamanAuthException) rethrow;
      
      _logger.error('Error exchanging auth code', e);
      throw XamanFirebaseException(
        message: 'Failed to exchange authorization code',
        code: 'exchange_failed',
        originalError: e,
      );
    }
  }

  /// Update user metadata with XRPL address
  static Future<void> _updateUserMetadata(User user, String xrplAddress) async {
    try {
      // This is a placeholder - in a real implementation, you might:
      // 1. Update Firestore user document
      // 2. Call a backend API to store the mapping
      // 3. Update custom claims (requires admin SDK)
      
      _logger.debug('Storing XRPL address for user: ${user.uid}');
      
      // For now, we'll just log it
      // In production, implement proper storage
    } catch (e) {
      _logger.error('Failed to update user metadata', e);
      // Don't throw - this is not critical for auth success
    }
  }

  /// Get user's XRPL address from Firebase
  static Future<String?> getUserXrplAddress(User user) async {
    try {
      // Try to get from custom claims
      final idTokenResult = await user.getIdTokenResult();
      final xrplAddress = idTokenResult.claims?['xrplAddress'] as String?;
      
      if (xrplAddress != null) {
        return xrplAddress;
      }
      
      // In a real implementation, you might also:
      // 1. Query Firestore for the user document
      // 2. Call a backend API to get the mapping
      
      return null;
    } catch (e) {
      _logger.error('Error getting XRPL address', e);
      return null;
    }
  }

  /// Sign out from Firebase
  static Future<void> signOut() async {
    try {
      await FirebaseAuth.instance.signOut();
      _logger.info('User signed out successfully');
    } catch (e) {
      _logger.error('Error signing out', e);
      throw XamanFirebaseException(
        message: 'Failed to sign out',
        code: 'signout_failed',
        originalError: e,
      );
    }
  }
}