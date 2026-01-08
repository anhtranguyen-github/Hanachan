
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = 'd:/PROJECT/hanachan_v2_final/data_v6/ku';
const OUTPUT_DIR = 'd:/PROJECT/hanachan_v2_final/data_v6/normalized';

if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const vocabPath = path.join(DATA_DIR, 'vocab_v6.json');
const grammarPath = path.join(DATA_DIR, 'grammar_v6.json');

const sentences = new Map(); // id -> sentence
const links = []; // { ku_slug, sentence_id }

function getHash(text) {
    return crypto.createHash('md5').update(text).digest('hex');
}

// Process Vocab
if (fs.existsSync(vocabPath)) {
    console.log('Processing Vocab...');
    const vocabData = JSON.parse(fs.readFileSync(vocabPath, 'utf8'));
    vocabData.forEach(item => {
        const ku_slug = `vocabulary/${item.slug}`;
        if (item.sentences) {
            item.sentences.forEach(s => {
                const id = `s_${getHash(s.ja)}`;
                if (!sentences.has(id)) {
                    sentences.set(id, {
                        id,
                        text_ja: s.ja,
                        text_en: s.en,
                        origin: 'v6_system',
                        metadata: { source: 'vocab_v6.json' }
                    });
                }
                links.push({ ku_slug, sentence_id: id });
            });
        }
    });
}

// Process Grammar
if (fs.existsSync(grammarPath)) {
    console.log('Processing Grammar...');
    const grammarData = JSON.parse(fs.readFileSync(grammarPath, 'utf8'));
    grammarData.forEach(item => {
        const ku_slug = `grammar/${item.slug}`;
        if (item.examples) {
            item.examples.forEach(e => {
                const id = `s_${getHash(e.sentence_text)}`;
                if (!sentences.has(id)) {
                    sentences.set(id, {
                        id,
                        text_ja: e.sentence_text,
                        text_en: e.translation,
                        origin: 'v6_system',
                        metadata: {
                            source: 'grammar_v6.json',
                            audio_url: e.audio_url
                        }
                    });
                }
                links.push({ ku_slug, sentence_id: id });
            });
        }
    });
}

console.log(`Total unique sentences: ${sentences.size}`);
console.log(`Total links: ${links.length}`);

fs.writeFileSync(path.join(OUTPUT_DIR, 'sentences.json'), JSON.stringify(Array.from(sentences.values()), null, 2));
fs.writeFileSync(path.join(OUTPUT_DIR, 'ku_to_sentence.json'), JSON.stringify(links, null, 2));

console.log('Done!');
