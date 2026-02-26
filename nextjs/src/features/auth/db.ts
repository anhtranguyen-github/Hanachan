import { supabase } from '@/lib/supabase';
import { UserProfile, UserSettings } from './types';

/**
 * Ensures a record exists in the public.users table for a given auth user.
 */
export async function provisionUserProfile(userId: string, email: string, displayName?: string): Promise<void> {
    const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('id', userId)
        .maybeSingle();

    if (!existing) {
        await supabase.from('users').insert({
            id: userId,
            display_name: displayName || email.split('@')[0],
        });
    }
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

    if (error) {
        console.error("Error fetching profile:", error);
        return null;
    }

    return data as UserProfile | null;
}

export async function updateUserProfile(userId: string, data: Partial<UserProfile>): Promise<void> {
    await supabase.from('users').update(data).eq('id', userId);
}
