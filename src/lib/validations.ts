import { z } from 'zod';

/**
 * Standard UUID validation schema.
 * Replaces generic strings to prevent Postgres 22P02 "Invalid Text Representation" errors.
 */
export const uuidSchema = z.string().uuid({ message: "Invalid UUID format" });

/**
 * Learning State Validation Schema
 */
export const learningStateSchema = z.object({
    user_id: uuidSchema,
    ku_id: uuidSchema,
    state: z.enum(['new', 'learning', 'review', 'relearning', 'burned']),
    stability: z.number().min(0),
    difficulty: z.number().min(0),
    next_review: z.string().datetime().or(z.date()),
    reps: z.number().int().min(0),
    lapses: z.number().int().min(0)
});
