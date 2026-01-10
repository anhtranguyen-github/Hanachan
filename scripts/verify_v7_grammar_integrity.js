
const fs = require('fs');
const path = require('path');

const grammarV7Path = 'd:/PROJECT/hanachan_v2_final/data_v7/ku_grammar.json';

if (!fs.existsSync(grammarV7Path)) {
    console.log('V7 grammar file not found.');
} else {
    // Read first item
    const content = fs.readFileSync(grammarV7Path, 'utf8');
    const data = JSON.parse(content);
    const item = data[0];

    console.log('Total items:', data.length);
    console.log('First item keys:', Object.keys(item));

    if (item.related_grammar) console.log('Has related_grammar: YES');
    else console.log('Has related_grammar: NO');

    if (item.examples && item.examples.length > 0) {
        console.log(`Has examples: YES (${item.examples.length})`);
    } else {
        console.log('Has examples: NO');
    }

    // Check for an item with related links if the first doesn't have them
    const withLinks = data.find(i => i.related_grammar || i.related_kanji);
    if (withLinks) {
        console.log('\nFound item with relationships:', withLinks.slug);
        console.log('Rel Grammar:', JSON.stringify(withLinks.related_grammar || 'None'));
        console.log('Rel Kanji:', JSON.stringify(withLinks.related_kanji || 'None'));
    }
}
