
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('d:/PROJECT/hanachan_v2_final/data_v6/ku/grammar_v6.json', 'utf8'));

const allKeys = new Set();
data.forEach(item => {
    Object.keys(item).forEach(k => allKeys.add(k));
});

console.log('All unique keys in grammar_v6.json:', Array.from(allKeys));

// Look for values that look like slugs or arrays of slugs
data.forEach(item => {
    for (const key in item) {
        if (key !== 'id' && key !== 'slug' && typeof item[key] === 'string' && item[key].includes('/')) {
            // console.log(`Potential link in ${item.slug}: ${key} -> ${item[key]}`);
        }
    }
});
