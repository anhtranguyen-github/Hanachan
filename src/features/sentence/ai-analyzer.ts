
import { openai } from '@/services/ai/openai-client';
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { z } from "zod";

// 1. Định nghĩa "Khuôn mẫu" bằng Zod
const AnalysisSchema = z.object({
    translation: z.string().describe("Natural English translation"),
    explanation: z.string().describe("Brief explanation of sentence structure"),
    grammar_points: z.array(z.object({
        title: z.string(),
        meaning: z.string(),
        slug: z.string().optional()
    })),
    learning_recommendations: z.array(z.string()),
    cloze_positions: z.array(z.number()).describe("Indices of characters to hide")
});

const RefineSchema = z.object({
    suggestion: z.string(),
    explanation: z.string(),
    is_correct: z.boolean()
});

export type AIAnalysisResult = z.infer<typeof AnalysisSchema>;

export class AISentenceAnalyzer {
    async analyze(text: string): Promise<AIAnalysisResult> {
        // 2. "Khóa cứng" Output bằng .withStructuredOutput
        const structuredLlm = openai.withStructuredOutput(AnalysisSchema);

        const systemPrompt = `You are Hana-chan, a Japanese language expert. 
        Analyze the provided Japanese sentence and return detailed linguistic insights.`;

        try {
            return await structuredLlm.invoke([
                new SystemMessage(systemPrompt),
                new HumanMessage(text)
            ]) as AIAnalysisResult;
        } catch (error) {
            console.error('Structured AI Analysis failed:', error);
            throw new Error('AI Analysis failed to provide structured data.');
        }
    }

    async refine(text: string) {
        const structuredLlm = openai.withStructuredOutput(RefineSchema);

        const systemPrompt = `Analyze this Japanese sentence for mistakes. 
        If there are errors, suggest a "Golden Sentence" (more natural or correct).`;

        try {
            return await structuredLlm.invoke([
                new SystemMessage(systemPrompt),
                new HumanMessage(text)
            ]);
        } catch (error) {
            return { suggestion: text, explanation: "Could not analyze", is_correct: true };
        }
    }
}

export const aiSentenceAnalyzer = new AISentenceAnalyzer();
