// Simple NFL Entries Extractor using Public API
// This script uses the existing Firebase Functions API to get data

const https = require('https');
const fs = require('fs');
const readline = require('readline');

// Make HTTPS request
function makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const req = https.request(url, options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    resolve(parsed);
                } catch (error) {
                    resolve({ success: false, error: 'Invalid JSON response', rawData: data });
                }
            });
        });
        
        req.on('error', reject);
        req.setTimeout(30000, () => reject(new Error('Request timeout')));
        req.end();
    });
}

// Get contest stats
async function getContestStats() {
    try {
        console.log('📊 Getting contest statistics...');
        const url = 'https://us-central1-nuts-sports-pickem.cloudfunctions.net/getContestStats';
        const response = await makeRequest(url);
        
        if (response.success) {
            console.log('✅ Contest stats retrieved');
            return response.stats;
        } else {
            throw new Error(response.error || 'Failed to get stats');
        }
    } catch (error) {
        console.error('❌ Error getting stats:', error.message);
        return null;
    }
}

// Get all contest entries for a specific day/week
async function getContestEntries(contestDay = null, weekNumber = null) {
    try {
        console.log('📋 Getting contest entries...');
        let url = 'https://us-central1-nuts-sports-pickem.cloudfunctions.net/getContestStats';
        
        const params = [];
        if (contestDay) params.push(`contestDay=${contestDay}`);
        if (weekNumber) params.push(`weekNumber=${weekNumber}`);
        
        if (params.length > 0) {
            url += '?' + params.join('&');
        }
        
        const response = await makeRequest(url);
        
        if (response.success) {
            console.log('✅ Contest entries retrieved');
            return response;
        } else {
            throw new Error(response.error || 'Failed to get entries');
        }
    } catch (error) {
        console.error('❌ Error getting entries:', error.message);
        return null;
    }
}

// Extract NFL data using available APIs
async function extractNFLData() {
    console.log('🏈 Extracting NFL Data');
    console.log('======================\n');

    try {
        // Get overall stats
        const stats = await getContestStats();
        
        if (!stats) {
            throw new Error('Could not retrieve contest statistics');
        }

        console.log('📊 Overall Contest Statistics:');
        console.log(`   Total Entries: ${stats.totalEntries || 0}`);
        console.log(`   Total Prize Pool: ${stats.prizePool || 0} NUTS`);
        console.log(`   Unique Users: ${stats.uniqueUsers || 0}`);
        
        if (stats.sports) {
            console.log('\n🏆 By Sport:');
            console.log(`   MLB Entries: ${stats.sports.mlb || 0}`);
            console.log(`   NFL Entries: ${stats.sports.nfl || 0}`);
        }

        // Try to get week-specific data for NFL
        console.log('\n🏈 Trying to get NFL Week 1 data...');
        const week1Data = await getContestEntries(null, 1);
        
        let week1NFLEntries = 0;
        if (week1Data && week1Data.stats && week1Data.stats.sports) {
            week1NFLEntries = week1Data.stats.sports.nfl || 0;
        }

        console.log(`📋 Week 1 NFL Entries: ${week1NFLEntries}`);

        // Create summary data
        const extractedData = {
            extractedAt: new Date().toISOString(),
            method: 'Public API (Limited Data)',
            overallStats: stats,
            week1Stats: week1Data?.stats || null,
            estimatedNFLEntries: stats.sports?.nfl || 0,
            estimatedWeek1NFLEntries: week1NFLEntries,
            note: 'This extraction uses public API which provides limited data. Individual user details are not available through this method.',
            recommendedAction: week1NFLEntries > 0 ? 'DELETE_WEEK_1_ENTRIES' : 'NO_ACTION_NEEDED',
            deletionInstructions: {
                method1: 'Use Firebase Console -> Firestore -> contestEntries collection -> filter by sport=nfl AND weekNumber=1',
                method2: 'Use Firebase Admin SDK with proper credentials',
                method3: 'Contact system administrator for bulk deletion'
            }
        };

        // Save the extracted data
        const filename = `nfl-data-extraction-${new Date().toISOString().split('T')[0]}.json`;
        fs.writeFileSync(filename, JSON.stringify(extractedData, null, 2));
        
        console.log(`\n💾 Extraction data saved to: ${filename}`);
        
        // Summary
        console.log('\n📋 SUMMARY:');
        console.log(`   Total NFL Entries (estimated): ${stats.sports?.nfl || 0}`);
        console.log(`   Week 1 NFL Entries (estimated): ${week1NFLEntries}`);
        
        if (week1NFLEntries > 0) {
            console.log('\n⚠️  ACTION REQUIRED:');
            console.log(`   You have approximately ${week1NFLEntries} Week 1 NFL entries that need to be deleted`);
            console.log('   before implementing the new 5000 NUTS entry fee.');
            console.log('\n🛠️  DELETION OPTIONS:');
            console.log('   1. Firebase Console: Go to Firestore -> contestEntries -> filter by sport="nfl" AND weekNumber=1');
            console.log('   2. Admin Tools: Use Firebase Admin SDK with proper service account credentials');
            console.log('   3. Manual: Contact system administrator for bulk deletion');
        } else {
            console.log('\n✅ NO ACTION NEEDED:');
            console.log('   No Week 1 NFL entries found. You can proceed with the new 5000 NUTS system!');
        }

        return extractedData;

    } catch (error) {
        console.error('\n💥 Extraction failed:', error.message);
        
        // Create error report
        const errorReport = {
            extractedAt: new Date().toISOString(),
            success: false,
            error: error.message,
            note: 'Extraction failed. Manual intervention required.',
            manualSteps: [
                '1. Access Firebase Console directly',
                '2. Navigate to Firestore Database',
                '3. Go to contestEntries collection',
                '4. Filter by: sport == "nfl" AND weekNumber == 1',
                '5. Manually delete all matching documents',
                '6. Proceed with new 5000 NUTS system'
            ]
        };
        
        const errorFilename = `nfl-extraction-error-${new Date().toISOString().split('T')[0]}.json`;
        fs.writeFileSync(errorFilename, JSON.stringify(errorReport, null, 2));
        console.log(`\n📄 Error report saved to: ${errorFilename}`);
        
        return errorReport;
    }
}

// Main execution
async function main() {
    console.log('🔍 NFL Entries Data Extractor');
    console.log('==============================\n');
    console.log('This tool will extract available NFL contest data using the public API.');
    console.log('Note: Individual user details may not be available through this method.\n');

    const result = await extractNFLData();
    
    console.log('\n🎉 Process complete!');
    console.log('Check the generated JSON file for detailed information.');
}

// Run the extraction
main().catch(error => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
});
