const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function test() {
    console.log('Checking radicals for visually similar...');
    const { data: rads } = await supabase.from('knowledge_units').select('slug, metadata').eq('type', 'radical').limit(500);
    const vis = rads.filter(r => r.metadata.visually_similar_subject_ids && r.metadata.visually_similar_subject_ids.length > 0);
    console.log('Found with Visually Similar:', vis.length);
}

test();
