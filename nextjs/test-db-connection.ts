
import { curriculumRepository } from './src/features/knowledge/db';

async function testConnection() {
    console.log("🚀 Testing Supabase Connection and Data Fetching...");

    try {
        // Test fetching a Kanji (九 - Nine)
        const kanji = await curriculumRepository.getBySlug('kanji_九', 'kanji');
        if (kanji) {
            console.log("✅ Successfully fetched Kanji: 九");
            console.log("   Meaning:", kanji.meaning);
            console.log("   Onyomi:", kanji.details?.onyomi);
            console.log("   Radicals count:", kanji.radicals?.length);
        } else {
            console.log("❌ Failed to fetch Kanji: 九");
        }

        // Test fetching Vocabulary (大人 - Adult)
        const vocab = await curriculumRepository.getBySlug('vocab_大人', 'vocabulary');
        if (vocab) {
            console.log("✅ Successfully fetched Vocabulary: 大人");
            console.log("   Meaning:", vocab.meaning);
            console.log("   Reading:", vocab.details?.reading);
            console.log("   Kanji count:", vocab.kanji?.length);
        } else {
            console.log("❌ Failed to fetch Vocabulary: 大人");
        }

        // Test fetching Grammar (たら - Conditional)
        const grammar = await curriculumRepository.getBySlug('grammar_tara', 'grammar');
        if (grammar) {
            console.log("✅ Successfully fetched Grammar: たら");
            console.log("   Meaning:", grammar.meaning);
            console.log("   Relations count:", grammar.related_grammar?.length);
        } else {
            console.log("❌ Failed to fetch Grammar: たら");
        }

    } catch (error) {
        console.error("❌ Error during verification:", error);
    }
}

testConnection();
