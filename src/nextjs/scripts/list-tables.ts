
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function run() {
    const { data, error } = await supabase.rpc('get_tables'); // This might not exist
    if (error) {
        // Fallback: try querying a common table or use information_schema
        const { data: tables, error: sError } = await supabase.from('pg_tables').select('tablename').eq('schemaname', 'public');
        if (sError) {
            // Try another way: just list what we can find via a raw query if enabled, or just check known tables
            console.log('Error fetching tables:', sError.message);

            const knownTables = ['users', 'knowledge_units', 'videos', 'video_subtitles', 'chat_sessions'];
            for (const t of knownTables) {
                const { error: tError } = await supabase.from(t).select('id').limit(1);
                console.log(`Table '${t}': ${tError ? 'MISSING (' + tError.message + ')' : 'EXISTS'}`);
            }
        } else {
            console.log('Tables:', tables.map(t => t.tablename).join(', '));
        }
    } else {
        console.log('Tables:', data);
    }
}

run();
