const admin = require('firebase-admin');

// Initialize admin SDK
admin.initializeApp();

// Export payment functions from new file
exports.createNutsPayment = require('./createNutsPayment').createNutsPayment;
exports.payloadStatus = require('./createNutsPayment').payloadStatus;

// Export XUMM payment functions from existing file
exports.createXummPayment = require('./xummPayment').createXummPayment;
exports.checkXummPayment = require('./xummPayment').checkXummPayment;
exports.xummWebhook = require('./xummPayment').xummWebhook;
exports.getNutsTokenInfo = require('./xummPayment').getNutsTokenInfo;

// Export contest payout functions (commented out for manual payouts only)
// exports.processContestPayouts = require('./processContestPayouts').processContestPayouts;
// exports.scheduledPayoutCheck = require('./processContestPayouts').scheduledPayoutCheck;