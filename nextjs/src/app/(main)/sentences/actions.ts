'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function addSentenceAction(japaneseRaw: string, englishRaw: string) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) { return cookieStore.get(name)?.value; },
            },
        }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { success: false, error: 'Unauthorized' };
    }

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

    return { success: true, data };
}

export async function fetchUserSentencesAction() {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) { return cookieStore.get(name)?.value; },
            },
        }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { success: false, error: 'Unauthorized' };
    }

    const { data, error } = await supabase
        .from('sentences')
        .select('*')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });

    if (error) {
        return { success: false, error: error.message };
    }

    return { success: true, data };
}
