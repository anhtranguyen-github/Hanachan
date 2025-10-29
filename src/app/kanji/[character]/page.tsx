'use client';

import React from 'react';
import { KanjiDetailView } from '@/modules/ckb/components/KanjiDetailView';

export default function KanjiDetailPage({ params }: any) {
    const character = decodeURIComponent(params.character);

    const kanji = {
        id: 'k1',
        character: character,
        meanings: { primary: ['Mock meaning for ' + character] },
        readings: { onyomi: ['???'], kunyomi: ['???'] },
        strokes: { count: 0 }
    };

    return (
        <KanjiDetailView
            kanji={kanji}
            linkedVocab={[]}
            linkedRadicals={[]}
            srsInfo={null}
        />
    );
}
