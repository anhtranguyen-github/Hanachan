
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FlashcardReview } from '@/features/deck/components/FlashcardReview';
import { flashcardService } from '@/features/deck/flashcard-service';
import { analyticsService } from '@/features/analytics/service';
import { FlashcardEntity } from '@/features/deck/types';

export default function ReviewPage() {
    const router = useRouter();
    const [cards, setCards] = useState<FlashcardEntity[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    // Mock User
    const TEST_USER_ID = "00000000-0000-0000-0000-000000000000";

    useEffect(() => {
        const load = async () => {
            try {
                const due = await flashcardService.getDueCards(TEST_USER_ID);
                setCards(due ?? []);
            } catch (err) {
                setError(err as Error);
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, []);

    const handleReview = async (cardId: string, rating: 1 | 2 | 3 | 4) => {
        await flashcardService.submitReview(cardId, rating);
        await analyticsService.logReview(false, rating > 1, TEST_USER_ID);
    };

    if (isLoading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <div className="w-12 h-12 border-4 border-sakura-divider border-t-sakura-pink rounded-full animate-spin" />
            <p className="font-black uppercase text-xs tracking-widest text-sakura-cocoa/40">Loading Reviews...</p>
        </div>
    );

    if (error) {
        return (
            <div data-testid="review-error" className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
                <p className="font-black uppercase text-xs tracking-widest text-sakura-cocoa/60">Failed to load reviews</p>
            </div>
        );
    }

    if (cards.length === 0) {
        return (
            <div data-testid="flashcard-empty" className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
                <p className="font-black uppercase text-xs tracking-widest text-sakura-cocoa/60">No cards to review</p>
            </div>
        );
    }

    return (
        <div data-testid="study-session-ready">
            <div data-testid="srs-session-started" />
            <FlashcardReview
                cards={cards}
                onReview={handleReview}
                onComplete={() => router.push('/dashboard')}
            />
        </div>
    );
}
