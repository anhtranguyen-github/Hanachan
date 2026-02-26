
import { addDays, addMinutes, addHours } from 'date-fns';
import { SRSStateSchema, RatingSchema } from '@/lib/validation';
import { z } from 'zod';

export type SRSState = z.infer<typeof SRSStateSchema>;
export type Rating = z.infer<typeof RatingSchema>;

export const SRS_STAGES = {
    NEW: 'new',
    LEARNING: 'learning',
    REVIEW: 'review',
    BURNED: 'burned'
} as const;

export interface NextReviewData {
    next_review: Date;
    next_state: SRSState;
}

/**
 * FSRS (Free Spaced Repetition Scheduler) simplified implementation
 * Based on the project specification in FSRS_LOGIC.md
 */
export class FSRSEngine {
    static DEFAULT_DIFFICULTY = 3.0;
    static BURNED_THRESHOLD_DAYS = 120;
    static REVIEW_THRESHOLD_DAYS = 3;

    static calculateNextReview(current: SRSState, rating: Rating, wrongCount: number = 0): NextReviewData {
        let { stage, stability, difficulty, reps, lapses } = current;

        // FIF: Failure Intensity Framework
        // Instead of binary "Again", we use the wrongCount to determine the impact.
        // If rating is 'again' but wrongCount is 0 (direct API call), treat it as intensity 1.0.
        const failureIntensity = (rating === 'again' && wrongCount === 0)
            ? 1.0
            : Math.min(Math.log2(wrongCount + 1), 3.0);

        console.log(`[FSRS-FIF] Rating=${rating}, Wrong=${wrongCount}, Intensity=${failureIntensity.toFixed(2)}`);

        // Initialize defaults if missing
        if (!difficulty) difficulty = this.DEFAULT_DIFFICULTY;
        if (stability === undefined || stability === 0) stability = 0.1;
        if (reps === undefined) reps = 0;
        if (lapses === undefined) lapses = 0;

        // Handle Failure
        if (rating === 'again') {
            reps = 0;
            lapses++;
            stability = Math.max(0.1, stability * 0.5);
            stage = SRS_STAGES.LEARNING;
        } else if (wrongCount > 0) {
            // Case 2: Struggle (Has Wrongs) - "Drill Integration"
            // This is called when user FINALLY gets it right, but had wrongs before
            reps++;
            const alpha = 0.2; // Sensitivity
            difficulty = Math.min(5.0, difficulty + (alpha * failureIntensity));

            const beta = 0.3; // Decay factor
            const decay = Math.exp(-beta * failureIntensity);
            stability = Math.max(0.1, stability * decay);

            if (failureIntensity > 0.5) {
                reps = Math.max(1, reps - 1);
                lapses++;
                stage = SRS_STAGES.LEARNING;
            } else {
                stage = SRS_STAGES.REVIEW;
            }
        } else {
            // Pure Success (rating !== 'again' and wrongCount === 0)
            reps++;
            const factor = 1.5;
            difficulty = Math.max(1.3, difficulty - 0.1);

            if (reps === 1 && stability < 0.166) stability = 0.166;
            else if (reps === 2 && stability < 0.333) stability = 0.333;
            else if (reps === 3 && stability < 1.0) stability = 1.0;
            else if (reps === 4 && stability < 3.0) stability = 3.0;
            else stability = stability * factor * (1.0 + (5.0 - difficulty) * 0.1);

            stability = Math.max(stability, current.stability || 0);

            if (stability >= this.BURNED_THRESHOLD_DAYS) stage = SRS_STAGES.BURNED;
            else if (stability >= this.REVIEW_THRESHOLD_DAYS) stage = SRS_STAGES.REVIEW;
            else stage = SRS_STAGES.LEARNING;
        }

        // Calculate timestamp
        // Stability is in days
        const intervalMinutes = Math.max(1, Math.round(stability * 1440));
        const next_review = addMinutes(new Date(), intervalMinutes);

        return {
            next_review,
            next_state: {
                stage,
                stability: Number(stability.toFixed(4)),
                difficulty,
                reps,
                lapses
            }
        };
    }
}

// For backward compatibility if needed, but we should migrate to the Class
export const calculateNextReview = (current: SRSState, rating: Rating, wrongCount: number = 0) =>
    FSRSEngine.calculateNextReview(current, rating, wrongCount);
