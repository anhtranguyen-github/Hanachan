
/**
 * Business rules for triggering study support actions from chat.
 */

export interface StudyRecommendation {
    action: 'START_LESSON' | 'START_REVIEW' | 'REFINE_SENTENCE';
    reason: string;
}

/**
 * Recommends the next study action based on user state.
 */
export function recommendStudyAction(dueCount: number, recentFailures: number): StudyRecommendation {
    if (recentFailures > 5) {
        return {
            action: 'START_REVIEW',
            reason: 'You have several items that need reinforcement. Focus on reviews!'
        };
    }

    if (dueCount > 20) {
        return {
            action: 'START_REVIEW',
            reason: `You have ${dueCount} items due. Let's clear the queue!`
        };
    }

    return {
        action: 'START_LESSON',
        reason: 'You are all caught up! Ready for something new?'
    };
}

/**
 * Logic to decide if a sentence refinement (UC-03.5) is triggered.
 * Rule: Trigger if average token difficulty is high or punctuation is missing.
 */
export function shouldRefine(text: string): boolean {
    // Simple heuristic: missing ending punctuation in long sentences
    if (text.length > 20 && !/[。！？]/.test(text)) return true;
    return false;
}
