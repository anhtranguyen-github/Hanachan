import { z } from "zod";
import { type LearningStatus } from '@/config/design.config';

export type ContentType = 'radical' | 'kanji' | 'vocabulary' | 'grammar';

// Unified with design system - use LearningStatus
export type ItemState = LearningStatus;
export type SrsState = LearningStatus;

export const ContentTypeSchema = z.enum(["radical", "kanji", "vocabulary", "grammar"]);
export const ItemStateSchema = z.enum(["new", "learning", "review", "relearning", "burned"]);
export const SrsStateSchema = z.enum(["new", "learning", "review", "relearning", "burned"]);

// Stage name mapping (Interval-style)
export const getStageName = (stage: number): string => {
    if (stage === 0) return 'new';
    if (stage >= 9) return 'burned';
    if (stage >= 5) return 'review';
    return 'learning';
};

// Map SRS stage to unified learning state
export const stageToLearningState = (stage: number): LearningStatus => {
    if (stage === 0) return 'new';
    if (stage >= 9) return 'burned';
    if (stage >= 5) return 'review';
    // Logic for relearning usually comes from recent rating (Again), 
    // but for static stage mapping, we'll favor 'learning'.
    return 'learning';
};

// --- Missing Types ---

export const ReviewResultSchema = z.object({
    success: z.boolean(),
    next_review: z.string().optional(),
    interval: z.number().optional(),
    ease: z.number().optional(),
});

export type ReviewResult = z.infer<typeof ReviewResultSchema>;

export const ReviewQueueSchema = z.object({
    queue: z.array(z.any()),
    count: z.number()
});

export type ReviewQueue = z.infer<typeof ReviewQueueSchema>;

