
import { KnowledgeUnit } from './types';

/**
 * Business rules for level-based lesson progression.
 */

export interface LessonQueueItem {
    ku: KnowledgeUnit;
    srsState: string;
}

export interface LevelProgress {
    level: number;
    totalItems: number;
    masteredItems: number; // SRS state 'Review' or 'Burned'
}

/**
 * Determines if a user can unlock the next level.
 * Rule: At least 90% of Current Level items must be in 'Review' or 'Burned' state.
 */
export function canUnlockNextLevel(progress: LevelProgress): boolean {
    if (progress.totalItems === 0) return true;
    const masteryPercentage = (progress.masteredItems / progress.totalItems) * 100;
    return masteryPercentage >= 90;
}

/**
 * Filters and prioritizes items for a lesson session.
 * Rule: Radicals -> Kanji -> Vocabulary -> Grammar.
 * Only items in 'New' state are candidates for lessons.
 */
export function prioritizeLessonQueue(items: LessonQueueItem[]): KnowledgeUnit[] {
    const typePriority: Record<string, number> = {
        'radical': 1,
        'kanji': 2,
        'vocabulary': 3,
        'grammar': 4
    };

    return items
        .filter(item => item.srsState.toLowerCase() === 'new')
        .sort((a, b) => {
            const priorityA = typePriority[a.ku.type] || 99;
            const priorityB = typePriority[b.ku.type] || 99;
            return priorityA - priorityB;
        })
        .map(item => item.ku);
}

/**
 * Calculates the next available level for the user.
 */
export function getNextLevel(currentLevel: number): number {
    return Math.min(currentLevel + 1, 60);
}
