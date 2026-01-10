/**
 * SRS Types
 * 
 * Core type definitions for the Spaced Repetition System.
 * These are pure types with no I/O or dependencies.
 */

/** Content types supported by the SRS system */
export type ContentType = 'RADICAL' | 'KANJI' | 'VOCABULARY' | 'GRAMMAR';

/** SRS item lifecycle states */
export type ItemState = 'NEW' | 'LEARNING' | 'REVIEW' | 'RELEARNING' | 'MASTERED';

/** SRS stage (0-9)
 * 
 * itemState = 'LEARNING' (if new) or 'RELEARNING' (if lapsed)
 */
export type SRSStage = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

/** Stage group for UI display */
export type StageGroup = 'APPRENTICE' | 'GURU' | 'MASTER' | 'ENLIGHTENED' | 'BURNED';

/** Result of an SRS state computation */
export interface SRSStateUpdate {
    newStage: number;
    nextReview: Date | null;
    newStreak: number;
}

/** Answer result tracking for analytics
 * 
 * Tracks correctness of individual answer components.
 * Used for single SRS mutation per review session.
 */
export interface AnswerResult {
    /** Whether the meaning answer was correct */
    meaningCorrect?: boolean;
    /** Whether the reading answer was correct */
    readingCorrect?: boolean;
    /** Whether the cloze/fill-in answer was correct (for grammar) */
    clozeCorrect?: boolean;
    /** Overall session correctness (derived from above) */
    sessionCorrect?: boolean;

    // Legacy field names (deprecated, use meaningCorrect/readingCorrect)
    /** @deprecated Use meaningCorrect instead */
    meaning?: boolean;
    /** @deprecated Use readingCorrect instead */
    reading?: boolean;
    /** @deprecated Use clozeCorrect instead */
    cloze?: boolean;
    /** @deprecated Use sessionCorrect instead */
    session?: boolean;
}

/** Stage distribution counts by content type */
export interface StageContentCounts {
    radicals: number;
    kanji: number;
    vocabulary: number;
    grammar: number;
}

/** Full distribution stats */
export interface DistributionStats {
    apprentice: number;
    guru: number;
    master: number;
    enlightened: number;
    burned: number;
    stages: Record<string, StageContentCounts>;
}

/** Level progress stats */
export interface LevelProgressStats {
    radicals: { total: number; guru: number; current: number; max: number; available: number };
    kanji: { total: number; guru: number; current: number; max: number; available: number };
    vocabulary: { total: number; guru: number; current: number; max: number; available: number };
    grammar: { total: number; guru: number; current: number; max: number; available: number };
    current_level: number;
    kanji_to_level_up: number;
}

/** Assessment Question Types */
export type AssessmentType =
    | 'RADICAL_MEANING'
    | 'KANJI_MEANING'
    | 'KANJI_READING'
    | 'VOCAB_MEANING'
    | 'VOCAB_READING'
    | 'GRAMMAR_FILL'
    | 'GRAMMAR_CHOICE'
    | 'GRAMMAR_JUDGEMENT';
