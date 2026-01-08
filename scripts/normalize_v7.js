
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const V6_UPDATED_DIR = path.join(__dirname, '../data_v6/ku/ku_updated');
const V6_DECKS_DIR = path.join(__dirname, '../data_v6/decks');
const V7_DIR = path.join(__dirname, '../data_v7');

if (!fs.existsSync(V7_DIR)) fs.mkdirSync(V7_DIR, { recursive: true });

// --- UTILS ---
function getHash(text) {
    return crypto.createHash('md5').update(text).digest('hex');
}

// --- STATE ---
const knowledgeUnits = new Map(); // slug -> full_object
const detailRadicals = [];
const detailKanji = [];
const detailVocab = [];
const detailGrammar = [];
const sentences = new Map(); // id -> sentence
const kuToSentence = [];
const officialDecks = [];
const deckItems = [];

// --- 1. NORMALIZE KNOWLEDGE UNITS ---

function processEntity(item, type) {
    const slug = `${type === 'vocab' ? 'vocabulary' : type}/${item.slug}`;

    // Base Entity - No trimming, keep everything
    const base = { ...item };
    delete base.sentences;
    delete base.examples;

    // Standardize some fields for search/display index
    const kuBase = {
        slug: slug,
        type: type === 'vocab' ? 'vocabulary' : type,
        level: item.level,
        character: item.character || item.title || item.name || item.slug,
        meaning: Array.isArray(item.meanings) ? item.meanings[0] : (item.title || item.name || item.slug),
        search_key: `${item.slug} ${item.character || ''} ${Array.isArray(item.meanings) ? item.meanings.join(' ') : ''}`.toLowerCase(),
        full_data: item // Keep ALL fields
    };

    knowledgeUnits.set(slug, kuBase);
    return slug;
}

// Radicals
const radicalsPath = path.join(V6_UPDATED_DIR, 'radicals_v6.json');
if (fs.existsSync(radicalsPath)) {
    console.log('Processing Radicals...');
    const data = JSON.parse(fs.readFileSync(radicalsPath, 'utf8'));
    data.forEach(item => {
        const slug = processEntity(item, 'radical');
        detailRadicals.push({
            ku_id: slug,
            ...item
        });
    });
}

// Kanji
const kanjiPath = path.join(V6_UPDATED_DIR, 'kanji_v6.json');
if (fs.existsSync(kanjiPath)) {
    console.log('Processing Kanji...');
    const data = JSON.parse(fs.readFileSync(kanjiPath, 'utf8'));
    data.forEach(item => {
        const slug = processEntity(item, 'kanji');
        detailKanji.push({
            ku_id: slug,
            ...item
        });
    });
}

// Vocab
const vocabPath = path.join(V6_UPDATED_DIR, 'vocab_v6.json');
if (fs.existsSync(vocabPath)) {
    console.log('Processing Vocab...');
    const data = JSON.parse(fs.readFileSync(vocabPath, 'utf8'));
    data.forEach(item => {
        const slug = processEntity(item, 'vocabulary');

        // Extract Sentences
        if (item.sentences) {
            item.sentences.forEach(s => {
                const sId = `s_${getHash(s.ja)}`;
                if (!sentences.has(sId)) {
                    sentences.set(sId, {
                        id: sId,
                        text_ja: s.ja,
                        text_en: s.en,
                        origin: 'v6_system',
                        metadata: { source: 'vocab_updated' }
                    });
                }
                kuToSentence.push({ ku_id: slug, sentence_id: sId });
            });
        }

        detailVocab.push({
            ku_id: slug,
            ...item
        });
    });
}

