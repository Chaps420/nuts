// NFL Entries Management Script
// This script will extract NFL entries data and optionally delete Week 1 entries

const admin = require('firebase-admin');
const fs = require('fs');
const readline = require('readline');

// Check if firebase-admin is available
try {
    require('firebase-admin');
} catch (error) {
    console.error('❌ Firebase Admin SDK not found. Run: npm install firebase-admin');
    process.exit(1);
}

// Firebase initialization with service account
function initializeFirebase() {
    try {
        // Try to use service account key if available
        let serviceAccount;
        try {
            serviceAccount = require('./firebase-service-account.json');
            console.log('✅ Using service account from firebase-service-account.json');
        } catch (error) {
            console.log('ℹ️  Service account file not found, using project ID only');
            // Initialize with minimal config for Firestore access
            serviceAccount = {
                projectId: 'nuts-sports-pickem'
            };
        }

        if (!admin.apps.length) {
            admin.initializeApp({
                credential: serviceAccount.projectId ? admin.credential.applicationDefault() : admin.credential.cert(serviceAccount),
                projectId: 'nuts-sports-pickem'
            });
        }

        const db = admin.firestore();
        console.log('🔥 Firebase Admin initialized successfully');
        return db;
    } catch (error) {
        console.error('❌ Failed to initialize Firebase:', error.message);
        console.log('\n💡 To fix this:');
        console.log('1. Download your Firebase service account key');
        console.log('2. Save it as "firebase-service-account.json" in this directory');
        console.log('3. Or set GOOGLE_APPLICATION_CREDENTIALS environment variable');
        process.exit(1);
    }
}

// Extract NFL entries from Firestore
async function extractNFLEntries(db) {
    try {
        console.log('🔍 Fetching NFL entries from Firestore...');
        
        const snapshot = await db.collection('contestEntries')
            .where('sport', '==', 'nfl')
            .get();
        
        const entries = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            entries.push({
                documentId: doc.id,
                ...data,
                timestamp: data.timestamp ? (data.timestamp.toDate ? data.timestamp.toDate() : data.timestamp) : null
            });
        });

        console.log(`📊 Found ${entries.length} total NFL entries`);
        
        // Analyze by week
        const byWeek = {};
        const week1Entries = [];
        
        entries.forEach(entry => {
            const week = entry.weekNumber || 'unknown';
            if (!byWeek[week]) byWeek[week] = [];
            byWeek[week].push(entry);
            
            if (entry.weekNumber === 1 || entry.weekNumber === '1') {
                week1Entries.push(entry);
            }
        });

        console.log('\n📋 Entries by week:');
        Object.keys(byWeek).sort().forEach(week => {
            console.log(`   Week ${week}: ${byWeek[week].length} entries`);
        });

        console.log(`\n🎯 Week 1 entries found: ${week1Entries.length}`);
        
        // Show Week 1 user details
        if (week1Entries.length > 0) {
            console.log('\n👥 Week 1 User Details:');
            week1Entries.forEach((entry, i) => {
                console.log(`${i+1}. ${entry.username || entry.userId || 'Unknown User'}`);
                console.log(`   Wallet: ${entry.walletAddress || 'N/A'}`);
                console.log(`   Twitter: ${entry.twitterHandle || 'N/A'}`);
                console.log(`   Score: ${entry.score || 'N/A'}`);
                console.log(`   Document ID: ${entry.documentId}`);
                console.log('');
            });
        }

        // Save backup file
        const backupData = {
            extractedAt: new Date().toISOString(),
            totalEntries: entries.length,
            week1EntriesToDelete: week1Entries.length,
            entriesByWeek: Object.keys(byWeek).reduce((acc, week) => {
                acc[week] = byWeek[week].length;
                return acc;
            }, {}),
            week1Entries: week1Entries,
            allEntries: entries
        };

        const backupFilename = `nfl-entries-backup-${new Date().toISOString().split('T')[0]}.json`;
        fs.writeFileSync(backupFilename, JSON.stringify(backupData, null, 2));
        console.log(`💾 Backup saved to: ${backupFilename}`);

        return { entries, week1Entries, backupData };

    } catch (error) {
        console.error('❌ Error extracting NFL entries:', error);
        throw error;
    }
}

// Delete Week 1 entries
async function deleteWeek1Entries(db, week1Entries) {
    if (week1Entries.length === 0) {
        console.log('ℹ️  No Week 1 entries to delete');
        return;
    }

    console.log(`\n⚠️  About to delete ${week1Entries.length} Week 1 NFL entries:`);
    week1Entries.forEach((entry, i) => {
        console.log(`${i+1}. ${entry.username || entry.userId || 'Unknown'} (${entry.documentId})`);
    });

    // Create readline interface for confirmation
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise((resolve) => {
        rl.question('\n❓ Are you sure you want to delete these entries? (yes/no): ', async (answer) => {
            rl.close();
            
            if (answer.toLowerCase() !== 'yes') {
                console.log('❌ Deletion cancelled');
                resolve(false);
                return;
            }

            try {
                console.log('\n🗑️  Starting deletion process...');
                let deleted = 0;
                let failed = 0;

                for (const entry of week1Entries) {
                    try {
                        await db.collection('contestEntries').doc(entry.documentId).delete();
                        deleted++;
                        console.log(`✅ Deleted ${deleted}/${week1Entries.length}: ${entry.username || entry.documentId}`);
                    } catch (error) {
                        failed++;
                        console.log(`❌ Failed to delete ${entry.documentId}: ${error.message}`);
                    }
                }

                console.log(`\n🎉 Deletion complete!`);
                console.log(`   ✅ Successfully deleted: ${deleted}`);
                console.log(`   ❌ Failed to delete: ${failed}`);
                
                resolve(true);
            } catch (error) {
                console.error('❌ Error during deletion:', error);
                resolve(false);
            }
        });
    });
}

// Main function
async function main() {
    console.log('🏈 NFL Entries Management Tool');
    console.log('===============================\n');

    try {
        // Initialize Firebase
        const db = initializeFirebase();

        // Extract entries
        const { entries, week1Entries } = await extractNFLEntries(db);

        // Ask about deletion
        if (week1Entries.length > 0) {
            console.log('\n🤔 Would you like to delete the Week 1 entries?');
            const deleted = await deleteWeek1Entries(db, week1Entries);
            
            if (deleted) {
                console.log('✅ Week 1 entries have been deleted. You can now start fresh with the new 5000 NUTS entry fee!');
            }
        } else {
            console.log('✅ No Week 1 entries found to delete.');
        }

        console.log('\n🎉 Process complete! Check the backup JSON file for all extracted data.');
        
    } catch (error) {
        console.error('\n💥 Script failed:', error.message);
        process.exit(1);
    }
}

// Run the script
main();
