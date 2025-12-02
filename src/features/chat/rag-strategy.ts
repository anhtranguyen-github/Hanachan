
import { KnowledgeUnit } from '../knowledge/types';

/**
 * Business rules for augmenting LLM prompts with RAG data.
 */

/**
 * Formats retrieved Knowledge Units into a context block for the LLM.
 * Rule: Keep it concise, use bullet points.
 */
export function formatRAGContext(kus: KnowledgeUnit[]): string {
    if (kus.length === 0) return "No specific knowledge units related to this query found.";

    const lines = kus.map(ku => {
        return `- ${ku.character} (${ku.meaning}): Type ${ku.type}, Level ${ku.level}`;
    });

    return `Relevant Knowledge Units:\n${lines.join('\n')}`;
}

/**
 * Validates if RAG results are "dense" enough to be used.
 * Rule: At least 1 result with score > 0.7.
 */
export function shouldAugment(scores: number[]): boolean {
    return scores.some(s => s > 0.7);
}
