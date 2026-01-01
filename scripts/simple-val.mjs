
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function v() {
    const t = ['radical', 'kanji', 'vocabulary', 'grammar'];
    const m = { radical: 'ku_radicals', kanji: 'ku_kanji', vocabulary: 'ku_vocabulary', grammar: 'ku_grammar' };

    for (const x of t) {
        const { count: c1 } = await supabase.from('knowledge_units').select('*', { count: 'exact', head: true }).eq('type', x);
        const { count: c2 } = await supabase.from(m[x]).select('*', { count: 'exact', head: true });
        console.log(`${x.toUpperCase()}: Main=${c1}, Detail=${c2} | Result: ${c1 === c2 ? 'OK' : 'MISMATCH'}`);
    }
}
v();
