/**
 * Reading Service - manages reading practice sessions
 * Moved from FastAPI to Next.js as part of Phase 2 architectural remediation
 */

import { supabase } from "@/lib/supabase";
import { HanaTime } from "@/lib/time";

// Use service role client on server to bypass RLS issues during Phase 2 transition
// Security: Functions must ALWAYS include .eq('user_id', userId)
const db = supabase;
import type {
    AnswerResult,
    DailyMetric,
    ReadingConfig,
    ReadingSession,
    ReadingMetrics,
    TopicPerformance
} from "./types";

/**
 * Get reading config for a user
 */
export async function getReadingConfig(userId: string): Promise<ReadingConfig | null> {
    try {
        const { data, error } = await db
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
        exercises_per_session: 5,
        time_limit_minutes: 15,
        difficulty_level: 'adaptive',
        jlpt_target: null,
        vocab_weight: 40,
        grammar_weight: 30,
        kanji_weight: 30,
        include_furigana: true,
        include_translation: false,
        passage_length: 'medium',
        topic_preferences: ['daily_life', 'culture', 'nature'],
        auto_generate: true,
        created_at: HanaTime.getNowISO(),
        updated_at: HanaTime.getNowISO()
    };

    const { data, error } = await db
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

        const { data, error } = await db
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
 * Create a new reading session (triggers generation via Agent)
 */
export async function createReadingSession(
    userId: string,
    options?: {
        configOverride?: Partial<ReadingConfig>;
        topics?: string[];
    }
): Promise<ReadingSession | null> {
    try {
        console.log(`[readingService] Triggering session generation via Supabase for ${userId}...`);

        // Removed FastAPI fetch block per Architecture Rules.
        // Reading session generation is now mediated via Supabase event triggers.
        // For now, we will just return null to indicate generation has started asynchronously
        return null;
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
        let query = db
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
        const { data: sessions, error: sessionsError } = await db
            .from('reading_sessions')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (sessionsError) throw sessionsError;

        const completedSessions = sessions?.filter(s => s.status === 'completed') || [];
        const totalSessions = sessions?.length || 0;

        // Statistics
        const validScores = completedSessions.map(s => s.score).filter(s => s !== null);
        const averageScore = validScores.length > 0
            ? validScores.reduce((sum, s) => sum + s, 0) / validScores.length
            : 0;
        const bestScore = validScores.length > 0 ? Math.max(...validScores) : 0;
        const totalTime = completedSessions.reduce((sum, s) => sum + (s.total_time_seconds || 0), 0);
        
        // Fetch total words read (requires fetching exercises)
        const { data: exercises } = await db
            .from('reading_exercises')
            .select('word_count, topic, session_id, reading_sessions!inner(score, status)')
            .eq('reading_sessions.user_id', userId)
            .eq('reading_sessions.status', 'completed');

        const totalWords = exercises?.reduce((sum, e) => sum + (e.word_count || 0), 0) || 0;

        // Daily Metrics
        const dailyMetrics = await getMetricsHistory(userId, 30);
        
        // Streak calculation
        const streak = calculateReadingStreak(dailyMetrics);

        // Topic Performance
        const topicMap = new Map<string, { total: number, scoreSum: number }>();
        exercises?.forEach(e => {
            const current = topicMap.get(e.topic) || { total: 0, scoreSum: 0 };
            const session = sessions?.find(s => s.id === e.session_id);
            if (session && session.score !== null) {
                current.total++;
                current.scoreSum += session.score;
                topicMap.set(e.topic, current);
            }
        });

        const topicPerformance: TopicPerformance[] = Array.from(topicMap.entries()).map(([topic, data]) => ({
            topic,
            exercises_count: data.total,
            accuracy: Math.round(data.scoreSum / Math.max(data.total, 1))
        }));

        return {
            total_sessions: totalSessions,
            total_exercises: exercises?.length || 0,
            total_time_seconds: totalTime,
            avg_score: Math.round(averageScore * 10) / 10,
            best_score: bestScore,
            pending_sessions: totalSessions - completedSessions.length,
            streak_days: streak,
            total_words_read: totalWords,
            recent_sessions: (sessions?.slice(0, 10) || []) as ReadingSession[],
            daily_metrics: dailyMetrics,
            topic_performance: topicPerformance
        };
    } catch (error) {
        console.error('Error in getReadingMetrics:', error);
        return {
            total_sessions: 0,
            total_exercises: 0,
            total_time_seconds: 0,
            avg_score: 0,
            best_score: 0,
            pending_sessions: 0,
            streak_days: 0,
            total_words_read: 0,
            recent_sessions: [],
            daily_metrics: [],
            topic_performance: []
        };
    }
}

function calculateReadingStreak(metrics: DailyMetric[]): number {
    if (!metrics || metrics.length === 0) return 0;
    
    // Sort metrics by date descending
    const sorted = [...metrics].sort((a, b) => b.date.localeCompare(a.date));
    
    const now = HanaTime.getNow();
    const todayStr = now.toISOString().split('T')[0];
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // Check if there was activity today or yesterday
    if (sorted[0].date !== todayStr && sorted[0].date !== yesterdayStr) {
        return 0;
    }

    let streak = 0;
    let expectedDate = new Date(sorted[0].date);

    for (const metric of sorted) {
        const d = new Date(metric.date);
        if (d.toISOString().split('T')[0] === expectedDate.toISOString().split('T')[0]) {
            streak++;
            expectedDate.setDate(expectedDate.getDate() - 1);
        } else {
            break;
        }
    }

    return streak;
}

/**
 * Get a reading session by ID with exercises
 */
export async function getReadingSessionById(
    userId: string,
    sessionId: string
): Promise<ReadingSession | null> {
    try {
        const { data: session, error: sessionError } = await db
            .from('reading_sessions')
            .select('*')
            .eq('id', sessionId)
            .eq('user_id', userId)
            .single();

        if (sessionError || !session) {
            console.error('Error fetching reading session:', sessionError);
            return null;
        }

        // Fetch exercises for this session
        const { data: exercises, error: exercisesError } = await db
            .from('reading_exercises')
            .select('*')
            .eq('session_id', sessionId)
            .order('order_index', { ascending: true });

        if (exercisesError) {
            console.error('Error fetching exercises:', exercisesError);
        }

        return {
            ...session,
            exercises: exercises || []
        } as ReadingSession;
    } catch (error) {
        console.error('Error in getReadingSessionById:', error);
        return null;
    }
}

/**
 * Start a reading session
 */
export async function startReadingSession(
    userId: string,
    sessionId: string
): Promise<ReadingSession | null> {
    try {
        const { data, error } = await db
            .from('reading_sessions')
            .update({
                status: 'active',
                started_at: HanaTime.getNowISO()
            })
            .eq('id', sessionId)
            .eq('user_id', userId)
            .select()
            .single();

        if (error) {
            console.error('Error starting reading session:', error);
            return null;
        }

        return data as ReadingSession;
    } catch (error) {
        console.error('Error in startReadingSession:', error);
        return null;
    }
}

/**
 * Complete a reading session
 */
export async function completeReadingSession(
    userId: string,
    sessionId: string,
    totalTimeSeconds: number
): Promise<{ score: number; correct_answers: number; total_exercises: number } | null> {
    try {
        // Get session exercises to calculate score
        const { data: exercises } = await db
            .from('reading_exercises')
            .select('id, questions')
            .eq('session_id', sessionId);

        let totalQuestions = 0;
        let correctAnswers = 0;

        // Count questions and correct answers
        for (const exercise of exercises || []) {
            const questions = exercise.questions || [];
            totalQuestions += questions.length;
            // Note: We'd need user_answers table to track correct answers
            // For now, using placeholder calculation
        }

        // Calculate score (placeholder logic)
        const score = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

        // Update session
        const { error } = await db
            .from('reading_sessions')
            .update({
                status: 'completed',
                completed_at: HanaTime.getNowISO(),
                total_time_seconds: totalTimeSeconds,
                score,
                correct_answers: correctAnswers,
                completed_exercises: exercises?.length || 0
            })
            .eq('id', sessionId)
            .eq('user_id', userId);

        if (error) {
            console.error('Error completing reading session:', error);
            return null;
        }

        return { score, correct_answers: correctAnswers, total_exercises: exercises?.length || 0 };
    } catch (error) {
        console.error('Error in completeReadingSession:', error);
        return null;
    }
}

import { coreClient } from "@/lib/core-client";

/**
 * Submit an answer for an exercise question
 */
export async function submitAnswer(
    userId: string,
    exerciseId: string,
    questionIndex: number,
    userAnswer: string,
    timeSpentSeconds: number = 0
): Promise<AnswerResult | null> {
    try {
        const response = await coreClient.submitReadingAnswer(
            exerciseId,
            questionIndex,
            userAnswer,
            timeSpentSeconds
        );
        return {
            is_correct: response.is_correct,
            correct_answer: response.correct_answer,
            explanation: response.explanation,
            exercise_completed: response.session_completed // Backend call this session_completed, but here it's expected as exercise_completed or similar
        };
    } catch (error) {
        console.error('Error in submitAnswer using Core API:', error);
        return null;
    }
}

/**
 * Get metrics history for a user
 */
export async function getMetricsHistory(
    userId: string,
    days: number = 30
): Promise<DailyMetric[]> {
    try {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const { data: sessions, error } = await db
            .from('reading_sessions')
            .select('completed_at, total_time_seconds, completed_exercises')
            .eq('user_id', userId)
            .eq('status', 'completed')
            .gte('completed_at', startDate.toISOString())
            .order('completed_at', { ascending: true });

        if (error) {
            console.error('Error fetching metrics history:', error);
            return [];
        }

        // Group by date
        const dailyMetrics = new Map<string, DailyMetric>();

        for (const session of sessions || []) {
            const date = session.completed_at?.split('T')[0] || '';
            if (!date) continue;

            const existing = dailyMetrics.get(date);
            if (existing) {
                existing.sessions_completed += 1;
                existing.exercises_completed += session.completed_exercises || 0;
                existing.total_time_seconds += session.total_time_seconds || 0;
            } else {
                dailyMetrics.set(date, {
                    date,
                    sessions_completed: 1,
                    exercises_completed: session.completed_exercises || 0,
                    total_time_seconds: session.total_time_seconds || 0,
                    correct_answers: 0,
                    total_answers: 0,
                    avg_score: 0
                });
            }
        }

        return Array.from(dailyMetrics.values());
    } catch (error) {
        console.error('Error in getMetricsHistory:', error);
        return [];
    }
}
