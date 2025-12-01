export interface Deck {
    id: string;
    user_id?: string | null;
    name: string;
    description?: string | null;
    type: string; // 'system' | 'user_mined'
    level_index?: number | null;
    category?: string | null;
    created_at?: string;
    updated_at?: string;
}

export interface DeckItem {
    deck_id: string;
    ku_id: string;
    sentence_id?: string | null;
    created_at?: string;
}

export interface DeckInteraction {
    user_id: string;
    deck_id: string;
    ku_id: string;
    state: string; // interaction_state enum
    last_interaction_at?: string;
    interaction_count?: number;
}
