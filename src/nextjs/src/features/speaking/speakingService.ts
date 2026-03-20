/**
 * Speaking Practice Service - manages speaking practice sessions
 * Moved from FastAPI to Next.js as part of Phase 2 architectural remediation
 */

import { supabase } from "@/lib/supabase";
import { HanaTime } from "@/lib/time";

export interface PracticeSentence {
    japanese: string;
    romaji: string;
    english: string;
    word: string;
    word_meaning: string;
    jlpt_level: number;
}

export interface PracticeSession {
    id: string;
    user_id: string;
    target_difficulty: string;
    status: 'active' | 'completed';
    created_at: string;
    completed_at?: string;
}

export interface PracticeAttempt {
    id: string;
    session_id: string;
    user_id: string;
    sentence: string;
    word: string;
    score: number;
    created_at: string;
}

export interface PracticeStats {
    total_sessions: number;
    total_attempts: number;
    average_score: number;
    words_practiced: number;
    current_streak: number;
}

/**
 * Create a new speaking practice session
 */
export async function createPracticeSession(
    userId: string,
    targetDifficulty?: string,
    supabaseClient?: any
): Promise<{ success: boolean; session?: PracticeSession; sentences?: PracticeSentence[]; error?: string }> {
    const db = supabaseClient || supabase;
    try {
        // Get learned words for the user (simplified - would need proper learned words query)
        const { data: learnedWords, error: wordsError } = await db

            .from('user_fsrs_states')
            .select('item_id, item_type, stability')
            .eq('user_id', userId)
            .eq('item_type', 'ku')
            .gt('stability', 0.1)
            .limit(20);

        if (wordsError) {
            console.error('Error fetching learned words:', wordsError);
        }

        // Get sentences for practice based on learned words
        let { data: sentences, error: sentencesError } = await db
            .from('sentences')
            .select('*')
            .order('jlpt_level', { ascending: true })
            .limit(10);

        if (sentencesError) {
            console.error('Error fetching sentences:', sentencesError);
        }

        // Fallback for demo/empty DB
        if (!sentences || sentences.length === 0) {
            sentences = [
                { japanese: 'これはペンです。', english: 'This is a pen.', romaji: 'Kore wa pen desu.', jlpt_level: 5 },
                { japanese: 'こんにちは。', english: 'Hello.', romaji: 'Konnichiwa.', jlpt_level: 5 },
                { japanese: 'ありがとうございます。', english: 'Thank you very much.', romaji: 'Arigatou gozaimasu.', jlpt_level: 5 }
            ] as any;
        }


        // Format sentences for response
        const formattedSentences: PracticeSentence[] = (sentences || []).map((s: any) => {
            const level = s.jlpt_level || 5;
            let diff: 'N5' | 'N3' | 'N1' = 'N5';
            if (level <= 4) diff = 'N5';
            else if (level <= 2) diff = 'N3';
            else diff = 'N1';

            return {
                japanese: s.japanese,
                english: s.english,
                reading: s.reading || s.romaji || '',
                difficulty: diff,
                source_word: s.japanese?.slice(0, 1) || '?', // Placeholder for target word
                word_meaning: s.english || '',
                jlpt_level: level
            };
        });


        // Create session
        const { data: session, error: sessionError } = await db
            .from('speaking_sessions')
            .insert({

                user_id: userId,
                difficulty: targetDifficulty || 'N5',
                status: 'active',
                sentences: formattedSentences,
                total_sentences: formattedSentences.length
            })
            .select()
            .single();

        if (sessionError || !session) {
            console.error('Error creating practice session:', sessionError);
            return { success: false, error: 'Failed to create session' };
        }



        return {
            success: true,
            session: session as PracticeSession,
            sentences: formattedSentences
        };

    } catch (error: unknown) {
        console.error('Error creating practice session:', error);
        return { success: false, error: (error instanceof Error ? error.message : String(error)) };
    }
}

/**
 * Record a practice attempt
 */
export async function recordPracticeAttempt(
    userId: string,
    sessionId: string,
    sentence: string,
    word: string,
    score: number,
    supabaseClient?: any
): Promise<{ success: boolean; attempt?: PracticeAttempt; error?: string }> {
    const db = supabaseClient || supabase;
    try {
        // Verify session ownership
        const { data: session, error: sessionError } = await db
            .from('speaking_sessions')
            .select('*')
            .eq('id', sessionId)
            .eq('user_id', userId)
            .single();

        if (sessionError || !session) {
            return { success: false, error: 'Session not found or access denied' };
        }

        // Record attempt
        const { data: attempt, error: attemptError } = await db
            .from('speaking_attempts')
            .insert({
                session_id: sessionId,
                user_id: userId,
                sentence,
                word,
                score
            })
            .select()
            .single();


        if (attemptError || !attempt) {
            console.error('Error recording attempt:', attemptError);
            return { success: false, error: 'Failed to record attempt' };
        }

        return {
            success: true,
            attempt: attempt as PracticeAttempt
        };

    } catch (error: unknown) {
        console.error('Error recording practice attempt:', error);
        return { success: false, error: (error instanceof Error ? error.message : String(error)) };
    }
}

/**
 * End a practice session
 */
export async function endPracticeSession(
    userId: string,
    sessionId: string,
    supabaseClient?: any
): Promise<{ success: boolean; error?: string }> {
    const db = supabaseClient || supabase;
    try {
        const { error } = await db
            .from('speaking_sessions')
            .update({
                status: 'completed',
                completed_at: HanaTime.getNowISO()
            })
            .eq('id', sessionId)
            .eq('user_id', userId);


        if (error) {
            return { success: false, error: (error instanceof Error ? error.message : String(error)) };
        }

        return { success: true };

    } catch (error: unknown) {
        console.error('Error ending practice session:', error);
        return { success: false, error: (error instanceof Error ? error.message : String(error)) };
    }
}

/**
 * Get practice stats for a user
 */
export async function getPracticeStats(userId: string): Promise<PracticeStats> {
    try {
        // Total sessions
        const { count: totalSessions } = await supabase
            .from('speaking_sessions')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId);

        // Total attempts and average score
        const { data: attempts, error: attemptsError } = await supabase
            .from('speaking_attempts')
            .select('score, word')
            .eq('user_id', userId);

        if (attemptsError) {
            console.error('Error fetching attempts:', attemptsError);
        }

        const totalAttempts = attempts?.length || 0;
        const averageScore = totalAttempts > 0
            ? (attempts?.reduce((sum, a) => sum + (a.score || 0), 0) || 0) / totalAttempts
            : 0;

        // Unique words practiced
        const uniqueWords = new Set(attempts?.map(a => a.word) || []);

        return {
            total_sessions: totalSessions || 0,
            total_attempts: totalAttempts,
            average_score: Math.round(averageScore * 10) / 10,
            words_practiced: uniqueWords.size,
            current_streak: 0  // Would need daily practice tracking
        };

    } catch (error) {
        console.error('Error getting practice stats:', error);
        return {
            total_sessions: 0,
            total_attempts: 0,
            average_score: 0,
            words_practiced: 0,
            current_streak: 0
        };
    }
}
