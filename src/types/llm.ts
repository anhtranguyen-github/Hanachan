import { z } from "zod";

export const LLMResponseSchema = z.object({
    content: z.string(),
    model: z.string(),
    tokens_in: z.number().int(),
    tokens_out: z.number().int(),
    cost: z.number()
});

export type LLMResponse = z.infer<typeof LLMResponseSchema>;

// Example of a validated LLM analysis output 
export const SentenceAnalysisSchema = z.object({
    translation: z.string(),
    notes: z.string()
});
