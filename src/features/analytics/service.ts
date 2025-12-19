import * as db from './db';
import { DailyStats, DashboardStats } from './types';
import { uuidSchema } from '@/lib/validations';

const DUMMY_USER_ID = "00000000-0000-0000-0000-000000000000";

export class AnalyticsService {

    /**
     * Log a review event to update stats in DB.
     */
    async logReview(isNew: boolean, isCorrect: boolean, userId: string = DUMMY_USER_ID) {
        uuidSchema.parse(userId);
        const today = new Date().toISOString().split('T')[0];

        // 1. Fetch current stats (or init defaults)
        const current = await db.getDailyStats(userId, today);

        const stats = current ? { ...current } : {
            user_id: userId,
            day: today,
            minutes_spent: 0,
            reviews_completed: 0,
            new_cards_learned: 0,
            correct_reviews: 0
        };

        // 2. Update memory values
        stats.reviews_completed++;
        if (isNew) stats.new_cards_learned++;
        if (isCorrect) stats.correct_reviews++;
        stats.minutes_spent += 1;

        // 3. Upsert to DB
        try {
            await db.upsertDailyStats(stats);
        } catch (error) {
            console.error("❌ Stats Error:", error);
        }
    }

    /**
     * Compatibility wrapper for trackReview
     */
    async trackReview(userId: string, isNew: boolean, isCorrect: boolean = true) {
        return this.logReview(isNew, isCorrect, userId);
    }

    async getDashboardStats(userId: string = DUMMY_USER_ID) {
        uuidSchema.parse(userId);
        const today = new Date().toISOString().split('T')[0];

        // 1. Get daily stats
        const dailyData = await db.getDailyStats(userId, today);
        const daily = dailyData || { minutes_spent: 0, reviews_completed: 0, correct_reviews: 0 };

        return {
            daily: {
                minutes: daily.minutes_spent,
                reviews: daily.reviews_completed,
                retention: daily.reviews_completed > 0
                    ? Math.round((daily.correct_reviews / (daily.reviews_completed as number)) * 100)
                    : 100
            }
        };
    }
}

export const analyticsService = new AnalyticsService();
