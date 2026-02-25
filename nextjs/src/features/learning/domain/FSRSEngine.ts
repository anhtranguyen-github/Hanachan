
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

    static calculateNextReview(current: SRSState, rating: Rating): NextReviewData {
        let { stage, stability, difficulty, reps, lapses } = current;

        // Initialize defaults if missing
        if (!difficulty) difficulty = this.DEFAULT_DIFFICULTY;
        if (stability === undefined || stability === 0) stability = 0.1;
        if (reps === undefined) reps = 0;
        if (lapses === undefined) lapses = 0;

        // Handle Failure
        if (rating === 'again') {
            reps = 0;
            lapses++;
            // Penalty: Stability reduces significantly
            stability = Math.max(0.1, stability * 0.5);
            stage = SRS_STAGES.LEARNING;
        }
        // Handle Success
        else {
            reps++;

            // Mapping 'pass' to the standard growth factor (1.5x)
            const factor = 1.5;

            // Apply growth based on difficulty baseline (3.0)
            const difficultyAdjustment = (difficulty / 3.0);

            // Fixed early intervals for low reps (foundation building)
            // Note: Spec says initial state is reps=1. 
            // 1st Review Success: reps becomes 2 -> 4 hours (0.166d)
            // 2nd Review Success: reps becomes 3 -> 8 hours (0.333d)
            // 3rd Review Success: reps becomes 4 -> 1 day
            // 4th Review Success: reps becomes 5 -> 3 days
            if (reps === 2) {
                stability = 0.166; // ~4 hours
            } else if (reps === 3) {
                stability = 0.333; // ~8 hours
            } else if (reps === 4) {
                stability = 1.0;   // 1 day
            } else if (reps === 5) {
                stability = 3.0;   // 3 days
            } else {
                // Dynamic growth for higher reps
                stability = stability * factor * difficultyAdjustment;
            }

            // Determine Stage based on Stability Thresholds
            if (stability >= this.BURNED_THRESHOLD_DAYS) {
                stage = SRS_STAGES.BURNED;
            } else if (stability >= this.REVIEW_THRESHOLD_DAYS) {
                stage = SRS_STAGES.REVIEW;
            } else {
                stage = SRS_STAGES.LEARNING;
            }
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
export const calculateNextReview = (current: SRSState, rating: Rating) =>
    FSRSEngine.calculateNextReview(current, rating);
