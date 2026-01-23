
// @ts-nocheck
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = 'http://127.0.0.1:54421';
const supabaseKey = 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz';
// NOTE: local scripts run without generated Supabase types
const supabase = createClient(supabaseUrl, supabaseKey) as any;

function canonicalSlug(type: 'radical' | 'kanji' | 'vocabulary' | 'grammar', identifier: string) {
    // Standardize slugs: lowercase and prefixed
    return `${type}:${identifier.toLowerCase()}`;
}

async function upsertAlias(type: 'radical' | 'kanji' | 'vocabulary' | 'grammar', legacy: string, kuId: string) {
    await supabase.from('ku_slug_aliases').upsert({
        type,
        alias_slug: legacy,
        ku_id: kuId
    }, { onConflict: 'type,alias_slug' });
}

async function main() {
    console.log('--- STARTING CLEAN WANIKANI SEEDING ---');

    // 1. SEED RADICALS
    await seedRadicals();

    // 2. SEED KANJI
    await seedKanji();

    // 3. SEED VOCABULARY
    await seedVocab();

    console.log('--- WANIKANI SEEDING COMPLETE ---');
}

async function seedRadicals() {
    console.log('Seeding Radicals...');
    const data = JSON.parse(fs.readFileSync('./data/radicals.json', 'utf8'));

    for (let i = 0; i < data.length; i++) {
        const item = data[i];
        if (i % 50 === 0) console.log(`Radicals Progress: ${i}/${data.length}`);

        const slugIdentifier = item.slug; // WK slug from JSON
        const fullSlug = canonicalSlug('radical', slugIdentifier);

        const { data: ku, error: kuErr } = await supabase.from('knowledge_units').upsert({
            slug: fullSlug,
            type: 'radical',
            level: item.level,
            character: item.character || null,
            meaning: item.meaning,
            search_key: `${item.character || ''} ${item.meaning}`.toLowerCase(),
            mnemonics: {
                meaning: item.mnemonic?.[0]?.content?.[0]?.content || '',
                image_url: item.mnemonic_image?.src,
                wanikani_url: item.url
            }
        }, { onConflict: 'slug' }).select('id').single();

        if (kuErr || !ku) {
            console.error(`Error Radical KU ${item.slug}:`, kuErr);
            continue;
        }

        await upsertAlias('radical', slugIdentifier, ku.id);
        if (item.character) await upsertAlias('radical', item.character, ku.id);

        await supabase.from('ku_radicals').upsert({
            ku_id: ku.id,
            name: item.name
        }, { onConflict: 'ku_id' });
    }
}

async function seedKanji() {
    console.log('Seeding Kanji...');
    const fileContent = fs.readFileSync('./data/kanji.jsonl', 'utf8');
    const lines = fileContent.split('\n').filter(Boolean);

    // Get all radicals for linking (slug to ID)
    const { data: rads } = await supabase.from('knowledge_units').select('id, slug').eq('type', 'radical');
    const radicalIdMap = new Map<string, string>();
    rads?.forEach(r => {
        const baseSlug = r.slug.replace('radical:', '');
        radicalIdMap.set(baseSlug, r.id);
    });

    for (let i = 0; i < lines.length; i++) {
        const item = JSON.parse(lines[i]);
        if (i % 50 === 0) console.log(`Kanji Progress: ${i}/${lines.length}`);

        const slugIdentifier = item.character;
        const fullSlug = canonicalSlug('kanji', slugIdentifier);

        const { data: ku, error: kuErr } = await supabase.from('knowledge_units').upsert({
            slug: fullSlug,
            type: 'kanji',
            level: item.level,
            character: item.character,
            meaning: item.meanings.primary[0],
            search_key: `${item.character} ${item.meanings.primary.join(' ')}`.toLowerCase(),
            mnemonics: {
                meaning: item.meanings.mnemonic,
                reading: item.readings.mnemonic,
                wanikani_url: item.url
            }
        }, { onConflict: 'slug' }).select('id').single();

        if (kuErr || !ku) {
            console.error(`Error Kanji KU ${item.character}:`, kuErr);
            continue;
        }

        await upsertAlias('kanji', slugIdentifier, ku.id);

        await supabase.from('ku_kanji').upsert({
            ku_id: ku.id,
            meaning_data: item.meanings,
            reading_data: item.readings
        }, { onConflict: 'ku_id' });


        // Link to Radicals
        if (item.radicals && item.radicals.length > 0) {
            const radLinks = item.radicals.map((r: any) => {
                // Extract slug from URL if possible, or use fallback
                const rSlug = r.url.endsWith('/') ? r.url.split('/').slice(-2, -1)[0] : r.url.split('/').pop();
                const radId = radicalIdMap.get(rSlug);
                if (radId) return { kanji_id: ku.id, radical_id: radId };
                return null;
            }).filter(Boolean);

            if (radLinks.length > 0) {
                await supabase.from('kanji_radicals').upsert(radLinks, { onConflict: 'kanji_id,radical_id' });
            }
        }
    }
}

