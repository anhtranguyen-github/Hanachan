/**
 * Deck-related TypeScript types
 * Aligned with the database schema for decks and deck_items tables
 * 
 * NOTE: All users now use fixed 60 system decks (Level 1-60).
 * Custom deck creation has been removed.
 */

// Only system decks are supported
export type DeckType = 'system';

export interface Deck {
    id: string;
    name: string;
    description?: string | null;
    deck_type: DeckType;
    level?: number | null;
    owner_id?: string | null;
    created_at?: string;
    updated_at?: string;
    // Virtual fields added by queries
    stats?: DeckStats;
}

export interface DeckItem {
    id: string;
    deck_id: string;
    ku_id?: string | null;
    cloze_id?: string | null;
    position?: number;
    added_at?: string;
    // Joined data
    knowledge_units?: any;
    cloze_sentence_cards?: any;
}

export interface DeckStats {
    total: number;
    due: number;
    new: number;
    learned: number;
    coverage?: number;
}

export interface DeckInteraction {
    user_id: string;
    ku_id: string;
    updates: Record<string, any>;
}
