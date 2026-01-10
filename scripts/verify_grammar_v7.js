
const fs = require('fs');
const v7 = JSON.parse(fs.readFileSync('d:/PROJECT/hanachan_v2_final/data_v7/ku_grammar.json', 'utf8'))[0];
console.log('Grammar V7 Item Keys:', Object.keys(v7));
console.log('Raw V6 Preserved?', !!v7.metadata.raw_v6);
if (v7.metadata.raw_v6) {
    console.log('Original V6 Keys:', Object.keys(v7.metadata.raw_v6));
}
