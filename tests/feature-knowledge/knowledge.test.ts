
import { describe, it, expect } from 'vitest';
import { isBookmarked, toggleBookmark } from '../../src/features/knowledge/persona-logic';
import { canUnlockNextLevel, prioritizeLessonQueue } from '../../src/features/knowledge/lesson-logic';

describe('Knowledge Personalization Logic', () => {
    it('should correctly identify bookmarked items', () => {
        const personalization = { bookmarkedIds: ['ku1', 'ku2'], knownIds: [] };
        expect(isBookmarked('ku1', personalization)).toBe(true);
        expect(isBookmarked('ku3', personalization)).toBe(false);
    });

    it('should toggle bookmarks', () => {
        let list: string[] = ['ku1'];
        list = toggleBookmark('ku2', { bookmarkedIds: list, knownIds: [] });
        expect(list).toContain('ku2');
        list = toggleBookmark('ku1', { bookmarkedIds: list, knownIds: [] });
        expect(list).not.toContain('ku1');
    });
});

describe('Lesson Progression Logic', () => {
    it('should allow unlocking next level at 90% mastery', () => {
        expect(canUnlockNextLevel({ level: 1, totalItems: 10, masteredItems: 9 })).toBe(true);
        expect(canUnlockNextLevel({ level: 1, totalItems: 10, masteredItems: 8 })).toBe(false);
    });

    it('should prioritize radicals over kanji in lesson queue', () => {
        const queue = [
            { ku: { type: 'kanji', id: 'k1' } as any, srsState: 'new' },
            { ku: { type: 'radical', id: 'r1' } as any, srsState: 'new' }
        ];
        const result = prioritizeLessonQueue(queue);
        expect(result[0].type).toBe('radical');
        expect(result[1].type).toBe('kanji');
    });
});
