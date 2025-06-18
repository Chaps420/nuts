library xaman_firebase_auth;

// Core exports
export 'src/core/xaman_config.dart';
export 'src/core/auth_result.dart';
export 'src/core/exceptions.dart';

// Service exports
export 'src/services/xaman_auth_service.dart';

// Widget exports
export 'src/widgets/xaman_login_button.dart';
export 'src/widgets/auth_builder.dart';

// Re-export Firebase Auth types that users will need
export 'package:firebase_auth/firebase_auth.dart' show User, UserCredential;