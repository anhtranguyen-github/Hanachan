
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Missing Supabase URL or Anon Key");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runHealthCheck() {
    console.log("🏥 Hanachan V2 Cloud Health Check...");
    console.log(`🔗 Connecting to: ${supabaseUrl}\n`);

    // 1. Kiểm tra Knowledge Units (CKB)
    const { data: counts, error: countErr } = await supabase
        .from('knowledge_units')
        .select('type, count')
        .select('*', { count: 'exact', head: true });

    if (countErr) {
        console.error("❌ Error fetching KU counts:", countErr.message);
    } else {
        // Query cụ thể từng loại
        const { data: typeCounts } = await supabase.rpc('get_ku_stats'); // Nếu có RPC

        // Fallback query tay
        const { count: total } = await supabase.from('knowledge_units').select('*', { count: 'exact', head: true });
        const { count: kanji } = await supabase.from('knowledge_units').select('*', { count: 'exact', head: true }).eq('type', 'kanji');
        const { count: vocabulary } = await supabase.from('knowledge_units').select('*', { count: 'exact', head: true }).eq('type', 'vocabulary');
        const { count: grammar } = await supabase.from('knowledge_units').select('*', { count: 'exact', head: true }).eq('type', 'grammar');
        const { count: radical } = await supabase.from('knowledge_units').select('*', { count: 'exact', head: true }).eq('type', 'radical');

        console.log("📊 [Knowledge Base]");
        console.table({
            Radical: radical,
            Kanji: kanji,
            Vocabulary: vocabulary,
            Grammar: grammar,
            TOTAL: total
        });
    }

    // 2. Kiểm tra Sentences & Examples
    console.log("\n📖 [Sentences & Examples]");
    const { count: totalSentences } = await supabase.from('sentences').select('*', { count: 'exact', head: true });
    const { count: linkedSentences } = await supabase.from('ku_to_sentence').select('*', { count: 'exact', head: true });
    const { count: clozeSentences } = await supabase.from('ku_to_sentence').select('*', { count: 'exact', head: true }).not('cloze_positions', 'is', null);

    console.table({
        "Total Sentences": totalSentences,
        "Linked to KU": linkedSentences,
        "Grammar Cloze Ready": clozeSentences
    });

    // 3. Kiểm tra RPG Progress Decks
    const { data: decks } = await supabase.from('decks').select('name, type');
    console.log("\n🎒 [Decks Established]");
    console.table(decks);

    // 3. Test một query thực tế (Search Kanban)
    console.log("\n🔍 [Test Query] Searching for '署' (Kanji or Grammar)...");
    const { data: searchResult } = await supabase
        .from('knowledge_units')
        .select('slug, type, search_key')
        .ilike('search_key', '%署%')
        .limit(3);

    console.table(searchResult);

    console.log("\n🚀 CLOUD DATA IS LIVE AND QUERYABLE!");
}

runHealthCheck();
