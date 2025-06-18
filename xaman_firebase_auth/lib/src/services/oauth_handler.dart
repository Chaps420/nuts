import 'dart:html' as html;
import 'package:flutter/foundation.dart';
import 'package:url_launcher/url_launcher.dart';
import '../core/xaman_config.dart';
import '../core/exceptions.dart';
import '../utils/logger.dart';

/// Handles OAuth2 flow for Xaman authentication
class XamanOAuthHandler {
  static final _logger = AuthLogger('XamanOAuthHandler');

  /// Start OAuth2 authentication flow
  static Future<void> startOAuth2(XamanAuthConfig config) async {
    try {
      if (!config.isValid) {
        throw const XamanConfigException(
          message: 'Invalid configuration. Please check your API key and URLs.',
          code: 'invalid_config',
        );
      }

      final authUrl = config.getAuthorizationUrl();
      _logger.debug('Starting OAuth2 flow with URL: $authUrl');

      if (kIsWeb) {
        // Web platform - use window redirect
        _redirectToOAuth2Web(authUrl);
      } else {
        // Mobile platforms - use url_launcher
        await _launchOAuth2Mobile(authUrl);
      }
    } catch (e) {
      _logger.error('Failed to start OAuth2', e);
      rethrow;
    }
  }

  /// Redirect to OAuth2 URL on web
  static void _redirectToOAuth2Web(Uri uri) {
    html.window.location.href = uri.toString();
  }

  /// Launch OAuth2 URL on mobile
  static Future<void> _launchOAuth2Mobile(Uri uri) async {
    if (!await canLaunchUrl(uri)) {
      throw XamanOAuthException(
        message: 'Cannot launch Xaman OAuth2 URL',
        code: 'launch_failed',
      );
    }

    final launched = await launchUrl(
      uri,
      mode: LaunchMode.externalApplication,
    );

    if (!launched) {
      throw XamanOAuthException(
        message: 'Failed to launch Xaman app',
        code: 'launch_failed',
      );
    }
  }

  /// Extract OAuth2 parameters from current URL (web only)
  static Map<String, String>? extractOAuth2Params() {
    if (!kIsWeb) return null;

    final uri = Uri.base;
    _logger.debug('Extracting OAuth2 params from: ${uri.toString()}');

    // Check query parameters
    if (uri.queryParameters.containsKey('code') || 
        uri.queryParameters.containsKey('error')) {
      _logger.debug('Found OAuth2 params in query parameters');
      return Map<String, String>.from(uri.queryParameters);
    }

    // Check hash/fragment (for implicit flow or errors)
    if (uri.fragment.isNotEmpty) {
      final hashParams = Uri.splitQueryString(uri.fragment);
      if (hashParams.containsKey('access_token') || 
          hashParams.containsKey('error')) {
        _logger.debug('Found OAuth2 params in hash fragment');
        return hashParams;
      }
    }

    _logger.debug('No OAuth2 params found in URL');
    return null;
  }

  /// Clean OAuth2 parameters from URL (web only)
  static void cleanUrlParams() {
    if (!kIsWeb) return;

    try {
      final currentUrl = html.window.location.href;
      final baseUrl = currentUrl.split('?')[0].split('#')[0];
      
      _logger.debug('Cleaning URL parameters');
      html.window.history.replaceState(null, '', baseUrl);
    } catch (e) {
      _logger.error('Failed to clean URL parameters', e);
    }
  }

  /// Check if we're in an OAuth callback
  static bool isOAuthCallback() {
    if (!kIsWeb) return false;

    final params = extractOAuth2Params();
    return params != null && 
           (params.containsKey('code') || params.containsKey('error'));
  }

  /// Handle OAuth error from URL parameters
  static XamanOAuthException? getOAuthError(Map<String, String> params) {
    final error = params['error'];
    if (error == null) return null;

    final errorDescription = params['error_description'] ?? 'No description provided';
    
    return XamanOAuthException(
      message: 'OAuth error: $error - $errorDescription',
      code: error,
    );
  }
}