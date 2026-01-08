
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('d:/PROJECT/hanachan_v2_final/data_v6/ku/grammar_v6.json', 'utf8'));
console.log('Structure of first item:', JSON.stringify(data[0].structure, null, 2));
if (data[10]) console.log('Structure of 10th item:', JSON.stringify(data[10].structure, null, 2));
