
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:54421';
const supabaseKey = 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz';
const supabase = createClient(supabaseUrl, supabaseKey);

async function verify() {
    console.log('--- Verifying Data Integrity ---');

    // 1. Check for prefixed slugs
    const { data: vocabSample } = await supabase.from('knowledge_units').select('slug').eq('type', 'vocabulary').limit(1);
    console.log('Vocab slug format:', vocabSample?.[0]?.slug);

    const { data: kanjiSample } = await supabase.from('knowledge_units').select('slug').eq('type', 'kanji').limit(1);
    console.log('Kanji slug format:', kanjiSample?.[0]?.slug);

    const { data: radicalSample } = await supabase.from('knowledge_units').select('slug').eq('type', 'radical').limit(1);
    console.log('Radical slug format:', radicalSample?.[0]?.slug);

    // 2. Check counts (should be exactly WK counts)
    const { count: r } = await supabase.from('knowledge_units').select('*', { count: 'exact', head: true }).eq('type', 'radical');
    console.log('Total Radicals:', r); // Expected ~486

    const { count: k } = await supabase.from('knowledge_units').select('*', { count: 'exact', head: true }).eq('type', 'kanji');
    console.log('Total Kanji:', k); // Expected ~2087

    const { count: v } = await supabase.from('knowledge_units').select('*', { count: 'exact', head: true }).eq('type', 'vocabulary');
    console.log('Total Vocabulary (so far):', v);

    // 3. Check for specific overlaps (e.g. big / 大)
    const { data: big } = await supabase.from('knowledge_units').select('slug, type, character').or('slug.eq.radical:big,slug.eq.kanji:大');
    console.log('Entries for Big:', big);
}

verify();
