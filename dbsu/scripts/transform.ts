
import fs from 'fs';
import path from 'path';
import { parseHTMLToTokens } from './parser';

const RAW_DIR = path.join(__dirname, '../raw_data');
const OUT_DIR = path.join(__dirname, '../processed_data');

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

function processRadicals() {
    const raw = JSON.parse(fs.readFileSync(path.join(RAW_DIR, 'content_radicals.json'), 'utf-8'));
    const processed = raw.map((item: any) => ({
        id: item.id,
        type: 'radical',
        slug: `radical/${item.slug}`,
        level: item.level,
        search_key: item.character || item.name,
        character: item.character,
        name: item.name,
        image: item.mnemonic_image,
        meaning_story: parseHTMLToTokens(item.mnemonic)
    }));
    fs.writeFileSync(path.join(OUT_DIR, 'processed_radicals.json'), JSON.stringify(processed, null, 2));
    console.log("✅ Processed Radicals");
}

function processKanji() {
    const raw = JSON.parse(fs.readFileSync(path.join(RAW_DIR, 'content_kanji.json'), 'utf-8'));
    const processed = raw.map((item: any) => ({
        id: item.id,
        type: 'kanji',
        slug: `kanji/${item.character}`,
        level: item.level,
        search_key: item.character,
        character: item.character,
        meaning_data: {
            primary: item.meanings.primary[0],
            alternatives: item.meanings.alternatives,
            story: parseHTMLToTokens(item.meanings.mnemonic)
        },
        reading_data: {
            on: item.readings.onyomi,
            kun: item.readings.kunyomi,
            story: parseHTMLToTokens(item.readings.mnemonic)
        }
    }));
    fs.writeFileSync(path.join(OUT_DIR, 'processed_kanji.json'), JSON.stringify(processed, null, 2));
    console.log("✅ Processed Kanji");
}

function processVocab() {
    const raw = JSON.parse(fs.readFileSync(path.join(RAW_DIR, 'content_vocabulary.json'), 'utf-8'));
    const processed = raw.map((item: any) => ({
        id: item.id,
        type: 'vocabulary',
        slug: `vocabulary/${item.character}`,
        level: item.level,
        search_key: item.character,
        character: item.character,
        reading_primary: item.readings.primary,
        meaning_data: {
            primary: item.meanings.primary,
            types: item.meanings.word_types,
            story: parseHTMLToTokens(item.meanings.explanation)
        },
        audio: item.readings.audio,
        sentences: (item.context_sentences || []).map((s: any) => ({
            ja: s.ja,
            en: s.en,
            tokens: parseHTMLToTokens(s.ja).tokens
        }))
    }));
    fs.writeFileSync(path.join(OUT_DIR, 'processed_vocab.json'), JSON.stringify(processed, null, 2));
    console.log("✅ Processed Vocabulary");
}

function processGrammar() {
    const raw = JSON.parse(fs.readFileSync(path.join(RAW_DIR, 'content_grammar.json'), 'utf-8'));
    const processed = raw.map((item: any) => {
        const aboutTokens = parseHTMLToTokens(item.about?.html);
        const formulaTokens = parseHTMLToTokens(item.structure?.patterns_html);
        const examples = (item.examples || []).map((ex: any) => {
            const structured = parseHTMLToTokens(ex.sentence_html);
            const cloze_positions = structured.tokens
                .map((t, i) => {
                    if (t.type === 'cloze') {
                        const offset = structured.tokens.slice(0, i).reduce((acc, curr) => acc + curr.text.length, 0);
                        return [offset, offset + t.text.length];
                    }
                    return null;
                })
                .filter(p => p !== null);
            return {
                text_ja: structured.text_only,
                text_en: ex.translation,
                tokens: structured.tokens,
                cloze_positions,
                audio: ex.audio_url
            };
        });
        return {
            id: item.id,
            type: 'grammar',
            slug: `grammar/${item.slug}`,
            level: item.level,
            search_key: item.title,
            meaning_summary: item.meanings[0],
            meaning_story: aboutTokens,
            structure: {
                patterns: item.structure?.patterns,
                formula: formulaTokens
            },
            examples
        };
    });
    fs.writeFileSync(path.join(OUT_DIR, 'processed_grammar.json'), JSON.stringify(processed, null, 2));
    console.log("✅ Processed Grammar");
}

console.log("🚀 Starting Data Transformation...");
processRadicals();
processKanji();
processVocab();
processGrammar();
console.log("🎉 All data processed and stored in dbsu/processed_data/");
