
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function countEverything() {
    console.log('📊 --- Supabase Detailed Content Count ---');

    const types = ['radical', 'kanji', 'vocabulary', 'grammar'];

    for (const type of types) {
        const { count, error } = await supabase
            .from('knowledge_units')
            .select('*', { count: 'exact', head: true })
            .eq('type', type);

        if (error) {
            console.error(`❌ Error counting ${type}:`, error.message);
        } else {
            console.log(`✅ ${type.padEnd(12)} : ${count} records`);
        }
    }

    const { count: sCount } = await supabase
        .from('sentences')
        .select('*', { count: 'exact', head: true });

    console.log(`✅ ${'sentences'.padEnd(12)} : ${sCount} records`);
    console.log('------------------------------------------');
}

countEverything();
