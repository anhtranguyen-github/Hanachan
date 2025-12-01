
import React from 'react';
import { notFound } from 'next/navigation';
import { knowledgeService } from '@/features/knowledge';
import { getUserLearningStates } from '@/features/learning/db';
import { KanjiDetailView } from '@/features/knowledge/components/KanjiDetailView';
import { createClient } from '@/services/supabase/server';

interface PageProps {
    params: {
        slug: string;
    };
}

export default async function KanjiDetailPage({ params }: PageProps) {
    const { slug } = params;
    const kanji = await knowledgeService.getBySlug(slug, 'kanji');

    if (!kanji) {
        notFound();
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const srsStatus = user ? await getUserLearningStates(user.id) : {};
    const srsInfo = srsStatus[slug] || null;

    const linkedVocab = await knowledgeService.getLinkedVocabByKanji(kanji.character);

    return (
        <KanjiDetailView
            kanji={kanji}
            linkedVocabulary={linkedVocab}
            srsInfo={srsInfo}
        />
    );
}
