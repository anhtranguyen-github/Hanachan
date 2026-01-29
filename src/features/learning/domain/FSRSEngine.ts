
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
        if (stability === undefined || stability === 0) stability = 0.1; // ~144 minutes (2.4h)
        if (reps === undefined) reps = 0;
        if (lapses === undefined) lapses = 0;

        // Handle Failure
        if (rating === 'fail') {
            // Smart Reset: Instead of 0, keep some momentum if it was advanced
            reps = Math.max(1, reps - 2);
            lapses++;

            // Penalty: Stability reduces significantly but stays above a minimum
            // Business Rule: Review fail uses relearning logic (0.3 - 0.5 * S)
            stability = Math.max(0.1, stability * 0.4);

            // Move back to learning/relearning stage
            stage = SRS_STAGES.LEARNING;
        }
        // Handle Success
        else {
            const previousStability = stability;
            reps++;

            // Map binary pass to the 'Good' growth factor (1.5x)
            const factor = 1.5;
            const difficultyAdjustment = (difficulty / 3.0);

            // Foundation Building (Fixed early intervals)
            // Only apply if we are actually at the very beginning (reps 2-5)
            // and NOT relearning from a high stability item
            if (reps === 2 && stability < 0.166) {
                stability = 0.166; // ~4 hours
            } else if (reps === 3 && stability < 0.333) {
                stability = 0.333; // ~8 hours
            } else if (reps === 4 && stability < 1.0) {
                stability = 1.0;   // 1 day
            } else if (reps === 5 && stability < 3.0) {
                stability = 3.0;   // 3 days
            } else {
                // Dynamic growth for higher intervals
                stability = stability * factor * difficultyAdjustment;
            }

            // Stability Guard: Never schedule a SUCCESS for sooner than the 
            // current stability state (prevents huge jumps backwards in time)
            stability = Math.max(stability, previousStability);

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
