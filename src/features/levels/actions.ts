'use server';

/**
 * Level Server Actions
 */

import { levelService } from './service';
import { Level, LevelStats } from './types';

const LOG_PREFIX = '[LevelsActions]';

export interface ActionResult<T> {
    success: boolean;
    data?: T;
    error?: string;
}

export async function getUserLevelsAction(userId: string): Promise<ActionResult<Level[]>> {
    try {
        const levels = await levelService.getUserLevelsWithStats(userId);
        return { success: true, data: levels };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function getLevelContentAction(levelId: string): Promise<ActionResult<any[]>> {
    try {
        const content = await levelService.getLevelContent(levelId);
        return { success: true, data: content };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function getLevelMasteryAction(
    userId: string,
    levelId: string
): Promise<ActionResult<LevelStats>> {
    try {
        const stats = await levelService.getLevelMastery(userId, levelId);
        return { success: true, data: stats };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}
