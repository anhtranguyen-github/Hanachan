/**
 * Levels Database Layer
 * 
 * Levels are determined by the `level` field on knowledge_units.
 * No separate levels_meta table - all levels are virtual (1-60).
 */

import { supabase } from '@/lib/supabase';
import { Level, LevelItem, LevelStats } from './types';

const LOG_PREFIX = '[LevelsDB]';

// ============================================
// LEVEL OPERATIONS (Virtual Levels Based on KU.level)
// ============================================

/**
 * Get all system levels (60 fixed virtual levels)
 * Levels are determined by knowledge_units.level field
 */
export async function getUserLevels(userId: string): Promise<Level[]> {
    console.log(`${LOG_PREFIX} getUserLevels called for userId:`, userId);
    return generateVirtualLevels();
}

/**
 * Generate virtual level-based levels
 */
function generateVirtualLevels(): Level[] {
    return Array.from({ length: 60 }, (_, i) => ({
        id: `level-${i + 1}`,
        name: `Level ${i + 1}`,
        description: `Content Level ${i + 1}`,
        level_type: 'system',
        level: i + 1,
        owner_id: null,
        created_at: new Date().toISOString()
    }));
}

/**
 * Get a single level by ID (virtual)
 */
export async function getLevelById(levelId: string): Promise<Level | null> {
    const match = levelId.match(/^level-(\d+)$/);
    if (!match) return null;

    const levelNum = parseInt(match[1]);
    if (levelNum < 1 || levelNum > 60) return null;

    return {
        id: levelId,
        name: `Level ${levelNum}`,
        description: `Content Level ${levelNum}`,
        level_type: 'system',
        level: levelNum,
        owner_id: null
    };
}

/**
 * Get all KUs in a level
 */
export async function getLevelItems(levelId: string): Promise<LevelItem[]> {
    const match = levelId.match(/^level-(\d+)$/);
    if (!match) return [];

    const levelNum = parseInt(match[1]);
    return await getKUsForLevel(levelNum, levelId);
}

/**
 * Helper: Get KUs for a specific level number
 */
async function getKUsForLevel(levelNum: number, levelId: string): Promise<LevelItem[]> {
    const { data, error } = await supabase
        .from('knowledge_units')
        .select('*')
        .eq('level', levelNum)
        .order('type', { ascending: true });

    if (error) {
        console.error(`${LOG_PREFIX} Error fetching KUs for level ${levelNum}:`, error);
        return [];
    }

    return (data || []).map((ku, index) => ({
        id: `${levelId}-${ku.id}`,
        level_id: levelId,
        ku_id: ku.id,
        position: index,
        knowledge_units: ku
    }));
}

/**
 * Calculate mastery stats for a level
 */
export async function getLevelMasteryStats(userId: string, levelId: string): Promise<LevelStats> {
    const items = await getLevelItems(levelId);
    if (items.length === 0) return getEmptyStats();

    const kuIds = items.map(i => i.ku_id).filter(Boolean) as string[];

    const { data: states } = await supabase
        .from('user_learning_states')
        .select('*')
        .eq('user_id', userId)
        .in('ku_id', kuIds);

    const statesMap = new Map();
    states?.forEach(s => {
        const existing = statesMap.get(s.ku_id) || [];
        statesMap.set(s.ku_id, [...existing, s]);
    });

    let learned = 0;
    let due = 0;
    let burned = 0;
    let learning = 0;
    const now = new Date();

    items.forEach(item => {
        if (!item.ku_id) return;
        const itemStates = statesMap.get(item.ku_id);
        if (itemStates && itemStates.length > 0) {
            learned++;
            const isBurned = itemStates.every((s: any) => s.state === 'burned');
            const isDue = itemStates.some((s: any) => s.next_review && new Date(s.next_review) <= now);

            if (isBurned) burned++;
            else learning++;
            if (isDue) due++;
        }
    });

    const total = items.length;
    return {
        total,
        due,
        new: total - learned,
        learned,
        learning,
        burned,
        coverage: total > 0 ? Math.round((learned / total) * 100) : 0
    };
}

function getEmptyStats(): LevelStats {
    return {
        total: 0, due: 0, new: 0, learned: 0, coverage: 0,
        learning: 0, burned: 0
    };
}
