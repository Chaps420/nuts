// Sample contest data generator for testing
function generateSampleData() {
    const sampleEntries = [];
    const today = new Date();
    
    // Generate MLB entries for past 7 days
    for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dateStr = date.toDateString();
        
        for (let j = 0; j < 4; j++) {
            sampleEntries.push({
                id: `mlb_${i}_${j}`,
                userId: `user_${j + 1}`,
                userName: `Player${j + 1}`,
                sport: 'mlb',
                contestDay: dateStr,
                picks: { game1: 'home', game2: 'away', game3: 'home' },
                tiebreakerRuns: 8 + j,
                entryFee: 50,
                timestamp: date.toISOString(),
                totalGames: 3
            });
        }
    }
    
    // Generate NFL entries for week 1
    for (let j = 0; j < 6; j++) {
        sampleEntries.push({
            id: `nfl_w1_${j}`,
            userId: `nfl_user_${j + 1}`,
            userName: `NFLFan${j + 1}`,
            sport: 'nfl',
            contestWeek: '2025-W01',
            weekNumber: 1,
            picks: { game1: 'home', game2: 'away', game3: 'home', game4: 'away' },
            tiebreakerPoints: 45 + j,
            entryFee: 50,
            timestamp: new Date().toISOString(),
            totalGames: 4
        });
    }
    
    // Store in localStorage
    localStorage.setItem('contest_entries', JSON.stringify(sampleEntries));
    console.log(`Generated ${sampleEntries.length} sample entries`);
    return sampleEntries;
}

// Auto-generate sample data if none exists
if (!localStorage.getItem('contest_entries') || JSON.parse(localStorage.getItem('contest_entries')).length < 10) {
    generateSampleData();
}
