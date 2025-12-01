export interface UserVideo {
    id: string;
    user_id: string;
    video_id: string;
    title?: string | null;
    thumbnail_url?: string | null;
    channel_title?: string | null;
    status: string; // 'learning' | 'mastered'
    last_watched_at?: string | null;
    created_at?: string;
}
