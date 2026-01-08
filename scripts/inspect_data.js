
const fs = require('fs');
const path = require('path');

const vocabFile = 'd:/PROJECT/hanachan_v2_final/data_v6/ku/vocab_v6.json';
const grammarFile = 'd:/PROJECT/hanachan_v2_final/data_v6/ku/grammar_v6.json';


function inspect(file, name) {
    if (!fs.existsSync(file)) {
        console.log(`${name} not found at ${file}`);
        return;
    }
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    console.log(`\n\n=== ${name} ===`);
    if (data.length > 0) {
        const item = data[0];
        console.log(`Item 0 Keys:`, Object.keys(item));
        if (item.sentences) {
            console.log(`Item 0 First Sentence:`, JSON.stringify(item.sentences[0], null, 2));
        }
        if (item.examples) {
            console.log(`Item 0 First Example:`, JSON.stringify(item.examples[0], null, 2));
        }
    }
}


inspect(vocabFile, 'Vocab');
inspect(grammarFile, 'Grammar');
