import { createClient } from '@/services/supabase/server';
import { AnalysisHistory } from './types';

export async function logAnalysis(analysis: Partial<AnalysisHistory>): Promise<AnalysisHistory | null> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('user_analysis_history')
        .insert(analysis)
        .select()
        .single();

    if (error) {
        console.error('Error logging analysis:', error);
        return null;
    }
    return data as AnalysisHistory;
}

export async function getUserAnalysisHistory(userId: string): Promise<AnalysisHistory[]> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('user_analysis_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching analysis history:', error);
        return [];
    }
    return data as AnalysisHistory[];
}
