
import React from 'react';
import { notFound } from 'next/navigation';
import { knowledgeService } from '@/features/knowledge';
import { getUserLearningStates } from '@/features/learning/db';
import { RadicalDetailView } from '@/features/knowledge/components/RadicalDetailView';
import { createClient } from '@/services/supabase/server';

interface PageProps {
    params: {
        slug: string;
    };
}

export default async function RadicalDetailPage({ params }: PageProps) {
    const { slug } = params;

    const radical = await knowledgeService.getBySlug(slug, 'radical');

    if (!radical) {
        notFound();
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Fetch SRS info if user is logged in
    const srsStatus = user ? await getUserLearningStates(user.id) : {};
    const srsInfo = srsStatus[slug] || null;

    const linkedKanji = await knowledgeService.getLinkedKanjiByRadical(slug);

    return (
        <RadicalDetailView
            radical={radical}
            linkedKanji={linkedKanji}
            srsInfo={srsInfo}
        />
    );
}
