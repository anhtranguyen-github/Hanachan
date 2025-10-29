'use client';

import React from 'react';
import { GlobalReviewClient } from '@/modules/learning/components/GlobalReviewClient';

export default function GlobalStudyPage() {
    const cards: any[] = [
        {
            content_id: 'v1',
            content_type: 'VOCABULARY' as any,
            item_state: 'learning' as any,
            content: { character: '猫', readings: { primary: 'ねこ' }, meanings: { primary: ['Cat'] }, context_sentences: [] }
        }
    ];

    return (
        <GlobalReviewClient items={cards} />
    );
}