// Grammar
const grammarPath = path.join(V6_UPDATED_DIR, 'grammar_v6.json');
if (fs.existsSync(grammarPath)) {
    console.log('Processing Grammar (122MB)...');
    // Using simple read as memory allows it on most modern envs, but 122MB is significant.
    const data = JSON.parse(fs.readFileSync(grammarPath, 'utf8'));
    data.forEach(item => {
        const slug = processEntity(item, 'grammar');

        // Extract Sentences & Clozes
        if (item.examples) {
            item.examples.forEach(e => {
                const sId = `s_${getHash(e.sentence_text)}`;

                // Cloze generation
                let clozes = [];
                if (e.sentence_structure) {
                    let currentPos = 0;
                    e.sentence_structure.forEach(part => {
                        const content = part.content;
                        if (part.type === 'grammar_point') {
                            clozes.push({
                                start: currentPos,
                                end: currentPos + content.length,
                                target: content
                            });
                        }
                        currentPos += content.length;
                    });
                }

                if (!sentences.has(sId)) {
                    sentences.set(sId, {
                        id: sId,
                        text_ja: e.sentence_text,
                        text_en: e.translation,
                        origin: 'v6_system',
                        cloze_data: clozes.length > 0 ? clozes : null,
                        metadata: {
                            audio_url: e.audio_url,
                            source: 'grammar_updated'
                        }
                    });
                }
                kuToSentence.push({ ku_id: slug, sentence_id: sId });
            });
        }

        detailGrammar.push({
            ku_id: slug,
            ...item
        });
    });
}

// --- 2. NORMALIZE DECKS ---

function processDeckDir(dirName, category) {
    const fullPath = path.join(V6_DECKS_DIR, dirName);
    if (!fs.existsSync(fullPath)) return;

    const files = fs.readdirSync(fullPath);
    files.forEach(file => {
        if (!file.endsWith('.json')) return;

        const deckName = file.replace('.json', '').replace('_', ' ');
        const deckId = `deck_${getHash(dirName + file)}`;

        officialDecks.push({
            id: deckId,
            name: `${category} ${deckName}`,
            category: category,
            type: 'official'
        });

        const data = JSON.parse(fs.readFileSync(path.join(fullPath, file), 'utf8'));
        data.forEach(item => {
            const ku_id = `${item.type === 'vocab' ? 'vocabulary' : (item.type || 'unknown')}/${item.slug}`;
            deckItems.push({
                deck_id: deckId,
                ku_id: ku_id
            });
        });
    });
}

console.log('Processing Decks...');
processDeckDir('kanji', 'Kanji');
processDeckDir('general', 'Vocab');
processDeckDir('grammar', 'Grammar');
processDeckDir('non-kanji', 'Classic');

// --- 3. WRITE V7 FILES ---

console.log('Writing V7 files...');
fs.writeFileSync(path.join(V7_DIR, 'knowledge_units.json'), JSON.stringify(Array.from(knowledgeUnits.values()), null, 2));
fs.writeFileSync(path.join(V7_DIR, 'ku_radicals.json'), JSON.stringify(detailRadicals, null, 2));
fs.writeFileSync(path.join(V7_DIR, 'ku_kanji.json'), JSON.stringify(detailKanji, null, 2));
fs.writeFileSync(path.join(V7_DIR, 'ku_vocabulary.json'), JSON.stringify(detailVocab, null, 2));
fs.writeFileSync(path.join(V7_DIR, 'ku_grammar.json'), JSON.stringify(detailGrammar, null, 2));
fs.writeFileSync(path.join(V7_DIR, 'sentences.json'), JSON.stringify(Array.from(sentences.values()), null, 2));
fs.writeFileSync(path.join(V7_DIR, 'ku_to_sentence.json'), JSON.stringify(kuToSentence, null, 2));
fs.writeFileSync(path.join(V7_DIR, 'official_decks.json'), JSON.stringify(officialDecks, null, 2));
fs.writeFileSync(path.join(V7_DIR, 'deck_items.json'), JSON.stringify(deckItems, null, 2));

console.log('--- STRATA NORMALIZATION COMPLETE ---');
console.log(`Units: ${knowledgeUnits.size}`);
console.log(`Sentences: ${sentences.size}`);
console.log(`Decks: ${officialDecks.length}`);
console.log(`Deck Links: ${deckItems.length}`);
