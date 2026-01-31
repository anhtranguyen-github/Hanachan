
import { Level, LevelItem } from './types';

export function isSystemLevel(level: Level): boolean {
    return level.level_type === 'system' || !level.owner_id;
}

export function canModifyLevel(level: Level, userId: string): boolean {
    return level.owner_id === userId;
}

export function validateLevelItem(item: LevelItem): boolean {
    return !!(item.level_id && item.ku_id);
}

/**
 * Business Rule: System levels have priority in 60-level standard curriculum.
 */
export function getLevelPriority(level: Level): number {
    if (isSystemLevel(level)) return 100;
    return 10;
}
