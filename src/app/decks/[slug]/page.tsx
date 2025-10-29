'use client';

import React from 'react';
import { DeckDetailView } from '@/modules/flashcard/components/DeckDetailView';

export default function DeckDetailPage({ params, searchParams }: any) {
    const isCompleted = searchParams?.completed === 'true';

    // Mock data for the purely UI template
    const deck = {
        id: '1',
        slug: params.slug,
        name: 'Mock Deck ' + params.slug,
        description: 'This is a description for the mock deck.'
    };

    const items: any[] = [
        { contentId: 'v1', contentType: 'VOCABULARY', content: { character: '猫', readings: { primary: 'ねこ' }, meanings: { primary: ['Cat'] } } },
        { contentId: 'v2', contentType: 'VOCABULARY', content: { character: '犬', readings: { primary: 'いぬ' }, meanings: { primary: ['Dog'] } } }
    ];

    const stats = {
        total_cards: 2,
        new_cards: 1,
        learning_cards: 0,
        review_cards: 1,
        mastered_cards: 0,
        due_cards: 1
    };

    return (
        <DeckDetailView
            deck={deck}
            initialItems={items}
            initialStats={stats}
            initialForecast={[]}
            initialActivity={[]}
            initialActivityStats={{}}
            isCompleted={isCompleted}
        />
    );
}
