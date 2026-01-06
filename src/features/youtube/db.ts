import { createClient } from '@/services/supabase/client';
import { UserVideo } from './types';
import { SupabaseClient } from '@supabase/supabase-js';

export const TABLE_NAME = 'user_youtube_videos';

export async function addVideo(video: Partial<UserVideo> & { user_id: string; video_id: string }, client?: SupabaseClient) {
    const supabase = client || createClient();

    // Check if exists
    const { data: existing } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .eq('user_id', video.user_id)
        .eq('video_id', video.video_id)
        .single();

    if (existing) return existing as UserVideo;

    const { data, error } = await supabase
        .from(TABLE_NAME)
        .insert({
            user_id: video.user_id,
            video_id: video.video_id,
            title: video.title || '',
            thumbnail_url: video.thumbnail_url || `https://img.youtube.com/vi/${video.video_id}/mqdefault.jpg`,
            channel_title: video.channel_title || '',
            status: video.status || 'learning',
            last_watched_at: new Date().toISOString()
        })
        .select()
        .single();

    if (error) {
        console.error("Failed to add video to DB:", error);
        throw error;
    }

    return data as UserVideo;
}

export async function getUserVideos(userId: string) {
    const supabase = createClient();

    const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Failed to fetch videos:", error);
        return [];
    }

    return data as UserVideo[];
}

export async function deleteVideo(id: string) {
    const supabase = createClient();
    const { error } = await supabase
        .from(TABLE_NAME)
        .delete()
        .eq('id', id);

    if (error) throw error;
}

export async function getVideoByYoutubeId(userId: string, videoId: string, client?: SupabaseClient) {
    const supabase = client || createClient();
    const { data } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .eq('user_id', userId)
        .eq('video_id', videoId)
        .single();

    return data as UserVideo | null;
}

export async function updateVideoStatus(id: string, status: string) {
    const supabase = createClient();
    const { error } = await supabase
        .from(TABLE_NAME)
        .update({ status })
        .eq('id', id);

    if (error) throw error;
}
