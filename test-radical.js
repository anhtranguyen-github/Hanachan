const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function test() {
    console.log("Checking thread radical...");
    const { data: rad } = await supabase.from('knowledge_units').select('slug, metadata').eq('slug', 'wk-radical-thread').single();
    if (!rad) return console.log("Radical not found");
    const arr = rad.metadata.amalgamation_subject_ids;
    console.log("Amalgamation Subject IDs:", arr);
    
    // query related
    if (arr && arr.length) {
        const { data: related } = await supabase.from('knowledge_units').select('slug, character').in('metadata->wk_id', arr);
        console.log("Found in Kanji:", related.length);
    }
}

test();
