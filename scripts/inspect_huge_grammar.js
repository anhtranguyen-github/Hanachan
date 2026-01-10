
const fs = require('fs');
const grammarFile = 'd:/PROJECT/hanachan_v2_final/data_v6/ku/ku_updated/grammar_v6.json';

// Since the file is huge, let's read it progressively or just the beginning if possible
// But for 122MB, JSON.parse might work if I have enough memory.
// Let's try to stream a bit.
const stream = fs.createReadStream(grammarFile, { end: 50000 });
let chunk = '';
stream.on('data', (data) => {
    chunk += data.toString();
});
stream.on('end', () => {
    try {
        // Try to find the first object in the array
        const firstObjMatch = chunk.match(/\{[\s\S]*?\n\s\s\}/);
        if (firstObjMatch) {
            console.log('First Item Snippet:');
            console.log(firstObjMatch[0]);
            const obj = JSON.parse(firstObjMatch[0]);
            console.log('\nKeys:', Object.keys(obj));
        } else {
            console.log('Could not parse first item from snippet.');
            // Fallback: just show the first 1000 chars
            console.log(chunk.substring(0, 1000));
        }
    } catch (e) {
        console.log('Error parsing snippet:', e.message);
        console.log(chunk.substring(0, 1000));
    }
});
