/**
 * Review Card Types
 * 
 * Implements the Unified Review RPD:
 * - 4 canonical unit types: Radical, Kanji, Vocabulary, Grammar
 * - ONE FSRS state per unit (no fragmentation)
 * - Type-specific prompt variants
 * 
 * Prompt Behaviors:
 * - Radical: meaning only
 * - Kanji: meaning OR reading (randomly selected)
 * - Vocabulary: meaning OR reading (randomly selected)
 * - Grammar: cloze only (always with sentences)
 */

// Prompt variant determines what we're asking the user
export type PromptVariant =
    | 'meaning'      // Ask: "What does this mean?"
    | 'reading'      // Ask: "How do you read this?"
    | 'cloze';       // Ask: "Fill in the blank"

// Base review card with common fields
export interface BaseReviewCard {
    id: string;
    ku_id: string;
    ku_type: 'radical' | 'kanji' | 'vocabulary' | 'grammar';
    level: number;
    character?: string;
    meaning: string;
    jlpt?: number;
    prompt_variant: PromptVariant;  // Which recall dimension are we testing?
    prompt?: string;                // Stored prompt from database
    correct_answers?: string[];     // Stored answers from database
    notes?: string;                 // User/Agent mnemonic notes
}

/**
 * Radical Review Card
 * ALWAYS meaning prompt - radicals are semantic mnemonics, not language
 * 
 * Prompt: Show symbol → Ask for meaning
 */
export interface RadicalReviewCard extends BaseReviewCard {
    ku_type: 'radical';
    prompt_variant: 'meaning';  // Always meaning
    radical_name?: string;
    mnemonic?: string;
    image_url?: string;
}

/**
 * Kanji Review Card
 * EITHER meaning OR reading prompt (randomly selected, one FSRS state)
 * 
 * Meaning Prompt: Show kanji → Ask for meaning
 * Reading Prompt: Show kanji (with optional context) → Ask for reading
 */
export interface KanjiReviewCard extends BaseReviewCard {
    ku_type: 'kanji';
    prompt_variant: 'meaning' | 'reading';
    readings: {
        onyomi?: string[];
        kunyomi?: string[];
        primary?: string;
    };
    // Optional context word for reading prompts
    context_word?: string;  // e.g., "食べる" when asking reading for 食
    context_reading?: string; // e.g., "たべる"
    mnemonic_meaning?: string;
    mnemonic_reading?: string;
}

/**
 * Vocabulary Review Card
 * EITHER meaning OR reading prompt (randomly selected, one FSRS state)
 * 
 * Meaning Prompt: Show word → Ask for meaning
 * Reading Prompt: Show word → Ask for reading
 */
export interface VocabReviewCard extends BaseReviewCard {
    ku_type: 'vocabulary';
    prompt_variant: 'meaning' | 'reading';
    reading: string;
    parts_of_speech?: string[];
    audio_url?: string;
    pitch?: any;
}

/**
 * Grammar Review Card
 * ALWAYS cloze prompt - grammar is never recalled in isolation
 * 
 * Prompt: Show sentence with blank → User fills in grammar point
 */
export interface GrammarReviewCard extends BaseReviewCard {
    ku_type: 'grammar';
    prompt_variant: 'cloze';  // Always cloze
    // Cloze-specific fields
    sentence_ja: string;           // Original: "雨が降っても、行きます。"
    sentence_en?: string;          // Translation
    cloze_display: string;         // "雨が降っ___、行きます。"
    cloze_answer: string;          // "ても"
    cloze_start_index?: number;     // Position of blank in original
    cloze_end_index?: number;
    // Source info
    sentence_id: string;
    sentence_source: 'official' | 'user_mined';
    // Grammar structure
    grammar_structure?: string;    // "Vても"
    grammar_hint?: string;         // "even if [verb]"
}

// Union type for all review cards
export type ReviewCard =
    | RadicalReviewCard
    | KanjiReviewCard
    | VocabReviewCard
    | GrammarReviewCard;

// Review session types
export interface ReviewSession {
    id: string;
    user_id: string;
    level_id?: string;
    session_type: 'learn' | 'review'; // NEW: Distinguish between learn and review
    cards: ReviewCard[];
    current_index: number;
    started_at: string;
    completed_at?: string;
}

// Answer submission
export interface ReviewAnswer {
    ku_id: string;
    rating: 'pass' | 'again';
    response_time_ms?: number;
    user_input: string;    // Required for all interactions now
}

// SRS state from database (ONE per KU per user)
export interface UserLearningState {
    user_id: string;
    ku_id: string;
    state: 'new' | 'learning' | 'review' | 'burned';
    stability: number;
    difficulty: number;
    last_review?: string;
    next_review?: string;
    lapses: number;
    reps: number;
    notes?: string;
}
