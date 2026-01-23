import * as db from './db';
import { DailyStats, DashboardStats } from './types';
import { uuidSchema } from '@/lib/validation';

export class AnalyticsService {

    /**
     * Log a review event to update stats in DB.
     */
    async logReview(isNew: boolean, isCorrect: boolean, userId: string) {
        // Persistence to daily_stats table is disabled as the table does not exist.
        // In the future, this can log to a different store or calculate on the fly.
        console.log(`[Analytics] Review logged for ${userId}: new=${isNew}, correct=${isCorrect}. (Persistence skipped)`);
    }

    /**
     * Compatibility wrapper for trackReview
     */
    async trackReview(userId: string, isNew: boolean, isCorrect: boolean = true) {
        return this.logReview(isNew, isCorrect, userId);
    }

    async getDashboardStats(userId: string) {
        // Return default stats since daily_stats table does not exist.
        return {
            daily: {
                minutes: 0,
                reviews: 0,
                retention: 100
            }
        };
    }
}

export const analyticsService = new AnalyticsService();
