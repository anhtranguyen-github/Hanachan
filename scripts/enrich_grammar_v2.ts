
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = 'http://127.0.0.1:54421';
const supabaseKey = 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz';
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    const filePath = path.join(process.cwd(), 'data/grammar.json');
    console.log('Reading grammar.json...');
    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const allItems = content.data;

    console.log('Fetching all grammar IDs...');
    const { data: allKu } = await supabase.from('knowledge_units').select('id, slug').eq('type', 'grammar');
    const slugToId = new Map(allKu?.map(k => [k.slug, k.id]));

    console.log(`Starting to seed examples and metadata for ${allItems.length} grammar points...`);

    // Ensure grammar_units exists for each KU
    console.log('Ensuring grammar_units records exist...');
    const kuIds = Array.from(slugToId.values());
    for (let i = 0; i < kuIds.length; i += 100) {
        const batch = kuIds.slice(i, i + 100).map(id => ({ ku_id: id }));
        await supabase.from('grammar_units').upsert(batch, { onConflict: 'ku_id' });
    }

    for (let i = 0; i < allItems.length; i++) {
        const item = allItems[i];
        const kuId = slugToId.get(item.slug);
        if (!kuId) continue;

        if (i % 50 === 0) console.log(`Progress: ${i}/${allItems.length} (${item.slug})`);

        // 1. Examples
        if (item.examples && item.examples.length > 0) {
            for (const ex of item.examples) {
                // Find or Insert Sentence
                // Note: We don't have a unique constraint on text_ja, so we do a lookup first
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

                // Link in grammar_sentences
                await supabase.from('grammar_sentences').upsert({
                    grammar_id: kuId,
                    sentence_id: sentenceId,
                    note: 'Bunpro Example'
                }, { onConflict: 'grammar_id,sentence_id' });

                // Link in ku_to_sentence
                await supabase.from('ku_to_sentence').upsert({
                    ku_id: kuId,
                    sentence_id: sentenceId
                }, { onConflict: 'ku_id,sentence_id' });
            }
        }

        // 2. Metadata Update (Cautions, Resources, Fun Facts)
        await supabase.from('ku_grammar').update({
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

    console.log('Enrichment complete!');
}

main();
