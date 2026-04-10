
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
    const migrationPath = path.resolve(process.cwd(), 'supabase/migrations/20260303_fix_chat_sessions_metadata.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('Applying migration...');
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
        // If exec_sql RPC doesn't exist, we might need another way or just assume the column should be added via REST if possible (not possible for ALTER TABLE)
        console.error('Error applying migration via RPC:', error);
        console.log('Falling back to direct SQL execution might not be possible via supabase-js without an RPC.');
        console.log('Please run the SQL manually in Supabase SQL Editor:');
        console.log(sql);
    } else {
        console.log('Migration applied successfully:', data);
    }
}

runMigration().catch(console.error);
