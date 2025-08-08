/**
 * Firebase Configuration
 * Mock configuration for testing - replace with your actual Firebase config
 */

// Mock Firebase config for development/testing
const firebaseConfig = {
    apiKey: "mock-api-key",
    authDomain: "mock-project.firebaseapp.com",
    projectId: "mock-project",
    storageBucket: "mock-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:mock-app-id"
};

// Mock Firebase initialization
window.firebaseConfig = firebaseConfig;
window.firebaseEnabled = false; // Set to true when you have real Firebase config

console.log('🔥 Firebase config loaded (mock mode)');
