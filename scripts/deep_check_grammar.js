
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('d:/PROJECT/hanachan_v2_final/data_v6/ku/grammar_v6.json', 'utf8'));

const entriesWithMoreKeys = data.filter(i => Object.keys(i).length > 8);
console.log(`Found ${entriesWithMoreKeys.length} items with extra keys.`);
if (entriesWithMoreKeys.length > 0) {
    console.log('Extra keys sample:', Object.keys(entriesWithMoreKeys[0]));
}

// Search for strings like "similar" or "related" in grammar items
data.forEach(item => {
    const s = JSON.stringify(item);
    if (s.toLowerCase().includes('related') || s.toLowerCase().includes('similar')) {
        // console.log(`Found keyword in ${item.slug}`);
    }
});
