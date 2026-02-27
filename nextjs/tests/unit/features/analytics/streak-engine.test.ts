/**
 * Unit tests for the streak calculation engine.
 * Pure business logic — no external dependencies.
 */
import { describe, it, expect } from 'vitest';
import { calculateStreak, isStreakMaintained } from '@/features/analytics/streak-engine';

describe('calculateStreak', () => {
    it('returns 0 for empty active dates', () => {
        expect(calculateStreak([], '2025-01-10')).toBe(0);
    });

    it('returns 1 when only today is active', () => {
        expect(calculateStreak(['2025-01-10'], '2025-01-10')).toBe(1);
    });

    it('returns 1 when only yesterday is active (today not active)', () => {
        expect(calculateStreak(['2025-01-09'], '2025-01-10')).toBe(1);
    });

    it('returns 0 when last active date was 2 days ago', () => {
        expect(calculateStreak(['2025-01-08'], '2025-01-10')).toBe(0);
    });

    it('calculates a 3-day streak ending today', () => {
        const dates = ['2025-01-10', '2025-01-09', '2025-01-08'];
        expect(calculateStreak(dates, '2025-01-10')).toBe(3);
    });

    it('calculates a 3-day streak ending yesterday', () => {
        const dates = ['2025-01-09', '2025-01-08', '2025-01-07'];
        expect(calculateStreak(dates, '2025-01-10')).toBe(3);
    });

    it('stops counting at a gap in dates', () => {
        // Gap on 2025-01-08 — streak should only count from 2025-01-09
        const dates = ['2025-01-10', '2025-01-09', '2025-01-07', '2025-01-06'];
        expect(calculateStreak(dates, '2025-01-10')).toBe(2);
    });

    it('handles a long streak correctly', () => {
        const dates: string[] = [];
        for (let i = 0; i < 30; i++) {
            const d = new Date('2025-01-30');
            d.setDate(d.getDate() - i);
            dates.push(d.toISOString().split('T')[0]);
        }
        expect(calculateStreak(dates, '2025-01-30')).toBe(30);
    });

    it('handles unsorted dates (still counts correctly)', () => {
        // calculateStreak uses includes(), so order doesn't matter
        const dates = ['2025-01-08', '2025-01-10', '2025-01-09'];
        expect(calculateStreak(dates, '2025-01-10')).toBe(3);
    });

    it('returns 0 when no recent activity', () => {
        const dates = ['2024-12-01', '2024-12-02'];
        expect(calculateStreak(dates, '2025-01-10')).toBe(0);
    });
});

describe('isStreakMaintained', () => {
    it('returns true when today is in active dates', () => {
        expect(isStreakMaintained(['2025-01-10', '2025-01-09'], '2025-01-10')).toBe(true);
    });

    it('returns false when today is not in active dates', () => {
        expect(isStreakMaintained(['2025-01-09', '2025-01-08'], '2025-01-10')).toBe(false);
    });

    it('returns false for empty active dates', () => {
        expect(isStreakMaintained([], '2025-01-10')).toBe(false);
    });
});
