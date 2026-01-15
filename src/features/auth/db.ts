import { UserProfile, UserSettings } from './types';

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
    return {
        id: userId,
        email: 'demo@hanachan.app',
        display_name: 'Hanachan Learner',
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Hanachan',
        created_at: new Date().toISOString()
    };
}

export async function updateUserProfile(userId: string, data: Partial<UserProfile>): Promise<void> {
    console.log(`🛠️ [Mock] Updating profile for ${userId}:`, data);
}

export async function getUserSettings(userId: string): Promise<UserSettings | null> {
    return {
        user_id: userId,
        target_retention: 0.9,
        fsrs_weights: [1, 2, 3, 4],
        updated_at: new Date().toISOString()
    };
}

export async function updateUserSettings(userId: string, settings: Partial<UserSettings>): Promise<void> {
    console.log(`🛠️ [Mock] Updating settings for ${userId}:`, settings);
}

