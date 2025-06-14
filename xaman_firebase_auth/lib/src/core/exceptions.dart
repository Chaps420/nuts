/// Base exception for Xaman Firebase Auth
class XamanAuthException implements Exception {
  final String message;
  final String? code;
  final dynamic originalError;

  const XamanAuthException({
    required this.message,
    this.code,
    this.originalError,
  });

  @override
  String toString() => 'XamanAuthException: $message${code != null ? ' (Code: $code)' : ''}';
}

/// Configuration-related exceptions
class XamanConfigException extends XamanAuthException {
  const XamanConfigException({
    required String message,
    String? code,
  }) : super(message: message, code: code);
}

/// OAuth2-related exceptions
class XamanOAuthException extends XamanAuthException {
  const XamanOAuthException({
    required String message,
    String? code,
    dynamic originalError,
  }) : super(message: message, code: code, originalError: originalError);
}

/// Firebase-related exceptions
class XamanFirebaseException extends XamanAuthException {
  const XamanFirebaseException({
    required String message,
    String? code,
    dynamic originalError,
  }) : super(message: message, code: code, originalError: originalError);
}

/// Network-related exceptions
class XamanNetworkException extends XamanAuthException {
  const XamanNetworkException({
    required String message,
    String? code,
    dynamic originalError,
  }) : super(message: message, code: code, originalError: originalError);
}