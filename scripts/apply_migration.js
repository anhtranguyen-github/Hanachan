
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });
require('dotenv').config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
    const migrationPath = path.resolve(__dirname, '../supabase/migrations/20260303_fix_chat_sessions_metadata.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('Applying migration...');
    // We try to call an RPC called 'exec_sql' if it exists
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
        console.error('Error applying migration via RPC:', error);
        console.log('\n--- MANUAL SQL ---');
        console.log(sql);
        console.log('--- END MANUAL SQL ---');
        console.log('\nPlease run the SQL above manually in Supabase SQL Editor if RPC fails.');
    } else {
        console.log('Migration applied successfully:', data);
    }
}

runMigration().catch(console.error);
