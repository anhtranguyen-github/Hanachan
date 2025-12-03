
import { OpenAI } from "openai";
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export class RefinementService {

    /**
     * AI Refinement (High Creativity).
     * Returns "Golden Sentence" variations.
     */
    async refineSentence(originalText: string) {
        console.log(`✨ Refining: "${originalText}"...`);

        const prompt = `
You are a strict Japanese Language Editor.
Analyze the following sentence.
1. Correct any grammar mistakes.
2. Improve naturalness (native-like phrasing).
3. If it is already perfect, output it as is.

Input: "${originalText}"

Output JSON format:
{
  "is_perfect": boolean,
  "corrected": "string",
  "explanation": "string (why you changed it)",
  "golden_variation": "string (a version optimized for learners, clear and standard)"
}
`;

        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [{ role: "system", content: prompt }],
            response_format: { type: "json_object" }
        });

        const result = JSON.parse(response.choices[0].message.content || "{}");
        return result;
    }
}

export const refinementService = new RefinementService();
