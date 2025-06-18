const admin = require('firebase-admin');

// Initialize admin SDK
admin.initializeApp();

// Export XUMM payment functions
exports.createNutsPayment = require('./xummPayment').createNutsPayment;