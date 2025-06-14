# Xaman Firebase Auth

A Flutter package that provides seamless authentication between Xaman (XUMM) wallet and Firebase, enabling XRPL-based authentication for your applications.

## Features

- 🔐 **OAuth2 Authentication**: Secure authentication using Xaman's OAuth2 flow
- 🔥 **Firebase Integration**: Automatic Firebase user creation and custom token generation
- 🎨 **Pre-built Widgets**: Ready-to-use login button and auth state builders
- 🌐 **Multi-platform**: Supports Web, iOS, and Android
- 🛡️ **Type-safe**: Full TypeScript support for Firebase Functions
- 📦 **Easy Setup**: Simple configuration and initialization

## Installation

Add this package to your `pubspec.yaml`:

```yaml
dependencies:
  xaman_firebase_auth:
    path: packages/xaman_firebase_auth  # For local development
    # Or from pub.dev (when published):
    # xaman_firebase_auth: ^0.1.0
```

## Quick Start

### 1. Initialize Firebase

```dart
import 'package:firebase_core/firebase_core.dart';
import 'package:xaman_firebase_auth/xaman_firebase_auth.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize Firebase
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );
  
  // Initialize Xaman Firebase Auth
  await XamanFirebaseAuth.initialize(
    XamanAuthConfig(
      xamanApiKey: 'your-xaman-api-key',
      firebaseFunctionUrl: 'https://your-project.cloudfunctions.net/xamanAuth',
      redirectUri: 'https://yourapp.com/auth/callback',
    ),
  );
  
  runApp(MyApp());
}
```

### 2. Add Login Button

```dart
XamanLoginButton(
  onSuccess: (result) {
    print('Logged in! XRPL Address: ${result.xrplAddress}');
    // Navigate to home screen
  },
  onError: (error) {
    print('Login failed: ${error.errorMessage}');
    // Show error message
  },
);
```

### 3. Use Auth Builder

```dart
XamanAuthBuilder(
  builder: (context, authState) {
    if (authState.isAuthenticated) {
      return HomePage(
        user: authState.user!,
        xrplAddress: authState.xrplAddress,
      );
    }
    return LoginPage();
  },
);
```

### 4. Protect Routes

```dart
XamanAuthGuard(
  child: DashboardPage(),
  unauthenticatedWidget: LoginPage(),
);
```

## Firebase Function Setup

1. Copy the Firebase function template from `firebase_functions/` to your project
2. Install dependencies:
   ```bash
   cd functions
   npm install
   ```
3. Set up secrets:
   ```bash
   firebase functions:secrets:set XAMAN_API_KEY
   firebase functions:secrets:set XAMAN_API_SECRET
   ```
4. Deploy:
   ```bash
   firebase deploy --only functions
   ```

## Configuration Options

```dart
XamanAuthConfig(
  // Required
  xamanApiKey: 'your-api-key',
  firebaseFunctionUrl: 'your-function-url',
  redirectUri: 'your-redirect-uri',
  
  // Optional
  forceNetwork: 'MAINNET',  // Force specific XRPL network
  autoCleanUrl: true,       // Clean OAuth params from URL
  timeout: Duration(seconds: 30),
  enableLogging: true,      // Enable debug logging
);
```

## Advanced Usage

### Get Current User

```dart
final user = XamanFirebaseAuth.instance.currentUser;
final xrplAddress = await XamanFirebaseAuth.instance.currentXrplAddress;
```

### Listen to Auth State

```dart
XamanFirebaseAuth.instance.authStateChanges.listen((state) {
  if (state.isAuthenticated) {
    print('User logged in: ${state.user?.uid}');
  } else {
    print('User logged out');
  }
});
```

### Sign Out

```dart
await XamanFirebaseAuth.instance.signOut();
```

### Custom Button Styling

```dart
XamanLoginButton(
  text: 'Connect Wallet',
  style: XamanButtonStyle.secondary,
  buttonStyle: ElevatedButton.styleFrom(
    padding: EdgeInsets.all(20),
  ),
  textStyle: TextStyle(fontSize: 18),
);
```

## Web Setup

For web platform, ensure your redirect URI is properly configured:

1. Add your domain to Xaman app settings
2. Handle the callback in your web app:

```dart
// In your main() or router setup
if (kIsWeb) {
  // The package automatically handles OAuth callbacks
  // Just ensure the page loads your Flutter app
}
```

## Security Considerations

1. **Never expose your Xaman API Secret** in client-side code
2. **Use environment variables** for API keys:
   ```bash
   flutter run --dart-define=XAMAN_API_KEY=your-key
   ```
3. **Validate tokens** on your backend for sensitive operations
4. **Set up proper CORS** in your Firebase Function
5. **Use HTTPS** for all redirect URIs

## Troubleshooting

### "Not Initialized" Error
Ensure you call `XamanFirebaseAuth.initialize()` before using any auth methods.

### OAuth Redirect Issues
- Check your redirect URI matches exactly in Xaman app settings
- For local development, use `http://localhost:PORT`
- Ensure your Firebase Function URL is correct

### Token Exchange Fails
- Verify your Xaman API key and secret are correct
- Check Firebase Function logs for detailed errors
- Ensure CORS is properly configured

## Example App

See the `example/` directory for a complete working example.

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

## License

This package is available under the MIT License.