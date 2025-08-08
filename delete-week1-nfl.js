// Simple deletion script for Week 1 NFL entries
// Run this if you have Firebase Admin SDK credentials set up

const admin = require('firebase-admin');

async function deleteWeek1NFLEntries() {
    try {
        console.log('🏈 Starting Week 1 NFL entries deletion...');
        
        // Initialize Firebase Admin (assumes credentials are set up)
        if (!admin.apps.length) {
            admin.initializeApp({
                projectId: 'nuts-sports-pickem'
            });
        }

        const db = admin.firestore();
        
        // Query for Week 1 NFL entries
        console.log('🔍 Finding Week 1 NFL entries...');
        const snapshot = await db.collection('contestEntries')
            .where('sport', '==', 'nfl')
            .where('weekNumber', '==', 1)
            .get();

        const entries = [];
        snapshot.forEach(doc => {
            entries.push({
                id: doc.id,
                data: doc.data()
            });
        });

        console.log(`📊 Found ${entries.length} Week 1 NFL entries to delete`);

        if (entries.length === 0) {
            console.log('✅ No Week 1 NFL entries found - cleanup already complete!');
            return;
        }

        // Show what will be deleted
        console.log('\n📋 Entries to delete:');
        entries.forEach((entry, i) => {
            console.log(`${i+1}. ${entry.data.username || entry.data.userId || 'Unknown'} (${entry.id})`);
        });

        // Delete all entries
        console.log('\n🗑️ Deleting entries...');
        const batch = db.batch();
        entries.forEach(entry => {
            batch.delete(db.collection('contestEntries').doc(entry.id));
        });

        await batch.commit();
        
        console.log(`✅ Successfully deleted ${entries.length} Week 1 NFL entries!`);
        console.log('🎉 NFL contest system ready for 5000 NUTS entry fee!');
        
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        
        if (error.message.includes('credentials') || error.message.includes('authentication')) {
            console.log('\n💡 To fix this:');
            console.log('1. Download Firebase service account key from Firebase Console');
            console.log('2. Save as firebase-service-account.json in this directory');
            console.log('3. Or set GOOGLE_APPLICATION_CREDENTIALS environment variable');
            console.log('\n🌐 Alternative: Use Firebase Console manually');
            console.log('   https://console.firebase.google.com/project/nuts-sports-pickem/firestore');
        }
        
        process.exit(1);
    }
}

// Run the deletion
deleteWeek1NFLEntries();
