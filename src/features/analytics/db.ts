import { createClient } from '@/services/supabase/server';
import { DailyStats } from './types';

export async function getDailyStats(userId: string, date: string): Promise<DailyStats | null> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('user_daily_stats')
        .select('*')
        .eq('user_id', userId)
        .eq('day', date)
        .single();

    if (error && error.code !== 'PGRST116') {
        console.error('Error fetching daily stats:', error);
        return null;
    }
    return data as DailyStats;
}

export async function incrementDailyStats(
    userId: string,
    date: string,
    field: keyof Omit<DailyStats, 'user_id' | 'day' | 'success_rate'>,
    increment: number = 1
): Promise<void> {
    const supabase = createClient();

    // Postgres UPSERT with increment using RPC or multiple calls.
    // Simplifying for now with a raw query or simple check.
    // Best practice: use a Supabase function (RPC) for atomicity.

    const { data: existing } = await supabase
        .from('user_daily_stats')
        .select('*')
        .eq('user_id', userId)
        .eq('day', date)
        .single();

    if (existing) {
        await supabase
            .from('user_daily_stats')
            .update({ [field]: (existing[field] || 0) + increment })
            .eq('user_id', userId)
            .eq('day', date);
    } else {
        await supabase
            .from('user_daily_stats')
            .insert({
                user_id: userId,
                day: date,
                [field]: increment
            });
    }
}
