import 'package:flutter/material.dart';
import '../services/xaman_auth_service.dart';
import '../core/auth_result.dart';

/// Widget that rebuilds based on authentication state
class XamanAuthBuilder extends StatelessWidget {
  /// Builder function that receives the current auth state
  final Widget Function(BuildContext context, XamanAuthState state) builder;
  
  /// Optional loading widget
  final Widget? loadingWidget;
  
  /// Optional error widget builder
  final Widget Function(BuildContext context, String error)? errorBuilder;

  const XamanAuthBuilder({
    Key? key,
    required this.builder,
    this.loadingWidget,
    this.errorBuilder,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<XamanAuthState>(
      stream: XamanFirebaseAuth.instance.authStateChanges,
      initialData: XamanFirebaseAuth.instance.currentState,
      builder: (context, snapshot) {
        final state = snapshot.data ?? XamanAuthState.initial();
        
        // Handle loading state
        if (state.isLoading && loadingWidget != null) {
          return loadingWidget!;
        }
        
        // Handle error state
        if (state.error != null && errorBuilder != null) {
          return errorBuilder!(context, state.error!);
        }
        
        // Default builder
        return builder(context, state);
      },
    );
  }
}

/// Convenience widget for protecting routes
class XamanAuthGuard extends StatelessWidget {
  /// Widget to show when authenticated
  final Widget child;
  
  /// Widget to show when not authenticated
  final Widget unauthenticatedWidget;
  
  /// Widget to show while checking auth state
  final Widget? loadingWidget;
  
  /// Whether to redirect to login on unauthenticated
  final bool redirectToLogin;
  
  /// Login route name for redirection
  final String loginRoute;

  const XamanAuthGuard({
    Key? key,
    required this.child,
    required this.unauthenticatedWidget,
    this.loadingWidget,
    this.redirectToLogin = false,
    this.loginRoute = '/login',
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return XamanAuthBuilder(
      loadingWidget: loadingWidget ?? const Center(
        child: CircularProgressIndicator(),
      ),
      builder: (context, state) {
        if (state.isAuthenticated) {
          return child;
        }
        
        if (redirectToLogin && !state.isLoading) {
          // Schedule navigation after build
          WidgetsBinding.instance.addPostFrameCallback((_) {
            Navigator.of(context).pushReplacementNamed(loginRoute);
          });
          return const SizedBox.shrink();
        }
        
        return unauthenticatedWidget;
      },
    );
  }
}