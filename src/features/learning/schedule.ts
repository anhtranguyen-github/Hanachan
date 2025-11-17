
import { FSRSParameters, FSRSReviewResult, ReviewRating, SRSState } from '../types';

// Default FSRS v4 weights from our system schema
const DEFAULT_WEIGHTS = [
    0.4, 0.6, 2.4, 5.8, 4.9, 0.4, 0.9, 0.0, 1.5, 0.4, 0.7, 0.8, 0.1, 0.3, 1.5, 0.4, 2.4
];

export class FSRS {
    private w: number[];
    private targetRetention: number;

    constructor(weights: number[] = DEFAULT_WEIGHTS, targetRetention: number = 0.9) {
        this.w = weights;
        this.targetRetention = targetRetention;
    }

    calculateNextState(current: FSRSParameters, rating: ReviewRating, reviewDate: Date = new Date()): FSRSReviewResult {
        let nextStability: number;
        let nextDifficulty: number;
        let nextState: SRSState = current.state;

        const isFirstReview = current.reps === 0 || current.state === 'New';

        if (isFirstReview) {
            // Initial Stability based on rating (1-4)
            nextStability = this.w[rating - 1];
            // Initial Difficulty: w[4] - w[5] * (rating - 3)
            nextDifficulty = this.clamp(this.w[4] - this.w[5] * (rating - 3), 1, 10);
            nextState = rating === 1 ? 'Learning' : 'Review';
        } else {
            const r = this.calculateRetrievability(current, reviewDate);

            if (rating === 1) { // Again (Failure)
                nextState = 'Relearning';
                // Failure Stability: w[11] * D^w[12] * (S+1)^w[13] * exp(w[14] * (1-R))
                nextStability = this.w[11] *
                    Math.pow(current.difficulty, -this.w[12]) *
                    (Math.pow(current.stability + 1, this.w[13]) - 1) *
                    Math.exp(this.w[14] * (1 - r));

                nextDifficulty = this.clamp(current.difficulty + this.w[6], 1, 10);
            } else { // Hard, Good, Easy (Success)
                nextState = 'Review';
                // Success Stability formula
                const hardMultiplier = rating === 2 ? this.w[15] : 1;
                const easyMultiplier = rating === 4 ? this.w[16] : 1;

                nextStability = current.stability * (1 + Math.exp(this.w[8]) *
                    (11 - current.difficulty) *
                    Math.pow(current.stability, -this.w[9]) *
                    (Math.exp(this.w[10] * (1 - r)) - 1) *
                    hardMultiplier * easyMultiplier);

                nextDifficulty = this.clamp(current.difficulty - this.w[6] * (rating - 3), 1, 10);
            }
        }

        // FSRS Scheduling: interval = S * ln(target_retention) / ln(0.9) -> Simple: S * 9 * (1/R - 1) 
        // Actual FSRS v4: interval = S * (r^-1/0.1 - 1) -> Simply S if R=0.9
        const scheduledDays = Math.max(1, Math.round(nextStability * (Math.log(this.targetRetention) / Math.log(0.9))));

        // Burned check (Rule: S > 365 days)
        if (nextStability > 365) {
            nextState = 'Burned';
        }

        const nextReviewDate = new Date(reviewDate);
        nextReviewDate.setDate(nextReviewDate.getDate() + scheduledDays);

        return {
            next_state: nextState,
            next_stability: nextStability,
            next_difficulty: nextDifficulty,
            scheduled_days: scheduledDays,
            next_review: nextReviewDate
        };
    }

    private calculateRetrievability(current: FSRSParameters, now: Date): number {
        if (!current.last_review) return 0;
        const elapsed = (now.getTime() - new Date(current.last_review).getTime()) / (1000 * 60 * 60 * 24);
        return Math.exp(Math.log(0.9) * elapsed / current.stability);
    }

    private clamp(val: number, min: number, max: number): number {
        return Math.min(Math.max(val, min), max);
    }
}
