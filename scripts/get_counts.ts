
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function getCounts() {
    const types = ['radical', 'kanji', 'vocabulary', 'grammar'];
    const counts: Record<string, number> = {};

    for (const type of types) {
        const { count, error } = await supabase
            .from('knowledge_units')
            .select('*', { count: 'exact', head: true })
            .eq('type', type);

        if (error) {
            console.error(`Error fetching count for ${type}:`, error);
            counts[type] = 0;
        } else {
            counts[type] = count || 0;
        }
    }

    console.log('--- Database Counts ---');
    console.log(JSON.stringify(counts, null, 2));
}

getCounts().catch(console.error);
