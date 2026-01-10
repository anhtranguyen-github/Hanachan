import { z } from "zod";

export type UserRole = 'USER' | 'ADMIN';
export type UserTier = 'FREE' | 'PREMIUM';

export const UserUsageSchema = z.object({
    ai_calls: z.object({
        count: z.number().int().nonnegative(),
        lastResetMonth: z.string()
    })
});

export const ProfileSchema = z.object({
    id: z.string().uuid(),
    email: z.string().email().nullable(),
    full_name: z.string().nullable(),
    avatar_url: z.string().nullable().optional(),
    role: z.enum(["USER", "ADMIN"]),
    tier: z.enum(["FREE", "PREMIUM"]),
    current_level_id: z.number().int().min(1).optional().default(1),
    exp: z.number().int().nonnegative().optional().default(0),
    usage: UserUsageSchema,
    stripe_customer_id: z.string().nullable(),
    subscription_status: z.string().nullable(),
    created_at: z.string().nullable().optional(),
    updated_at: z.string().nullable().optional()
});

export type Profile = z.infer<typeof ProfileSchema>;
export type ProfileUsage = z.infer<typeof UserUsageSchema>;

export interface UserDisplayInfo {
    id: string;
    email: string | null;
    full_name: string | null;
    avatar_url: string | null;
    role: UserRole;
    tier: UserTier;
    current_level_id: number;
    exp: number;
}
