import { supabase } from '@/lib/supabase';
import { UserProfile, UserSettings } from './types';

/**
 * Ensures a record exists in the public.users table for a given auth user.
 */
export async function provisionUserProfile(userId: string, email: string, displayName?: string, avatarUrl?: string): Promise<void> {
    const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('id', userId)
        .maybeSingle();

    if (!existing) {
        await supabase.from('users').insert({
            id: userId,
            display_name: displayName || email.split('@')[0],
            avatar_url: avatarUrl || null,
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

export async function updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<void> {
    // Only include fields that are defined (avoid overwriting with undefined)
    const safeUpdates: Record<string, unknown> = {};
    const allowedFields: (keyof UserProfile)[] = [
        'display_name', 'avatar_url', 'avatar_color', 'bio',
        'native_language', 'learning_goals', 'last_activity_at'
    ];
    for (const key of allowedFields) {
        if (key in updates) {
            safeUpdates[key] = updates[key];
        }
    }
    if (Object.keys(safeUpdates).length === 0) return;
    const { error } = await supabase.from('users').update(safeUpdates).eq('id', userId);
    if (error) {
        console.error("Error updating profile:", error);
        throw error;
    }
}
