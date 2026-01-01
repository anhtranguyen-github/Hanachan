
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkJlptMapping() {
    console.log('--- Level mapping check ---');
    for (let l = 1; l <= 5; l++) {
        const { data: kus } = await supabase
            .from('knowledge_units')
            .select('slug, type, character, level')
            .eq('level', l)
            .limit(5);

        console.log(`\nLEVEL ${l} Sample:`);
        kus?.forEach(k => {
            console.log(` - [${k.type}] ${k.slug} | ${k.character}`);
        });
    }

    const { data: grammarN5 } = await supabase
        .from('ku_grammar')
        .select('title, metadata')
        .limit(10);
    console.log('\n--- Grammar Sample ---');
    grammarN5?.forEach(g => console.log(` - ${g.title} (Meta: ${JSON.stringify(g.metadata)})`));
}
checkJlptMapping();
