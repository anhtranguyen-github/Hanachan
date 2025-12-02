
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // Dùng Service Role để bypass RLS khi test
);

async function checkData() {
    console.log('--- Database Integrity Check ---');

    // 1. Check Knowledge Units
    const { count: kuCount, data: kus } = await supabase
        .from('knowledge_units')
        .select('slug, type, character', { count: 'exact' })
        .limit(3);

    console.log(`✅ Knowledge Units: ${kuCount} records found.`);
    if (kus && kus.length > 0) {
        console.log('Sample KUs (Slug | Type | Char):');
        kus.forEach(k => console.log(` - ${k.slug} | ${k.type} | ${k.character}`));
    }

    // 2. Check Sentences
    const { count: sCount, data: sentences } = await supabase
        .from('sentences')
        .select('text_ja, is_verified', { count: 'exact' })
        .limit(3);

    console.log(`✅ Sentences: ${sCount} records found.`);
    if (sentences && sentences.length > 0) {
        console.log('Sample Sentences:');
        sentences.forEach(s => console.log(` - ${s.text_ja.substring(0, 30)}... (Verified: ${s.is_verified})`));
    }
}

checkData();
