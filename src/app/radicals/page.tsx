'use client';

import React from 'react';
import { ContentListView } from '@/modules/ckb/components/ContentListView';
import { CONTENT_TYPES } from '@/config/design.config';

// Mock radicals data with diverse SRS states
const MOCK_RADICALS = [
    { id: 'r1', character: '一', meaning: 'One', slug: 'ichi', srsState: 'mastered' },
    { id: 'r2', character: '二', meaning: 'Two', slug: 'ni', srsState: 'burned' },
    { id: 'r3', character: '人', meaning: 'Person', slug: 'hito', srsState: 'new' },
    { id: 'r4', character: '口', meaning: 'Mouth', slug: 'kuchi', srsState: 'learning' },
    { id: 'r5', character: '目', meaning: 'Eye', slug: 'me', srsState: 'review' },
    { id: 'r6', character: '耳', meaning: 'Ear', slug: 'mimi', srsState: 'locked' },
    { id: 'r7', character: '手', meaning: 'Hand', slug: 'te', srsState: 'mastered' },
    { id: 'r8', character: '足', meaning: 'Foot', slug: 'ashi', srsState: 'learning' },
];

export default function RadicalsListPage({ searchParams }: any) {
    const difficulty = searchParams?.difficulty || 'N5';

    // Mock data mapped to levels with SRS states
    const initialLevelData: Record<number, any> = {
        1: { level: 1, items: MOCK_RADICALS, total: MOCK_RADICALS.length }
    };

    // Build SRS status map from mock data
    const initialSrsStatus = MOCK_RADICALS.reduce((acc, item) => {
        acc[item.character] = { state: item.srsState || 'new', next_review: '' };
        return acc;
    }, {} as Record<string, { state: string, next_review: string }>);

    return (
        <ContentListView
            type="RADICAL"
            title="Radicals"
            subtitle="Building Blocks"
            accentColor={CONTENT_TYPES.radical.inkColor}
            initialDifficulty={difficulty}
            initialLevelData={initialLevelData}
            initialSrsStatus={initialSrsStatus}
        />
    );
}
