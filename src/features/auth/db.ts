import { supabase } from '@/lib/supabase';
import { UserProfile, UserSettings } from './types';

/**
 * Ensures a record exists in the public.users table for a given auth user.
 * This is a safeguard for environments without Supabase DB triggers.
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

        // Also Provision Default Settings
        await supabase.from('user_settings').insert({
            user_id: userId,
            target_retention: 0.9
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

export async function getUserSettings(userId: string): Promise<UserSettings | null> {
    const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

    if (error) {
        console.error("Error fetching settings:", error);
        return null;
    }

    return data as UserSettings | null;
}

export async function updateUserSettings(userId: string, settings: Partial<UserSettings>): Promise<void> {
    await supabase.from('user_settings').upsert({
        user_id: userId,
        ...settings,
        updated_at: new Date().toISOString()
    });
}
