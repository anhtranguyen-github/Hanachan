
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('d:/PROJECT/hanachan_v2_final/data_v6/ku/grammar_v6.json', 'utf8'));
const sample = data.find(i => i.related || i.similar || i.links || (i.metadata && i.metadata.related_grammar));
if (sample) {
    console.log('Found Grammar with relationships:', sample.slug);
    console.log('Keys:', Object.keys(sample));
    if (sample.metadata) console.log('Metadata Keys:', Object.keys(sample.metadata));
} else {
    console.log('No direct relationship fields found in first items of grammar_v6.json');
    // Let's check keys of the first item anyway
    console.log('First Item Keys:', Object.keys(data[0]));
}
