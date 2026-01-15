import { DailyStats } from './types';

export async function getDailyStats(userId: string, date: string): Promise<DailyStats | null> {
    // Mock implementation
    return {
        user_id: userId,
        day: date,
        reviews_count: 42,
        new_items_count: 5,
        success_rate: 0.85
    } as DailyStats;
}

export async function incrementDailyStats(
    userId: string,
    date: string,
    field: keyof Omit<DailyStats, 'user_id' | 'day' | 'success_rate'>,
    increment: number = 1
): Promise<void> {
    console.log(`🛠️ [Mock] Incrementing ${field} by ${increment} for ${userId} on ${date}`);
}

export async function upsertDailyStats(stats: Partial<DailyStats> & { user_id: string; day: string }): Promise<void> {
    console.log(`🛠️ [Mock] Upserting daily stats for ${stats.user_id} on ${stats.day}`);
}

