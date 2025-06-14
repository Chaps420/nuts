import 'package:flutter/material.dart';
import '../services/xaman_auth_service.dart';
import '../core/auth_result.dart';

/// Pre-styled Xaman login button
class XamanLoginButton extends StatefulWidget {
  /// Callback when authentication succeeds
  final Function(XamanAuthResult)? onSuccess;
  
  /// Callback when authentication fails
  final Function(XamanAuthResult)? onError;
  
  /// Button text
  final String text;
  
  /// Button style
  final XamanButtonStyle style;
  
  /// Custom button styling
  final ButtonStyle? buttonStyle;
  
  /// Custom text style
  final TextStyle? textStyle;
  
  /// Loading indicator
  final Widget? loadingIndicator;
  
  /// Whether to show loading state
  final bool showLoading;

  const XamanLoginButton({
    Key? key,
    this.onSuccess,
    this.onError,
    this.text = 'Sign in with Xaman',
    this.style = XamanButtonStyle.primary,
    this.buttonStyle,
    this.textStyle,
    this.loadingIndicator,
    this.showLoading = true,
  }) : super(key: key);

  @override
  State<XamanLoginButton> createState() => _XamanLoginButtonState();
}

class _XamanLoginButtonState extends State<XamanLoginButton> {
  bool _isLoading = false;
  
  Future<void> _handleSignIn() async {
    if (_isLoading) return;
    
    setState(() => _isLoading = true);
    
    try {
      final result = await XamanFirebaseAuth.instance.signIn();
      
      if (result.isSuccess) {
        widget.onSuccess?.call(result);
      } else {
        widget.onError?.call(result);
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }
  
  @override
  Widget build(BuildContext context) {
    final isLoading = widget.showLoading && _isLoading;
    
    return ElevatedButton(
      onPressed: isLoading ? null : _handleSignIn,
      style: widget.buttonStyle ?? _getDefaultStyle(),
      child: isLoading
          ? widget.loadingIndicator ?? _buildDefaultLoadingIndicator()
          : _buildButtonContent(),
    );
  }
  
  Widget _buildButtonContent() {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        _buildXamanLogo(),
        const SizedBox(width: 12),
        Text(
          widget.text,
          style: widget.textStyle ?? _getDefaultTextStyle(),
        ),
      ],
    );
  }
  
  Widget _buildXamanLogo() {
    return Container(
      width: 24,
      height: 24,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(4),
      ),
      child: Center(
        child: Text(
          'X',
          style: TextStyle(
            color: _getLogoColor(),
            fontWeight: FontWeight.bold,
            fontSize: 16,
          ),
        ),
      ),
    );
  }
  
  Widget _buildDefaultLoadingIndicator() {
    return const SizedBox(
      width: 20,
      height: 20,
      child: CircularProgressIndicator(
        strokeWidth: 2,
        valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
      ),
    );
  }
  
  ButtonStyle _getDefaultStyle() {
    switch (widget.style) {
      case XamanButtonStyle.primary:
        return ElevatedButton.styleFrom(
          backgroundColor: const Color(0xFF3052FF),
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
        );
      case XamanButtonStyle.secondary:
        return ElevatedButton.styleFrom(
          backgroundColor: Colors.white,
          foregroundColor: const Color(0xFF3052FF),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
            side: const BorderSide(color: Color(0xFF3052FF)),
          ),
        );
      case XamanButtonStyle.dark:
        return ElevatedButton.styleFrom(
          backgroundColor: const Color(0xFF1A1A1A),
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
        );
    }
  }
  
  TextStyle _getDefaultTextStyle() {
    return const TextStyle(
      fontSize: 16,
      fontWeight: FontWeight.w500,
    );
  }
  
  Color _getLogoColor() {
    switch (widget.style) {
      case XamanButtonStyle.primary:
      case XamanButtonStyle.dark:
        return const Color(0xFF3052FF);
      case XamanButtonStyle.secondary:
        return const Color(0xFF3052FF);
    }
  }
}

/// Button style options
enum XamanButtonStyle {
  /// Blue background, white text
  primary,
  
  /// White background, blue text and border
  secondary,
  
  /// Dark background, white text
  dark,
}