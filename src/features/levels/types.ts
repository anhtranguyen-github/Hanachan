/**
 * Level-related TypeScript types
 * 
 * Levels are virtual (level-1 to level-60) based on knowledge_units.level field.
 * No separate database tables for levels - all levels are computed from KU data.
 */

// Only system levels are supported
export type LevelType = 'system';

export interface Level {
    id: string;
    name: string;
    description?: string | null;
    level_type: LevelType;
    level?: number | null;
    owner_id?: string | null;
    created_at?: string;
    updated_at?: string;
    // Virtual fields added by queries
    stats?: LevelStats;
}

export interface LevelItem {
    id: string;
    level_id: string;
    ku_id?: string | null;
    cloze_id?: string | null;
    position?: number;
    added_at?: string;
    // Joined data
    knowledge_units?: any;
    cloze_sentence_cards?: any;
}

export interface LevelStats {
    total: number;
    due: number;
    new: number;
    learned: number;
    coverage?: number;
    composition?: Record<string, number>;
    learning?: number;
    burned?: number;
}

export interface LevelInteraction {
    user_id: string;
    ku_id: string;
    updates: Record<string, any>;
}
