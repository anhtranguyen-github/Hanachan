
const fs = require('fs');

const v6 = JSON.parse(fs.readFileSync('d:/PROJECT/hanachan_v2_final/data_v6/ku/vocab_v6.json', 'utf8'))[0];
const v7 = JSON.parse(fs.readFileSync('d:/PROJECT/hanachan_v2_final/data_v7/ku_vocabulary.json', 'utf8'))[0];

console.log('=== V6 Vocab Item ===');
console.log(Object.keys(v6));
console.log('Readings Count:', v6.readings.length);

console.log('\n=== V7 Vocab Item ===');
console.log(Object.keys(v7));
console.log('Mapping check:');
console.log('- reading_primary:', v7.reading_primary);
console.log('- has metadata.readings_full?', !!v7.metadata.readings_full);

if (v6.readings.length > 1 && !v7.metadata.readings_full) {
    console.log('\n⚠️ DATA LOSS ALERT: Secondary readings were NOT preserved in the previous run.');
}
