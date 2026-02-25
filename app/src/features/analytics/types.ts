import { z } from 'zod';
import { DashboardStatsSchema } from '@/lib/validation';

export type DashboardStats = z.infer<typeof DashboardStatsSchema>;

export interface DailyStats {
    user_id: string;
    day: string; // YYYY-MM-DD
    minutes_spent: number;
    reviews_completed: number;
    new_cards_learned: number;
    correct_reviews: number;
}
