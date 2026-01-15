
import { addDays, addMinutes } from 'date-fns';

import { SRSStateSchema, RatingSchema } from '@/lib/validation';
import { z } from 'zod';

export type SRSState = z.infer<typeof SRSStateSchema>;

export const SRS_STAGES = {
    NEW: 'new',
    LEARNING: 'learning',
    REVIEW: 'review',
    BURNED: 'burned'
} as const;

export type Rating = z.infer<typeof RatingSchema>;

/**
 * A simplified SM-2 Algorithm modified for WaniKani-style levels
 */
export function calculateNextReview(current: SRSState, rating: Rating): { next_review: Date, next_state: SRSState } {
    let { interval, ease_factor, streak, stage } = current;

    // Defaults
    if (!ease_factor) ease_factor = 2.5;
    if (streak === undefined) streak = 0;

    // Logic
    if (rating === 'again') {
        streak = 0;
        interval = 1 / 1440; // 1 minute (essentially immediate)
        stage = SRS_STAGES.LEARNING;
    } else if (rating === 'hard') {
        streak = Math.max(0, streak - 1);
        interval = Math.max(0.5, interval * 0.5); // reduced interval
        ease_factor = Math.max(1.3, ease_factor - 0.2);
    } else if (rating === 'good') {
        streak += 1;
        if (streak === 1) interval = 4 / 24; // 4 hours
        else if (streak === 2) interval = 8 / 24; // 8 hours
        else if (streak === 3) interval = 1; // 1 day
        else if (streak === 4) interval = 3; // 3 days
        else if (streak === 5) interval = 7; // 1 week
        else if (streak === 6) interval = 14; // 2 weeks
        else interval = interval * ease_factor;

        // Stage Progression
        if (streak > 0 && streak < 5) stage = SRS_STAGES.LEARNING;
        else if (streak >= 9) stage = SRS_STAGES.BURNED;
        else stage = SRS_STAGES.REVIEW;

    } else if (rating === 'easy') {
        streak += 1.5; // Bonus
        interval = interval * ease_factor * 1.3;
        if (streak >= 9) stage = SRS_STAGES.BURNED;
        else stage = SRS_STAGES.REVIEW;
        ease_factor += 0.15;
    }

    // Interval Cap (e.g., 20 days max for testing, or standard years)
    // if (interval > 365) interval = 365;

    const next_review = addMinutes(new Date(), interval * 24 * 60);

    return {
        next_review,
        next_state: {
            stage,
            interval,
            ease_factor,
            streak: Math.floor(streak)
        }
    };
}
