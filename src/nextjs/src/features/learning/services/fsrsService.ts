/**
 * FSRS (Free Spaced Repetition Scheduler) Service
 * Implements the FSRS-4.5 algorithm for optimal review scheduling.
 * Moved from FastAPI to Next.js as part of Phase 2 architectural remediation.
 * 
 * Architecture: Next.js BFF pattern - all business logic in Next.js,
 * data access through Supabase client (RLS-protected)
 */

import { supabase } from "@/lib/supabase";
import { HanaTime } from "@/lib/time";

// Use service role client on server to bypass RLS issues during Phase 2 transition
// Security: Functions must ALWAYS include .eq('user_id', userId)
const db = supabase;
import { addDays } from 'date-fns';

// FSRS-4.5 Default Parameters (19 weights)
// These are the default values from the FSRS-4.5 paper
export const DEFAULT_FSRS_WEIGHTS = [
    0.4,   // w0: Initial stability for rating 1 (Again)
    0.6,   // w1: Initial stability for rating 2 (Hard)
    2.2,   // w2: Initial stability for rating 3 (Good)
    10.9,  // w3: Initial stability for rating 4 (Easy)
    5.8,   // w4: Initial difficulty
    0.93,  // w5: Difficulty factor
    0.94,  // w6: Stability gain for Again
    0.86,  // w7: Stability gain for Hard
    1.01,  // w8: Stability gain for Good
    1.05,  // w9: Stability gain for Easy
    0.94,  // w10: Retrievability factor
    0.74,  // w11: Difficulty damping
    0.46,  // w12: Difficulty mean reversion
    0.27,  // w13: Short-term stability
    0.42,  // w14: Short-term stability exponent
    0.36,  // w15: Short-term difficulty
    0.29,  // w16: Short-term difficulty exponent
    1.2,   // w17: Initial stability for relearning
    0.25   // w18: Relearning stability factor
];

export interface FSRSSettings {
    user_id: string;
    w: number[];  // FSRS Weights w0-w18
    daily_new_cards: number;
    daily_review_limit: number;
    learning_steps: number[];  // Minutes
    relearning_steps: number[];  // Minutes
    graduation_interval: number;  // Days
    easy_interval: number;  // Days
    interval_modifier: number;
    show_answer_timer: boolean;
    auto_play_audio: boolean;
}

export interface FSRSState {
    user_id: string;
    ku_id: string;
    item_type_placeholder: string;
    facet: string;
    state: 'new' | 'learning' | 'review' | 'relearning' | 'burned';
    stability: number;
    difficulty: number;
    reps: number;
    lapses: number;
    last_review: string | null;
    next_review: string | null;
}

export interface FSRSSchedule {
    ku_id: string;
    item_type_placeholder: string;
    due_date: string;
    interval_days: number;
    priority_score: number;
    is_new: boolean;
}

export interface FSRSReviewResult {
    state: string;
    stability: number;
    difficulty: number;
    reps: number;
    lapses: number;
    next_review: string;
    interval_days: number;
}

export interface LearningSummary {
    by_type: Record<string, { total: number; states: Record<string, number> }>;
    by_state: { new: number; learning: number; review: number; relearning: number; burned: number };
    total: number;
    due_today: number;
}

export type Rating = 1 | 2 | 3 | 4;  // 1=Again, 2=Hard, 3=Good, 4=Easy

/**
 * FSRS-4.5 Scheduler implementation
 */
class FSRSScheduler {
    private w: number[];

    constructor(weights?: number[]) {
        this.w = weights || [...DEFAULT_FSRS_WEIGHTS];
    }

    private _initDifficulty(rating: Rating): number {
        // w[4] is initial difficulty
        return this.w[4] - Math.exp(this.w[5] * (rating - 1)) + 1;
    }

    private _initStability(rating: Rating): number {
        // w[0-3] are initial stabilities for ratings 1-4
        return Math.max(0.1, this.w[rating - 1]);
    }

    private _nextDifficulty(difficulty: number, rating: Rating): number {
        // w[6] is difficulty decay
        const nextD = difficulty - this.w[6] * (rating - 3);
        // Clamp between 1 and 10
        return Math.max(1.0, Math.min(10.0, nextD));
    }

