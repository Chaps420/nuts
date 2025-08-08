import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:xaman_firebase_auth/xaman_firebase_auth.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize Firebase
  await Firebase.initializeApp();
  
  // Initialize Xaman Firebase Auth
  await XamanFirebaseAuth.initialize(
    XamanAuthConfig(
      xamanApiKey: const String.fromEnvironment('XAMAN_API_KEY'),
      firebaseFunctionUrl: const String.fromEnvironment('FIREBASE_FUNCTION_URL'),
      redirectUri: const String.fromEnvironment('REDIRECT_URI', 
        defaultValue: 'http://localhost:3000'),
      enableLogging: true,
    ),
  );
  
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Xaman Firebase Auth Example',
      theme: ThemeData(
        primarySwatch: Colors.blue,
        useMaterial3: true,
      ),
      home: const AuthWrapper(),
    );
  }
}

class AuthWrapper extends StatelessWidget {
  const AuthWrapper({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return XamanAuthBuilder(
      loadingWidget: const Scaffold(
        body: Center(
          child: CircularProgressIndicator(),
        ),
      ),
      builder: (context, authState) {
        if (authState.isAuthenticated) {
          return HomePage(
            user: authState.user!,
            xrplAddress: authState.xrplAddress,
          );
        }
        return const LoginPage();
      },
    );
  }
}

class LoginPage extends StatelessWidget {
  const LoginPage({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Xaman Auth Example'),
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text(
              'Welcome!',
              style: TextStyle(fontSize: 32, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 20),
            const Text(
              'Sign in with your Xaman wallet',
              style: TextStyle(fontSize: 16),
            ),
            const SizedBox(height: 40),
            XamanLoginButton(
              onSuccess: (result) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text('Welcome ${result.xrplAddress ?? 'User'}!'),
                    backgroundColor: Colors.green,
                  ),
                );
              },
              onError: (error) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text('Error: ${error.errorMessage}'),
                    backgroundColor: Colors.red,
                  ),
                );
              },
            ),
            const SizedBox(height: 20),
            XamanLoginButton(
              text: 'Connect Wallet',
              style: XamanButtonStyle.secondary,
              onSuccess: (result) {
                debugPrint('Secondary button success');
              },
            ),
          ],
        ),
      ),
    );
  }
}

class HomePage extends StatelessWidget {
  final User user;
  final String? xrplAddress;

  const HomePage({
    Key? key,
    required this.user,
    this.xrplAddress,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Home'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () async {
              await XamanFirebaseAuth.instance.signOut();
            },
          ),
        ],
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const CircleAvatar(
              radius: 50,
              child: Icon(Icons.person, size: 50),
            ),
            const SizedBox(height: 20),
            Text(
              'Welcome!',
              style: Theme.of(context).textTheme.headlineMedium,
            ),
            const SizedBox(height: 10),
            Text(
              'User ID: ${user.uid}',
              style: Theme.of(context).textTheme.bodyLarge,
            ),
            if (xrplAddress != null) ...[
              const SizedBox(height: 10),
              Text(
                'XRPL Address:',
                style: Theme.of(context).textTheme.bodyMedium,
              ),
              Text(
                xrplAddress!,
                style: Theme.of(context).textTheme.bodySmall,
              ),
            ],
            const SizedBox(height: 40),
            ElevatedButton(
              onPressed: () {
                // Implement your app logic here
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Ready to use XRPL features!'),
                  ),
                );
              },
              child: const Text('Start Using App'),
            ),
          ],
        ),
      ),
    );
  }
}