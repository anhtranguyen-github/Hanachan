#!/usr/bin/env node

// @ts-nocheck
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = 'http://127.0.0.1:54421';
const supabaseKey = 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz';
const supabase = createClient(supabaseUrl, supabaseKey);

function canonicalSlug(type: string, baseSlug: string) {
    return `${type}:${baseSlug}`;
}

function decodeSlug(encoded: string) {
    try {
        return decodeURIComponent(encoded);
    } catch {
        return encoded;
    }
}

async function main() {
    console.log('=== RESEED ALL GRAMMAR (WITH RELATIONS) ===');

    const crawled = JSON.parse(fs.readFileSync('./data/crawled_grammar_all.json', 'utf8'));
    console.log(`Loaded ${crawled.length} crawled items.`);

    // 1. Load existing KUs and aliases for resolution
    const { data: allKU } = await supabase.from('knowledge_units').select('id, slug').eq('type', 'grammar');
    const slugToId = new Map(allKU?.map(k => [k.slug, k.id]));
    const baseToId = new Map();
    const { data: aliases } = await supabase.from('ku_slug_aliases').select('alias_slug, ku_id').eq('type', 'grammar');
    aliases?.forEach(a => baseToId.set(a.alias_slug, a.ku_id));

    // 2. Insert/update KUs and ku_grammar
    console.log('\n--- Inserting/Updating KUs and ku_grammar ---');
    for (let i = 0; i < crawled.length; i++) {
        const item = crawled[i];
        const canonical = canonicalSlug('grammar', item.slug);
        const kuId = slugToId.get(canonical) || baseToId.get(item.slug);

        if (!kuId) {
            console.warn(`Missing KU for ${item.slug}, skipping...`);
            continue;
        }

        if (i % 100 === 0) console.log(`Progress: ${i}/${crawled.length}`);

        // Ensure ku_grammar row exists
        await supabase.from('ku_grammar').upsert({
            ku_id: kuId,
            structure: item.structure,
            details: item.details,
            cautions: item.cautions?.join('\n') || null,
            content_blob: {
                about_description: item.about,
                cautions: item.cautions || [],
                fun_facts: item.fun_facts || [],
                details_expanded: item.details_expanded || {},
                furigana: item.furigana,
                resources: item.resources || {},
            },
        }, { onConflict: 'ku_id' });

        // Insert/update alias if missing
        if (!baseToId.has(item.slug)) {
            await supabase.from('ku_slug_aliases').upsert({
                type: 'grammar',
                alias_slug: item.slug,
                ku_id: kuId,
            }, { onConflict: 'type,alias_slug' });
            baseToId.set(item.slug, kuId);
        }
    }

    // 3. Prepare relations
    console.log('\n--- Preparing relations ---');
    const relationInserts: any[] = [];
    for (const item of crawled) {
        if (!item.related?.length) continue;
        const canonical = canonicalSlug('grammar', item.slug);
        const kuId = slugToId.get(canonical) || baseToId.get(item.slug);
        if (!kuId) continue;

        for (const rel of item.related) {
            const relatedSlug = decodeSlug(rel.slug || '');
            const relatedKuId = slugToId.get(`grammar:${relatedSlug}`) || baseToId.get(relatedSlug);
            if (!relatedKuId) continue;

            const type = (rel.type || '').toLowerCase();
            const validTypes = ['synonym', 'antonym', 'similar', 'contrast'];
            const relationType = validTypes.includes(type) ? type : 'similar';

            relationInserts.push({
                grammar_id: kuId,
                related_grammar_id: relatedKuId,
                type: relationType,
                comparison_note: rel.comparison_text || null,
            });
        }
    }

    // 4. Insert relations in batches
    console.log(`Inserting ${relationInserts.length} relations...`);
    for (let i = 0; i < relationInserts.length; i += 500) {
        const batch = relationInserts.slice(i, i + 500);
        await supabase.from('grammar_relations').upsert(batch, { onConflict: 'grammar_id,related_grammar_id,type' });
        if (i % 2000 === 0) console.log(`Relations progress: ${i}/${relationInserts.length}`);
    }

    // 5. Insert sentences and links
    console.log('\n--- Inserting sentences and links ---');
    for (let i = 0; i < crawled.length; i++) {
        const item = crawled[i];
        const canonical = canonicalSlug('grammar', item.slug);
        const kuId = slugToId.get(canonical) || baseToId.get(item.slug);
        if (!kuId || !item.examples?.length) continue;

        for (const ex of item.examples) {
            // Find or insert sentence
            const { data: existing } = await supabase
                .from('sentences')
                .select('id')
                .eq('text_ja', ex.sentence_text)
                .eq('origin', 'bunpro')
                .limit(1);

            let sentenceId: string;
            if (existing && existing.length > 0) {
                sentenceId = existing[0].id;
            } else {
                const { data: neu } = await supabase.from('sentences').insert({
                    text_ja: ex.sentence_text,
                    text_en: ex.translation,
                    origin: 'bunpro',
                    metadata: {
                        audio_url: ex.audio_url,
                        structure: ex.sentence_structure,
                    },
                }).select('id').single();
                if (!neu) continue;
                sentenceId = neu.id;
            }

            // Link
            await supabase.from('grammar_sentences').upsert({
                grammar_id: kuId,
                sentence_id: sentenceId,
                note: 'Bunpro Example',
            }, { onConflict: 'grammar_id,sentence_id' });

            await supabase.from('ku_to_sentence').upsert({
                ku_id: kuId,
                sentence_id: sentenceId,
            }, { onConflict: 'ku_id,sentence_id' });
        }

        if (i % 100 === 0) console.log(`Sentences progress: ${i}/${crawled.length}`);
    }

    console.log('\n=== RESEED COMPLETE ===');
}

main().catch(err => {
    console.error('FATAL:', err);
    process.exit(1);
});
