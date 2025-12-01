import { createClient } from '@/services/supabase/server';
import { UserProfile, UserSettings } from './types';

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

    if (error) {
        console.error('Error fetching user profile:', error);
        return null;
    }
    return data as UserProfile;
}

export async function updateUserProfile(userId: string, data: Partial<UserProfile>): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
        .from('users')
        .update(data)
        .eq('id', userId);

    if (error) {
        throw new Error(`Failed to update user profile: ${error.message}`);
    }
}

export async function getUserSettings(userId: string): Promise<UserSettings | null> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

    if (error) {
        console.error('Error fetching user settings:', error);
        return null;
    }
    return data as UserSettings;
}

export async function updateUserSettings(userId: string, settings: Partial<UserSettings>): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
        .from('user_settings')
        .update(settings)
        .eq('user_id', userId);

    if (error) {
        throw new Error(`Failed to update user settings: ${error.message}`);
    }
}
