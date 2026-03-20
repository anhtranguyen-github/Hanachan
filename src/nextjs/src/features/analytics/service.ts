import { supabase } from '@/lib/supabase';
import { HanaTime } from '@/lib/time';
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
        const today = HanaTime.getNowISO().split('T')[0];
        
        const { data: logs } = await supabase
            .from('fsrs_review_logs')
            .select('rating, created_at')
            .eq('user_id', userId)
            .gte('created_at', today);

        if (!logs || logs.length === 0) {
            return {
                daily: {
                    minutes: 0,
                    reviews: 0,
                    retention: 100
                }
            };
        }

        const reviews = logs.length;
        const correct = logs.filter(l => l.rating > 1).length;
        const retention = Math.round((correct / reviews) * 100);
        const minutes = Math.round(reviews * 0.5); // 30s per review avg

        return {
            daily: {
                minutes,
                reviews,
                retention
            }
        };
    }
}

export const analyticsService = new AnalyticsService();
