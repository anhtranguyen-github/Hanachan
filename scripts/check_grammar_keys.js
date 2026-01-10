
const fs = require('fs');
const grammarFile = 'd:/PROJECT/hanachan_v2_final/data_v6/ku/grammar_v6.json';
const data = JSON.parse(fs.readFileSync(grammarFile, 'utf8'));
const item = data[0];
console.log('Grammar Item Keys:', Object.keys(item));
if (item.examples && item.examples.length > 0) {
    console.log('Grammar Example Keys:', Object.keys(item.examples[0]));
    console.log('Grammar Example Text:', item.examples[0].sentence_text);
    console.log('Grammar Example Translation:', item.examples[0].translation);
}
