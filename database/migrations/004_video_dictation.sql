-- ==========================================================
-- MIGRATION 004: VIDEO DICTATION FEATURES
-- Created: 2026-02-28
-- Features: Dictation practice sessions, attempts tracking,
--           accuracy scoring, progress per subtitle
-- ==========================================================

-- ==========================================
-- VIDEO DICTATION TABLES
-- ==========================================

-- Video dictation sessions: tracks a user's dictation practice session for a video
CREATE TABLE IF NOT EXISTS public.video_dictation_sessions (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    video_id uuid NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
    started_at timestamp with time zone DEFAULT now(),
    completed_at timestamp with time zone,
    total_subtitles integer DEFAULT 0,          -- Total subtitles attempted
    correct_count integer DEFAULT 0,            -- Number of correct attempts
    accuracy_percent integer DEFAULT 0,         -- Calculated accuracy
    status text DEFAULT 'in_progress',          -- in_progress, completed, abandoned
    settings jsonb DEFAULT '{"show_reading": false, "playback_speed": 1.0}', -- Session settings
    PRIMARY KEY (id),
    UNIQUE (user_id, video_id, started_at::date) -- One session per day per video
);

CREATE INDEX idx_video_dictation_sessions_user ON public.video_dictation_sessions(user_id);
CREATE INDEX idx_video_dictation_sessions_video ON public.video_dictation_sessions(video_id);
CREATE INDEX idx_video_dictation_sessions_status ON public.video_dictation_sessions(user_id, status);

-- Video dictation attempts: individual subtitle dictation attempts
CREATE TABLE IF NOT EXISTS public.video_dictation_attempts (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    session_id uuid NOT NULL REFERENCES public.video_dictation_sessions(id) ON DELETE CASCADE,
    subtitle_id uuid NOT NULL REFERENCES public.video_subtitles(id) ON DELETE CASCADE,
    user_input text NOT NULL,                   -- What the user typed
    is_correct boolean DEFAULT false,          -- Whether it matched
    accuracy_score integer DEFAULT 0,           -- Levenshtein-based similarity score (0-100)
    time_taken_ms integer DEFAULT 0,           -- How long they took to type
    attempts_count integer DEFAULT 1,           -- How many tries for this subtitle
    completed_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id)
);

CREATE INDEX idx_video_dictation_attempts_session ON public.video_dictation_attempts(session_id);
CREATE INDEX idx_video_dictation_attempts_subtitle ON public.video_dictation_attempts(subtitle_id);

-- Video dictation subtitle settings: which subtitles to include in dictation
CREATE TABLE IF NOT EXISTS public.video_dictation_settings (
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    video_id uuid NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
    included_jlpt_levels integer[] DEFAULT '{5,4,3,2,1}', -- Which JLPT levels to include
    min_subtitle_length integer DEFAULT 1,    -- Minimum characters
    max_subtitle_length integer DEFAULT 100, -- Maximum characters
    enable_reading_hint boolean DEFAULT false, -- Show hiragana reading
    playback_speed decimal(3,1) DEFAULT 1.0,  -- Audio playback speed
    auto_advance boolean DEFAULT true,        -- Auto move to next after correct
    PRIMARY KEY (user_id, video_id)
);

CREATE INDEX idx_video_dictation_settings_user ON public.video_dictation_settings(user_id);

-- ==========================================
-- HELPER FUNCTION: Calculate similarity score
-- ==========================================================

-- Function to calculate edit distance similarity between two strings
CREATE OR REPLACE FUNCTION public.calculate_similarity_score(
    input_text text,
    target_text text
) RETURNS integer AS $$
DECLARE
    input_len integer;
    target_len integer;
    matrix integer[];
    i integer;
    j integer;
    cost integer;
    max_len integer;
BEGIN
    -- Handle empty or null inputs
    IF input_text IS NULL OR target_text IS NULL THEN
        RETURN 0;
    END IF;
    
    IF input_text = '' AND target_text = '' THEN
        RETURN 100;
    END IF;
    
    IF input_text = '' OR target_text = '' THEN
        RETURN 0;
    END IF;

    input_len := length(input_text);
    target_len := length(target_text);
    max_len := greatest(input_len, target_len);
    
    -- If exactly matching, return 100
    IF input_text = target_text THEN
        RETURN 100;
    END IF;

    -- Simple Levenshtein distance calculation
    -- For Japanese text, we use a character-based approach
    cost := 0;
    
    -- For now, use a simple character overlap ratio
    -- This is a simplified version; for production, use proper Levenshtein
    DECLARE
        matched_chars integer := 0;
        input_char text;
        target_chars text[] := regexp_split_to_array(target_text, '');
    BEGIN
        FOR i IN 1..input_len LOOP
            input_char := substr(input_text, i, 1);
            FOR j IN 1..array_length(target_chars, 1) LOOP
                IF target_chars[j] = input_char AND j > 0 THEN
                    -- Check if this character was already matched
                    IF j <= array_length(target_chars, 1) THEN
                        matched_chars := matched_chars + 1;
                    END IF;
                END IF;
            END LOOP;
        END LOOP;
        
        -- Calculate score as ratio of matched characters
        RETURN LEAST(100, ROUND((matched_chars::float / max_len::float) * 100));
    END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ==========================================
-- VIEW: Video dictation progress per video
-- ==========================================================

CREATE OR REPLACE VIEW public.video_dictation_progress AS
SELECT 
    vds.user_id,
    vds.video_id,
    v.title as video_title,
    v.youtube_id,
    COUNT(vda.id) as total_attempts,
    SUM(CASE WHEN vda.is_correct THEN 1 ELSE 0 END) as correct_attempts,
    AVG(vda.accuracy_score)::integer as avg_accuracy,
    MAX(vda.completed_at) as last_attempt_at,
    vds.status,
    vds.completed_at
FROM public.video_dictation_sessions vds
LEFT JOIN public.video_dictation_attempts vda ON vda.session_id = vds.id
LEFT JOIN public.videos v ON v.id = vds.video_id
GROUP BY vds.id, v.id;

-- ==========================================================
-- END OF MIGRATION 004
-- ==========================================================
