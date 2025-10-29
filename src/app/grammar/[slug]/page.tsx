'use client';

import React from 'react';
import { GrammarDetailView } from '@/modules/ckb/components/GrammarDetailView';

export default function GrammarDetailPage({ params }: any) {
    const slug = decodeURIComponent(params.slug);

    const grammar = {
        id: 'g1',
        title: slug,
        meanings: ['Mock meaning for ' + slug],
        examples: [
            { ja: 'これはテストです。', en: 'This is a test.' }
        ]
    };

    return (
        <GrammarDetailView
            grammar={grammar}
            srsInfo={null}
            deckName={null}
            deckId={null}
        />
    );
}
