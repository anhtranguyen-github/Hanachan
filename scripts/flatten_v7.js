const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const V7_DIR = path.join(__dirname, '../data_v7');
const OUTPUT_DIR = path.join(__dirname, '../data_flattened');

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

function getHash(text) {
    if (!text) return 'empty';
    return crypto.createHash('md5').update(text).digest('hex');
}

console.log('Reading Normalized V7 Data...');

// Load Everything into Memory (Node.js handles this fine for < 500MB)
const units = JSON.parse(fs.readFileSync(path.join(V7_DIR, 'knowledge_units.json'), 'utf8'));
const detailKanji = JSON.parse(fs.readFileSync(path.join(V7_DIR, 'ku_kanji.json'), 'utf8'));
const detailVocab = JSON.parse(fs.readFileSync(path.join(V7_DIR, 'ku_vocabulary.json'), 'utf8'));
const detailGrammar = JSON.parse(fs.readFileSync(path.join(V7_DIR, 'ku_grammar.json'), 'utf8'));
const detailRadicals = JSON.parse(fs.readFileSync(path.join(V7_DIR, 'ku_radicals.json'), 'utf8'));
const sentencesRaw = JSON.parse(fs.readFileSync(path.join(V7_DIR, 'sentences.json'), 'utf8'));
const links = JSON.parse(fs.readFileSync(path.join(V7_DIR, 'ku_to_sentence.json'), 'utf8'));

// 1. Index Sentences Map
const sentenceMap = new Map();
sentencesRaw.forEach(s => sentenceMap.set(s.id, s));

// 2. Index Links
const kuToSentencesMap = new Map();
links.forEach(l => {
    if (!kuToSentencesMap.has(l.ku_id)) kuToSentencesMap.set(l.ku_id, []);
    kuToSentencesMap.get(l.ku_id).push(l.sentence_id);
});

// 2.5 Char to Slug Map for matching support data
const charToSlug = new Map();
units.forEach(u => {
    if (u.type === 'vocabulary' || u.type === 'vocab') {
        charToSlug.set(u.character, u.slug);
    }
});

// 3. Index Details
const detailMap = new Map();
detailKanji.forEach(d => detailMap.set(d.ku_id, d));
detailVocab.forEach(d => detailMap.set(d.ku_id, d));
detailGrammar.forEach(d => detailMap.set(d.ku_id, d));
detailRadicals.forEach(d => detailMap.set(d.ku_id, d));

// 3.5 Load Support Data
let vocabSupportData = new Map();
const supportPath = path.join(V7_DIR, 'support/vocabulary_linked.json');
if (fs.existsSync(supportPath)) {
    console.log('Loading Vocabulary Support Data...');
    const supportList = JSON.parse(fs.readFileSync(supportPath, 'utf8'));
    supportList.forEach(item => {
        // Index by character for matching
        vocabSupportData.set(item.character, item);

        // EXTRA: Incorporate Sentences from Support File
        const slug = charToSlug.get(item.character);
        if (slug && item.context_sentences) {
            if (!kuToSentencesMap.has(slug)) kuToSentencesMap.set(slug, []);

            item.context_sentences.forEach(s => {
                const sId = `s_${getHash(s.ja)}`;
                if (!sentenceMap.has(sId)) {
                    sentenceMap.set(sId, {
                        id: sId,
                        text_ja: s.ja,
                        text_en: s.en,
                        origin: 'v7_support',
                        metadata: { source: 'vocabulary_linked' }
                    });
                }
                // Link if not already linked
                if (!kuToSentencesMap.get(slug).includes(sId)) {
                    kuToSentencesMap.get(slug).push(sId);
                }
            });
        }
    });
    console.log(`Indexed ${vocabSupportData.size} support vocab items and merged extra sentences.`);
}

// 4. Build Flattened KU Store
const flattenedKUs = {};

