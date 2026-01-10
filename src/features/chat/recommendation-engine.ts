
import { KnowledgeUnit } from '../knowledge/types';

/**
 * Business rules for AI learning recommendations.
 */

export interface SRSStateSnapshot {
    kuId: string;
    lapses: number;
    difficulty: number;
    state: string;
}

/**
 * Identifies "Trouble Items" that the AI should focus on during conversation.
 * Rule: High lapses (>3) or high difficulty (>7).
 */
export function identifyTroubleItems(states: SRSStateSnapshot[]): string[] {
    return states
        .filter(s => s.lapses > 3 || s.difficulty > 7)
        .map(s => s.kuId);
}

/**
 * Recommends topics based on user progress.
 */
export function recommendTopics(currentLevel: number, masteredCount: number): string[] {
    if (masteredCount > 20) return [`Level ${currentLevel + 1} Introduction`];
    return ['Basic Conversation', 'Recent Vocabulary Review'];
}
