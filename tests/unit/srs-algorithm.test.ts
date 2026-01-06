
import { describe, it, expect, vi } from 'vitest';
import { calculateNextReview, SRS_STAGES, SRSState } from '../../src/features/srs/algorithm';

describe('SRS Algorithm (SM-2 Variant)', () => {

    // Helper to generic initial state
    const getNewState = (): SRSState => ({
        stage: SRS_STAGES.NEW,
        interval: 0,
        ease_factor: 2.5,
        streak: 0
    });

    it('should promote New item to Learning on first review', () => {
        const current = getNewState();
        const { next_state } = calculateNextReview(current, 'good');

        expect(next_state.stage).toBe(SRS_STAGES.LEARNING);
        expect(next_state.streak).toBe(1);
        expect(next_state.interval).toBeGreaterThan(0); // Should be 4 hours (4/24)
    });

    it('should reset Learning item on "Again"', () => {
        const current: SRSState = { ...getNewState(), stage: SRS_STAGES.LEARNING, streak: 2, interval: 0.5 };
        const { next_state } = calculateNextReview(current, 'again');

        expect(next_state.streak).toBe(0);
        expect(next_state.interval).toBeLessThan(0.1); // 1 minute
        expect(next_state.stage).toBe(SRS_STAGES.LEARNING);
    });

    it('should graduate to Review stage after enough streaks (SR System)', () => {
        // Assume streak 4 is the threshold to end "Learning" (Apprentice) phase in WaniKani style
        const current: SRSState = { ...getNewState(), stage: SRS_STAGES.LEARNING, streak: 4, interval: 3 };
        const { next_state } = calculateNextReview(current, 'good');

        expect(next_state.streak).toBe(5);
        expect(next_state.stage).toBe(SRS_STAGES.REVIEW); // Guru equivalent
        expect(next_state.interval).toBe(7); // 1 week
    });

    it('should exponentially increase interval in Review stage', () => {
        const current: SRSState = {
            stage: SRS_STAGES.REVIEW,
            interval: 7,
            ease_factor: 2.5,
            streak: 5
        };
        const { next_state } = calculateNextReview(current, 'good');

        expect(next_state.interval).toBe(14); // Hardcoded step for streak 6

        // Next step dynamic
        const nextInput = { ...next_state, streak: 6 };
        const { next_state: dynamicState } = calculateNextReview(nextInput, 'good');
        // 14 * 2.5 = 35
        expect(dynamicState.interval).toBe(35);
    });

    it('should penalize "Hard" rating', () => {
        const current: SRSState = {
            stage: SRS_STAGES.REVIEW,
            interval: 10,
            ease_factor: 2.5,
            streak: 6
        };
        const { next_state } = calculateNextReview(current, 'hard');

        expect(next_state.interval).toBe(5); // 0.5x
        expect(next_state.ease_factor).toBe(2.3); // -0.2
        expect(next_state.streak).toBe(5); // -1
    });

    it('should burn item after streak 9', () => {
        const current: SRSState = {
            stage: SRS_STAGES.REVIEW,
            interval: 120,
            ease_factor: 2.5,
            streak: 8
        };
        const { next_state } = calculateNextReview(current, 'good');

        expect(next_state.streak).toBe(9);
        expect(next_state.stage).toBe(SRS_STAGES.BURNED);
    });
});
