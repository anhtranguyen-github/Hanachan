/**
 * Reading Service - manages reading practice sessions
 * Moved from FastAPI to Next.js as part of Phase 2 architectural remediation
 */

import { supabase, supabaseService } from "@/lib/supabase";
import { HanaTime } from "@/lib/time";

// Use service role client on server to bypass RLS issues during Phase 2 transition
// Security: Functions must ALWAYS include .eq('user_id', userId)
const db = supabaseService || supabase;
import type {
    AnswerResult,
    DailyMetric,
    ReadingConfig,
    ReadingSession,
    ReadingMetrics
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
        console.log(`[readingService] Triggering session generation for ${userId}...`);
        
        // Call FastAPI backend to generate session and exercises
        // user_id is passed as a query param (simple trusted architecture)
        const response = await fetch(`http://localhost:8765/api/v1/reading/sessions?user_id=${userId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(options || {})
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[readingService] FastAPI generation failed:', errorText);
            return null;
        }

        const session = await response.json();
        console.log(`[readingService] Session generated: ${session.id}`);
        
        return session as ReadingSession;
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
        const { count: totalSessions } = await db
            .from('reading_sessions')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId);

        // Completed sessions
        const { count: completedSessions } = await db
            .from('reading_sessions')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('status', 'completed');

        // Average score
        const { data: scores } = await db
            .from('reading_sessions')
            .select('score')
            .eq('user_id', userId)
            .not('score', 'is', null);

        const validScores = scores?.filter(s => s.score !== null).map(s => s.score) || [];
        const averageScore = validScores.length > 0
            ? validScores.reduce((sum, s) => sum + s, 0) / validScores.length
            : 0;
        const bestScore = validScores.length > 0 ? Math.max(...validScores) : 0;

        // Recent sessions
        const { data: recentSessions } = await db
            .from('reading_sessions')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(10);

        return {
            total_sessions: totalSessions || 0,
            total_exercises: completedSessions || 0,
            total_time_seconds: 0,
            avg_score: Math.round(averageScore * 10) / 10,
            best_score: bestScore,
            pending_sessions: (totalSessions || 0) - (completedSessions || 0),
            streak_days: 0,
            total_words_read: 0,
            recent_sessions: (recentSessions || []) as ReadingSession[],
            daily_metrics: [],
            topic_performance: []
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
        // Get the exercise and question
        const { data: exercise, error } = await db
            .from('reading_exercises')
            .select('questions, session_id')
            .eq('id', exerciseId)
            .single();

        if (error || !exercise) {
            console.error('Error fetching exercise:', error);
            return null;
        }

        // Verify session ownership
        const { data: session } = await db
            .from('reading_sessions')
            .select('user_id')
            .eq('id', exercise.session_id)
            .single();

        if (session?.user_id !== userId) {
            throw new Error('Unauthorized access to exercise');
        }

        const question = exercise.questions?.[questionIndex];
        if (!question) {
            throw new Error('Question not found');
        }

        const isCorrect = userAnswer.trim().toLowerCase() === question.correct_answer.trim().toLowerCase();

        // Store the answer (we'd need a user_answers table for full implementation)
        // For now, return the result
        return {
            is_correct: isCorrect,
            correct_answer: question.correct_answer,
            explanation: question.explanation,
            exercise_completed: false // Would check if all questions answered
        };
    } catch (error) {
        console.error('Error in submitAnswer:', error);
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
