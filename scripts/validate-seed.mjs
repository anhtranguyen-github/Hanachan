
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

async function validate() {
    console.log('🧪 --- SEED VALIDATION ---');

    const types = ['radical', 'kanji', 'vocabulary', 'grammar'];
    const tables = {
        radical: 'ku_radicals',
        kanji: 'ku_kanji',
        vocabulary: 'ku_vocabulary',
        grammar: 'ku_grammar'
    };

    for (const type of types) {
        // Count in knowledge_units
        const { count: mainCount } = await supabase
            .from('knowledge_units')
            .select('*', { count: 'exact', head: true })
            .eq('type', type);

        // Count in specific table
        const { count: specCount } = await supabase
            .from(tables[type])
            .select('*', { count: 'exact', head: true });

        console.log(`\n🔹 TYPE: ${type.toUpperCase()}`);
        console.log(`   - knowledge_units: ${mainCount} records`);
        console.log(`   - ${tables[type].padEnd(15)}: ${specCount} records`);

        if (mainCount === specCount) {
            console.log('   ✅ Match!');
        } else {
            console.log('   ⚠️ Alert: Counts do not match!');
        }
    }

    // Check a random sample with its details
    console.log('\n🔍 --- Sample Deep Trace (Vocabulary) ---');
    const { data: sample } = await supabase
        .from('knowledge_units')
        .select(`
            slug, 
            type, 
            character,
            ku_vocabulary (
                reading_primary,
                meaning_data
            )
        `)
        .eq('type', 'vocabulary')
        .limit(1)
        .single();

    if (sample) {
        console.log(`   Slug: ${sample.slug}`);
        console.log(`   Char: ${sample.character}`);
        console.log(`   Detail: ${JSON.stringify(sample.ku_vocabulary)}`);
    }

    console.log('\n🏁 --- VALIDATION FINISHED ---');
}

validate().catch(console.error);
