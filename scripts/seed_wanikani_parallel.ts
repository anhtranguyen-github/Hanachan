
// @ts-nocheck
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = 'http://127.0.0.1:54421';
const supabaseKey = 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz';
const supabase = createClient(supabaseUrl, supabaseKey) as any;

const CONCURRENCY = 20;

function canonicalSlug(type: 'radical' | 'kanji' | 'vocabulary' | 'grammar', identifier: string) {
    return `${type}:${identifier.toLowerCase()}`;
}

async function upsertAliaseBatch(aliases: { type: string, alias_slug: string, ku_id: string }[]) {
    if (aliases.length === 0) return;
    await supabase.from('ku_slug_aliases').upsert(aliases, { onConflict: 'type,alias_slug' });
}

async function promiseAllStepByStep(items: any[], batchSize: number, worker: (item: any) => Promise<void>) {
    for (let i = 0; i < items.length; i += batchSize) {
        const chunk = items.slice(i, i + batchSize);
        await Promise.all(chunk.map(worker));
    }
}

async function main() {
    console.log('--- STARTING PARALLEL WANIKANI SEEDING ---');

    console.time('seed_radicals');
    await seedRadicals();
    console.timeEnd('seed_radicals');

    console.time('seed_kanji');
    await seedKanji();
    console.timeEnd('seed_kanji');

    console.time('seed_vocab');
    await seedVocab();
    console.timeEnd('seed_vocab');

    console.log('--- PARALLEL WANIKANI SEEDING COMPLETE ---');
}

async function seedRadicals() {
    console.log('Seeding Radicals...');
    const data = JSON.parse(fs.readFileSync('./data/radicals.json', 'utf8'));

    await promiseAllStepByStep(data, CONCURRENCY, async (item) => {
        const slugIdentifier = item.slug;
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

        if (kuErr || !ku) return;

        await upsertAliaseBatch([
            { type: 'radical', alias_slug: slugIdentifier, ku_id: ku.id },
            ...(item.character ? [{ type: 'radical', alias_slug: item.character, ku_id: ku.id }] : [])
        ]);

        await supabase.from('ku_radicals').upsert({
            ku_id: ku.id,
            name: item.name
        }, { onConflict: 'ku_id' });
    });
    console.log('Finished Radicals');
}

async function seedKanji() {
    console.log('Seeding Kanji...');
    const fileContent = fs.readFileSync('./data/kanji.jsonl', 'utf8');
    const items = fileContent.split('\n').filter(Boolean).map(l => JSON.parse(l));

    const { data: rads } = await supabase.from('knowledge_units').select('id, slug').eq('type', 'radical');
    const radicalIdMap = new Map(rads?.map(r => [r.slug.replace('radical:', ''), r.id]));

    await promiseAllStepByStep(items, CONCURRENCY, async (item) => {
        const fullSlug = canonicalSlug('kanji', item.character);
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

        if (kuErr || !ku) return;

        await upsertAliaseBatch([{ type: 'kanji', alias_slug: item.character, ku_id: ku.id }]);
        await supabase.from('ku_kanji').upsert({
            ku_id: ku.id,
            meaning_data: item.meanings,
            reading_data: item.readings
        }, { onConflict: 'ku_id' });

        if (item.radicals) {
            const radLinks = item.radicals.map(r => {
                const rSlug = r.url.endsWith('/') ? r.url.split('/').slice(-2, -1)[0] : r.url.split('/').pop();
                const radId = radicalIdMap.get(rSlug);
                return radId ? { kanji_id: ku.id, radical_id: radId } : null;
            }).filter(Boolean);
            if (radLinks.length > 0) await supabase.from('kanji_radicals').upsert(radLinks, { onConflict: 'kanji_id,radical_id' });
        }
    });
    console.log('Finished Kanji');
}

async function seedVocab() {
    console.log('Seeding Vocabulary...');
    const fileContent = fs.readFileSync('./data/vocab.jsonl', 'utf8');
    const items = fileContent.split('\n').filter(Boolean).map(l => JSON.parse(l));

    const { data: kanjis } = await supabase.from('knowledge_units').select('id, character').eq('type', 'kanji');
    const kanjiToId = new Map(kanjis?.map(k => [k.character, k.id]));

    let count = 0;
    await promiseAllStepByStep(items, CONCURRENCY, async (item) => {
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

        if (kuErr || !ku) return;

        await upsertAliaseBatch([
            { type: 'vocabulary', alias_slug: item.character, ku_id: ku.id },
            { type: 'vocabulary', alias_slug: urlSlug, ku_id: ku.id }
        ]);

        await supabase.from('ku_vocabulary').upsert({
            ku_id: ku.id,
            reading_primary: item.readings.primary,
            parts_of_speech: item.meanings.word_types || [],
            meaning_data: item.meanings
        }, { onConflict: 'ku_id' });

        const kanjiLinks = item.character.split('').map(c => kanjiToId.get(c)).filter(Boolean).map(kId => ({ vocab_id: ku.id, kanji_id: kId }));
        if (kanjiLinks.length > 0) await supabase.from('vocab_kanji').upsert(kanjiLinks, { onConflict: 'vocab_id,kanji_id' });

        if (item.context_sentences) {
            for (const sent of item.context_sentences) {
                const { data: sData } = await supabase.from('sentences').upsert({
                    text_ja: sent.ja,
                    text_en: sent.en,
                    origin: 'wanikani'
                }, { onConflict: 'text_ja' }).select('id').single();

                if (sData) await supabase.from('ku_to_sentence').upsert({ ku_id: ku.id, sentence_id: sData.id }, { onConflict: 'ku_id,sentence_id' });
            }
        }
        count++;
        if (count % 100 === 0) console.log(`Processed ${count}/${items.length} vocab`);
    });
}

main();
