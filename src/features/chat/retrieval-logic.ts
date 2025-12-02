
import { KnowledgeUnit } from '../knowledge/types';
import { SRSStateSnapshot } from './recommendation-engine';

/**
 * Business rules for prioritizing search results in RAG.
 */

export interface RetrievalResult {
    ku: KnowledgeUnit;
    score: number; // Semantic similarity score
}

/**
 * Reranks retrieval results based on user's learning state.
 * Rule: Priority = Score + (Learning Weight).
 * Learning Weight:
 * - Trouble items: +0.5
 * - Due items: +0.3
 * - New items: +0.1
 * - Mastered/Burned: +0.0
 */
export function rerankResults(
    results: RetrievalResult[],
    states: Record<string, SRSStateSnapshot>
): RetrievalResult[] {
    return results.map(res => {
        const state = states[res.ku.id];
        let boost = 0;

        if (state) {
            if (state.lapses > 3 || state.difficulty > 7) {
                boost += 0.5;
            } else if (state.state === 'Review' && state.difficulty > 5) {
                boost += 0.3;
            } else if (state.state === 'New') {
                boost += 0.1;
            }
        }

        return {
            ...res,
            score: res.score + boost
        };
    }).sort((a, b) => b.score - a.score);
}
