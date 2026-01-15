import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { JsonOutputParser } from "@langchain/core/output_parsers";
import { MOCK_ANALYSIS_RESULT } from "@/lib/mock-db/seeds";


const llm = new ChatOpenAI({
    modelName: "gpt-4o",
    temperature: 0.2,
});

export interface AIGrammarPoint {
    title: string;
    meaning: string;
    explanation: string;
    selector: string; // The part of the sentence matching this point
}

export interface AIAnalysisResult {
    translation: string;
    grammar_points: AIGrammarPoint[];
    recommendations: string[];
    cloze_suggestion: {
        text: string;
        cloze_index: number;
    };
}

export const aiSentenceAnalyzer = {
    analyze: async (text: string): Promise<AIAnalysisResult> => {
        const prompt = ChatPromptTemplate.fromMessages([
            ["system", `You are a Japanese Language Tutor. Analyze the provided sentence and return a JSON object.
            Focus on deconstructing grammar and identifying the best parts for a learner to focus on.
            
            Return format:
            {{
                "translation": "English translation",
                "grammar_points": [
                  {{ "title": "JLPT Level/Name", "meaning": "English meaning", "explanation": "Brief usage note", "selector": "exact string match in sentence" }}
                ],
                "recommendations": ["word1", "word2"],
                "cloze_suggestion": {{
                    "text": "Sentence with [...] for the most important part",
                    "cloze_index": 0
                }}
            }}`],
            ["human", "{input}"]
        ]);

        const parser = new JsonOutputParser<AIAnalysisResult>();
        const chain = prompt.pipe(llm).pipe(parser);

        try {
            const result = await chain.invoke({ input: text });
            return result;
        } catch (e) {
            console.error("AI Analysis failed, using mocks", e);
            return {
                translation: MOCK_ANALYSIS_RESULT.translation,
                grammar_points: MOCK_ANALYSIS_RESULT.grammar_points,
                recommendations: [],
                cloze_suggestion: {
                    text: MOCK_ANALYSIS_RESULT.cloze_suggestion.text,
                    cloze_index: 0
                }
            };
        }
    },
    refine: async (text: string): Promise<string> => {
        const prompt = ChatPromptTemplate.fromMessages([
            ["system", "You are a Japanese native speaker. Refine the following sentence to be more natural OR confirm it is a 'Golden Sentence'. Return only the refined sentence or the original if it is perfect."],
            ["human", "{input}"]
        ]);

        const response = await llm.invoke(await prompt.format({ input: text }));
        return response.content as string;
    }
};
