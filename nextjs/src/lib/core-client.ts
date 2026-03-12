import { cookies } from 'next/headers';
import { getBearerFromSupabaseCookie } from './auth-utils';

export class CoreClient {
    private baseUrl: string;

    constructor() {
        this.baseUrl = process.env.FASTAPI_CORE_URL || 'http://127.0.0.1:6200/api/v1';
    }

    private async getHeaders(): Promise<HeadersInit> {
        const bearer = await getBearerFromSupabaseCookie();
        
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        };

        if (bearer) {
            headers['Authorization'] = bearer;
        } else {
            console.warn('[CoreClient] No auth token found in cookies');
        }

        return headers;
    }

    async startReviewSession(limit: number = 20, contentType: string = 'all') {
        const headers = await this.getHeaders();
        const res = await fetch(`${this.baseUrl}/sessions/review/start`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ limit, content_type: contentType }),
            cache: 'no-store'
        });

        if (!res.ok) {
            const err = await res.text();
            throw new Error(`Core API Error: ${res.status} ${err}`);
        }
        return res.json();
    }

    async submitReview(sessionId: string, kuId: string, facet: string, rating: string, attemptCount: number, wrongCount: number) {
        const headers = await this.getHeaders();
        const res = await fetch(`${this.baseUrl}/sessions/review/${sessionId}/submit`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                ku_id: kuId,
                facet,
                rating,
                attempt_count: attemptCount,
                wrong_count: wrongCount
            }),
            cache: 'no-store'
        });

        if (!res.ok) {
            const err = await res.text();
            throw new Error(`Core API Error: ${res.status} ${err}`);
        }
        return res.json();
    }

    async startLessonSession(unitIds: string[]) {
        const headers = await this.getHeaders();
        const res = await fetch(`${this.baseUrl}/sessions/lesson/start`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ unit_ids: unitIds }),
            cache: 'no-store'
        });

        if (!res.ok) {
            const err = await res.text();
            throw new Error(`Core API Error: ${res.status} ${err}`);
        }
        return res.json();
    }

    async completeLessonSession(batchId: string) {
        const headers = await this.getHeaders();
        const res = await fetch(`${this.baseUrl}/sessions/lesson/${batchId}/complete`, {
            method: 'POST',
            headers,
            body: JSON.stringify({}),
            cache: 'no-store'
        });

        if (!res.ok) {
            const err = await res.text();
            throw new Error(`Core API Error: ${res.status} ${err}`);
        }
        return res.json();
    }

    // V2 Clean Architecture Endpoints
    async getLearningProgress(identifier: string) {
        const headers = await this.getHeaders();
        const res = await fetch(`${this.baseUrl}/learning/progress?identifier=${encodeURIComponent(identifier)}`, {
            headers,
            cache: 'no-store'
        });
        if (!res.ok) return null;
        return res.json();
    }

    async getDashboardStats() {
        const headers = await this.getHeaders();
        const res = await fetch(`${this.baseUrl}/learning/dashboard`, {
            headers,
            cache: 'no-store'
        });
        if (!res.ok) {
            const err = await res.text();
            throw new Error(`Core API Error: ${res.status} ${err}`);
        }
        return res.json();
    }

    async submitReviewV2(kuId: string, facet: string, rating: string, wrongCount: number = 0) {
        const headers = await this.getHeaders();
        const res = await fetch(`${this.baseUrl}/learning/review`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                ku_id: kuId,
                facet,
                rating,
                wrong_count: wrongCount
            }),
            cache: 'no-store'
        });

        if (!res.ok) {
            const err = await res.text();
            throw new Error(`Core API Error: ${res.status} ${err}`);
        }
        return res.json();
    }

    async submitReadingAnswer(exerciseId: string, questionIndex: number, userAnswer: string, timeSpent: number = 0) {
        const headers = await this.getHeaders();
        const res = await fetch(`${this.baseUrl}/reading/submit-answer`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                exercise_id: exerciseId,
                question_index: questionIndex,
                user_answer: userAnswer,
                time_spent_seconds: timeSpent
            }),
            cache: 'no-store'
        });
        if (!res.ok) {
            const err = await res.text();
            throw new Error(`Core API Error: ${res.status} ${err}`);
        }
        return res.json();
    }
}

export const coreClient = new CoreClient();
