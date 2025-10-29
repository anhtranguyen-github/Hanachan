import React from 'react';
import { FlashcardSession } from '@/modules/learning/components/FlashcardSession';
import { getReviewSessionAction } from '@/modules/learning/actions';
import { KUType } from '@/modules/ckb';

export default async function DeckStudyPage({ params }: any) {
    const { slug } = params;

    // Mapping slug to level and type (Basic logic for demo)
    // slug example: "n5-kanji" -> level: 5, type: 'kanji' (simplified for now)
    const levelMatch = slug.match(/n(\d+)/i);
    const typeMatch = slug.match(/kanji|vocabulary|grammar/i);

    const level = levelMatch ? parseInt(levelMatch[1]) : 36;
    const type = (typeMatch ? typeMatch[0].toLowerCase() : 'kanji') as KUType;

    const result = await getReviewSessionAction(level, type, 10);
    const cards = result.success ? result.items : [];

    const deck = {
        id: slug,
        name: slug.toUpperCase().replace('-', ' ')
    };

    return (
        <FlashcardSession
            deckId={deck.id}
            deckName={deck.name}
            items={cards as any}
        />
    );
}
