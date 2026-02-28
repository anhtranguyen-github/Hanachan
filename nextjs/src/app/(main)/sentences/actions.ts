'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const MEMORY_API_BASE = process.env.MEMORY_API_URL ?? 'http://localhost:8765';

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

    // 1. Insert the sentence
    const { data, error } = await supabase
        .from('sentences')
        .insert({
            japanese_raw: japaneseRaw,
            english_raw: englishRaw,
            source: 'user',
            created_by: user.id
        })
        .select()
        .single();

    if (error) {
        console.error('Error adding sentence:', error);
        return { success: false, error: error.message };
    }

    // 2. Trigger annotation via the backend API
    try {
        const annotRes = await fetch(`${MEMORY_API_BASE}/sentences/annotate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sentence_id: data.id,
                japanese_raw: japaneseRaw,
            }),
        });
        if (annotRes.ok) {
            const annotations = await annotRes.json();
            return { success: true, data: { ...data, annotations } };
        }
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

    // Fetch sentences
    const { data: sentences, error } = await supabase
        .from('sentences')
        .select('*')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });

    if (error) {
        return { success: false, error: error.message };
    }

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
