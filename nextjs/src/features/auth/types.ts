/**
 * Auth Module - Role and Permission Types
 * 
 * SINGLE SOURCE OF TRUTH for role definitions.
 */

/**
 * Roles in the system (ordered by power level)
 */
export type Role = 'USER' | 'ADMIN';

/**
 * Permissions that can be granted to roles
 */
export type Permission =
    | 'read:public'      // Public content (no auth required)
    | 'read:content'     // Protected content (kanji, vocab, grammar details)
    | 'use:srs'          // SRS features (lessons, reviews)
    | 'use:tools'        // Tools (dictionary, analyzer without AI)
    | 'use:ai'           // AI features (explanations, chat, quiz generation)
    | 'use:chat'         // Chat with Hana
    | 'manage:users'     // User management (admin)
    | 'manage:content';  // Content management (admin)

/**
 * Role hierarchy - higher number = more power
 */
export const ROLE_POWER: Record<Role, number> = {
    USER: 1,
    ADMIN: 2,
};

/**
 * Checks if a role has at least the power of another role
 */
export function hasRolePower(userRole: Role, requiredRole: Role): boolean {
    return ROLE_POWER[userRole] >= ROLE_POWER[requiredRole];
}

export interface UserProfile {
    id: string;
    email?: string | null;
    display_name?: string | null;
    avatar_url?: string | null;
    avatar_color?: string | null;
    bio?: string | null;
    native_language?: string | null;
    learning_goals?: string[] | null;
    role: Role;
    level: number;
    created_at?: string;
    last_activity_at?: string;
}

export interface UserSettings {
    theme?: 'light' | 'dark' | 'system';
    review_batch_size?: number;
    daily_goal?: number;
}
