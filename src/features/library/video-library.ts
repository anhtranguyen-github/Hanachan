
import { createClient } from '@/services/supabase/server';
import { VideoMetadata } from './types';

const DUMMY_USER_ID = "00000000-0000-0000-0000-000000000000";

export class VideoLibraryService {

    /**
     * Adds a video to the user's library in Supabase.
     */
    async addVideo(video: Omit<VideoMetadata, 'id' | 'user_id' | 'created_at'>, userId: string = DUMMY_USER_ID) {
        const supabase = createClient();

        // 1. Check if video already exists for this user
        const { data: existing } = await supabase
            .from('user_youtube_videos')
            .select('*')
            .eq('user_id', userId)
            .eq('video_id', video.video_id)
            .single();

        if (existing) {
            console.log(`⚠️ Video ${video.video_id} already in library. Skipping.`);
            return existing as VideoMetadata;
        }

        // 2. Insert new record
        const { data, error } = await supabase
            .from('user_youtube_videos')
            .insert({
                user_id: userId,
                video_id: video.video_id,
                title: video.title,
                thumbnail_url: video.thumbnail_url,
                channel_title: video.channel_title,
                status: video.status || 'new',
                last_watched_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) {
            console.error("❌ Error adding video to library:", error);
            throw error;
        }

        console.log(`📚 Added to DB Library: ${video.title}`);
        return data as VideoMetadata;
    }

    /**
     * Lists all videos in library from Supabase.
     */
    async listVideos(userId: string = DUMMY_USER_ID): Promise<VideoMetadata[]> {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('user_youtube_videos')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error("❌ Error listing videos:", error);
            return [];
        }

        return (data || []) as VideoMetadata[];
    }

    /**
     * Update video status.
     */
    async updateStatus(videoId: string, status: VideoMetadata['status'], userId: string = DUMMY_USER_ID) {
        const supabase = createClient();
        const { error } = await supabase
            .from('user_youtube_videos')
            .update({ status, last_watched_at: new Date().toISOString() })
            .eq('user_id', userId)
            .eq('video_id', videoId);

        if (error) console.error("❌ Error updating video status:", error);
    }

    async deleteVideo(videoId: string, userId: string = DUMMY_USER_ID) {
        const supabase = createClient();
        const { error } = await supabase
            .from('user_youtube_videos')
            .delete()
            .eq('user_id', userId)
            .eq('video_id', videoId);

        if (error) console.error("❌ Error deleting video:", error);
    }
}

export const videoLibraryService = new VideoLibraryService();
