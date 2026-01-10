
const fs = require('fs');
const sentences = JSON.parse(fs.readFileSync('d:/PROJECT/hanachan_v2_final/data_v7/sentences.json', 'utf8'));
const withCloze = sentences.find(s => s.cloze_data && s.cloze_data.length > 0);
console.log(JSON.stringify(withCloze, null, 2));
