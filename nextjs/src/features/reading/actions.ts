'use server';

import { supabase } from '@/lib/supabase';
import type {
    ReadingConfig,
    ReadingSession,
    ReadingMetrics,
    AnswerResult,
} from './types';

const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000';

async function getAuthHeaders() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) throw new Error('Not authenticated');
    return {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
    };
}

// ─── Config ──────────────────────────────────────────────────────────────────

export async function getReadingConfig(): Promise<ReadingConfig> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${FASTAPI_URL}/api/v1/reading/config`, {
        headers,
        cache: 'no-store',
    });
    if (!res.ok) throw new Error('Failed to fetch reading config');
    return res.json();
}

export async function updateReadingConfig(config: Partial<ReadingConfig>): Promise<ReadingConfig> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${FASTAPI_URL}/api/v1/reading/config`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(config),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any).detail || 'Failed to update reading config');
    }
    return res.json();
}

// ─── Sessions ─────────────────────────────────────────────────────────────────

export async function createReadingSession(options?: {
    configOverride?: Partial<ReadingConfig>;
    topics?: string[];
}): Promise<ReadingSession> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${FASTAPI_URL}/api/v1/reading/sessions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
            config_override: options?.configOverride || null,
            topics: options?.topics || null,
        }),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any).detail || 'Failed to create reading session');
    }
    return res.json();
}

export async function listReadingSessions(options?: {
    status?: string;
    limit?: number;
    offset?: number;
}): Promise<{ sessions: ReadingSession[]; total: number }> {
    const headers = await getAuthHeaders();
    const params = new URLSearchParams();
    if (options?.status) params.set('status', options.status);
    if (options?.limit) params.set('limit', String(options.limit));
    if (options?.offset) params.set('offset', String(options.offset));

    const res = await fetch(`${FASTAPI_URL}/api/v1/reading/sessions?${params}`, {
        headers,
        cache: 'no-store',
    });
    if (!res.ok) throw new Error('Failed to fetch reading sessions');
    return res.json();
}

export async function getReadingSession(sessionId: string): Promise<ReadingSession> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${FASTAPI_URL}/api/v1/reading/sessions/${sessionId}`, {
        headers,
        cache: 'no-store',
    });
    if (!res.ok) throw new Error('Session not found');
    return res.json();
}

export async function startReadingSession(sessionId: string): Promise<void> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${FASTAPI_URL}/api/v1/reading/sessions/${sessionId}/start`, {
        method: 'POST',
        headers,
    });
    if (!res.ok) throw new Error('Failed to start session');
}

export async function completeReadingSession(
    sessionId: string,
    totalTimeSeconds: number
): Promise<{ score: number; correct_answers: number; total_exercises: number }> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${FASTAPI_URL}/api/v1/reading/sessions/${sessionId}/complete`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ total_time_seconds: totalTimeSeconds }),
    });
    if (!res.ok) throw new Error('Failed to complete session');
    return res.json();
}

// ─── Exercises ────────────────────────────────────────────────────────────────

export async function submitAnswer(
    exerciseId: string,
    questionIndex: number,
    userAnswer: string,
    timeSpentSeconds: number = 0
): Promise<AnswerResult> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${FASTAPI_URL}/api/v1/reading/exercises/${exerciseId}/answer`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
            question_index: questionIndex,
            user_answer: userAnswer,
            time_spent_seconds: timeSpentSeconds,
        }),
    });
    if (!res.ok) throw new Error('Failed to submit answer');
    return res.json();
}

// ─── Metrics ──────────────────────────────────────────────────────────────────

export async function getReadingMetrics(): Promise<ReadingMetrics> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${FASTAPI_URL}/api/v1/reading/metrics`, {
        headers,
        cache: 'no-store',
    });
    if (!res.ok) throw new Error('Failed to fetch reading metrics');
    return res.json();
}

export async function getMetricsHistory(days: number = 30) {
    const headers = await getAuthHeaders();
    const res = await fetch(`${FASTAPI_URL}/api/v1/reading/metrics/history?days=${days}`, {
        headers,
        cache: 'no-store',
    });
    if (!res.ok) throw new Error('Failed to fetch metrics history');
    return res.json();
}
