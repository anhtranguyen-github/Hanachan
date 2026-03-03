/**
 * Dictation Service - manages video dictation practice sessions
 * Moved from FastAPI to Next.js as part of Phase 2 architectural remediation
 */

import { supabase } from "@/lib/supabase";
import { HanaTime } from "@/lib/time";

export interface DictationSession {
    id: string;
    user_id: string;
    video_id: string;
    status: 'active' | 'completed' | 'abandoned';
    total_subtitles: number;
    correct_count: number;
    settings: DictationSettings;
    created_at: string;
    completed_at?: string;
}

export interface DictationSettings {
    jlpt_levels: number[];
    hint_type: 'romaji' | 'kana' | 'none';
    show_length: boolean;
}

export interface DictationSubtitle {
    id: string;
    subtitle_id: string;
    japanese: string;
    start_time: number;
    end_time: number;
}

export interface DictationAttempt {
    id: string;
    session_id: string;
    subtitle_id: string;
    user_input: string;
    is_correct: boolean;
    accuracy_score: number;
    time_taken_ms: number;
    attempts_count: number;
    created_at: string;
}

export interface DictationStats {
    total_sessions: number;
    total_attempts: number;
    average_accuracy: number;
    videos_practiced: number;
    current_streak: number;
    best_accuracy: number;
}

/**
 * Create a new dictation session for a video
 */
