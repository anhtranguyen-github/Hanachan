
import { FSRSParameters, SRSState, ReviewRating, FSRSReviewResult } from './types';
import { SRSAlgorithm } from './srs-algorithm';

export class SRSCard {
    private params: FSRSParameters;
    private kuId: string;

    constructor(kuId: string, params?: Partial<FSRSParameters>) {
        this.kuId = kuId;
        this.params = {
            stability: params?.stability ?? 0,
            difficulty: params?.difficulty ?? 0,
            elapsed_days: params?.elapsed_days ?? 0,
            scheduled_days: params?.scheduled_days ?? 0,
            state: params?.state ?? 'New',
            last_review: params?.last_review,
            reps: params?.reps ?? 0,
            lapses: params?.lapses ?? 0,
        };
    }

    /**
     * Applies a review to the card using the provided algorithm.
     * Returns the result of the calculation.
     */
    review(rating: ReviewRating, algorithm: SRSAlgorithm, reviewDate: Date = new Date()): FSRSReviewResult {
        const result = algorithm.calculateNextState(this.params, rating, reviewDate);

        // Update internal state
        this.params = {
            ...this.params,
            state: result.next_state,
            stability: result.next_stability,
            difficulty: result.next_difficulty,
            scheduled_days: result.scheduled_days,
            last_review: reviewDate,
            reps: this.params.reps + 1,
            lapses: rating === 1 ? this.params.lapses + 1 : this.params.lapses,
        };

        return result;
    }

    get id(): string {
        return this.kuId;
    }

    get state(): SRSState {
        return this.params.state;
    }

    get snapshot(): FSRSParameters {
        return { ...this.params };
    }

    isDue(now: Date = new Date()): boolean {
        if (this.state === 'New') return true;
        if (this.state === 'Burned') return false;

        if (!this.params.last_review) return true;

        const nextReview = new Date(this.params.last_review);
        nextReview.setDate(nextReview.getDate() + this.params.scheduled_days);

        return now.getTime() >= nextReview.getTime();
    }
}
