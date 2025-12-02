
import { describe, it, expect } from 'vitest';
import { calculateStreak } from '../../src/features/analytics/streak-engine';
import { calculateMemoryDistribution, calculateMemoryPower } from '../../src/features/analytics/memory-stats';

describe('Streak Engine', () => {
    it('should calculate active streaks', () => {
        const active = ['2026-01-24', '2026-01-23', '2026-01-22'];
        expect(calculateStreak(active, '2026-01-24')).toBe(3);
    });

    it('should maintain streak if today is missing but yesterday was active', () => {
        const active = ['2026-01-23', '2026-01-22'];
        expect(calculateStreak(active, '2026-01-24')).toBe(2);
    });

    it('should return 0 if streak is broken', () => {
        const active = ['2026-01-21'];
        expect(calculateStreak(active, '2026-01-24')).toBe(0);
    });
});

describe('Memory Stats', () => {
    const points = [{ stability: 5 }, { stability: 15 }, { stability: 50 }];

    it('should distribute points into buckets', () => {
        const dist = calculateMemoryDistribution(points);
        expect(dist.weak).toBe(1);
        expect(dist.moderate).toBe(1);
        expect(dist.strong).toBe(1);
    });

    it('should calculate non-zero memory power', () => {
        expect(calculateMemoryPower(points)).toBeGreaterThan(0);
    });
});
