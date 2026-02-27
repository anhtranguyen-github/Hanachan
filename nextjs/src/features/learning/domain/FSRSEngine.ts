
import { addDays, addMinutes, addHours } from 'date-fns';
import { SRSStateSchema, RatingSchema } from '@/lib/validation';
import { z } from 'zod';
import { HanaTime } from '@/lib/time';

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

        // 1. FIF: Failure Intensity Framework
        // Instead of binary "Again", we use the wrongCount to determine the impact.
        // failIntensity = log2(wrongCount + 1). 
        // Example: 0 wrong = 0 intensity, 1 wrong = 1 intensity, 3 wrong = 2 intensity.
        const failureIntensity = Math.min(Math.log2(wrongCount + 1), 4.0);

        console.log(`[FSRS-FIF] Current Stage: ${stage}, Rating: ${rating}, Wrongs: ${wrongCount}, Intensity: ${failureIntensity.toFixed(2)}`);

        // Initialize defaults if missing
        if (difficulty === undefined || difficulty === 0) difficulty = this.DEFAULT_DIFFICULTY;
        if (stability === undefined || stability === 0) stability = 0.1;
        if (reps === undefined) reps = 0;
        if (lapses === undefined) lapses = 0;

        // 2. State Transition Logic

        // CASE A: Hard Reset (Manual 'again' or pure failure)
        if (rating === 'again') {
            reps = 0;
            lapses++;
            // Strict 50% penalty for a total blank out
            stability = Math.max(0.1, stability * 0.5);
            stage = SRS_STAGES.LEARNING;
        }

        // CASE B: Struggle (Has Wrongs) - The "Drill Integration" logic chốt sổ
        else if (wrongCount > 0) {
            reps++;
            // Sensitivity alpha determines how much difficulty increases per failure intensity
            const alpha = 0.2;
            difficulty = Math.min(5.0, difficulty + (alpha * failureIntensity));

            // Decay factor beta determines stability drop. Formula: S = S * exp(-beta * Intensity)
            const beta = 0.3;
            const decay = Math.exp(-beta * failureIntensity);
            stability = Math.max(0.1, stability * decay);

            // If intensity is high enough, we treat it as a lapse (reset progress slightly)
            if (failureIntensity > 0.8) {
                lapses++;
                stage = SRS_STAGES.LEARNING;
                // Don't reset reps completely, but penalize growth
                reps = Math.max(1, Math.floor(reps * 0.5));
            } else {
                stage = SRS_STAGES.REVIEW;
            }
        }

        // CASE C: Pure Success (rating === 'pass' and wrongCount === 0)
        else {
            reps++;
            const factor = 1.65; // Success multiplier
            difficulty = Math.max(1.3, difficulty - 0.1);

            // Guard: Initial stability steps for new items
            if (reps === 1 && stability < 0.166) stability = 0.166; // 4h
            else if (reps === 2 && stability < 0.333) stability = 0.333; // 8h
            else if (reps === 3 && stability < 1.0) stability = 1.0; // 1d
            else if (reps === 4 && stability < 3.0) stability = 3.0; // 3d
            else {
                // FSRS growth core
                stability = stability * factor * (1.0 + (5.0 - difficulty) * 0.1);
            }

            // Ensure stability never drops on pure success
            stability = Math.max(stability, current.stability || 0);

            // Determine stage based on thresholds
            if (stability >= this.BURNED_THRESHOLD_DAYS) stage = SRS_STAGES.BURNED;
            else if (stability >= this.REVIEW_THRESHOLD_DAYS) stage = SRS_STAGES.REVIEW;
            else stage = SRS_STAGES.LEARNING;
        }

        // 3. Final Scheduling
        // Stability is in days. Convert to next_review date.
        const intervalMinutes = Math.max(1, Math.round(stability * 1440));
        const next_review = addMinutes(HanaTime.getNow(), intervalMinutes);

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
