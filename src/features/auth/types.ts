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
 * Check if a role has at least the power of another role
 */
export function hasRolePower(userRole: Role, requiredRole: Role): boolean {
    return ROLE_POWER[userRole] >= ROLE_POWER[requiredRole];
}
