
import { SRSStateSnapshot } from './recommendation-engine';

/**
 * Business rules for generating interactive practice in chat.
 */

export interface PracticePrompt {
    type: 'TRANSLATION' | 'CLOZE' | 'CONVERSATION';
    targetKUId?: string;
    prompt: string;
}

/**
 * Generates a practice prompt based on a "Trouble Item".
 */
export function generatePractice(troubleItem: SRSStateSnapshot, surface: string): PracticePrompt {
    if (troubleItem.lapses > 2) {
        return {
            type: 'TRANSLATION',
            targetKUId: troubleItem.kuId,
            prompt: `I noticed you're struggling with "${surface}". Can you try using it in a simple sentence?`
        };
    }

    return {
        type: 'CONVERSATION',
        targetKUId: troubleItem.kuId,
        prompt: `Let's practice! How would you say "I like ${surface}" in Japanese?`
    };
}
