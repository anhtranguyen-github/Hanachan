
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
    console.log("🚀 Testing Supabase Connection and Data Fetching (Clean Script)...");

    try {
        // Test fetching a Kanji (九 - Nine)
        const { data: kanji, error: kError } = await supabase
            .from('knowledge_units')
            .select('*, details:kanji_details(*)')
            .eq('slug', 'kanji_九')
            .single();

        if (kError) throw kError;
        console.log("✅ Successfully fetched Kanji: 九");
        console.log("   Meaning:", kanji.meaning);
        console.log("   Onyomi:", kanji.details?.onyomi);

        // Test fetching Vocabulary (大人 - Adult)
        const { data: vocab, error: vError } = await supabase
            .from('knowledge_units')
            .select('*, details:vocabulary_details(*)')
            .eq('slug', 'vocab_大人')
            .single();

        if (vError) throw vError;
        console.log("✅ Successfully fetched Vocabulary: 大人");
        console.log("   Meaning:", vocab.meaning);
        console.log("   Reading:", vocab.details?.reading);

    } catch (error) {
        console.error("❌ Error during verification:", error);
    }
}

testConnection();
