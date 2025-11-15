
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Missing Supabase URL or Service Key");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verify() {
    try {
        console.log("🔍 Running Data Verification via Supabase API...");

        // 1. KU Counts
        const { data: kuCounts, error: kuErr } = await supabase.rpc('count_ku_by_type'); // We might not have this RPC, let's use a simpler way if not

        // Simpler way if RPC not exists
        const types = ['radical', 'kanji', 'vocabulary', 'grammar'];
        console.log("\n📊 KU Counts:");
        for (const t of types) {
            const { count } = await supabase.from('knowledge_units').select('*', { count: 'exact', head: true }).eq('type', t);
            console.log(`- ${t}: ${count}`);
        }

        // 2. Sentence Counts
        console.log("\n📊 Sentence Counts:");
        const sourceTypes = ['wanikani', 'bunpro', 'youtube', 'mined'];
        for (const st of sourceTypes) {
            const { count } = await supabase.from('sentences').select('*', { count: 'exact', head: true }).eq('source_type', st);
            console.log(`- ${st}: ${count}`);
        }

        // 3. Grammar with Cloze
        const { count: grammarWithCloze } = await supabase.from('ku_to_sentence').select('*', { count: 'exact', head: true }).not('cloze_positions', 'is', null);
        console.log(`\n📊 Grammar with Cloze (ku_to_sentence): ${grammarWithCloze}`);

        // 4. Check for Grammar without sentences
        // This is harder via simple API, but we can verify some grammar KUs
        const { data: grammars } = await supabase.from('knowledge_units').select('id, slug').eq('type', 'grammar').limit(10);
        if (grammars) {
            console.log("\n🧪 Random Grammar Verification (Sentence Check):");
            for (const g of grammars) {
                const { count: sCount } = await supabase.from('ku_to_sentence').select('*', { count: 'exact', head: true }).eq('ku_id', g.id);
                console.log(`- Grammar [${g.slug}]: ${sCount} sentences linked.`);
            }
        }

    } catch (err) {
        console.error("❌ Verification failed:", err);
    }
}

verify();
