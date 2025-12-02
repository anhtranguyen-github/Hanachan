
/**
 * Business rules for AI-driven sentence refinement (UC-03.5).
 */

export interface RefinementScore {
    naturalness: number; // 0-100
    grammarCorrectness: number; // 0-100
    overall: number;
}

export interface RefinementAssessment {
    score: RefinementScore;
    isGolden: boolean; // Perfect sentence for learning
    suggestions: string[];
}

/**
 * Calculates a refinement score based on AI assessment parameters.
 * Rule: Weighted average favoring correctness.
 */
export function calculateRefinementScore(naturalness: number, correctness: number): RefinementScore {
    const overall = (correctness * 0.7) + (naturalness * 0.3);
    return {
        naturalness,
        grammarCorrectness: correctness,
        overall: Math.round(overall)
    };
}

/**
 * Rules to determine if a sentence is "Golden" (Optimal for SRS).
 * Criteria: 
 * 1. Score >= 90
 * 2. Length between 10 and 25 characters
 * 3. Contains exactly 1 target grammar point (i+1 principle)
 */
export function isGoldenSentence(
    score: number,
    characterCount: number,
    grammarCount: number
): boolean {
    return (
        score >= 90 &&
        characterCount >= 10 &&
        characterCount <= 25 &&
        grammarCount === 1
    );
}

/**
 * Business rule for "Minimal Change" heuristic.
 * Suggest improvements only if the current score is below 80.
 */
export function needsImprovement(score: number): boolean {
    return score < 80;
}
