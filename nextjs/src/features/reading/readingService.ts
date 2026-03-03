/**
 * Reading Service - manages reading practice sessions
 * Moved from FastAPI to Next.js as part of Phase 2 architectural remediation
 */

import { supabase } from "@/lib/supabase";
import { HanaTime } from "@/lib/time";

export interface ReadingConfig {
    id?: string;
    user_id: string;
    daily_goal: number;
    difficulty_preference: string[];
    topic_preferences: string[];
    show_furigana: boolean;
    show_translation: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface ReadingSession {
    id: string;
    user_id: string;
    passage_id?: string;
    status: 'active' | 'completed' | 'abandoned';
    started_at: string;
    completed_at?: string;
    score?: number;
}

export interface ReadingMetrics {
    total_sessions: number;
    completed_sessions: number;
    total_passages_read: number;
    average_score: number;
    current_streak: number;
    longest_streak: number;
}

/**
 * Get reading config for a user
 */
export async function getReadingConfig(userId: string): Promise<ReadingConfig | null> {
    try {
        const { data, error } = await supabase
            .from('reading_configs')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                // No config found, create default
                return createDefaultReadingConfig(userId);
            }
            console.error('Error fetching reading config:', error);
            return null;
        }

        return data as ReadingConfig;
    } catch (error) {
        console.error('Error in getReadingConfig:', error);
        return null;
    }
}

/**
 * Create default reading config
 */
async function createDefaultReadingConfig(userId: string): Promise<ReadingConfig> {
    const defaultConfig: Omit<ReadingConfig, 'id'> = {
        user_id: userId,
        daily_goal: 3,
        difficulty_preference: ['N5', 'N4'],
        topic_preferences: ['daily_life', 'culture'],
        show_furigana: true,
        show_translation: true,
        created_at: HanaTime.getNowISO(),
        updated_at: HanaTime.getNowISO()
    };

    const { data, error } = await supabase
        .from('reading_configs')
        .insert(defaultConfig)
        .select()
        .single();

    if (error) {
        console.error('Error creating default reading config:', error);
        // Return default without saving
        return { ...defaultConfig, id: 'temp' };
    }

    return data as ReadingConfig;
}

/**
 * Update reading config
 */
export async function updateReadingConfig(
    userId: string,
    config: Partial<ReadingConfig>
): Promise<ReadingConfig | null> {
    try {
        const updates = {
            ...config,
            updated_at: HanaTime.getNowISO()
        };

        const { data, error } = await supabase
            .from('reading_configs')
            .update(updates)
            .eq('user_id', userId)
            .select()
            .single();

        if (error) {
            console.error('Error updating reading config:', error);
            return null;
        }

        return data as ReadingConfig;
    } catch (error) {
        console.error('Error in updateReadingConfig:', error);
        return null;
    }
}

/**
 * Create a new reading session
 */
export async function createReadingSession(
    userId: string,
    options?: {
        configOverride?: Partial<ReadingConfig>;
        topics?: string[];
    }
): Promise<ReadingSession | null> {
    try {
        // Get a random passage based on preferences
        const { data: passage } = await supabase
            .from('reading_passages')
            .select('id')
            .in('topic', options?.topics || ['daily_life', 'culture'])
            .limit(1)
            .maybeSingle();

        const { data, error } = await supabase
            .from('reading_sessions')
            .insert({
                user_id: userId,
                passage_id: passage?.id,
                status: 'active',
                started_at: HanaTime.getNowISO()
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating reading session:', error);
            return null;
        }

        return data as ReadingSession;
    } catch (error) {
        console.error('Error in createReadingSession:', error);
        return null;
    }
}

/**
 * List reading sessions for a user
 */
export async function listReadingSessions(
    userId: string,
    options?: {
        status?: string;
        limit?: number;
        offset?: number;
    }
): Promise<{ sessions: ReadingSession[]; total: number }> {
    try {
        let query = supabase
            .from('reading_sessions')
            .select('*', { count: 'exact' })
            .eq('user_id', userId)
            .order('started_at', { ascending: false });

        if (options?.status) {
            query = query.eq('status', options.status);
        }

        const limit = options?.limit || 20;
        const offset = options?.offset || 0;

        query = query.range(offset, offset + limit - 1);

        const { data, error, count } = await query;

        if (error) {
            console.error('Error listing reading sessions:', error);
            return { sessions: [], total: 0 };
        }

        return {
            sessions: (data || []) as ReadingSession[],
            total: count || 0
        };
    } catch (error) {
        console.error('Error in listReadingSessions:', error);
        return { sessions: [], total: 0 };
    }
}

/**
 * Get reading metrics for a user
 */
export async function getReadingMetrics(userId: string): Promise<ReadingMetrics> {
    try {
        // Total sessions
        const { count: totalSessions } = await supabase
            .from('reading_sessions')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId);

        // Completed sessions
        const { count: completedSessions } = await supabase
            .from('reading_sessions')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('status', 'completed');

        // Average score
        const { data: scores } = await supabase
            .from('reading_sessions')
            .select('score')
            .eq('user_id', userId)
            .not('score', 'is', null);

        const validScores = scores?.filter(s => s.score !== null) || [];
        const averageScore = validScores.length > 0
            ? validScores.reduce((sum, s) => sum + (s.score || 0), 0) / validScores.length
            : 0;

        return {
            total_sessions: totalSessions || 0,
            completed_sessions: completedSessions || 0,
            total_passages_read: completedSessions || 0,
            average_score: Math.round(averageScore * 10) / 10,
            current_streak: 0,
            longest_streak: 0
        };
    } catch (error) {
        console.error('Error in getReadingMetrics:', error);
        return {
            total_sessions: 0,
            completed_sessions: 0,
            total_passages_read: 0,
            average_score: 0,
            current_streak: 0,
            longest_streak: 0
        };
    }
}
