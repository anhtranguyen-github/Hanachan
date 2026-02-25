
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:54421';
const supabaseKey = 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz';
const supabase = createClient(supabaseUrl, supabaseKey);

async function verify() {
    console.log('--- Initial Verification ---');

    const { count: kuCount } = await supabase.from('knowledge_units').select('*', { count: 'exact', head: true });
    console.log('Total Knowledge Units:', kuCount);

    const { count: radCount } = await supabase.from('radical_details').select('*', { count: 'exact', head: true });
    console.log('Total Radical Details:', radCount);

    const { count: kanjiCount } = await supabase.from('kanji_details').select('*', { count: 'exact', head: true });
    console.log('Total Kanji Details:', kanjiCount);

    const { count: vocabCount } = await supabase.from('vocabulary_details').select('*', { count: 'exact', head: true });
    console.log('Total Vocabulary Details:', vocabCount);

    const { count: grammarCount } = await supabase.from('grammar_details').select('*', { count: 'exact', head: true });
    console.log('Total Grammar Details:', grammarCount);

    const { count: relCount } = await supabase.from('grammar_relations').select('*', { count: 'exact', head: true });
    console.log('Total Grammar Relations:', relCount);

    console.log('--- Verification Complete ---');
}

verify();
