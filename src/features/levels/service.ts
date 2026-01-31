/**
 * Levels Service Layer
 */

import * as db from './db';
import { Level, LevelItem, LevelStats } from './types';

const LOG_PREFIX = '[LevelsService]';

export class LevelService {
    async getUserLevels(userId: string): Promise<Level[]> {
        return await db.getUserLevels(userId);
    }

    async getLevelById(levelId: string): Promise<Level | null> {
        return await db.getLevelById(levelId);
    }

    async getLevelContent(levelId: string): Promise<LevelItem[]> {
        return await db.getLevelItems(levelId);
    }

    async getLevelMastery(userId: string, levelId: string): Promise<LevelStats> {
        return await db.getLevelMasteryStats(userId, levelId);
    }

    async getUserLevelsWithStats(userId: string): Promise<Level[]> {
        const levels = await this.getUserLevels(userId);
        return await Promise.all(
            levels.map(async (level) => {
                const stats = await this.getLevelMastery(userId, level.id);
                return { ...level, stats };
            })
        );
    }
}

export const levelService = new LevelService();
