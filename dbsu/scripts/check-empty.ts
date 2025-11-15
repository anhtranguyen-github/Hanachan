
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function checkEmpty() {
    const tables = ['knowledge_units', 'sentences', 'ku_to_sentence', 'ku_vocabulary', 'ku_grammar'];
    console.log("🔍 Deep Table Check:");
    for (const t of tables) {
        const { count, error } = await supabase.from(t).select('*', { count: 'exact', head: true });
        if (error) {
            console.error(`❌ Error checking ${t}:`, error.message);
        } else {
            console.log(`- Table [${t}]: ${count} rows.`);
        }
    }
}

checkEmpty();
