import { supabase } from '@/lib/supabase';
import { DailyStats } from './types';

export async function getDailyStats(userId: string, date: string): Promise<DailyStats | null> {
    // daily_stats table does not exist. 
    // We could calculate from user_learning_logs if needed.
    // For now, return null to signify no persistent daily_stats table.
    return null;
}

export async function incrementDailyStats(
    userId: string,
    date: string,
    field: string,
    increment: number = 1
): Promise<void> {
    // Disabled as daily_stats table does not exist
}

export async function upsertDailyStats(stats: any): Promise<void> {
    // Disabled as daily_stats table does not exist
}
