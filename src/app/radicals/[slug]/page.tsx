'use client';

import React from 'react';
import { RadicalDetailView } from '@/modules/ckb/components/RadicalDetailView';

export default function RadicalDetailPage({ params }: any) {
    const slug = decodeURIComponent(params.slug);

    const radical = {
        id: 'r1',
        character: slug,
        meaning: 'Mock meaning for ' + slug,
        mnemonic: 'Mock mnemonic'
    };

    return (
        <RadicalDetailView
            radical={radical}
            linkedKanji={[]}
            srsInfo={null}
        />
    );
}
