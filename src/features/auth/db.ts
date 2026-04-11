import { supabase } from '@/lib/supabase';
import { UserProfile, UserSettings } from './types';

function isMissingUsersTableError(error: unknown): boolean {
    if (!error || typeof error !== 'object') return false;
    const code = 'code' in error ? error.code : undefined;
    return code === 'PGRST205';
}

export async function getUserLevelOrDefault(userId: string, fallback = 1): Promise<number> {
    const { data, error } = await supabase
        .from('users')
        .select('level')
        .eq('id', userId)
        .maybeSingle();

    if (error) {
        if (!isMissingUsersTableError(error)) {
            console.error('Error fetching user level:', error);
        }
        return fallback;
    }

    return data?.level || fallback;
}

/**
 * Ensures a record exists in the public.users table for a given auth user.
 */
export async function provisionUserProfile(userId: string, email: string, displayName?: string, avatarUrl?: string): Promise<void> {
    const { data: existing, error: existingError } = await supabase
        .from('users')
        .select('id')
        .eq('id', userId)
        .maybeSingle();

    if (existingError) {
        if (!isMissingUsersTableError(existingError)) {
            console.error('Error checking existing profile:', existingError);
        }
        return;
    }

    if (!existing) {
        const insertData: Record<string, unknown> = {
            id: userId,
            display_name: displayName || email.split('@')[0],
        };
        if (avatarUrl) insertData.avatar_url = avatarUrl;
        const { error } = await supabase.from('users').insert(insertData);
        if (error && !isMissingUsersTableError(error)) {
            console.error('Error provisioning profile:', error);
        }
    } else if (avatarUrl) {
        // Update avatar on subsequent logins
        const { error } = await supabase.from('users').update({ avatar_url: avatarUrl }).eq('id', userId);
        if (error && !isMissingUsersTableError(error)) {
            console.error('Error updating avatar:', error);
        }
    }
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

    if (error) {
        if (!isMissingUsersTableError(error)) {
            console.error("Error fetching profile:", error);
        }
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
        if (isMissingUsersTableError(error)) {
            return;
        }
        console.error("Error updating profile:", error);
        throw error;
    }
}
