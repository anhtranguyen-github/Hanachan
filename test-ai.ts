import { aiSentenceAnalyzer } from './src/features/sentence/ai-analyzer';

async function testAI() {
    console.log("Testing AI Analysis with the new key...");
    const text = "私は日本語を勉強しています。";
    try {
        const result = await aiSentenceAnalyzer.analyze(text);
        console.log("Result:", JSON.stringify(result, null, 2));

        console.log("\nTesting Refinement...");
        const refined = await aiSentenceAnalyzer.refine(text);
        console.log("Refined:", refined);

        console.log("\nTest Success!");
    } catch (e) {
        console.error("Test Failed!", e);
    }
}

testAI();
