import { z } from 'zod';

export const uuidSchema = z.string().uuid();

// --- SHARED ENUMS ---
export const KnowledgeUnitTypeSchema = z.enum(['radical', 'kanji', 'vocabulary', 'grammar']);
export const SRSStageSchema = z.enum(['new', 'learning', 'review', 'burned']);
export const RatingSchema = z.enum(['again', 'good']);
export const SourceTypeSchema = z.enum(['youtube', 'chat', 'manual', 'analyze']);

export const QuestionTypeSchema = z.enum(['fill_in', 'cloze']);
export const SessionStatusSchema = z.enum(['active', 'finished']);
export const BatchStatusSchema = z.enum(['in_progress', 'completed', 'abandoned']);
export const AnswerStateSchema = z.enum(['unanswered', 'correct', 'incorrect']);

// --- CORE KNOWLEDGE ---
export const KnowledgeUnitSchema = z.object({
    id: z.string().uuid().optional(),
    slug: z.string().min(1),
    type: KnowledgeUnitTypeSchema,
    character: z.string().min(1),
    level: z.number().int().min(1).max(60),
    meaning: z.string().min(1),
    mnemonics: z.any().optional(),
    details: z.any().optional(),
});

// --- SRS & LEARNING ---
export const SRSStateSchema = z.object({
    stage: SRSStageSchema,
    stability: z.number().min(0),
    difficulty: z.number().min(1.3),
    reps: z.number().int().min(0),
    lapses: z.number().int().min(0),
});

export const UserLearningStateSchema = z.object({
    user_id: z.string().uuid(),
    ku_id: z.string().min(1),
    state: SRSStageSchema,
    next_review: z.string().datetime(),
    last_review: z.string().datetime().nullable().optional(),
    stability: z.number(),
    difficulty: z.number(),
    reps: z.number().int(),
    lapses: z.number().int(),
});

// --- SENTENCE & MINING ---
export const SentenceEntitySchema = z.object({
    id: z.string().uuid().optional(),
    user_id: z.string().uuid(),
    text_ja: z.string().min(1),
    text_en: z.string().optional().nullable(),
    source_type: SourceTypeSchema,
    source_id: z.string().optional().nullable(),
    timestamp: z.number().optional().nullable(),
    created_at: z.string().datetime().optional(),
});

export const MineSentenceParamsSchema = z.object({
    textJa: z.string().min(1),
    textEn: z.string().optional(),
    targetWord: z.string().optional(),
    targetMeaning: z.string().optional(),
    sourceType: SourceTypeSchema.optional(),
    sourceId: z.string().optional(),
});

// --- CHAT ---
export const ChatMessageSchema = z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string().min(1),
    timestamp: z.string().datetime(),
    metadata: z.any().optional(),
});

export const ChatSessionSchema = z.object({
    id: z.string().min(1), // Session ID might be UUID or custom string
    userId: z.string().uuid(),
    messages: z.array(ChatMessageSchema),
    updatedAt: z.string().datetime(),
});

// --- ANALYTICS ---
export const DashboardStatsSchema = z.object({
    reviewsDue: z.number().int().min(0),
    dueBreakdown: z.object({
        learning: z.number().int(),
        review: z.number().int(),
    }).optional(),
    totalLearned: z.number().int().min(0),
    totalMastered: z.number().int().min(0).optional(),
    totalBurned: z.number().int().min(0).optional(),
    unlockedLevel: z.number().int().min(1).max(60),
    recentLevels: z.array(z.number().int()),
    retention: z.number().min(0).max(100).optional(),
    minutesSpent: z.number().min(0).optional(),
    streak: z.number().int().min(0).optional(),
    totalKUCoverage: z.number().optional(),
});

// --- YOUTUBE ---
export const YouTubeMetadataSchema = z.object({
    videoId: z.string().min(11), // YouTube video IDs are usually 11 chars
    title: z.string(),
    thumbnail: z.string().url().optional(),
    channelTitle: z.string().optional(),
    description: z.string().optional(),
});

// Helper Types for inference
export type KnowledgeUnitType = z.infer<typeof KnowledgeUnitTypeSchema>;
export type KnowledgeUnit = z.infer<typeof KnowledgeUnitSchema>;
export type SRSState = z.infer<typeof SRSStateSchema>;
export type Rating = z.infer<typeof RatingSchema>;
export type MineSentenceParams = z.infer<typeof MineSentenceParamsSchema>;
export type ChatMessage = z.infer<typeof ChatMessageSchema>;
export type ChatSession = z.infer<typeof ChatSessionSchema>;
