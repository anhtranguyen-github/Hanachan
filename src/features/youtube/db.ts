import { createClient } from '@/services/supabase/server';
import { UserVideo } from './types';

export async function getUserVideos(userId: string): Promise<UserVideo[]> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('user_youtube_videos')
        .select('*')
        .eq('user_id', userId);

    if (error) {
        console.error('Error fetching user videos:', error);
        return [];
    }
    return data as UserVideo[];
}

export async function addVideo(video: Partial<UserVideo>): Promise<UserVideo | null> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('user_youtube_videos')
        .insert(video)
        .select()
        .single();

    if (error) {
        console.error('Error adding video:', error);
        return null;
    }
    return data as UserVideo;
}

export async function updateVideoStatus(userId: string, videoId: string, status: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
        .from('user_youtube_videos')
        .update({ status, last_watched_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('video_id', videoId);

    if (error) {
        throw new Error(`Failed to update video status: ${error.message}`);
    }
}
