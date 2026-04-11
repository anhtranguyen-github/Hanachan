-- Add Hints to all detail tables
ALTER TABLE public.radical_details ADD COLUMN IF NOT EXISTS meaning_hint TEXT;
ALTER TABLE public.kanji_details ADD COLUMN IF NOT EXISTS meaning_hint TEXT;
ALTER TABLE public.kanji_details ADD COLUMN IF NOT EXISTS reading_hint TEXT;
ALTER TABLE public.vocabulary_details ADD COLUMN IF NOT EXISTS meaning_hint TEXT;
ALTER TABLE public.vocabulary_details ADD COLUMN IF NOT EXISTS reading_hint TEXT;

-- Expand Audio for Vocabulary (to support multi-actor, multi-format)
ALTER TABLE public.vocabulary_details ADD COLUMN IF NOT EXISTS pronunciation_audios JSONB DEFAULT '[]'::jsonb;

-- Support for Radical Images (Multiple formats like SVG, PNG)
ALTER TABLE public.radical_details ADD COLUMN IF NOT EXISTS character_images JSONB DEFAULT '[]'::jsonb;

-- Track official WaniKani states and timestamps
ALTER TABLE public.user_learning_states ADD COLUMN IF NOT EXISTS wanikani_state TEXT; -- locked, in_lessons, review, burned
ALTER TABLE public.user_learning_states ADD COLUMN IF NOT EXISTS unlocked_at TIMESTAMPTZ;
ALTER TABLE public.user_learning_states ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;
ALTER TABLE public.user_learning_states ADD COLUMN IF NOT EXISTS burned_at TIMESTAMPTZ;

-- Add comment for clarity
COMMENT ON COLUMN public.user_learning_states.wanikani_state IS 'Original WaniKani SRS state (locked, in_lessons, review, burned)';
