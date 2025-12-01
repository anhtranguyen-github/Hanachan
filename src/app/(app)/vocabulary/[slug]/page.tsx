
import React from 'react';
import { notFound } from 'next/navigation';
import { knowledgeService } from '@/features/knowledge';
import { getUserLearningStates } from '@/features/learning/db';
import { VocabularyDetailView } from '@/features/knowledge/components/VocabularyDetailView';
import { createClient } from '@/services/supabase/server';

interface PageProps {
    params: {
        slug: string;
    };
}

export default async function VocabularyDetailPage({ params }: PageProps) {
    const { slug } = params;
    const vocab = await knowledgeService.getBySlug(slug, 'vocabulary');

    if (!vocab) {
        notFound();
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const srsStatus = user ? await getUserLearningStates(user.id) : {};
    const srsInfo = srsStatus[slug] || null;

    const contextSentences = await knowledgeService.getSentencesByKU(vocab.id);

    return (
        <VocabularyDetailView
            vocabulary={vocab}
            contextSentences={contextSentences}
            srsInfo={srsInfo}
        />
    );
}
