
import React from 'react';
import { notFound } from 'next/navigation';
import { knowledgeService } from '@/features/knowledge';
import { getUserLearningStates } from '@/features/learning/db';
import { GrammarDetailView } from '@/features/knowledge/components/GrammarDetailView';
import { createClient } from '@/services/supabase/server';

interface PageProps {
    params: {
        slug: string;
    };
}

export default async function GrammarDetailPage({ params }: PageProps) {
    const { slug } = params;
    const grammar = await knowledgeService.getBySlug(slug, 'grammar');

    if (!grammar) {
        notFound();
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const srsStatus = user ? await getUserLearningStates(user.id) : {};
    const srsInfo = srsStatus[slug] || null;

    const contextSentences = await knowledgeService.getSentencesByKU(grammar.id);

    return (
        <GrammarDetailView
            grammar={grammar}
            contextSentences={contextSentences}
            srsInfo={srsInfo}
        />
    );
}
