/**
 * Unit tests for HanaTime utility.
 * Tests the time simulation logic without any external dependencies.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { HanaTime } from '@/lib/time';

describe('HanaTime', () => {
    beforeEach(() => {
        HanaTime.reset();
    });

    it('getNow() returns a Date object', () => {
        const now = HanaTime.getNow();
        expect(now).toBeInstanceOf(Date);
    });

    it('getNowISO() returns a valid ISO string', () => {
        const iso = HanaTime.getNowISO();
        expect(typeof iso).toBe('string');
        expect(() => new Date(iso)).not.toThrow();
        expect(new Date(iso).toISOString()).toBe(iso);
    });

    it('getNow() returns approximately the current time at speed 1', () => {
        const before = Date.now();
        const simulated = HanaTime.getNow().getTime();
        const after = Date.now();
        // Should be within 100ms of real time
        expect(simulated).toBeGreaterThanOrEqual(before - 100);
        expect(simulated).toBeLessThanOrEqual(after + 100);
    });

    it('setSpeed() changes the time multiplier', () => {
        HanaTime.setSpeed(2);
        expect(HanaTime.getSpeed()).toBe(2);
    });

    it('getSpeed() returns 1 after reset', () => {
        HanaTime.setSpeed(100);
        HanaTime.reset();
        expect(HanaTime.getSpeed()).toBe(1);
    });

    it('skipTime() advances simulated time', () => {
        const before = HanaTime.getNow().getTime();
        const skipMs = 60 * 60 * 1000; // 1 hour
        HanaTime.skipTime(skipMs);
        const after = HanaTime.getNow().getTime();
        // Should be approximately 1 hour ahead
        expect(after - before).toBeGreaterThanOrEqual(skipMs - 100);
        expect(after - before).toBeLessThanOrEqual(skipMs + 100);
    });

    it('setSimulatedTime() sets an explicit time', () => {
        const target = new Date('2025-01-01T00:00:00.000Z');
        HanaTime.setSimulatedTime(target);
        const result = HanaTime.getNow();
        // Should be very close to the target (within 50ms for execution time)
        expect(Math.abs(result.getTime() - target.getTime())).toBeLessThan(50);
    });

    it('togglePause() pauses time', () => {
        HanaTime.togglePause();
        const t1 = HanaTime.getNow().getTime();
        // Wait a tiny bit
        const t2 = HanaTime.getNow().getTime();
        // When paused, time should not advance
        expect(t2).toBe(t1);
    });

    it('togglePause() resumes time after second call', () => {
        HanaTime.togglePause(); // pause
        HanaTime.togglePause(); // resume
        // After resuming, speed should still be 1
        expect(HanaTime.getSpeed()).toBe(1);
    });

    it('reset() restores default state', () => {
        HanaTime.setSpeed(1000);
        HanaTime.skipTime(999999999);
        HanaTime.reset();
        expect(HanaTime.getSpeed()).toBe(1);
        // Time should be close to real time again
        const diff = Math.abs(HanaTime.getNow().getTime() - Date.now());
        expect(diff).toBeLessThan(200);
    });
});