export async function createDictationSession(
    userId: string,
    videoId: string,
    settings: DictationSettings = { jlpt_levels: [5, 4, 3, 2, 1], hint_type: 'romaji', show_length: true }
): Promise<{ success: boolean; session?: DictationSession; subtitles?: DictationSubtitle[]; error?: string }> {
    try {
        // Get video subtitles
        const { data: videoData, error: videoError } = await supabase
            .from('videos')
            .select('subtitles')
            .eq('id', videoId)
            .single();

        if (videoError || !videoData) {
            return { success: false, error: 'Video not found' };
        }

        const subtitles = videoData.subtitles || [];
        const filteredSubtitles = subtitles.filter((sub: any) => 
            settings.jlpt_levels.includes(sub.jlpt_level || 5)
        );

        // Create session
        const { data: session, error: sessionError } = await supabase
            .from('video_dictation_sessions')
            .insert({
                user_id: userId,
                video_id: videoId,
                total_subtitles: filteredSubtitles.length,
                settings,
                status: 'active'
            })
            .select()
            .single();

        if (sessionError || !session) {
            console.error('Error creating dictation session:', sessionError);
            return { success: false, error: 'Failed to create session' };
        }

        // Format subtitles for response
        const formattedSubtitles: DictationSubtitle[] = filteredSubtitles.map((sub: any, index: number) => ({
            id: `${session.id}_${index}`,
            subtitle_id: sub.id || `${videoId}_${index}`,
            japanese: sub.japanese_text || sub.text || '',
            start_time: sub.start_time || 0,
            end_time: sub.end_time || 0
        }));

        return {
            success: true,
            session: session as DictationSession,
            subtitles: formattedSubtitles
        };

    } catch (error: any) {
        console.error('Error creating dictation session:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Submit a dictation attempt
 */
export async function submitDictationAttempt(
    userId: string,
    sessionId: string,
    subtitleId: string,
    userInput: string,
    timeTakenMs: number
): Promise<{ success: boolean; result?: any; error?: string }> {
    try {
        // Get session to verify ownership
        const { data: session, error: sessionError } = await supabase
            .from('video_dictation_sessions')
            .select('*')
            .eq('id', sessionId)
            .eq('user_id', userId)
            .single();

        if (sessionError || !session) {
            return { success: false, error: 'Session not found or access denied' };
        }

        // Get the correct subtitle
        const { data: videoData } = await supabase
            .from('videos')
            .select('subtitles')
            .eq('id', session.video_id)
            .single();

        const subtitles = videoData?.subtitles || [];
        const subtitle = subtitles.find((s: any) => 
            (s.id || '').toString() === subtitleId || 
            `${session.video_id}_${subtitles.indexOf(s)}` === subtitleId
        );

        if (!subtitle) {
            return { success: false, error: 'Subtitle not found' };
        }

        const correctText = subtitle.japanese_text || subtitle.text || '';
        
        // Calculate accuracy (simple matching for now)
        const normalizedInput = userInput.trim().replace(/\s+/g, '');
        const normalizedCorrect = correctText.trim().replace(/\s+/g, '');
        const isCorrect = normalizedInput === normalizedCorrect;
        
        // Calculate accuracy percentage
        let accuracyScore = 0;
        if (isCorrect) {
            accuracyScore = 100;
        } else {
            // Simple character-based accuracy
            const maxLen = Math.max(normalizedInput.length, normalizedCorrect.length);
            let matches = 0;
            for (let i = 0; i < Math.min(normalizedInput.length, normalizedCorrect.length); i++) {
                if (normalizedInput[i] === normalizedCorrect[i]) matches++;
            }
            accuracyScore = Math.round((matches / maxLen) * 100);
        }

        // Count previous attempts
        const { count: attemptsCount } = await supabase
            .from('video_dictation_attempts')
            .select('*', { count: 'exact', head: true })
            .eq('session_id', sessionId)
            .eq('subtitle_id', subtitleId);

        // Save attempt
        const { error: attemptError } = await supabase
            .from('video_dictation_attempts')
            .insert({
                session_id: sessionId,
                subtitle_id: subtitleId,
                user_input: userInput,
                is_correct: isCorrect,
                accuracy_score: accuracyScore,
                time_taken_ms: timeTakenMs,
                attempts_count: (attemptsCount || 0) + 1
            });

        if (attemptError) {
            console.error('Error saving attempt:', attemptError);
            return { success: false, error: 'Failed to save attempt' };
        }

        // Update session progress
        const { data: stats } = await supabase
            .from('video_dictation_attempts')
            .select('is_correct')
            .eq('session_id', sessionId);

        const correctCount = stats?.filter(s => s.is_correct).length || 0;
        const totalAttempts = stats?.length || 0;
        const accuracyPercent = totalAttempts > 0 ? Math.round((correctCount / session.total_subtitles) * 100) : 0;

        // Check if session is complete
        const isComplete = totalAttempts >= session.total_subtitles;
        
        const updateData: any = {
            correct_count: correctCount,
            accuracy_percent: accuracyPercent,
            updated_at: HanaTime.getNowISO()
        };

        if (isComplete) {
            updateData.status = 'completed';
            updateData.completed_at = HanaTime.getNowISO();
        }

        await supabase
            .from('video_dictation_sessions')
            .update(updateData)
            .eq('id', sessionId);

        return {
            success: true,
            result: {
                is_correct: isCorrect,
                accuracy_score: accuracyScore,
                correct_text: correctText,
                attempts_count: (attemptsCount || 0) + 1,
                is_complete: isComplete,
                progress: {
                    attempted: totalAttempts,
                    total: session.total_subtitles,
                    correct: correctCount,
                    accuracy_percent: accuracyPercent
                }
            }
        };

    } catch (error: any) {
        console.error('Error submitting dictation attempt:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get dictation session status
 */
export async function getDictationSessionStatus(
    userId: string,
    sessionId: string
): Promise<{ success: boolean; session?: any; error?: string }> {
    try {
        const { data: session, error } = await supabase
            .from('video_dictation_sessions')
            .select('*')
            .eq('id', sessionId)
            .eq('user_id', userId)
            .single();

        if (error || !session) {
            return { success: false, error: 'Session not found' };
        }

        // Get attempt stats
        const { data: attempts } = await supabase
            .from('video_dictation_attempts')
            .select('*')
            .eq('session_id', sessionId);

        return {
            success: true,
            session: {
                ...session,
                attempts: attempts || []
            }
        };

    } catch (error: any) {
        console.error('Error getting session status:', error);
        return { success: false, error: error.message };
    }
}

/**
 * End/abandon a dictation session
 */
export async function endDictationSession(
    userId: string,
    sessionId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const { error } = await supabase
            .from('video_dictation_sessions')
            .update({
                status: 'abandoned',
                completed_at: HanaTime.getNowISO(),
                updated_at: HanaTime.getNowISO()
            })
            .eq('id', sessionId)
            .eq('user_id', userId);

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true };

    } catch (error: any) {
        console.error('Error ending session:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get dictation stats for a user
 */
export async function getDictationStats(userId: string): Promise<DictationStats> {
    try {
        // Total sessions
        const { count: totalSessions } = await supabase
            .from('video_dictation_sessions')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId);

        // Total attempts
        const { data: attemptsData } = await supabase
            .from('video_dictation_attempts')
            .select('id')
            .eq('user_id', userId);

        // Alternative: join through sessions
        const { data: sessionAttempts } = await supabase
            .from('video_dictation_sessions')
            .select('id')
            .eq('user_id', userId);

        const sessionIds = sessionAttempts?.map(s => s.id) || [];
        let totalAttempts = 0;
        let averageAccuracy = 0;

        if (sessionIds.length > 0) {
            const { data: attempts } = await supabase
                .from('video_dictation_attempts')
                .select('accuracy_score')
                .in('session_id', sessionIds);

            totalAttempts = attempts?.length || 0;
            averageAccuracy = totalAttempts > 0
                ? (attempts?.reduce((sum, a) => sum + (a.accuracy_score || 0), 0) || 0) / totalAttempts
                : 0;
        }

        // Videos practiced
        const { data: videosData } = await supabase
            .from('video_dictation_sessions')
            .select('video_id')
            .eq('user_id', userId);

        const uniqueVideos = new Set(videosData?.map(v => v.video_id) || []);

        // Best accuracy
        const { data: bestSession } = await supabase
            .from('video_dictation_sessions')
            .select('accuracy_percent')
            .eq('user_id', userId)
            .eq('status', 'completed')
            .order('accuracy_percent', { ascending: false })
            .limit(1)
            .single();

        return {
            total_sessions: totalSessions || 0,
            total_attempts: totalAttempts,
            average_accuracy: Math.round(averageAccuracy * 10) / 10,
            videos_practiced: uniqueVideos.size,
            current_streak: 0, // Would need daily practice tracking
            best_accuracy: bestSession?.accuracy_percent || 0
        };

    } catch (error) {
        console.error('Error getting dictation stats:', error);
        return {
            total_sessions: 0,
            total_attempts: 0,
            average_accuracy: 0,
            videos_practiced: 0,
            current_streak: 0,
            best_accuracy: 0
        };
    }
}
