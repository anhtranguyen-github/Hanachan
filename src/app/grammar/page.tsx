'use client';

import React from 'react';
import { ContentListView } from '@/modules/ckb/components/ContentListView';
import { MOCK_GRAMMAR } from '@/lib/mock-data';
import { CONTENT_TYPES } from '@/config/design.config';

export default function GrammarListPage({ searchParams }: any) {
    const difficulty = searchParams?.difficulty || 'N5';

    // Mock data mapped to levels with SRS states
    const initialLevelData: Record<number, any> = {
        1: { level: 1, items: MOCK_GRAMMAR, total: MOCK_GRAMMAR.length }
    };

    // Build SRS status map from mock data
    const initialSrsStatus = MOCK_GRAMMAR.reduce((acc, item) => {
        acc[item.title] = { state: item.srsState || 'new', next_review: '' };
        return acc;
    }, {} as Record<string, { state: string, next_review: string }>);

    return (
        <ContentListView
            type="GRAMMAR"
            title="Grammar"
            subtitle="Sentence Patterns"
            accentColor={CONTENT_TYPES.grammar.inkColor}
            initialDifficulty={difficulty}
            initialLevelData={initialLevelData}
            initialSrsStatus={initialSrsStatus}
        />
    );
}