    private _nextStability(
        stability: number,
        difficulty: number,
        rating: Rating,
        state: string
    ): number {
        if (rating === 1) {  // Again (failed)
            // w[11] is failure stability factor
            return Math.max(
                0.1,
                this.w[11]
                * Math.pow(difficulty, -this.w[12])
                * (Math.pow(stability + 1, this.w[13]) - 1)
                * Math.exp((1 - rating) * this.w[14])
            );
        } else {
            // Success path
            if (state === 'new') {
                return this._initStability(rating);
            }

            // w[7-10] are stability factors for successful reviews
            const hardPenalty = rating === 4 ? 1.0 : this.w[15];
            const easyBonus = rating === 2 ? 1.0 : this.w[16];
            const retrievability = Math.exp(Math.log(0.9) * 1.0);  // Simplified

            const nextS = stability * (
                1
                + Math.exp(this.w[8])
                * (11 - difficulty)
                * Math.pow(stability, -this.w[9])
                * (Math.exp((1 - retrievability) * this.w[10]) - 1)
                * hardPenalty
                * easyBonus
            );
            return Math.max(0.1, nextS);
        }
    }

    scheduleReview(
        currentState: FSRSState,
        rating: Rating
    ): FSRSReviewResult {
        const now = HanaTime.getNowISO();

        let stability: number;
        let difficulty: number;
        let reps: number;
        let lapses: number;
        let state: string;

        if (currentState.state === 'new') {
            // First review
            stability = this._initStability(rating);
            difficulty = this._initDifficulty(rating);
            reps = rating > 1 ? 1 : 0;
            lapses = 0;
            state = rating < 4 ? 'learning' : 'review';
        } else {
            // Subsequent review
            stability = this._nextStability(
                currentState.stability,
                currentState.difficulty,
                rating,
                currentState.state
            );
            difficulty = this._nextDifficulty(currentState.difficulty, rating);

            if (rating === 1) {
                // Failed - reset reps and increment lapses
                reps = Math.max(0, currentState.reps - 2);
                lapses = currentState.lapses + 1;
                state = 'relearning';
            } else {
                // Success
                reps = currentState.reps + 1;
                lapses = currentState.lapses;
                state = reps >= 2 ? 'review' : 'learning';
            }
        }

        // Calculate next review date
        const intervalDays = stability;
        const nextReview = addDays(new Date(), intervalDays).toISOString();

        return {
            state,
            stability,
            difficulty,
            reps,
            lapses,
            next_review: nextReview,
            interval_days: intervalDays
        };
    }

    getRetrievability(stability: number, daysSinceReview: number): number {
        if (stability <= 0 || daysSinceReview < 0) {
            return 1.0;
        }
        return Math.exp(Math.log(0.9) * daysSinceReview / stability);
    }
}

// Cache for user schedulers
const userSchedulers: Map<string, FSRSScheduler> = new Map();

/**
 * FSRS Service - Main service class for FSRS operations
 */
