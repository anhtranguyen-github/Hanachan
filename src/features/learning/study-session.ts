
import { SRSCard } from './srs-card';
import { ReviewRating, FSRSReviewResult } from './types';
import { SRSAlgorithm } from './srs-algorithm';

export interface SessionLimits {
    newLimit: number;
    reviewLimit: number;
}

export class StudySession {
    private cards: SRSCard[];
    private currentIdx: number = 0;
    private completedCount: Record<string, number> = {
        new: 0,
        review: 0
    };

    constructor(cards: SRSCard[]) {
        this.cards = this.prioritizeAndLimit(cards);
    }

    private prioritizeAndLimit(cards: SRSCard[]): SRSCard[] {
        const dueReviews = cards.filter(c => c.state !== 'New' && c.isDue());
        const newCards = cards.filter(c => c.state === 'New');

        // Without study limits, we take all cards.
        // Common SRS strategy: Reviews first, then New cards
        return [...dueReviews, ...newCards];
    }

    /**
     * Returns the current card to be reviewed.
     */
    getCurrentCard(): SRSCard | null {
        if (this.currentIdx >= this.cards.length) return null;
        return this.cards[this.currentIdx];
    }

    /**
     * Processes a review for the current card and moves to the next.
     */
    submitReview(rating: ReviewRating, algorithm: SRSAlgorithm): FSRSReviewResult | null {
        const card = this.getCurrentCard();
        if (!card) return null;

        const isNew = card.state === 'New';
        const result = card.review(rating, algorithm);

        // Track progression
        if (isNew) this.completedCount.new++;
        else this.completedCount.review++;

        // In a real session, if rating is 'Again' (1), we might re-queue the card
        // For this simple domain model, we just advance.
        this.currentIdx++;

        return result;
    }

    get stats() {
        return {
            completed: this.completedCount,
            remaining: this.cards.length - this.currentIdx,
            total: this.cards.length
        };
    }

    isFinished(): boolean {
        return this.currentIdx >= this.cards.length;
    }
}
