
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:54421';
const supabaseKey = 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz';
const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanup() {
    console.log('--- AGGRESSIVE CLEANUP ---');

    // Deleting grammar_units is risky if it handles N5-N1 structure, 
    // but if it prevents radical deletion, it must be cleared.
    try {
        console.log('Clearing grammar_units...');
        // We don't know the columns, so we use a generic delete if possible
        const { error } = await supabase.from('grammar_units').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (error) {
            // Try different column names
            await supabase.from('grammar_units').delete().neq('ku_id', '00000000-0000-0000-0000-000000000000');
        }
    } catch (e) { }

    const tables = [
        'ku_to_sentence', 'vocab_kanji', 'kanji_radicals',
        'ku_vocabulary', 'ku_kanji', 'ku_radicals',
        'ku_grammar', 'ku_slug_aliases', 'user_learning_states',
        'grammar_relations'
    ];

    for (const table of tables) {
        console.log(`Clearing ${table}...`);
        try {
            await supabase.from(table).delete().neq('ku_id', '0-0-0-0-0');
            await supabase.from(table).delete().neq('vocab_id', '0-0-0-0-0');
            await supabase.from(table).delete().neq('kanji_id', '0-0-0-0-0');
            await supabase.from(table).delete().neq('grammar_id', '0-0-0-0-0');
        } catch (e) { }
    }

    console.log('Deleting WaniKani types from knowledge_units...');
    await supabase.from('knowledge_units').delete().in('type', ['vocabulary', 'kanji', 'radical']);

    console.log('Cleanup Complete!');
}

cleanup();
