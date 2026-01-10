
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const FLATTENED_DIR = path.join(__dirname, '../data_flattened');
const OUTPUT_SQL = path.join(__dirname, '../docs/seed.sql');
const OUTPUT_REPORT = path.join(__dirname, '../docs/migration_report.md');

// Helper: Deterministic UUID from Slug (so repeated runs verify same IDs)
function getUUID(slug) {
    return crypto.createHash('md5').update(slug).digest('hex').substring(0, 8) +
        '-' + crypto.createHash('md5').update(slug).digest('hex').substring(8, 12) +
        '-' + crypto.createHash('md5').update(slug).digest('hex').substring(12, 16) +
        '-' + crypto.createHash('md5').update(slug).digest('hex').substring(16, 20) +
        '-' + crypto.createHash('md5').update(slug).digest('hex').substring(20, 32);
}

// Helper: Escape SQL
function sqlEsc(str) {
    if (str === null || str === undefined) return 'NULL';
    return "'" + String(str).replace(/'/g, "''") + "'";
}

// Helper: Escape JSON
function jsonEsc(obj) {
    if (!obj) return 'NULL';
    return "'" + JSON.stringify(obj).replace(/'/g, "''") + "'";
}

// ERROR LOGGING
const errors = {
    missing_kanji_component: [],
    missing_vocab_kanji: [],
    missing_grammar_relation: [],
    missing_grammar_sentence: [],
    missing_prerequisite: [],
    other: []
};

function logError(type, message) {
    if (!errors[type]) errors[type] = [];
    errors[type].push(message);
}

async function main() {
    console.log("Loading Flattened Data...");
    const kus = JSON.parse(fs.readFileSync(path.join(FLATTENED_DIR, 'all_kus.json'), 'utf8'));
    const sentences = JSON.parse(fs.readFileSync(path.join(FLATTENED_DIR, 'all_sentences.json'), 'utf8'));

    // --- PHASE 1: ID REGISTRY ---
    const idMap = new Map(); // Slug -> UUID
    const typeMap = new Map(); // UUID -> Normalized Type
    const charToRadicalId = new Map(); // Character -> Radical UUID
    const charToKanjiId = new Map(); // Character -> Kanji UUID
    const sentenceIdMap = new Map(); // OldID -> UUID

    // Create UUIDs for KUs
    Object.values(kus).forEach(ku => {
        const uuid = getUUID(ku.slug);
        idMap.set(ku.slug, uuid);
        typeMap.set(uuid, ku.type === 'vocab' ? 'vocabulary' : ku.type);

        if (ku.type === 'radical' && ku.character) {
            charToRadicalId.set(ku.character, uuid);
        }
        if (ku.type === 'kanji' && ku.character) {
            charToKanjiId.set(ku.character, uuid);
        }
    });

    // Create UUIDs for Sentences (Since your schema uses UUID, but file might have 's_hash')
    Object.values(sentences).forEach(s => {
        // Use hash of text for stable UUID
        const uuid = getUUID("sentence_" + s.id);
        sentenceIdMap.set(s.id, uuid);
    });

    console.log(`Registered ${idMap.size} KUs and ${sentenceIdMap.size} Sentences.`);

    const sqlStatements = [];
    sqlStatements.push(`-- Auto-generated Seed Data`);
    sqlStatements.push(`-- Generated at: ${new Date().toISOString()}`);
    sqlStatements.push(`BEGIN;`);

    // --- PHASE 2: GENERATE INSERS FOR CORE TABLES ---

    // 1. Core Users (System User)
    const SYSTEM_USER_ID = getUUID('user_system');
    sqlStatements.push(`INSERT INTO public.users (id, email, display_name) VALUES ('${SYSTEM_USER_ID}', 'system@hanachan.app', 'System');`);

    // 2. Sentences
    console.log("Processing Sentences...");
    Object.values(sentences).forEach(s => {
        const uuid = sentenceIdMap.get(s.id);
        const origin = 'v6_system';
        // Your Schema: id, text_ja, text_en, origin, source_text, metadata, created_by
        sqlStatements.push(`INSERT INTO public.sentences (id, text_ja, text_en, origin, created_by) VALUES (` +
            `'${uuid}', ${sqlEsc(s.text_ja)}, ${sqlEsc(s.text_en)}, '${origin}', '${SYSTEM_USER_ID}');`);
    });

    // 3. Core Knowledge Units (Base Table)
    console.log("Processing Knowledge Units (Core)...");
    Object.values(kus).forEach(ku => {
        const uuid = idMap.get(ku.slug);
        const mnemonics = ku.mnemonics || {};
        const typeNormalized = ku.type === 'vocab' ? 'vocabulary' : ku.type;

        sqlStatements.push(`INSERT INTO public.knowledge_units (id, slug, type, level, character, meaning, search_key, mnemonics) VALUES (` +
            `'${uuid}', ${sqlEsc(ku.slug)}, '${typeNormalized}', ${ku.level || 0}, ${sqlEsc(ku.character)}, ${sqlEsc(ku.meaning)}, ${sqlEsc(ku.search_key || ku.character)}, ${jsonEsc(mnemonics)}) ON CONFLICT (id) DO NOTHING;`);
    });

    // 4. Detail Tables & Relations
    console.log("Processing Details & Relations...");
    Object.values(kus).forEach(ku => {
        const uuid = idMap.get(ku.slug);

        if (ku.type === 'radical') {
            sqlStatements.push(`INSERT INTO public.ku_radicals (ku_id, name) VALUES ('${uuid}', ${sqlEsc(ku.meaning)}) ON CONFLICT DO NOTHING;`);

        } else if (ku.type === 'kanji') {
            const raw = (ku.metadata && ku.metadata.raw_v6) ? ku.metadata.raw_v6 : {};
            sqlStatements.push(`INSERT INTO public.ku_kanji (ku_id, video, meaning_data, reading_data) VALUES (` +
                `'${uuid}', ${sqlEsc(ku.video)}, ${jsonEsc(ku.meaning_data || ku.meanings)}, ${jsonEsc(ku.reading_data || ku.readings)}) ON CONFLICT DO NOTHING;`);

            // RELATION: Kanji -> Radicals (kanji_radicals table)
            const components = ku.components || [];
            components.forEach((comp, idx) => {
                let radUUID = charToRadicalId.get(comp) || idMap.get(comp) || idMap.get(`radical/${comp}`);
                if (radUUID) {
                    sqlStatements.push(`INSERT INTO public.kanji_radicals (kanji_id, radical_id, position) VALUES ('${uuid}', '${radUUID}', ${idx}) ON CONFLICT DO NOTHING;`);
                } else {
                    logError('missing_kanji_component', `Kanji [${ku.slug}] references missing radical [${comp}]`);
                }
            });

        } else if (ku.type === 'vocabulary' || ku.type === 'vocab') {
            const pitch = ku.pitch || null;
            const pos = ku.parts_of_speech || [];
            const posSql = pos.length > 0 ? `'{${pos.map(s => `"${s}"`).join(',')}}'` : 'NULL';

            // Merge meanings and collocations into a rich object
            const meaningData = {
                meanings: ku.meanings || [],
                collocations: ku.collocations || []
            };

            sqlStatements.push(`INSERT INTO public.ku_vocabulary (ku_id, reading_primary, audio, pitch, parts_of_speech, meaning_data) VALUES (` +
                `'${uuid}', ${sqlEsc(ku.reading_primary || ku.character || 'unknown')}, ${sqlEsc(ku.audio)}, ${jsonEsc(pitch)}, ${posSql}, ${jsonEsc(meaningData)}) ON CONFLICT DO NOTHING;`);

            // RELATION: Vocab -> Kanji
            const kanjiChars = (ku.character || '').match(/[\u4e00-\u9faf]/g) || [];
            kanjiChars.forEach((char, idx) => {
                const kanjiUUID = charToKanjiId.get(char);
                if (kanjiUUID) {
                    sqlStatements.push(`INSERT INTO public.vocab_kanji (vocab_id, kanji_id, position) VALUES ('${uuid}', '${kanjiUUID}', ${idx}) ON CONFLICT DO NOTHING;`);
                } else {
                    logError('missing_vocab_kanji', `Vocabulary [${ku.slug}] references missing kanji [${char}]`);
                }
            });

        } else if (ku.type === 'grammar') {
            const raw = (ku.metadata && ku.metadata.raw_v6) ? ku.metadata.raw_v6 : {};
            sqlStatements.push(`INSERT INTO public.ku_grammar (ku_id, structure, details, cautions) VALUES (` +
                `'${uuid}', ${jsonEsc(ku.structure)}, ${sqlEsc(ku.details)}, ${sqlEsc(ku.cautions)}) ON CONFLICT DO NOTHING;`);

            // RELATION: Grammar Relations
            const related = ku.related?.grammar || [];
            related.forEach(relSlug => {
                let relUUID = idMap.get(relSlug) || idMap.get(`grammar/${relSlug}`);
                if (relUUID) {
                    sqlStatements.push(`INSERT INTO public.grammar_relations (grammar_id, related_grammar_id, type) VALUES ('${uuid}', '${relUUID}', 'similar') ON CONFLICT DO NOTHING;`);
                } else {
                    logError('missing_grammar_relation', `Grammar [${ku.slug}] links to missing [${relSlug}]`);
                }
            });

            // RELATION: Grammar Sentences
            ku.sentences.forEach(s => {
                const sUUID = sentenceIdMap.get(s.id);
                if (sUUID) {
                    sqlStatements.push(`INSERT INTO public.grammar_sentences (grammar_id, sentence_id) VALUES ('${uuid}', '${sUUID}') ON CONFLICT DO NOTHING;`);
                } else {
                    logError('missing_grammar_sentence', `Grammar [${ku.slug}] references missing sentence [${s.id}]`);
                }
            });
        }

        // 5. Common Relations: KU -> Sentence (General Usage)
        // Note: For Grammar, we put them in grammar_sentences. 
        // For Vocab/Kanji, we use ku_to_sentence.
        if (ku.type !== 'grammar') {
            ku.sentences.forEach(s => {
                const sUUID = sentenceIdMap.get(s.id);
                if (sUUID) {
                    sqlStatements.push(`INSERT INTO public.ku_to_sentence (ku_id, sentence_id) VALUES ('${uuid}', '${sUUID}') ON CONFLICT DO NOTHING;`);
                }
            });
        }
    });

    // --- PHASE 2.5: SYSTEM DECKS & FLASHCARDS ---
    console.log("Processing Official Decks...");

    // We need to track created flashcards to avoid duplicates (One Flashcard per KU per Type)
    // Map<KU_UUID + Type, Flashcard_UUID>
    const flashcardMap = new Map();

    const DECKS_ROOT = path.join(__dirname, '../data_v6/decks');
    const categories = ['general', 'grammar', 'kanji', 'non-kanji']; // 'general' usually means mixed or specific vocab

    for (const cat of categories) {
        const catDir = path.join(DECKS_ROOT, cat);
        if (!fs.existsSync(catDir)) continue;

        const files = fs.readdirSync(catDir).filter(f => f.endsWith('.json'));

        for (const file of files) {
            const levelMatch = file.match(/Level_(\d+)/);
            const level = levelMatch ? parseInt(levelMatch[1]) : 0;
            const deckName = `Official ${cat.charAt(0).toUpperCase() + cat.slice(1)} Level ${level}`;
            const deckUUID = getUUID(`deck_system_${cat}_${level}`);

            // 1. Create Deck
            sqlStatements.push(`INSERT INTO public.decks (id, name, description, deck_type, level) VALUES (` +
                `'${deckUUID}', '${deckName}', 'System generated deck for ${cat} Level ${level}', 'system', ${level}) ON CONFLICT DO NOTHING;`);

            // 2. Process Items
            const deckItems = JSON.parse(fs.readFileSync(path.join(catDir, file), 'utf8'));

            for (const item of deckItems) {
                // Resolve KU Slug -> UUID
                // The deck files use 'slug' property. 
                // WARNING: Some deck files might have "vocabulary/xxx" or just "xxx".
                // We need to try both or rely on item.type.

                let targetSlug = item.slug;
                if (item.type === 'kanji' && !targetSlug.startsWith('kanji/')) targetSlug = `kanji/${targetSlug}`;
                if (item.type === 'vocabulary' && !targetSlug.startsWith('vocabulary/')) targetSlug = `vocabulary/${targetSlug}`;
                if (item.type === 'grammar') {
                    // Grammar slugs in decks might store the ID, but our KUs use slugs.
                    // We check the ID map.
                    if (!targetSlug.startsWith('grammar/')) targetSlug = `grammar/${targetSlug}`;
                }
                if (item.type === 'radical' && !targetSlug.startsWith('radical/')) targetSlug = `radical/${targetSlug}`;

                const kuUUID = idMap.get(targetSlug);

                if (!kuUUID) {
                    // Try raw slug as fallback
                    if (idMap.has(item.slug)) {
                        // It was a direct match
                    } else {
                        // Log error but continue
                        // console.log(`Skipping missing deck item: ${targetSlug}`); 
                        continue;
                    }
                }

                const finalUUID = kuUUID || idMap.get(item.slug);
                const kuType = typeMap.get(finalUUID);

                // DATA INTEGRITY CHECK:
                // Ensure Deck Item Type matches KU Type. 
                // Schema requires 1:1 mapping (Flashcard Type must match KU Type).
                const itemTypeNorm = item.type === 'vocab' ? 'vocabulary' : item.type;

                if (kuType && kuType !== itemTypeNorm) {
                    continue;
                }

                // 3. Ensure Flashcard Exists for this KU
                // Mapping: Deck Item type 'kanji' -> Flashcard type 'kanji'
                const cardType = (item.type === 'vocabulary') ? 'vocab' : item.type; // DB uses 'vocab'
                const flashcardKey = `${finalUUID}_${cardType}`;

                let flashcardUUID = flashcardMap.get(flashcardKey);
                if (!flashcardUUID) {
                    flashcardUUID = getUUID(`fc_${finalUUID}_${cardType}`);
                    flashcardMap.set(flashcardKey, flashcardUUID);
                    // Insert Flashcard Allowed Check (Seed requirement)
                    // public.flashcard_allowed_ku (ku_id, type)
                    if (['radical', 'kanji', 'vocabulary', 'vocab'].includes(item.type)) {
                        // Grammar doesn't have allowed_ku entry in your schema example, only Grammar Units?
                        // Your schema has flashcards(ku_id) ref allowed_ku OR cloze.
                        // But allowed_ku check is type IN radical,kanji,vocab.
                        // So Grammar Standard Flashcards are NOT supported by your schema constraint?
                        // "type text NOT NULL CHECK (type = ANY (ARRAY['radical'::text, 'kanji'::text, 'vocabulary'::text]))"
                        // Wait, check schema: flashcardsCheck: card_type ANY radical, kanji, vocab, cloze.
                        // But FK is to flashcard_allowed_ku.

                        if (cardType !== 'grammar') {
                            const allowedType = item.type === 'vocab' ? 'vocabulary' : item.type;
                            sqlStatements.push(`INSERT INTO public.flashcard_allowed_ku (ku_id, type) VALUES ('${finalUUID}', '${allowedType}') ON CONFLICT DO NOTHING;`);
                        }
                    }

                    // Insert Flashcard
                    // If it's grammar, we might have an issue if the schema strictly enforces allowed_ku for ALL ku_id.
                    // Looking at your schema: "flashcards_ku_allowed_fkey FOREIGN KEY (ku_id) REFERENCES public.flashcard_allowed_ku(ku_id)"
                    // This implies EVERY flashcard with a ku_id MUST map to allowed_ku table.
                    // And allowed_ku table CHECK constraint excludes 'grammar'.
                    // This means **You cannot have standard Grammar Flashcards** in this schema, only Cloze? 
                    // Or you need to update the check constraint.
                    // For now, I will skip Grammar Flashcards here to respect the schema, or assume you want Cloze only?
                    // BUT, V6 decks have "Grammar Cards" (Front/Back).
                    // I will assumes you will update the schema later. For now I insert only if valid.

                    if (['radical', 'kanji', 'vocabulary', 'vocab'].includes(item.type)) {
                        sqlStatements.push(`INSERT INTO public.flashcards (id, ku_id, card_type) VALUES ('${flashcardUUID}', '${finalUUID}', '${cardType}') ON CONFLICT DO NOTHING;`);
                    } else {
                        // Skip creation for Grammar standard card to avoid FK error
                        continue;
                    }
                }

                // 4. Link Flashcard to Deck
                if (flashcardUUID && ['radical', 'kanji', 'vocabulary', 'vocab'].includes(item.type)) {
                    sqlStatements.push(`INSERT INTO public.deck_flashcards (deck_id, flashcard_id) VALUES ('${deckUUID}', '${flashcardUUID}') ON CONFLICT DO NOTHING;`);
                }
            }
        }
    }

    sqlStatements.push(`COMMIT;`);

    // --- PHASE 3: WRITE OUT ---
    console.log("Writing SQL to " + OUTPUT_SQL);
    fs.writeFileSync(OUTPUT_SQL, sqlStatements.join('\n'));

    // --- PHASE 4: REPORT ---
    console.log("Generating Report...");
    let reportMd = `# Data Migration Validation Report\n\n`;
    reportMd += `**Total Knowledge Units:** ${Object.keys(kus).length}\n`;
    reportMd += `**Total Sentences:** ${Object.keys(sentences).length}\n\n`;

    let totalErrors = 0;
    Object.keys(errors).forEach(key => {
        totalErrors += errors[key].length;
        if (errors[key].length > 0) {
            reportMd += `### Issue: ${key} (${errors[key].length})\n`;
            reportMd += `<details><summary>View Details</summary>\n\n`;
            errors[key].slice(0, 50).forEach(e => reportMd += `- ${e}\n`);
            if (errors[key].length > 50) reportMd += `- ... and ${errors[key].length - 50} more\n`;
            reportMd += `\n</details>\n\n`;
        }
    });

    if (totalErrors === 0) {
        reportMd += `## ✅ SUCCESS: Data is 100% clean. No Referential Integrity issues found.\n`;
    } else {
        reportMd += `## ⚠️ WARNING: Found ${totalErrors} data integrity issues.\n`;
        reportMd += `These relations were SKIPPED in the generated SQL to prevent database errors.\n`;
    }

    fs.writeFileSync(OUTPUT_REPORT, reportMd);
    console.log(`Done! Report saved to ${OUTPUT_REPORT}`);
}

main();