async function seedVocab() {
    console.log('Seeding Vocabulary...');
    const fileContent = fs.readFileSync('./data/vocab.jsonl', 'utf8');
    const lines = fileContent.split('\n').filter(Boolean);

    // Get all kanji for linking
    const { data: kanjis } = await supabase.from('knowledge_units').select('id, character').eq('type', 'kanji');
    const kanjiToId = new Map(kanjis?.map(k => [k.character, k.id]));

    for (let i = 0; i < lines.length; i++) {
        const item = JSON.parse(lines[i]);
        if (i % 50 === 0) console.log(`Vocab Progress: ${i}/${lines.length}`);

        // Vocabulary slug should be unique, sometimes characters clash
        const urlSlug = decodeURIComponent(item.url.split('/').pop());
        const fullSlug = canonicalSlug('vocabulary', urlSlug);

        const { data: ku, error: kuErr } = await supabase.from('knowledge_units').upsert({
            slug: fullSlug,
            type: 'vocabulary',
            level: item.level,
            character: item.character,
            meaning: item.meanings.primary[0],
            search_key: `${item.character} ${item.meanings.primary.join(' ')}`.toLowerCase(),
            mnemonics: {
                meaning: item.meanings.explanation?.[0]?.content?.[0]?.content || '',
                reading: item.readings.explanation?.[0]?.content?.[0]?.content || '',
                wanikani_url: item.url
            }
        }, { onConflict: 'slug' }).select('id').single();

        if (kuErr || !ku) {
            console.error(`Error Vocab KU ${item.character} (${urlSlug}):`, kuErr);
            continue;
        }

        await upsertAlias('vocabulary', item.character, ku.id);
        await upsertAlias('vocabulary', urlSlug, ku.id);

        await supabase.from('ku_vocabulary').upsert({
            ku_id: ku.id,
            reading_primary: item.readings.primary,
            parts_of_speech: item.meanings.word_types || [],
            meaning_data: item.meanings
        }, { onConflict: 'ku_id' });

        // Link to Kanji
        const chars = item.character.split('');
        const kanjiLinks = [];
        for (const char of chars) {
            const kId = kanjiToId.get(char);
            if (kId) {
                kanjiLinks.push({ vocab_id: ku.id, kanji_id: kId });
            }
        }
        if (kanjiLinks.length > 0) {
            await supabase.from('vocab_kanji').upsert(kanjiLinks, { onConflict: 'vocab_id,kanji_id' });
        }

        // Seed context sentences
        if (item.context_sentences && item.context_sentences.length > 0) {
            for (const sent of item.context_sentences) {
                // Find or Insert Sentence
                // Using text_ja as unique key for sentences table
                const { data: sData, error: sErr } = await supabase.from('sentences').upsert({
                    text_ja: sent.ja,
                    text_en: sent.en,
                    origin: 'wanikani'
                }, { onConflict: 'text_ja' }).select('id').single();

                if (sData) {
                    await supabase.from('ku_to_sentence').upsert({
                        ku_id: ku.id,
                        sentence_id: sData.id
                    }, { onConflict: 'ku_id,sentence_id' });
                }
            }
        }
    }
}

main();
