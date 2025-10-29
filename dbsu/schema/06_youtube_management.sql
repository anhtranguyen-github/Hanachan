-- ---------------------------------------------------------
-- PART 06: YOUTUBE MANAGEMENT (UC-04.1)
-- ---------------------------------------------------------

CREATE TABLE IF NOT EXISTS user_youtube_videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    video_id TEXT NOT NULL,         -- YouTube Video ID
    title TEXT,
    thumbnail_url TEXT,
    channel_title TEXT,
    status TEXT DEFAULT 'learning', -- 'learning', 'completed', 'bookmarked'
    last_watched_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, video_id)
);

-- Link individual sentences to these videos for better organization
ALTER TABLE sentences ADD COLUMN IF NOT EXISTS youtube_video_id UUID REFERENCES user_youtube_videos(id) ON DELETE SET NULL;
