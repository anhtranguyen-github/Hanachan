'use client';

import { MOCK_SRS_CARDS } from '@/lib/mock-data';

export function useSrsData() {
    return {
        dueCards: MOCK_SRS_CARDS,
        stats: {
            mastered: 1240,
            learning: 45,
            reviewsDue: 12
        },
        isLoading: false,
        mutate: () => { }
    };
}

export function useDashboardStats() {
    return {
        stats: {
            reviewsCount: 12,
            lessonsCount: 5
        },
        refresh: () => { }
    };
}

export function useReadiness() {
    return {
        data: {
            state: 'READY_FOR_LESSONS',
            title: 'Perfect Time for New Lessons!',
            description: 'You have caught up with all your reviews. Your retention is high, making this an ideal moment to learn new characters.',
            suggestedActions: [
                { type: 'primary', label: 'Start Lessons', href: '/decks' },
                { type: 'secondary', label: 'Review Library', href: '/vocabulary' }
            ]
        },
        isLoading: false
    };
}
