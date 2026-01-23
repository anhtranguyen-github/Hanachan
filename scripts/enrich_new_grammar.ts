#!/usr/bin/env node

// @ts-nocheck
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = 'http://127.0.0.1:54421';
const supabaseKey = 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz';
const supabase = createClient(supabaseUrl, supabaseKey);

// New slugs we just inserted
const NEW_SLUGS = [
    'する','あそこ','あの','あれ','ここ','この','これ','そこ','その','それ','どこ','どの','どれ',
    'まだ','もう','ほとんど','各','聞こえる','見える','風','代','一体','中','再び','切る','却って',
    '合う','当たり','点','的','直ちに','第一','一旦','上','抜く','気','確かに','以前'
];

async function main() {
    console.log('=== TARGETED ENRICHMENT FOR 38 NEW GRAMMAR SLUGS ===\n');

    const filePath = path.join(process.cwd(), 'data/grammar.json');
    console.log('Reading grammar.json...');
    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const allItems = content.data;

    console.log('Fetching all grammar IDs...');
    const { data: allKu } = await supabase.from('knowledge_units').select('id, slug').eq('type', 'grammar');
    const slugToId = new Map(allKu?.map(k => [k.slug.replace('grammar:', ''), k.id]));

    // Filter to only our new slugs
    const targetItems = allItems.filter(item => NEW_SLUGS.includes(item.slug));
    console.log(`Target items to enrich: ${targetItems.length}`);

    const targetKuIds = targetItems.map(item => slugToId.get(item.slug)).filter(Boolean);

    // Ensure ku_grammar rows exist for each KU
    console.log('Ensuring ku_grammar records exist...');
    for (let i = 0; i < targetKuIds.length; i += 100) {
        const batch = targetKuIds.slice(i, i + 100).map(id => ({ ku_id: id }));
        await supabase.from('ku_grammar').upsert(batch, { onConflict: 'ku_id' });
    }

    for (let i = 0; i < targetItems.length; i++) {
        const item = targetItems[i];
        const kuId = slugToId.get(item.slug);
        if (!kuId) {
            console.warn(`Missing KU for slug: ${item.slug}`);
            continue;
        }

        console.log(`[${i+1}/${targetItems.length}] Enriching: ${item.slug}`);

        // 1. Examples
        if (item.examples && item.examples.length > 0) {
            for (const ex of item.examples) {
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
                    const { data: neu, error: sErr } = await supabase.from('sentences').insert({
                        text_ja: ex.sentence_text,
                        text_en: ex.translation,
                        origin: 'bunpro',
                        metadata: {
                            audio_url: ex.audio_url,
                            structure: ex.sentence_structure
                        }
                    }).select('id').single();

                    if (sErr || !neu) continue;
                    sentenceId = neu.id;
                }

                await supabase.from('grammar_sentences').upsert({
                    grammar_id: kuId,
                    sentence_id: sentenceId,
                    note: 'Bunpro Example'
                }, { onConflict: 'grammar_id,sentence_id' });

                await supabase.from('ku_to_sentence').upsert({
                    ku_id: kuId,
                    sentence_id: sentenceId
                }, { onConflict: 'ku_id,sentence_id' });
            }
        }

        // 2. Metadata Update (Cautions, Resources, Fun Facts)
        await supabase.from('ku_grammar').update({
            structure: item.structure || { patterns: [] },
            details: item.details?.word_type || null,
            cautions: item.cautions?.map((c: any) => c.text || c).join('\n') || null,
            content_blob: {
                about_description: item.about?.text || item.about?.description || 'See Bunpro for details.',
                fun_facts: item.fun_facts || [],
                details_expanded: item.details,
                cautions: item.cautions || [],
                resources: item.resources || {},
                furigana: item.title_with_furigana || null
            }
        }).eq('ku_id', kuId);
    }

    console.log('\n=== ENRICHMENT COMPLETE ===');
}

main().catch(err => {
    console.error('FATAL:', err);
    process.exit(1);
});
