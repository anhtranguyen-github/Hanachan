
import { describe, it, expect } from 'vitest';
import { FSRSAlgorithm } from '../../src/features/learning/srs-algorithm';
import { SRSCard } from '../../src/features/learning/srs-card';
import { StudySession } from '../../src/features/learning/study-session';

describe('FSRS Learning Domain', () => {
    const algo = new FSRSAlgorithm();

    describe('SRS Transitions (New Cards)', () => {
        it('should move from New to Learning when rated Again (1)', () => {
            const card = new SRSCard('ku_1');
            const result = card.review(1, algo);
            expect(result.next_state).toBe('Learning');
            expect(result.scheduled_days).toBe(1); // Usually day 1 for failure
        });

        it('should move from New to Review when rated Good (3)', () => {
            const card = new SRSCard('ku_1');
            const result = card.review(3, algo);
            expect(result.next_state).toBe('Review');
            expect(result.scheduled_days).toBeGreaterThan(1);
        });
    });

    describe('Burned State', () => {
        it('should reach Burned when stability exceeds 365 days', () => {
            // High stability scenario
            const card = new SRSCard('ku_heavy', {
                stability: 400,
                difficulty: 3,
                state: 'Review',
                last_review: new Date(),
                reps: 1
            });

            // Even if rated Good, it should become Burned
            const result = card.review(3, algo);
            expect(result.next_state).toBe('Burned');
        });
    });

    describe('Study Session Strategy', () => {
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 10);

        const cards = [
            new SRSCard('new_1'),
            new SRSCard('due_1', { state: 'Review', last_review: pastDate, scheduled_days: 1 }),
            new SRSCard('due_2', { state: 'Review', last_review: pastDate, scheduled_days: 1 }),
            new SRSCard('future_1', { state: 'Review', last_review: new Date(), scheduled_days: 10 }),
        ];

        it('should correctly filter due and new cards (all cards)', () => {
            const session = new StudySession(cards);
            // 2 due + 1 new = 3 total. future_1 is not due.
            expect(session.stats.total).toBe(3);
        });

        it('should process cards in order', () => {
            const session = new StudySession(cards);
            // Should have 2 due + 1 new = 3 total
            const firstCard = session.getCurrentCard();
            expect(firstCard?.state).toBe('Review');

            session.submitReview(3, algo);
            const secondCard = session.getCurrentCard();
            expect(secondCard?.state).toBe('Review'); // Second due review

            session.submitReview(3, algo);
            const thirdCard = session.getCurrentCard();
            expect(thirdCard?.state).toBe('New'); // Then new card
        });
    });
});
