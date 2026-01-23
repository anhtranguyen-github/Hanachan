-- Add status column to youtube_videos table
ALTER TABLE youtube_videos 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'learning';

-- Index for faster filtering by status (optional but good practice)
CREATE INDEX IF NOT EXISTS idx_youtube_videos_status ON youtube_videos(status);
