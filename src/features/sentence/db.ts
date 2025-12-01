import { createClient } from '@/services/supabase/server';
import { Sentence, KUToSentence } from './types';

export async function getSentenceById(id: string): Promise<Sentence | null> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('sentences')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error fetching sentence:', error);
        return null;
    }
    return data as Sentence;
}

export async function getSentencesByKU(kuId: string): Promise<Sentence[]> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('ku_to_sentence')
        .select('sentences (*)')
        .eq('ku_id', kuId);

    if (error) {
        console.error('Error fetching sentences for KU:', error);
        return [];
    }
    return (data || []).map((row: any) => row.sentences as Sentence);
}

export async function createSentence(data: Partial<Sentence>): Promise<Sentence | null> {
    const supabase = createClient();
    const { data: created, error } = await supabase
        .from('sentences')
        .insert(data)
        .select()
        .single();

    if (error) {
        console.error('Error creating sentence:', error);
        return null;
    }
    return created as Sentence;
}

export async function linkKUToSentence(link: KUToSentence): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
        .from('ku_to_sentence')
        .insert(link);

    if (error) {
        throw new Error(`Failed to link KU to sentence: ${error.message}`);
    }
}
