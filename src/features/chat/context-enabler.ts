
import { SRSStateSnapshot } from './recommendation-engine';
import { ChatMessage, pruneHistory } from './context-manager';

/**
 * Business rules for enriching chat context with learning metadata.
 */

export interface LearningContext {
    currentLevel: number;
    troubleItems: string[]; // KU IDs
    dueCount: number;
    recentMistakes: string[]; // Recent session failures
}

export interface EnrichedContext {
    messages: ChatMessage[];
    learning: LearningContext;
    systemPrompt: string;
}

/**
 * Merges raw history with learning states to create a "System Mental Model" for the AI.
 */
export function buildEnrichedContext(
    history: ChatMessage[],
    learning: LearningContext
): EnrichedContext {
    const pruned = pruneHistory(history, 10);

    // Core logic: inject learning awareness into the bot's "personality"
    const systemPrompt = `You are Hana-chan, a friendly Japanese tutor.
User current level: ${learning.currentLevel}.
User has ${learning.dueCount} items due for review.
Struggle areas (focus on these): ${learning.troubleItems.join(', ')}.
Be encouraging and link concepts to these items when possible.`;

    return {
        messages: pruned,
        learning,
        systemPrompt
    };
}
