export type Role = 'USER' | 'ADMIN';

/** Global AI quota limit for all users (monthly) */
export const AI_QUOTA_LIMIT = 100;

/** AI quota per role - Deprecated: use AI_QUOTA_LIMIT instead */
export const AI_QUOTA: Record<Role, number> = {
    USER: AI_QUOTA_LIMIT,
    ADMIN: Infinity,
};
