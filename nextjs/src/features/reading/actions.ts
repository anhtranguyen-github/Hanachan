'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type {
    ReadingConfig,
    ReadingSession,
    ReadingMetrics,
    AnswerResult,
} from './types';
import {
    getReadingConfig as getReadingConfigService,
    updateReadingConfig as updateReadingConfigService,
    createReadingSession as createReadingSessionService,
    listReadingSessions as listReadingSessionsService,
    getReadingMetrics as getReadingMetricsService,
    getReadingSessionById,
    startReadingSession as startReadingSessionService,
    completeReadingSession as completeReadingSessionService,
    submitAnswer as submitAnswerService,
    getMetricsHistory as getMetricsHistoryService
} from './readingService';

async function getUserId(): Promise<string> {
    const cookieStore = cookies();
    const supabaseClient = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value;
                },
            },
        }
    );
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user?.id) throw new Error('Not authenticated');
    return user.id;
}

// ─── Config ──────────────────────────────────────────────────────────────────

export async function getReadingConfig(): Promise<ReadingConfig> {
    const userId = await getUserId();
    const config = await getReadingConfigService(userId);
    if (!config) throw new Error('Failed to fetch reading config');
    return config;
}

export async function updateReadingConfig(config: Partial<ReadingConfig>): Promise<ReadingConfig> {
    const userId = await getUserId();
    const updated = await updateReadingConfigService(userId, config);
    if (!updated) throw new Error('Failed to update reading config');
    return updated;
}

// ─── Sessions ─────────────────────────────────────────────────────────────────

export async function createReadingSession(options?: {
    configOverride?: Partial<ReadingConfig>;
    topics?: string[];
}): Promise<ReadingSession> {
    const userId = await getUserId();
    const session = await createReadingSessionService(userId, options);
    if (!session) throw new Error('Failed to create reading session');
    return session;
}

export async function listReadingSessions(options?: {
    status?: string;
    limit?: number;
    offset?: number;
}): Promise<{ sessions: ReadingSession[]; total: number }> {
    const userId = await getUserId();
    return listReadingSessionsService(userId, options);
}

export async function getReadingSession(sessionId: string): Promise<ReadingSession> {
    const userId = await getUserId();
    const session = await getReadingSessionById(userId, sessionId);
    if (!session) throw new Error('Reading session not found');
    return session;
}

export async function startReadingSession(sessionId: string): Promise<void> {
    const userId = await getUserId();
    const result = await startReadingSessionService(userId, sessionId);
    if (!result) throw new Error('Failed to start reading session');
}

export async function completeReadingSession(
    sessionId: string,
    totalTimeSeconds: number
): Promise<{ score: number; correct_answers: number; total_exercises: number }> {
    const userId = await getUserId();
    const result = await completeReadingSessionService(userId, sessionId, totalTimeSeconds);
    if (!result) throw new Error('Failed to complete reading session');
    return result;
}

// ─── Exercises ────────────────────────────────────────────────────────────────

export async function submitAnswer(
    exerciseId: string,
    questionIndex: number,
    userAnswer: string,
    timeSpentSeconds: number = 0
): Promise<AnswerResult> {
    const userId = await getUserId();
    const result = await submitAnswerService(userId, exerciseId, questionIndex, userAnswer, timeSpentSeconds);
    if (!result) throw new Error('Failed to submit answer');
    return result;
}

// ─── Metrics ──────────────────────────────────────────────────────────────────

export async function getReadingMetrics(): Promise<ReadingMetrics> {
    const userId = await getUserId();
    return getReadingMetricsService(userId);
}

export async function getMetricsHistory(days: number = 30) {
    const userId = await getUserId();
    return getMetricsHistoryService(userId, days);
}
