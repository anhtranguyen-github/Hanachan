
export type UUID = string;

// 1. BASE TABLES
export interface User {
    id: UUID;
    email: string | null;
    display_name: string | null;
    avatar_url: string | null;
    created_at: string;
}

export type KUType = 'radical' | 'kanji' | 'vocabulary' | 'grammar';

export interface KnowledgeUnit {
    id: UUID;
    slug: string; // "vocabulary/猫" or just "猫" ? Schema says slug is text and unique. In code it seems slug is often used as ID.
    type: KUType;
    level: number | null;
    character: string | null;
    meaning: string | null;
    search_key: string | null;
    mnemonics: Record<string, any> | null;
    created_at: string;
    updated_at: string;
    // Joins (optional for mock objects)
    ku_kanji?: KUKanji | null;
    ku_vocabulary?: KUVocabulary | null;
    ku_radicals?: KURadical | null;
    ku_grammar?: KUGrammar | null;
}

// 2. KU DETAIL TABLES
export interface KUKanji {
    ku_id: UUID;
    video: string | null;
    meaning_data: Record<string, any> | null;
    reading_data: Record<string, any> | null;
}

export interface KURadical {
    ku_id: UUID;
    name: string;
}

export interface KUVocabulary {
    ku_id: UUID;
    reading_primary: string;
    audio: string | null;
    pitch: Record<string, any> | null;
    parts_of_speech: string[] | null;
    meaning_data: Record<string, any> | null;
}

export interface KUGrammar {
    ku_id: UUID;
    structure: Record<string, any> | null;
    details: string | null;
    cautions: string | null;
    meaning_summary?: string; // From usage in srs/service.ts
    structure_json?: Record<string, any>; // From usage in srs/service.ts
}

// 3. SENTENCES
export interface Sentence {
    id: UUID;
    text_ja: string;
    text_en: string | null;
    origin: string;
    source_text: string | null;
    metadata: Record<string, any> | null;
    created_by: UUID | null;
    created_at: string;
}

// 4. DECKS
export type DeckType = 'system' | 'user';

export interface Deck {
    id: UUID;
    owner_id: UUID | null;
    name: string;
    description: string | null;
    deck_type: DeckType;
    level: number | null;
    created_at: string;
}

export interface DeckItem {
    id?: UUID; // from deck_flashcards if mapped, or deck_items
    deck_id: UUID;
    flashcard_id?: UUID;
    // In code it uses deck_items which links to KU directly in some legacy/mixed code?
    // Schema says deck_flashcards -> flashcards -> ku_id.
    // We will stick to schema mostly but support direct KU link for convenience if needed.
    ku_id: UUID;
    created_at?: string;
    knowledge_units?: KnowledgeUnit;
}

// 5. USER LEARNING STATES
export type SRSState = 'new' | 'learning' | 'review' | 'relearning' | 'burned';

export interface UserLearningState {
    user_id: UUID;
    ku_id: UUID; // or slug? Code mixes them. Schema uses UUID.
    state: SRSState;
    stability: number;
    difficulty: number;
    last_review: string | null;
    next_review: string | null;
    lapses: number;
    reps: number;
    srs_stage?: number; // Helper for frontend
}

// 6. FSRS HISTORY
export interface FSRSHistory {
    id: UUID;
    user_id: string;
    ku_id: string;
    rating: number;
    prev_state: SRSState;
    new_state?: SRSState; // inferred
    reviewed_at: string;
}
