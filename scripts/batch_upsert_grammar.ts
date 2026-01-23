
// @ts-nocheck
import { createClient } from '@supabase/supabase-js';

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

export async function upsertGrammarBatch(items: any[]) {
    for (const item of items) {
        const { slug, level, title, meanings, structure, about, fun_facts, details, related } = item;
        const canonical = canonicalSlug('grammar', slug);

        // 1. KU
        const { data: ku, error: kuErr } = await supabase.from('knowledge_units').upsert({
            slug: canonical,
            type: 'grammar',
            level,
            character: title,
            meaning: meanings?.[0],
            search_key: title.toLowerCase()
        }, { onConflict: 'slug' }).select('id').single();

        if (kuErr || !ku) {
            console.error(`Error KU ${slug}:`, kuErr);
            continue;
        }

        await upsertAlias('grammar', slug, ku.id);

        // 2. KU Grammar
        const { error: gErr } = await supabase.from('ku_grammar').upsert({
            ku_id: ku.id,
            structure,
            details: details?.part_of_speech,
            content_blob: {
                about_description: about,
                fun_facts,
                details_expanded: details
            }
        }, { onConflict: 'ku_id' });

        if (gErr) console.error(`Error G ${slug}:`, gErr);

        // 3. Related Relations
        if (related && related.length > 0) {
            for (const rel of related) {
                // Find related ID
                const { data: relKu } = await supabase.from('knowledge_units')
                    .select('id')
                    .eq('slug', canonicalSlug('grammar', rel.slug))
                    .single();

                if (relKu) {
                    await supabase.from('grammar_relations').upsert({
                        grammar_id: ku.id,
                        related_grammar_id: relKu.id,
                        type: rel.type.toLowerCase(),
                        comparison_note: rel.comparison
                    }, { onConflict: 'grammar_id,related_grammar_id,type' });
                }
            }
        }
    }
}
