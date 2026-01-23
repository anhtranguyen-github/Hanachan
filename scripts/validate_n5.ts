
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const supabaseUrl = 'http://127.0.0.1:54421';
const supabaseKey = 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz';
const supabase = createClient(supabaseUrl, supabaseKey);

async function validate() {
    const fileContent = JSON.parse(fs.readFileSync('./n5_urls.json', 'utf8'));
    const slugsInFile = fileContent.map((item: any) => item.slug);

    console.log(`Slugs in file: ${slugsInFile.length}`);

    const { data: dbData, error } = await supabase
        .from('knowledge_units')
        .select('slug')
        .eq('type', 'grammar')
        .in('slug', slugsInFile);

    if (error) {
        console.error('Error fetching from DB:', error);
        return;
    }

    const slugsInDb = dbData.map((item: any) => item.slug);
    console.log(`Slugs in DB: ${slugsInDb.length}`);

    const missing = slugsInFile.filter((slug: string) => !slugsInDb.includes(slug));
    console.log(`Missing slugs: ${missing.length}`);
    if (missing.length > 0) {
        console.log('Missing items:', missing);
    } else {
        console.log('All items from file are present in DB.');
    }

    // Check richness (if ku_grammar has about_description)
    const { data: richData } = await supabase
        .from('knowledge_units')
        .select('slug, ku_grammar(content_blob)')
        .eq('type', 'grammar')
        .in('slug', slugsInFile);

    const poorItems = richData?.filter((item: any) => !item.ku_grammar?.content_blob?.about_description).map((item: any) => item.slug);
    console.log(`Items missing rich content: ${poorItems?.length || 0}`);
}

validate();