export const fsrsService = {
    /**
     * Get or create a scheduler with user's custom weights
     */
    _getUserScheduler(userId: string): FSRSScheduler {
        if (!userSchedulers.has(userId)) {
            // For now, use default weights
            // TODO: Load user-specific weights from settings
            userSchedulers.set(userId, new FSRSScheduler());
        }
        return userSchedulers.get(userId)!;
    },

    /**
     * Get FSRS settings for a user
     */
    async getUserSettings(userId: string): Promise<FSRSSettings> {
        const { data, error } = await supabase
            .from('user_fsrs_settings')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error || !data) {
            // Create default settings
            await this._createDefaultSettings(userId);
            return {
                user_id: userId,
                w: [...DEFAULT_FSRS_WEIGHTS],
                daily_new_cards: 10,
                daily_review_limit: 100,
                learning_steps: [1, 10],
                relearning_steps: [10],
                graduation_interval: 1,
                easy_interval: 4,
                interval_modifier: 1.0,
                show_answer_timer: true,
                auto_play_audio: false
            };
        }

        // Map weights from individual columns to array
        const weights = [
            data.w0, data.w1, data.w2, data.w3, data.w4,
            data.w5, data.w6, data.w7, data.w8, data.w9,
            data.w10, data.w11, data.w12, data.w13, data.w14,
            data.w15, data.w16, data.w17, data.w18
        ];

        return {
            user_id: data.user_id,
            w: weights,
            daily_new_cards: data.daily_new_cards,
            daily_review_limit: data.daily_review_limit,
            learning_steps: data.learning_steps,
            relearning_steps: data.relearning_steps,
            graduation_interval: data.graduation_interval,
            easy_interval: data.easy_interval,
            interval_modifier: data.interval_modifier,
            show_answer_timer: data.show_answer_timer,
            auto_play_audio: data.auto_play_audio
        };
    },

    /**
     * Create default FSRS settings for a user
     */
    async _createDefaultSettings(userId: string): Promise<void> {
        const { error } = await supabase
            .from('user_fsrs_settings')
            .insert({ user_id: userId })
            .select()
            .single();

        if (error && error.code !== '23505') {  // Ignore unique constraint violations
            console.error('[fsrsService] Error creating default settings:', error);
        }
    },

    /**
     * Get items due for review for a user
     */
    async getDueItems(
        userId: string,
        itemType?: string,
        limit: number = 20
    ): Promise<FSRSSchedule[]> {
        const tomorrow = addDays(new Date(), 1).toISOString();

        let query = db
            .from('user_learning_states')
            .select('*')
            .eq('user_id', userId)
            .lte('next_review', tomorrow)
            .neq('state', 'burned')
            .order('next_review', { ascending: true })
            .limit(limit);

        const { data, error } = await query;

        if (error) {
            console.error('[fsrsService] Error fetching due items:', error);
            return [];
        }

        const now = new Date();
        const schedules: FSRSSchedule[] = [];

        for (const row of data || []) {
            const nextReview = new Date(row.next_review);
            const daysOverdue = Math.max(0, (now.getTime() - nextReview.getTime()) / (1000 * 86400));
            const priorityScore = daysOverdue + (1.0 / Math.max(1, row.stability));

            schedules.push({
                ku_id: row.ku_id,
                item_type_placeholder: 'ku',
                due_date: row.next_review,
                interval_days: row.stability,
                priority_score: priorityScore,
                is_new: row.state === 'new'
            });
        }

        return schedules;
    },

    /**
     * Get summary of user's learning state
     */
    async getLearningSummary(userId: string): Promise<LearningSummary> {
        const { data, error } = await db
            .from('user_learning_states')
            .select('state')
            .eq('user_id', userId);

        if (error) {
            console.error('[fsrsService] Error fetching learning summary:', error);
            return {
                by_type: {},
                by_state: { new: 0, learning: 0, review: 0, relearning: 0, burned: 0 },
                total: 0,
                due_today: 0
            };
        }

        const summary: LearningSummary = {
            by_type: {},
            by_state: { new: 0, learning: 0, review: 0, relearning: 0, burned: 0 },
            total: 0,
            due_today: 0
        };

        for (const row of data || []) {
            const state = row.state;
            const itemType = 'ku';

            if (!summary.by_type[itemType]) {
                summary.by_type[itemType] = { total: 0, states: {} };
            }

            summary.by_type[itemType].total++;
            summary.by_type[itemType].states[state] = (summary.by_type[itemType].states[state] || 0) + 1;
            summary.by_state[state as keyof typeof summary.by_state]++;
            summary.total++;
        }

        // Count due today
        const tomorrow = addDays(new Date(), 1).toISOString();
        const { count, error: countError } = await db
            .from('user_learning_states')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .lte('next_review', tomorrow)
            .neq('state', 'burned');

        if (!countError && count !== null) {
            summary.due_today = count;
        }

        return summary;
    },

    /**
     * Submit a review and update the schedule
     */
    async submitReview(
        userId: string,
        itemId: string,
        itemType: string,
        rating: Rating,
        facet: string = 'meaning'
    ): Promise<FSRSReviewResult> {
        const scheduler = this._getUserScheduler(userId);

        const { data: current, error } = await db
            .from('user_learning_states')
            .select('*')
            .eq('user_id', userId)
            .eq('ku_id', itemId)
            .eq('facet', facet)
            .single();

        let state: FSRSState;

        if (error || !current) {
            // New item
            state = {
                user_id: userId,
                ku_id: itemId,
                item_type_placeholder: itemType,
                facet: facet,
                state: 'new',
                stability: 0,
                difficulty: 5.0,
                reps: 0,
                lapses: 0,
                last_review: null,
                next_review: null
            };
        } else {
            state = {
                user_id: current.user_id,
                ku_id: current.ku_id,
                item_type_placeholder: current.item_type_placeholder,
                facet: current.facet,
                state: current.state,
                stability: current.stability,
                difficulty: current.difficulty,
                reps: current.reps,
                lapses: current.lapses,
                last_review: current.last_review,
                next_review: current.next_review
            };
        }

        // Calculate new schedule
        const result = scheduler.scheduleReview(state, rating);

        // Save to database
        const now = HanaTime.getNowISO();
        const { error: upsertError } = await db
            .from('user_learning_states')
            .upsert({
                user_id: userId,
                ku_id: itemId,
                facet: facet,
                state: result.state,
                stability: result.stability,
                difficulty: result.difficulty,
                reps: result.reps,
                lapses: result.lapses,
                last_review: now,
                next_review: result.next_review,
                updated_at: now
            }, {
                onConflict: 'user_id,ku_id,facet'
            });

        if (upsertError) {
            console.error('[fsrsService] Error updating state:', upsertError);
            throw upsertError;
        }

        // Log the review
        const { error: logError } = await db
            .from('fsrs_review_logs')
            .insert({
                user_id: userId,
                ku_id: itemId,
                facet: facet,
                rating: rating,
                state: result.state,
                stability: result.stability,
                difficulty: result.difficulty,
                interval_days: result.interval_days,
                reviewed_at: now
            });

        if (logError) {
            console.error('[fsrsService] Error logging review:', logError);
        }

        return result;
    },

    /**
     * Decide whether the user should learn new content or review existing items
     */
    async shouldTeachOrReview(userId: string): Promise<{ action: string; details: Record<string, any> }> {
        const summary = await this.getLearningSummary(userId);
        const dueCount = summary.due_today;
        const reviewCount = summary.by_state.review;
        const learningCount = summary.by_state.learning;

        // If many items are due, prioritize review
        if (dueCount >= 10) {
            return {
                action: 'review',
                details: {
                    reason: 'Many items due for review',
                    due_count: dueCount,
                    suggested_reviews: Math.min(dueCount, 20)
                }
            };
        }

        // If user has items in learning state, continue with mixed approach
        if (learningCount > 0) {
            return {
                action: 'mixed',
                details: {
                    reason: 'Items in learning state need reinforcement',
                    learning_count: learningCount,
                    suggested_new: 5,
                    suggested_reviews: Math.min(dueCount + 5, 15)
                }
            };
        }

        // If user has few reviews, teach new content
        if (reviewCount < 20) {
            return {
                action: 'teach',
                details: {
                    reason: 'Building foundational knowledge',
                    review_count: reviewCount,
                    suggested_new: 10
                }
            };
        }

        // Default to review
        return {
            action: 'review',
            details: {
                reason: 'Maintaining existing knowledge',
                due_count: dueCount,
                suggested_reviews: Math.min(dueCount, 20)
            }
        };
    },

    /**
     * Update user FSRS settings
     */
    async updateUserSettings(userId: string, settings: Partial<FSRSSettings>): Promise<FSRSSettings> {
        const allowedFields = [
            'daily_new_cards', 'daily_review_limit', 'learning_steps',
            'relearning_steps', 'graduation_interval', 'easy_interval',
            'interval_modifier', 'show_answer_timer', 'auto_play_audio'
        ];

        const updates: Record<string, any> = {};
        for (const key of allowedFields) {
            if (key in settings) {
                updates[key] = settings[key as keyof FSRSSettings];
            }
        }

        // Handle weights array specially
        if (settings.w && Array.isArray(settings.w)) {
            for (let i = 0; i < Math.min(settings.w.length, 19); i++) {
                updates[`w${i}`] = settings.w[i];
            }
        }

        if (Object.keys(updates).length === 0) {
            return this.getUserSettings(userId);
        }

        updates.updated_at = HanaTime.getNowISO();

        const { error } = await db
            .from('user_fsrs_settings')
            .update(updates)
            .eq('user_id', userId);

        if (error) {
            console.error('[fsrsService] Error updating settings:', error);
            throw error;
        }

        // Clear cached scheduler to pick up new weights
        userSchedulers.delete(userId);

        return this.getUserSettings(userId);
    },

    /**
     * Get retrievability for an item
     */
    getRetrievability(stability: number, daysSinceReview: number): number {
        const scheduler = new FSRSScheduler();
        return scheduler.getRetrievability(stability, daysSinceReview);
    }
};

export default fsrsService;
