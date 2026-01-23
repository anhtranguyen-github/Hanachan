
// @ts-nocheck
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

const supabaseUrl = 'http://127.0.0.1:54421';
const supabaseKey = 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz';
// NOTE: local scripts run without generated Supabase types
const supabase = createClient(supabaseUrl, supabaseKey) as any;

function canonicalSlug(type: 'radical' | 'kanji' | 'vocabulary' | 'grammar', legacy: string) {
    return `${type}:${legacy}`;
}

async function upsertAlias(type: 'radical' | 'kanji' | 'vocabulary' | 'grammar', legacy: string, kuId: string) {
    await supabase.from('ku_slug_aliases').upsert({
        type,
        alias_slug: legacy,
        ku_id: kuId
    }, { onConflict: 'type,alias_slug' });
}

async function seedRadicals() {
    console.log('Seeding Radicals...');
    const filePath = path.join(process.cwd(), 'data/radicals.json');
    const radicals = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    const chunks = [];
    for (let i = 0; i < radicals.length; i += 100) chunks.push(radicals.slice(i, i + 100));

    for (const chunk of chunks) {
        const kuInserts = chunk.map(r => ({
            slug: canonicalSlug('radical', r.character || r.name.toLowerCase().replace(/\s+/g, '-')),
            type: 'radical',
            level: r.level,
            character: r.character || null,
            meaning: r.name,
            search_key: r.name.toLowerCase()
        }));

        const { data: kus, error: kuErr } = await supabase.from('knowledge_units').upsert(kuInserts, { onConflict: 'slug' }).select('id, slug');
        if (kuErr) {
            console.error('Error inserting radical KUs:', kuErr);
            continue;
        }

        const radInserts = chunk.map(r => {
            const legacy = (r.character || r.name.toLowerCase().replace(/\s+/g, '-'));
            const ku = kus.find(k => k.slug === canonicalSlug('radical', legacy));
            return { ku_id: ku.id, name: r.name };
        });

        await supabase.from('ku_radicals').upsert(radInserts, { onConflict: 'ku_id' });

        // aliases
        for (const r of chunk) {
            const legacy = (r.character || r.name.toLowerCase().replace(/\s+/g, '-'));
            const ku = kus.find(k => k.slug === canonicalSlug('radical', legacy));
            if (ku) await upsertAlias('radical', legacy, ku.id);
        }
    }
}

async function seedKanji() {
    console.log('Seeding Kanji...');
    const filePath = path.join(process.cwd(), 'data/kanji.jsonl');
    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

    let batch = [];
    for await (const line of rl) {
        if (!line.trim()) continue;
        batch.push(JSON.parse(line));
        if (batch.length >= 50) {
            await processKanjiBatch(batch);
            batch = [];
        }
    }
    if (batch.length > 0) await processKanjiBatch(batch);
}

async function processKanjiBatch(batch: any[]) {
    const kuInserts = batch.map(k => ({
        slug: canonicalSlug('kanji', k.character),
        type: 'kanji',
        level: k.level,
        character: k.character,
        meaning: k.meanings.primary[0],
        search_key: k.meanings.primary.join(' ').toLowerCase()
    }));

    const { data: kus, error: kuErr } = await supabase.from('knowledge_units').upsert(kuInserts, { onConflict: 'slug' }).select('id, slug');
    if (kuErr) return console.error('Error batch kanji KU:', kuErr);

    const kanjiInserts = batch.map(k => ({
        ku_id: kus.find(ku => ku.slug === canonicalSlug('kanji', k.character)).id,
        video: k.url,
        meaning_data: k.meanings,
        reading_data: k.readings
    }));
    await supabase.from('ku_kanji').upsert(kanjiInserts, { onConflict: 'ku_id' });

    // Relations: kanji_radicals
    // This requires radicals to be seeded first and their IDs known
    for (const k of batch) {
        const kanjiId = kus.find(ku => ku.slug === canonicalSlug('kanji', k.character)).id;
        await upsertAlias('kanji', k.character, kanjiId);
        for (const rad of k.radicals) {
            const { data: rKu } = await supabase.from('knowledge_units')
                .select('id')
                .eq('type', 'radical')
                .or(`character.eq.${rad.character},meaning.eq.${rad.name}`)
                .single();

            if (rKu) {
                await supabase.from('kanji_radicals').upsert({
                    kanji_id: kanjiId,
                    radical_id: rKu.id
                }, { onConflict: 'kanji_id,radical_id' });
            }
        }
    }
}

async function seedVocabulary() {
    console.log('Seeding Vocabulary...');
    const filePath = path.join(process.cwd(), 'data/vocab.jsonl');
    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

    let batch = [];
    for await (const line of rl) {
        if (!line.trim()) continue;
        batch.push(JSON.parse(line));
        if (batch.length >= 50) {
            await processVocabBatch(batch);
            batch = [];
        }
    }
    if (batch.length > 0) await processVocabBatch(batch);
}

async function processVocabBatch(batch: any[]) {
    const kuInserts = batch.map(v => ({
        // keep the legacy uniqueness strategy but namespace it
        slug: canonicalSlug('vocabulary', v.character + (v.level ? `-${v.level}` : '')),
        type: 'vocabulary',
        level: v.level,
        character: v.character,
        meaning: v.meanings.primary[0],
        search_key: v.meanings.primary.join(' ').toLowerCase()
    }));

    const { data: kus, error: kuErr } = await supabase.from('knowledge_units').upsert(kuInserts, { onConflict: 'slug' }).select('id, slug');
    if (kuErr) return console.error('Error batch vocab KU:', kuErr);

    const vocabInserts = batch.map(v => ({
        ku_id: kus.find(ku => ku.slug === canonicalSlug('vocabulary', (v.character + (v.level ? `-${v.level}` : '')))).id,
        reading_primary: v.readings.primary,
        parts_of_speech: v.meanings.word_types || [],
        meaning_data: v.meanings
    }));
    await supabase.from('ku_vocabulary').upsert(vocabInserts, { onConflict: 'ku_id' });

    // Sentences and Relations
    for (const v of batch) {
        const legacy = (v.character + (v.level ? `-${v.level}` : ''));
        const vocabId = kus.find(ku => ku.slug === canonicalSlug('vocabulary', legacy)).id;
        await upsertAlias('vocabulary', legacy, vocabId);

        // Components (Kanji in Vocab)
        if (v.components) {
            for (const comp of v.components) {
                const { data: kKu } = await supabase.from('knowledge_units').select('id').eq('type', 'kanji').eq('character', comp.character).single();
                if (kKu) {
                    await supabase.from('vocab_kanji').upsert({ vocab_id: vocabId, kanji_id: kKu.id }, { onConflict: 'vocab_id,kanji_id' });
                }
            }
        }

        // Context Sentences
        if (v.context_sentences) {
            for (const sent of v.context_sentences) {
                const { data: sData, error: sErr } = await supabase.from('sentences').upsert({
                    text_ja: sent.ja,
                    text_en: sent.en,
                    origin: 'wanikani'
                }, { onConflict: 'text_ja' }).select('id').single();

                if (sData) {
                    await supabase.from('ku_to_sentence').upsert({
                        ku_id: vocabId,
                        sentence_id: sData.id
                    }, { onConflict: 'ku_id,sentence_id' });
                }
            }
        }
    }
}

async function main() {
    try {
        await seedRadicals();
        await seedKanji();
        await seedVocabulary();
        console.log('Deep data seeding completed!');
    } catch (err) {
        console.error('Seeding failed:', err);
    }
}

main();
