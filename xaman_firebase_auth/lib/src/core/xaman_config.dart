/// Configuration for Xaman Firebase authentication
class XamanAuthConfig {
  /// Xaman API key (client ID for OAuth2)
  final String xamanApiKey;
  
  /// Firebase function URL for token exchange
  final String firebaseFunctionUrl;
  
  /// OAuth2 redirect URI
  final String redirectUri;
  
  /// Force specific XRPL network (e.g., 'MAINNET', 'TESTNET')
  final String? forceNetwork;
  
  /// Automatically clean OAuth parameters from URL after authentication
  final bool autoCleanUrl;
  
  /// Request timeout duration
  final Duration timeout;
  
  /// Enable debug logging
  final bool enableLogging;
  
  /// OAuth2 scope (default: 'openid')
  final String scope;
  
  /// OAuth2 response type (default: 'code')
  final String responseType;

  const XamanAuthConfig({
    required this.xamanApiKey,
    required this.firebaseFunctionUrl,
    required this.redirectUri,
    this.forceNetwork,
    this.autoCleanUrl = true,
    this.timeout = const Duration(seconds: 30),
    this.enableLogging = false,
    this.scope = 'openid',
    this.responseType = 'code',
  });

  /// Create config from environment variables
  factory XamanAuthConfig.fromEnvironment() {
    return XamanAuthConfig(
      xamanApiKey: const String.fromEnvironment('XAMAN_API_KEY'),
      firebaseFunctionUrl: const String.fromEnvironment('FIREBASE_FUNCTION_URL'),
      redirectUri: const String.fromEnvironment('REDIRECT_URI', 
        defaultValue: 'http://localhost:3000'),
      forceNetwork: const String.fromEnvironment('XRPL_NETWORK').isEmpty 
        ? null 
        : const String.fromEnvironment('XRPL_NETWORK'),
      enableLogging: const bool.fromEnvironment('ENABLE_AUTH_LOGGING', 
        defaultValue: false),
    );
  }

  /// OAuth2 endpoints
  static const String oauth2AuthEndpoint = 'oauth2.xumm.app';
  static const String oauth2AuthPath = '/auth';
  static const String oauth2TokenEndpoint = 'https://oauth2.xumm.app/token';
  
  /// Check if configuration is valid
  bool get isValid => 
      xamanApiKey.isNotEmpty && 
      firebaseFunctionUrl.isNotEmpty &&
      redirectUri.isNotEmpty;
      
  /// Get OAuth2 authorization URL
  Uri getAuthorizationUrl() {
    final params = <String, String>{
      'client_id': xamanApiKey,
      'redirect_uri': redirectUri,
      'response_type': responseType,
      'scope': scope,
    };

    if (forceNetwork != null && forceNetwork!.isNotEmpty) {
      params['force_network'] = forceNetwork!;
    }

    return Uri.https(oauth2AuthEndpoint, oauth2AuthPath, params);
  }
}