const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function test() {
    const { data: kanji } = await supabase.from('knowledge_units').select('metadata').eq('slug', 'wk-kanji-級').single();
    if (!kanji) return console.log("Kanji not found");
    const arr = kanji.metadata.component_subject_ids;
    console.log("Component Subject IDs:", arr);
    
    // query related
    const { data: related } = await supabase.from('knowledge_units').select('slug, character').in('metadata->wk_id', arr);
    console.log("Related:", related);
}

test();
