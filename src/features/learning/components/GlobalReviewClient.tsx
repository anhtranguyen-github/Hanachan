'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FlashcardSession } from '@/features/learning/components/FlashcardSession';
import { GlobalReviewPreview } from '@/features/learning/components/GlobalReviewPreview';

interface GlobalReviewClientProps {
    items: any[];
}

export function GlobalReviewClient({ items }: GlobalReviewClientProps) {
    const router = useRouter();
    const [isStarted, setIsStarted] = useState(false);

    const handleComplete = () => {
        // Redirect to progress page or dashboard on complete
        router.push('/decks?completed=true');
    };

    const handleClose = () => {
        if (isStarted) {
            if (confirm("End session? Progress will be saved for answered cards.")) {
                router.push('/decks');
            }
        } else {
            router.back();
        }
    };

    const handleStart = () => {
        setIsStarted(true);
    };

    if (!isStarted) {
        return (
            <GlobalReviewPreview
                items={items}
                onStart={handleStart}
                onCancel={() => router.back()}
            />
        );
    }

    return (
        <FlashcardSession
            deckId="global"
            deckName="Global Review"
            items={items}
            onComplete={handleComplete}
            onClose={handleClose}
        />
    );
}
