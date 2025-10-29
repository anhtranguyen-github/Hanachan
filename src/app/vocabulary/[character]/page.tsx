'use client';

import React from 'react';
import { VocabularyDetailView } from '@/modules/ckb/components/VocabularyDetailView';

export default function VocabDetailPage({ params }: any) {
    const character = decodeURIComponent(params.character);

    const vocab = {
        id: 'v1',
        character: character,
        meanings: { primary: ['Mock meaning for ' + character] },
        readings: { primary: '???' },
        context_sentences: [
            { ja: 'これはテストです。', en: 'This is a test.' }
        ]
    };

    return (
        <VocabularyDetailView
            vocab={vocab}
            linkedKanji={[]}
            srsInfo={null}
        />
    );
}
