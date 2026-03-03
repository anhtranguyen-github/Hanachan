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
    getReadingMetrics as getReadingMetricsService
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
    // This would need a getReadingSessionById service function
    // For now, throwing not implemented
    throw new Error('getReadingSession not yet migrated to Next.js');
}

export async function startReadingSession(sessionId: string): Promise<void> {
    // This would need to be implemented in the service
    // For now, it's a no-op
    console.log('Start reading session:', sessionId);
}

export async function completeReadingSession(
    sessionId: string,
    totalTimeSeconds: number
): Promise<{ score: number; correct_answers: number; total_exercises: number }> {
    // This would need to be implemented in the service
    // For now, returning dummy data
    return { score: 0, correct_answers: 0, total_exercises: 0 };
}

// ─── Exercises ────────────────────────────────────────────────────────────────

export async function submitAnswer(
    exerciseId: string,
    questionIndex: number,
    userAnswer: string,
    timeSpentSeconds: number = 0
): Promise<AnswerResult> {
    // This would need to be implemented in the service
    // For now, throwing not implemented
    throw new Error('submitAnswer not yet migrated to Next.js');
}

// ─── Metrics ──────────────────────────────────────────────────────────────────

export async function getReadingMetrics(): Promise<ReadingMetrics> {
    const userId = await getUserId();
    return getReadingMetricsService(userId);
}

export async function getMetricsHistory(days: number = 30) {
    // This would need to be implemented in the service
    // For now, returning empty array
    return [];
}
