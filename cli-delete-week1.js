// Firebase CLI deletion script
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

async function deleteWeek1NFL() {
    try {
        console.log('🏈 Initializing Firebase CLI deletion...');
        
        // Initialize with CLI credentials
        const app = initializeApp({
            projectId: 'nuts-sports-pickem'
        });
        
        const db = getFirestore(app);
        
        console.log('🔍 Finding Week 1 NFL entries...');
        
        // Get all NFL entries first
        const nflQuery = db.collection('contestEntries').where('sport', '==', 'nfl');
        const nflSnapshot = await nflQuery.get();
        
        console.log(`📊 Found ${nflSnapshot.size} total NFL entries`);
        
        // Filter for Week 1
        const week1Entries = [];
        nflSnapshot.forEach(doc => {
            const data = doc.data();
            if (data.weekNumber === 1 || data.weekNumber === '1') {
                week1Entries.push({
                    id: doc.id,
                    data: data
                });
            }
        });
        
        console.log(`🎯 Found ${week1Entries.length} Week 1 NFL entries to delete:`);
        
        // Show what will be deleted
        week1Entries.forEach((entry, i) => {
            console.log(`  ${i+1}. ${entry.data.username || entry.data.userId || 'Unknown'} (${entry.id})`);
        });
        
        if (week1Entries.length === 0) {
            console.log('✅ No Week 1 NFL entries found - already clean!');
            process.exit(0);
        }
        
        // Delete using batch
        console.log('\n🗑️ Deleting entries...');
        const batch = db.batch();
        
        week1Entries.forEach(entry => {
            const docRef = db.collection('contestEntries').doc(entry.id);
            batch.delete(docRef);
        });
        
        await batch.commit();
        
        console.log(`✅ Successfully deleted ${week1Entries.length} Week 1 NFL entries!`);
        console.log('🎉 NFL contest system ready for 5000 NUTS entry fee!');
        
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

deleteWeek1NFL();
