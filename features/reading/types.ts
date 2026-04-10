// Reading Practice Feature Types

export type DifficultyLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1' | 'adaptive';
export type PassageLength = 'short' | 'medium' | 'long';
export type SessionStatus = 'pending' | 'active' | 'completed' | 'abandoned';
export type ExerciseStatus = 'pending' | 'active' | 'completed' | 'skipped';
export type QuestionType = 'multiple_choice' | 'true_false' | 'fill_blank' | 'comprehension';

export interface ReadingConfig {
    id?: string;
    user_id?: string;
    exercises_per_session: number;
    time_limit_minutes: number;
    difficulty_level: DifficultyLevel;
    jlpt_target: number | null;
    vocab_weight: number;
    grammar_weight: number;
    kanji_weight: number;
    include_furigana: boolean;
    include_translation: boolean;
    passage_length: PassageLength;
    topic_preferences: string[];
    auto_generate: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface ReadingQuestion {
    index: number;
    type: QuestionType;
    question_ja: string;
    question_en: string;
    options: string[] | null;
    correct_answer: string;
    explanation: string;
}

export interface ReadingExercise {
    id: string;
    session_id: string;
    passage_ja: string;
    passage_furigana: string | null;
    passage_en: string;
    passage_title: string;
    difficulty_level: DifficultyLevel;
    jlpt_level: number | null;
    topic: string;
    word_count: number;
    featured_vocab_ids: string[];
    featured_grammar_ids: string[];
    featured_kanji_ids: string[];
    questions: ReadingQuestion[];
    status: ExerciseStatus;
    time_spent_seconds: number;
    order_index: number;
    created_at?: string;
}

export interface ReadingSession {
    id: string;
    user_id?: string;
    status: SessionStatus;
    total_exercises: number;
    completed_exercises: number;
    correct_answers: number;
    total_time_seconds: number;
    score: number;
    config_snapshot: Partial<ReadingConfig>;
    generated_by: string;
    generation_context: {
        user_level?: number;
        vocab_count?: number;
        grammar_count?: number;
        kanji_count?: number;
        generated_at?: string;
    };
    exercises?: ReadingExercise[];
    started_at: string | null;
    completed_at: string | null;
    created_at: string;
}

export interface AnswerResult {
    is_correct: boolean;
    correct_answer: string;
    explanation: string;
    exercise_completed: boolean;
}

export interface TopicPerformance {
    topic: string;
    exercises_count: number;
    accuracy: number;
}

export interface DailyMetric {
    date: string;
    sessions_completed: number;
    exercises_completed: number;
    total_time_seconds: number;
    correct_answers: number;
    total_answers: number;
    avg_score: number;
    words_read?: number;
}

export interface ReadingMetrics {
    total_sessions: number;
    total_exercises: number;
    total_time_seconds: number;
    avg_score: number;
    best_score: number;
    pending_sessions: number;
    streak_days: number;
    total_words_read: number;
    recent_sessions: ReadingSession[];
    daily_metrics: DailyMetric[];
    topic_performance: TopicPerformance[];
}

export const TOPIC_LABELS: Record<string, string> = {
    daily_life: '日常生活',
    culture: '文化',
    nature: '自然',
    food: '食べ物',
    travel: '旅行',
    technology: 'テクノロジー',
    history: '歴史',
    sports: 'スポーツ',
    music: '音楽',
    family: '家族',
    work: '仕事',
    school: '学校',
    seasons: '季節',
    festivals: '祭り',
    animals: '動物',
};

export const TOPIC_EMOJIS: Record<string, string> = {
    daily_life: '🏠',
    culture: '🎎',
    nature: '🌸',
    food: '🍜',
    travel: '✈️',
    technology: '💻',
    history: '📜',
    sports: '⚽',
    music: '🎵',
    family: '👨‍👩‍👧',
    work: '💼',
    school: '📚',
    seasons: '🍂',
    festivals: '🎆',
    animals: '🐾',
};

export const ALL_TOPICS = Object.keys(TOPIC_LABELS);

export const DIFFICULTY_LABELS: Record<DifficultyLevel, string> = {
    N5: 'N5 (Beginner)',
    N4: 'N4 (Elementary)',
    N3: 'N3 (Intermediate)',
    N2: 'N2 (Advanced)',
    N1: 'N1 (Mastery)',
    adaptive: 'Adaptive (Auto)',
};

export const DIFFICULTY_COLORS: Record<DifficultyLevel, string> = {
    N5: '#48BB78',
    N4: '#4DABF7',
    N3: '#F4ACB7',
    N2: '#CDB4DB',
    N1: '#9B5DE5',
    adaptive: '#FFD6A5',
};
