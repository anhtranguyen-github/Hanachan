
export interface VideoMetadata {
    id: string; // Internal UUID
    video_id: string; // YouTube ID
    user_id: string;
    title?: string;
    thumbnail_url?: string;
    channel_title?: string;
    status: 'new' | 'learning' | 'completed';
    last_watched_at?: string;
    created_at: string;
}
