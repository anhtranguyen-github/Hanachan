'use client';

import React from 'react';
import { ContentListView } from '@/modules/ckb/components/ContentListView';
import { MOCK_KANJI } from '@/lib/mock-data';
import { CONTENT_TYPES } from '@/config/design.config';

export default function KanjiListPage({ searchParams }: any) {
    const difficulty = searchParams?.difficulty || 'N5';

    // Mock data mapped to levels with SRS states
    const initialLevelData: Record<number, any> = {
        1: { level: 1, items: MOCK_KANJI, total: MOCK_KANJI.length }
    };

    // Build SRS status map from mock data
    const initialSrsStatus = MOCK_KANJI.reduce((acc, item) => {
        acc[item.character] = { state: item.srsState || 'new', next_review: '' };
        return acc;
    }, {} as Record<string, { state: string, next_review: string }>);

    return (
        <ContentListView
            type="KANJI"
            title="Kanji"
            subtitle="Characters & Meanings"
            accentColor={CONTENT_TYPES.kanji.inkColor}
            initialDifficulty={difficulty}
            initialLevelData={initialLevelData}
            initialSrsStatus={initialSrsStatus}
        />
    );
}
