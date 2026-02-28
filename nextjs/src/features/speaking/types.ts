// ─── Speaking Practice Types ──────────────────────────────────────────────────

export type SpeechRecognitionStatus =
    | 'idle'
    | 'requesting-permission'
    | 'ready'
    | 'recording'
    | 'processing'
    | 'error';

export type PronunciationAssessmentStatus =
    | 'idle'
    | 'recording'
    | 'processing'
    | 'done'
    | 'error';

// ─── Pronunciation Assessment Result ─────────────────────────────────────────

export interface PhonemeResult {
    phoneme: string;
    accuracyScore: number;
    nBestPhonemes?: Array<{ phoneme: string; score: number }>;
}

export interface WordResult {
    word: string;
    accuracyScore: number;
    errorType: 'None' | 'Omission' | 'Insertion' | 'Mispronunciation' | 'UnexpectedBreak' | 'MissingBreak' | 'Monotone';
    syllables?: Array<{ syllable: string; accuracyScore: number }>;
    phonemes?: PhonemeResult[];
}

export interface PronunciationAssessmentResult {
    recognizedText: string;
    accuracyScore: number;
    fluencyScore: number;
    completenessScore: number;
    pronunciationScore: number;
    prosodyScore?: number;
    words: WordResult[];
    durationMs: number;
}

// ─── Practice Prompt ──────────────────────────────────────────────────────────

export type PromptDifficulty = 'beginner' | 'intermediate' | 'advanced';
export type PromptCategory =
    | 'greetings'
    | 'numbers'
    | 'daily-life'
    | 'food'
    | 'travel'
    | 'business'
    | 'grammar'
    | 'tongue-twisters';

export interface SpeakingPrompt {
    id: string;
    japanese: string;
    reading: string;
    english: string;
    difficulty: PromptDifficulty;
    category: PromptCategory;
    tip?: string;
}

// ─── Practice Session ─────────────────────────────────────────────────────────

export interface PracticeAttempt {
    promptId: string;
    timestamp: string;
    result: PronunciationAssessmentResult;
    targetText: string;
}

export interface PracticeSession {
    id: string;
    startedAt: string;
    attempts: PracticeAttempt[];
    averageScore: number;
}

// ─── Score Thresholds ─────────────────────────────────────────────────────────

export const SCORE_THRESHOLDS = {
    excellent: 90,
    good: 75,
    fair: 60,
    poor: 0,
} as const;

export type ScoreLevel = 'excellent' | 'good' | 'fair' | 'poor';

export function getScoreLevel(score: number): ScoreLevel {
    if (score >= SCORE_THRESHOLDS.excellent) return 'excellent';
    if (score >= SCORE_THRESHOLDS.good) return 'good';
    if (score >= SCORE_THRESHOLDS.fair) return 'fair';
    return 'poor';
}

export function getScoreColor(score: number): string {
    const level = getScoreLevel(score);
    switch (level) {
        case 'excellent': return '#48BB78';
        case 'good': return '#4DABF7';
        case 'fair': return '#F6AD55';
        case 'poor': return '#FC8181';
    }
}

export function getScoreLabel(score: number): string {
    const level = getScoreLevel(score);
    switch (level) {
        case 'excellent': return 'Excellent!';
        case 'good': return 'Good';
        case 'fair': return 'Keep Practicing';
        case 'poor': return 'Needs Work';
    }
}