units.forEach(base => {
    const detail = detailMap.get(base.slug) || {};
    const linkedSentences = (kuToSentencesMap.get(base.slug) || [])
        .map(sid => sentenceMap.get(sid))
        .filter(Boolean);


    // MERGE & PROMOTE
    let promotedFields = {};

    if (base.type === 'kanji') {
        const raw = (detail.metadata && detail.metadata.raw_v6) ? detail.metadata.raw_v6 : {};
        promotedFields = {
            mnemonics: {
                meaning: detail.mnemonic_meaning || (detail.meaning_data && detail.meaning_data.mnemonic) || null,
                reading: detail.mnemonic_reading || (detail.reading_data && detail.reading_data.mnemonic) || null
            },
            components: (detail.components && detail.components.length > 0) ? detail.components : ((detail.metadata && detail.metadata.components) || []),
            amalgamations: detail.amalgamations || (detail.metadata && detail.metadata.amalgamations) || [],
            video: detail.video || raw.video || null,
            // Preserve rich data for seed.sql
            meaning_data: detail.meanings || detail.meaning_data || [],
            reading_data: detail.readings || detail.reading_data || []
        };
    } else if (base.type === 'vocabulary' || base.type === 'vocab') {
        const raw = (detail.metadata && detail.metadata.raw_v6) ? detail.metadata.raw_v6 : {};
        const support = vocabSupportData.get(base.character) || {};

        promotedFields = {
            mnemonics: {
                meaning: support.meaning_mnemonic || detail.mnemonic_meaning || (detail.meaning_data && detail.meaning_data.mnemonic) || null,
                reading: support.reading_mnemonic || detail.mnemonic_reading || null
            },
            audio: (detail.audio_assets && detail.audio_assets.length > 0) ? detail.audio_assets[0].url : (detail.audio || null),
            pitch: detail.pitch || raw.pitch_info || null,
            parts_of_speech: (detail.parts_of_speech && detail.parts_of_speech.length > 0) ? detail.parts_of_speech : ((detail.metadata && detail.metadata.parts_of_speech) || []),
            // Preserve rich data for seed.sql
            meaning_data: detail.meanings || detail.meaning_data || [],
            // Reading primary is handled during seed generation if needed, but we keep the full array
            reading_data: detail.readings || detail.reading_data || [],
            collocations: support.collocations || []
        };
    } else if (base.type === 'grammar') {
        const raw = (detail.metadata && detail.metadata.raw_v6) ? detail.metadata.raw_v6 : {};
        promotedFields = {
            structure: detail.structure || detail.structure_json || null,
            details: detail.details || raw.details || null,
            related: {
                grammar: detail.related_grammar || (detail.related && detail.related.grammar) || raw.related_grammar || [],
                kanji: detail.related_kanji || (detail.related && detail.related.kanji) || raw.related_kanji || []
            },
            cautions: detail.cautions || raw.cautions || null
        };
    } else if (base.type === 'radical') {
        promotedFields = {
            mnemonics: {
                meaning: detail.meaning_story || (detail.mnemonics ? detail.mnemonics.meaning : null),
                reading: null
            },
            found_in_kanji: (detail.metadata && detail.metadata.found_in_kanji) || []
        };
    }

    const merged = {
        ...base,
        ...detail,
        ...promotedFields,
        sentences: linkedSentences,
        metadata: {
            raw_v6: detail.metadata ? detail.metadata.raw_v6 : null
        }
    };

    // Keep fields needed for postgres seeding
    delete merged.ku_id;
    delete merged.audio_assets;
    delete merged.structure_json;
    delete merged.meaning_story;
    delete merged.mnemonic_meaning;
    delete merged.mnemonic_reading;
    delete merged.related_grammar;
    delete merged.related_kanji;


    flattenedKUs[base.slug] = merged;
});

// 5. Write Output
console.log('Writing Flattened Data...');
fs.writeFileSync(path.join(OUTPUT_DIR, 'all_kus.json'), JSON.stringify(flattenedKUs, null, 2));
fs.writeFileSync(path.join(OUTPUT_DIR, 'all_sentences.json'), JSON.stringify(Object.fromEntries(sentenceMap), null, 2));

console.log(`--- FLATTENING COMPLETE ---`);
console.log(`Knowledge Units: ${Object.keys(flattenedKUs).length}`);
console.log(`Sentences: ${sentenceMap.size}`);
