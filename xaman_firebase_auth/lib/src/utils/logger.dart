import 'package:flutter/foundation.dart';

/// Simple logger for the auth package
class AuthLogger {
  final String tag;
  static bool _enabled = kDebugMode;
  
  AuthLogger(this.tag);
  
  /// Enable or disable logging
  static void setEnabled(bool enabled) {
    _enabled = enabled;
  }
  
  /// Log debug message
  void debug(String message) {
    if (_enabled) {
      debugPrint('[$tag] DEBUG: $message');
    }
  }
  
  /// Log info message
  void info(String message) {
    if (_enabled) {
      debugPrint('[$tag] INFO: $message');
    }
  }
  
  /// Log warning message
  void warning(String message) {
    if (_enabled) {
      debugPrint('[$tag] WARN: $message');
    }
  }
  
  /// Log error message
  void error(String message, [dynamic error, StackTrace? stackTrace]) {
    if (_enabled) {
      debugPrint('[$tag] ERROR: $message');
      if (error != null) {
        debugPrint('[$tag] ERROR DETAILS: $error');
      }
      if (stackTrace != null && kDebugMode) {
        debugPrint('[$tag] STACK TRACE: $stackTrace');
      }
    }
  }
}