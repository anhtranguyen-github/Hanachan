'use server';

import { sentenceClient } from '@/services/sentenceClient';
import { sentenceRepository } from '@/features/sentence/db';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Architecture Note: Direct FastAPI calls removed per Phase 2 migration
// Use Next.js API routes instead of calling FastAPI directly

function getSupabase(cookieStore: any) {
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) { return cookieStore.get(name)?.value; },
            },
        }
    );
}

export async function addSentenceAction(japaneseRaw: string, englishRaw: string) {
    const cookieStore = await cookies();
    const supabase = getSupabase(cookieStore);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { success: false, error: 'Unauthorized' };
    }

    const data = await sentenceRepository.create({
        japanese_raw: japaneseRaw,
        english_raw: englishRaw,
        source: 'manual',
        created_by: user.id,
    }, supabase as any);

    if (!data) {
        return { success: false, error: 'Failed to create sentence.' };
    }

    try {
        const annotations = await sentenceClient.annotate(data.id, japaneseRaw);
        return { success: true, data: { ...data, annotations } };
    } catch (err) {
        console.warn('Annotation failed (non-fatal):', err);
    }

    return { success: true, data: { ...data, annotations: [] } };
}

export async function fetchUserSentencesAction() {
    const cookieStore = await cookies();
    const supabase = getSupabase(cookieStore);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { success: false, error: 'Unauthorized' };
    }

    const sentences = await sentenceRepository.getUserSentences(user.id, supabase as any);

    if (!sentences || sentences.length === 0) {
        return { success: true, data: [] };
    }

    // Fetch annotations for all sentences in one query
    const sentenceIds = sentences.map(s => s.id);
    const { data: annotations } = await supabase
        .from('sentence_knowledge')
        .select(`
            sentence_id,
            position_start,
            position_end,
            ku_id,
            knowledge_units!inner (
                type,
                character,
                slug
            )
        `)
        .in('sentence_id', sentenceIds);

    // Group annotations by sentence_id
    const annotationMap: Record<string, any[]> = {};
    for (const ann of (annotations || [])) {
        const sid = ann.sentence_id;
        if (!annotationMap[sid]) annotationMap[sid] = [];
        const ku = (ann as any).knowledge_units;
        annotationMap[sid].push({
            ku_id: ann.ku_id,
            ku_type: ku?.type,
            character: ku?.character,
            slug: ku?.slug,
            position_start: ann.position_start,
            position_end: ann.position_end,
        });
    }

    // Attach annotations to each sentence
    const enriched = sentences.map(s => ({
        ...s,
        annotations: (annotationMap[s.id] || []).sort(
            (a: any, b: any) => a.position_start - b.position_start
        ),
    }));

    return { success: true, data: enriched };
}
