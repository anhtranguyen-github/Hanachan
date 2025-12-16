
import { FSRSState } from './fsrs-engine';

export interface FlashcardEntity {
    id: string;
    sentence_id: string;
    card_type: 'vocab' | 'cloze';
    front: string;
    back: string;
    target_slug?: string;
    fsrs_state: FSRSState;
    next_review: string;
    user_id: string;
}

export interface DeckEntity {
    id: string;
    user_id: string;
    name: string;
    description?: string;
    type: 'user_mined' | 'system' | 'custom';
    created_at: string;
}

export interface DeckItemEntity {
    id: string;
    deck_id: string;
    ku_id?: string;
    sentence_id?: string;
    target_grammar_slug?: string;
    created_at: string;
}

export interface DeckSummary {
    id: string; // 'level-1', 'youtube', 'chat'
    title: string;
    description: string;
    totalCards: number;
    dueCards: number;
    type: 'system_level' | 'immersion_source' | 'custom';
}
