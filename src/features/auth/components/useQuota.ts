'use client';

export function useQuota() {
    return {
        usage: {
            ai_calls: { count: 5, limit: 100 },
            deck_limit: { count: 3, limit: 10 }
        },
        isLoading: false
    };
}
