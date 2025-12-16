import { createClient } from '@/services/supabase/server';
import { DailyStats, DashboardStats } from './types';

const DUMMY_USER_ID = "00000000-0000-0000-0000-000000000000";

export class AnalyticsService {

    /**
     * Log a review event to update stats in DB.
     */
    async logReview(isNew: boolean, isCorrect: boolean, userId: string = DUMMY_USER_ID) {
        const supabase = createClient();
        const today = new Date().toISOString().split('T')[0];

        // 1. Fetch current stats (or init defaults)
        const { data: current } = await supabase
            .from('user_daily_stats')
            .select('*')
            .eq('user_id', userId)
            .eq('day', today)
            .single();

        const stats = current || {
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
        stats.minutes_spent += 1; // Used 1 instead of 0.5 to match INT column type for now

        // 3. Upsert to DB
        const { error } = await supabase
            .from('user_daily_stats')
            .upsert(stats);

        if (error) console.error("❌ Stats Error:", error);
    }

    async getDashboardStats(userId: string = DUMMY_USER_ID) {
        const supabase = createClient();
        const today = new Date().toISOString().split('T')[0];

        // Parallel Fetch
        const [dailyRes, totalInfo] = await Promise.all([
            supabase.from('user_daily_stats').select('*').eq('user_id', userId).eq('day', today).single(),
            // Mock total info since we might allow 'null' decks
            Promise.resolve({ total: 100, due: 5 })
        ]);

        const daily = dailyRes.data || { minutes_spent: 0, reviews_completed: 0, correct_reviews: 0 };

        return {
            daily: {
                minutes: daily.minutes_spent,
                reviews: daily.reviews_completed,
                retention: daily.reviews_completed > 0
                    ? Math.round((daily.correct_reviews / daily.reviews_completed) * 100)
                    : 100
            }
        };
    }
}

export const analyticsService = new AnalyticsService();
