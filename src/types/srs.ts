import { z } from "zod";
import { type LearningStatus } from '@/config/design.config';

export type ContentType = 'radical' | 'kanji' | 'vocabulary' | 'grammar';

// Unified with design system - use LearningStatus
export type ItemState = LearningStatus;
export type SrsState = LearningStatus;

export type DeckSource = 'SYSTEM';

export const ContentTypeSchema = z.enum(["radical", "kanji", "vocabulary", "grammar"]);
export const ItemStateSchema = z.enum(["new", "learning", "review", "relearning", "burned"]);
export const SrsStateSchema = z.enum(["new", "learning", "review", "relearning", "burned"]);
export const DeckSourceSchema = z.enum(["SYSTEM"]);

export interface SrsItem {
    id: string;
    user_id: string;
    content_id: string;
    content_type: ContentType;
    item_state: ItemState;
    srs_stage: number;
    interval_days: number;
    ease_factor: number;
    next_review: string | null;
    last_review: string | null;
    learned_at: string | null;
    total_reps: number;
    lapses: number;
    last_rating: number | null;
    created_at?: string;
    updated_at?: string;
}

export interface Deck {
    id: string;
    user_id?: string;
    name: string;
    slug: string | null;
    description: string | null;
    source: DeckSource;
    created_at: string;

    // Stats / UI fields
    itemCount?: number;           // total cards
    total_cards?: number;         // alias
    new_cards?: number;
    learning_count?: number;      // current learning
    learning_cards?: number;      // alias
    review_count?: number;        // current review
    review_cards?: number;        // alias
    mastered_count?: number;      // mastered
    mastered_cards?: number;      // alias
    due_count?: number;           // due for review
    is_bookmarked?: boolean;

    items?: Array<{
        content_id: string;
        content_type: string;
    }>;
}

// Stage name mapping (WaniKani-style)
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

