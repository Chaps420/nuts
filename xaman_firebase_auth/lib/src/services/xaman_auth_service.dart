import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../core/xaman_config.dart';
import '../core/auth_result.dart';
import '../core/exceptions.dart';
import '../utils/logger.dart';
import 'oauth_handler.dart';
import 'firebase_bridge.dart';

/// Main service for Xaman Firebase authentication
class XamanFirebaseAuth {
  // Singleton instance
  static final XamanFirebaseAuth _instance = XamanFirebaseAuth._internal();
  factory XamanFirebaseAuth() => _instance;
  XamanFirebaseAuth._internal();
  
  // Configuration
  static XamanAuthConfig? _config;
  
  // Logger
  static final _logger = AuthLogger('XamanFirebaseAuth');
  
  // Auth state controller
  final _authStateController = StreamController<XamanAuthState>.broadcast();
  
  // Current auth state
  XamanAuthState _currentState = XamanAuthState.initial();
  
  /// Get singleton instance
  static XamanFirebaseAuth get instance => _instance;
  
  /// Initialize the service with configuration
  static Future<void> initialize(XamanAuthConfig config) async {
    _config = config;
    AuthLogger.setEnabled(config.enableLogging);
    _logger.info('XamanFirebaseAuth initialized');
    
    // Set up Firebase auth state listener
    _instance._setupAuthStateListener();
    
    // Check for OAuth callback on web
    if (kIsWeb && XamanOAuthHandler.isOAuthCallback()) {
      _logger.debug('OAuth callback detected, processing...');
      await _instance.handleOAuthCallback();
    }
  }
  
  /// Get current configuration
  static XamanAuthConfig get config {
    if (_config == null) {
      throw const XamanConfigException(
        message: 'XamanFirebaseAuth not initialized. Call initialize() first.',
        code: 'not_initialized',
      );
    }
    return _config!;
  }
  
  /// Get current Firebase user
  User? get currentUser => FirebaseAuth.instance.currentUser;
  
  /// Get current XRPL address
  Future<String?> get currentXrplAddress async {
    final user = currentUser;
    if (user == null) return null;
    return XamanFirebaseBridge.getUserXrplAddress(user);
  }
  
  /// Auth state changes stream
  Stream<XamanAuthState> get authStateChanges => _authStateController.stream;
  
  /// Current auth state
  XamanAuthState get currentState => _currentState;
  
  /// Sign in with Xaman
  Future<XamanAuthResult> signIn() async {
    try {
      _updateState(XamanAuthState.loading());
      
      // Start OAuth2 flow
      await XamanOAuthHandler.startOAuth2(config);
      
      // On web, the page will redirect and we'll handle the callback
      // On mobile, we'll need to handle app links
      
      // For mobile, you might want to set up a listener for app links
      // This is a simplified version - real implementation would handle this
      
      return XamanAuthResult.success(
        user: currentUser!,
        xrplAddress: await currentXrplAddress,
      );
      
    } catch (e) {
      _logger.error('Sign in failed', e);
      
      final error = _mapError(e);
      _updateState(XamanAuthState.unauthenticated(error: error.errorMessage));
      
      return error;
    }
  }
  
  /// Handle OAuth callback (web only)
  Future<XamanAuthResult> handleOAuthCallback() async {
    if (!kIsWeb) {
      return XamanAuthResult.failure(
        errorMessage: 'OAuth callback is only supported on web',
        error: XamanAuthError.unknown,
      );
    }
    
    try {
      _updateState(XamanAuthState.loading());
      
      // Extract OAuth parameters
      final params = XamanOAuthHandler.extractOAuth2Params();
      if (params == null) {
        throw const XamanOAuthException(
          message: 'No OAuth parameters found in URL',
          code: 'no_params',
        );
      }
      
      _logger.debug('Processing OAuth callback with params: ${params.keys.join(', ')}');
      
      // Check for errors
      final error = XamanOAuthHandler.getOAuthError(params);
      if (error != null) {
        throw error;
      }
      
      // Get authorization code
      final authCode = params['code'];
      if (authCode == null || authCode.isEmpty) {
        throw const XamanOAuthException(
          message: 'No authorization code found',
          code: 'no_code',
        );
      }
      
      // Exchange code for Firebase token
      final userCredential = await XamanFirebaseBridge.exchangeCodeForToken(
        authCode: authCode,
        config: config,
      );
      
      final user = userCredential.user;
      if (user == null) {
        throw const XamanFirebaseException(
          message: 'No user returned from Firebase',
          code: 'no_user',
        );
      }
      
      // Get XRPL address
      final xrplAddress = await XamanFirebaseBridge.getUserXrplAddress(user);
      
      // Update state
      _updateState(XamanAuthState.authenticated(
        user: user,
        xrplAddress: xrplAddress,
      ));
      
      // Clean URL if configured
      if (config.autoCleanUrl) {
        XamanOAuthHandler.cleanUrlParams();
      }
      
      _logger.info('Authentication successful for user: ${user.uid}');
      
      return XamanAuthResult.success(
        user: user,
        xrplAddress: xrplAddress,
      );
      
    } catch (e) {
      _logger.error('OAuth callback failed', e);
      
      final error = _mapError(e);
      _updateState(XamanAuthState.unauthenticated(error: error.errorMessage));
      
      return error;
    }
  }
  
  /// Sign out
  Future<void> signOut() async {
    try {
      _updateState(XamanAuthState.loading());
      await XamanFirebaseBridge.signOut();
      _updateState(XamanAuthState.unauthenticated());
      _logger.info('User signed out');
    } catch (e) {
      _logger.error('Sign out failed', e);
      _updateState(XamanAuthState.unauthenticated(
        error: 'Failed to sign out: ${e.toString()}',
      ));
      rethrow;
    }
  }
  
  /// Set up Firebase auth state listener
  void _setupAuthStateListener() {
    FirebaseAuth.instance.authStateChanges().listen((user) async {
      if (user != null) {
        final xrplAddress = await XamanFirebaseBridge.getUserXrplAddress(user);
        _updateState(XamanAuthState.authenticated(
          user: user,
          xrplAddress: xrplAddress,
        ));
      } else {
        _updateState(XamanAuthState.unauthenticated());
      }
    });
  }
  
  /// Update auth state
  void _updateState(XamanAuthState state) {
    _currentState = state;
    _authStateController.add(state);
  }
  
  /// Map exceptions to auth results
  XamanAuthResult _mapError(dynamic error) {
    if (error is XamanConfigException) {
      return XamanAuthResult.failure(
        errorMessage: error.message,
        error: XamanAuthError.invalidConfig,
      );
    } else if (error is XamanOAuthException) {
      return XamanAuthResult.failure(
        errorMessage: error.message,
        error: XamanAuthError.xamanError,
      );
    } else if (error is XamanFirebaseException) {
      return XamanAuthResult.failure(
        errorMessage: error.message,
        error: XamanAuthError.firebaseError,
      );
    } else if (error is XamanNetworkException) {
      return XamanAuthResult.failure(
        errorMessage: error.message,
        error: XamanAuthError.networkError,
      );
    } else {
      return XamanAuthResult.failure(
        errorMessage: error.toString(),
        error: XamanAuthError.unknown,
      );
    }
  }
  
  /// Dispose resources
  void dispose() {
    _authStateController.close();
  }
}