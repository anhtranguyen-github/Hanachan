
import { supabase } from '../src/lib/supabase';
import * as fs from 'fs';

async function audit() {
    console.log('--- Radical & Kanji Audit ---');

    // 1. Counts
    const { count: kuRadCount } = await supabase.from('knowledge_units').select('*', { count: 'exact', head: true }).eq('type', 'radical');
    const { count: detailRadCount } = await supabase.from('ku_radicals').select('*', { count: 'exact', head: true });
    console.log('KU Radicals:', kuRadCount);
    console.log('Detail Radicals (ku_radicals):', detailRadCount);

    const { count: kuKanjiCount } = await supabase.from('knowledge_units').select('*', { count: 'exact', head: true }).eq('type', 'kanji');
    const { count: detailKanjiCount } = await supabase.from('ku_kanji').select('*', { count: 'exact', head: true });
    console.log('KU Kanji:', kuKanjiCount);
    console.log('Detail Kanji (ku_kanji):', detailKanjiCount);

    const { count: kuVocabCount } = await supabase.from('knowledge_units').select('*', { count: 'exact', head: true }).eq('type', 'vocabulary');
    const { count: detailVocabCount } = await supabase.from('ku_vocabulary').select('*', { count: 'exact', head: true });
    console.log('KU Vocab:', kuVocabCount);
    console.log('Detail Vocab (ku_vocabulary):', detailVocabCount);

    // 2. Mismatched Detail -> KU links
    const { data: mismatchedR } = await supabase
        .from('ku_radicals')
        .select('ku_id, knowledge_units!inner(type, slug)');

    const rMismatches = mismatchedR?.filter((r: any) => r.knowledge_units.type !== 'radical') || [];
    console.log('ku_radicals pointing to non-radical KU:', rMismatches.length);
    if (rMismatches.length > 0) {
        console.log('Sample R mismatch:', rMismatches.slice(0, 3));
    }

    const { data: mismatchedK } = await supabase
        .from('ku_kanji')
        .select('ku_id, knowledge_units!inner(type, slug)');

    const kMismatches = mismatchedK?.filter((k: any) => k.knowledge_units.type !== 'kanji') || [];
    console.log('ku_kanji pointing to non-kanji KU:', kMismatches.length);
    if (kMismatches.length > 0) {
        console.log('Sample K mismatch:', kMismatches.slice(0, 3));
    }

    // 3. Check JSON unique slugs
    const radData = JSON.parse(fs.readFileSync('./data/radicals.json', 'utf8'));
    const radSlugs = radData.map((r: any) => r.slug);
    const uniqueRadSlugs = new Set(radSlugs);
    console.log('JSON Radicals count:', radData.length);
    console.log('JSON Unique Radical Slugs:', uniqueRadSlugs.size);

    // 4. Check for Character Overlap
    const { data: radKU } = await supabase.from('knowledge_units').select('character, slug').eq('type', 'radical').not('character', 'is', null);
    const { data: kanjiKU } = await supabase.from('knowledge_units').select('character, slug').eq('type', 'kanji');

    const radCharSet = new Set(radKU?.map(r => r.character));
    const kanjiCharSet = new Set(kanjiKU?.map(k => k.character));

    const common = [...radCharSet].filter(c => kanjiCharSet.has(c));
    console.log('Common characters between Radicals and Kanji:', common.length);
    if (common.length > 0) {
        console.log('Sample common:', common.slice(0, 5));
        // Check their slugs in DB
        const { data: overlapEntries } = await supabase.from('knowledge_units').select('character, type, slug').in('character', common.slice(0, 5));
        console.log('DB entries for common chars:', overlapEntries);
    }
}

audit();
