
// @ts-nocheck
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

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

async function main() {
    const filePath = path.join(process.cwd(), 'data/grammar.json');
    console.log('Reading grammar.json...');
    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const allItems = content.data;

    console.log(`Total items to process: ${allItems.length}`);

    // Pass 1: Upsert KU and KU_Grammar
    console.log('Starting Pass 1: Upserting Knowledge Units and Grammar records...');
    for (let i = 0; i < allItems.length; i++) {
        const item = allItems[i];
        if (i % 50 === 0) console.log(`Progress: ${i}/${allItems.length}`);

        const legacySlug = item.slug;
        const slug = canonicalSlug('grammar', legacySlug);
        const { data: ku, error: kuErr } = await supabase.from('knowledge_units').upsert({
            slug,
            type: 'grammar',
            level: item.level,
            character: item.title,
            meaning: item.meanings?.[0] || 'Unknown',
            search_key: item.title.toLowerCase()
        }, { onConflict: 'slug' }).select('id').single();

        if (kuErr || !ku) {
            console.error(`Error KU ${item.slug}:`, kuErr);
            continue;
        }

        await upsertAlias('grammar', legacySlug, ku.id);

        const { error: gErr } = await supabase.from('ku_grammar').upsert({
            ku_id: ku.id,
            structure: item.structure,
            details: item.details?.part_of_speech || 'Grammar',
            content_blob: {
                about_description: item.about?.text || item.about?.description || 'See Bunpro for details.',
                fun_facts: item.fun_facts || [],
                details_expanded: item.details,
                examples_count: item.examples?.length || 0,
                // We don't store examples in content_blob usually, but we could
                // examples: item.examples 
            }
        }, { onConflict: 'ku_id' });

        if (gErr) console.error(`Error G ${item.slug}:`, gErr);
    }

    // Pass 2: Upsert Relations
    console.log('Starting Pass 2: Upserting Grammar Relations...');
    // We need a map of slug -> id to be fast
    const { data: allKu } = await supabase.from('knowledge_units').select('id, slug').eq('type', 'grammar');
    const slugToId = new Map(allKu?.map(k => [k.slug, k.id]));

    for (let i = 0; i < allItems.length; i++) {
        const item = allItems[i];
        if (i % 50 === 0) console.log(`Link Progress: ${i}/${allItems.length}`);

        const kuId = slugToId.get(canonicalSlug('grammar', item.slug));
        if (!kuId) continue;

        const relations: any[] = [];

        // Add related
        if (item.related) {
            item.related.forEach((rel: any) => {
                const relId = slugToId.get(canonicalSlug('grammar', rel.slug));
                if (relId) {
                    relations.push({
                        grammar_id: kuId,
                        related_grammar_id: relId,
                        type: 'similar',
                        comparison_note: rel.comparison_text || ''
                    });
                }
            });
        }

        // Add synonyms
        if (item.synonyms) {
            item.synonyms.forEach((rel: any) => {
                const relId = slugToId.get(canonicalSlug('grammar', rel.slug));
                if (relId) {
                    relations.push({
                        grammar_id: kuId,
                        related_grammar_id: relId,
                        type: 'synonym',
                        comparison_note: ''
                    });
                }
            });
        }

        // Add antonyms
        if (item.antonyms) {
            item.antonyms.forEach((rel: any) => {
                const relId = slugToId.get(canonicalSlug('grammar', rel.slug));
                if (relId) {
                    relations.push({
                        grammar_id: kuId,
                        related_grammar_id: relId,
                        type: 'antonym',
                        comparison_note: ''
                    });
                }
            });
        }

        if (relations.length > 0) {
            const { error: relErr } = await supabase.from('grammar_relations').upsert(relations, { onConflict: 'grammar_id,related_grammar_id,type' });
            if (relErr) console.error(`Error Rel for ${item.slug}:`, relErr);
        }
    }

    console.log('Bulk Seeding Complete!');
}

main();
