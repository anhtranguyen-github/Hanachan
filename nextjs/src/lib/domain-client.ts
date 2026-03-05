import { cookies } from 'next/headers';

export class DomainClient {
    private baseUrl: string;

    constructor() {
        this.baseUrl = process.env.DOMAIN_SERVICE_URL || 'http://127.0.0.1:8001/api/v1';
    }

    private async getHeaders(): Promise<HeadersInit> {
        // Retrieve the current user's session token to pass to the domain service
        const cookieStore = await cookies();

        // Find the Supabase auth token
        // Usually named sb-<project-ref>-auth-token
        let authCookie = null;

        // Safety check for Vitest/JSDOM environments where next/headers might be partially mocked
        const allCookies = typeof cookieStore.getAll === 'function' ? cookieStore.getAll() : [];

        for (const cookie of allCookies) {
            if (cookie.name.includes('-auth-token')) {
                const parsed = JSON.parse(cookie.value);
                if (Array.isArray(parsed) && parsed[0]) {
                    authCookie = parsed[0];
                    break;
                }
            }
        }

        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        };

        if (authCookie) {
            headers['Authorization'] = `Bearer ${authCookie}`;
        } else {
            // Fallback for dev/test: look for a generic token or log warning
            console.warn('[DomainClient] No auth token found in cookies');
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
            throw new Error(`Domain API Error: ${res.status} ${err}`);
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
            throw new Error(`Domain API Error: ${res.status} ${err}`);
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
            throw new Error(`Domain API Error: ${res.status} ${err}`);
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
            throw new Error(`Domain API Error: ${res.status} ${err}`);
        }
        return res.json();
    }
}

export const domainClient = new DomainClient();
