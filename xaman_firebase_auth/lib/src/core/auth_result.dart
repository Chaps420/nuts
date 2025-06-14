import 'package:firebase_auth/firebase_auth.dart';

/// Result of a Xaman authentication attempt
class XamanAuthResult {
  /// Whether the authentication was successful
  final bool isSuccess;
  
  /// The authenticated Firebase user
  final User? user;
  
  /// The user's XRPL address
  final String? xrplAddress;
  
  /// Error message if authentication failed
  final String? errorMessage;
  
  /// Type of error if authentication failed
  final XamanAuthError? error;
  
  /// Additional data from the authentication process
  final Map<String, dynamic>? additionalData;

  const XamanAuthResult({
    required this.isSuccess,
    this.user,
    this.xrplAddress,
    this.errorMessage,
    this.error,
    this.additionalData,
  });

  /// Create a successful result
  factory XamanAuthResult.success({
    required User user,
    String? xrplAddress,
    Map<String, dynamic>? additionalData,
  }) {
    return XamanAuthResult(
      isSuccess: true,
      user: user,
      xrplAddress: xrplAddress,
      additionalData: additionalData,
    );
  }

  /// Create a failed result
  factory XamanAuthResult.failure({
    required String errorMessage,
    required XamanAuthError error,
    Map<String, dynamic>? additionalData,
  }) {
    return XamanAuthResult(
      isSuccess: false,
      errorMessage: errorMessage,
      error: error,
      additionalData: additionalData,
    );
  }

  /// Create a cancelled result
  factory XamanAuthResult.cancelled() {
    return const XamanAuthResult(
      isSuccess: false,
      errorMessage: 'Authentication cancelled by user',
      error: XamanAuthError.cancelled,
    );
  }
}

/// Types of authentication errors
enum XamanAuthError {
  /// User cancelled the authentication
  cancelled,
  
  /// Network error occurred
  networkError,
  
  /// Invalid configuration
  invalidConfig,
  
  /// Firebase-related error
  firebaseError,
  
  /// Xaman-related error
  xamanError,
  
  /// Token exchange failed
  tokenExchangeError,
  
  /// Unknown error
  unknown,
}

/// Authentication state
class XamanAuthState {
  /// Whether the user is authenticated
  final bool isAuthenticated;
  
  /// Whether authentication is in progress
  final bool isLoading;
  
  /// The authenticated user
  final User? user;
  
  /// The user's XRPL address
  final String? xrplAddress;
  
  /// Error if any
  final String? error;

  const XamanAuthState({
    required this.isAuthenticated,
    required this.isLoading,
    this.user,
    this.xrplAddress,
    this.error,
  });

  /// Initial state
  factory XamanAuthState.initial() {
    return const XamanAuthState(
      isAuthenticated: false,
      isLoading: false,
    );
  }

  /// Loading state
  factory XamanAuthState.loading() {
    return const XamanAuthState(
      isAuthenticated: false,
      isLoading: true,
    );
  }

  /// Authenticated state
  factory XamanAuthState.authenticated({
    required User user,
    String? xrplAddress,
  }) {
    return XamanAuthState(
      isAuthenticated: true,
      isLoading: false,
      user: user,
      xrplAddress: xrplAddress,
    );
  }

  /// Unauthenticated state
  factory XamanAuthState.unauthenticated({String? error}) {
    return XamanAuthState(
      isAuthenticated: false,
      isLoading: false,
      error: error,
    );
  }
  
  /// Copy with new values
  XamanAuthState copyWith({
    bool? isAuthenticated,
    bool? isLoading,
    User? user,
    String? xrplAddress,
    String? error,
  }) {
    return XamanAuthState(
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
      isLoading: isLoading ?? this.isLoading,
      user: user ?? this.user,
      xrplAddress: xrplAddress ?? this.xrplAddress,
      error: error ?? this.error,
    );
  }
}