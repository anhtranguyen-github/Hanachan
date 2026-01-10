
/**
 * Business rules for sentence mining (linking sentences to Knowledge Units).
 */

export interface MiningContext {
    sentenceId: string;
    text: string;
}

/**
 * Validates if a sentence is a suitable candidate for mining a specific KU.
 * Rule: Sentence must contain the KU character/title.
 */
export function canMineKU(kuChar: string, context: MiningContext): boolean {
    return context.text.includes(kuChar);
}

/**
 * Determines weighting for sentence selection.
 * Rule: Shorter sentences are generally better for learning (Cognitive Load).
 */
export function calculateSentenceWeight(text: string): number {
    const length = text.length;
    if (length < 5) return 0.5; // Too short/fragment
    if (length > 40) return 0.2; // Too long/distracting
    return 1.0; // Optimal
}
