
-- =========================================================
-- PATCH: Add Missing Columns for AI/Search Features
-- Based on user's existing schema
-- =========================================================

-- 1. Ensure Table Naming Alignment (Profiles vs Users)
-- Code uses 'users', standard migration might have used 'profiles'.
-- Patch ensures 'users' exists and is correctly structured.
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
    CREATE TABLE public.users (
      id uuid references auth.users not null primary key,
      email text unique,
      display_name text,
      avatar_url text,
      role text default 'USER',
      current_level integer default 1,
      created_at timestamp with time zone default timezone('utc'::text, now()) not null
    );
  ELSE
    -- Ensure columns exist in case it was a partial create
    ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email text;
    ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role text default 'USER';
    ALTER TABLE public.users ADD COLUMN IF NOT EXISTS current_level integer default 1;
  END IF;
END $$;

-- 2. Update Knowledge Units for SQL Search
ALTER TABLE public.knowledge_units 
ADD COLUMN IF NOT EXISTS slug text,
ADD COLUMN IF NOT EXISTS "character" text,
ADD COLUMN IF NOT EXISTS meaning text;

-- 3. Ensure User Settings matches UserSettings interface
ALTER TABLE public.user_settings 
ADD COLUMN IF NOT EXISTS daily_new_limit integer default 20,
ADD COLUMN IF NOT EXISTS daily_review_limit integer default 100,
ADD COLUMN IF NOT EXISTS fsrs_weights float[] default '{0.4, 0.6, 2.4, 5.8, 4.9, 0.4, 0.9, 0.0, 1.5, 0.4, 0.7, 0.8, 0.1, 0.3, 1.5, 0.4, 2.4}',
ADD COLUMN IF NOT EXISTS target_retention float default 0.9,
ADD COLUMN IF NOT EXISTS quota_limit integer default 100,
ADD COLUMN IF NOT EXISTS quota_used integer default 0,
ADD COLUMN IF NOT EXISTS metadata jsonb;

-- 4. Align Analysis History
DO $$ 
BEGIN 
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_analysis_history' AND column_name='text_content') THEN
    ALTER TABLE public.user_analysis_history RENAME COLUMN text_content TO text_ja;
  END IF;
  -- If it doesn't exist at all, add it
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_analysis_history' AND column_name='text_ja') THEN
    ALTER TABLE public.user_analysis_history ADD COLUMN text_ja text;
  END IF;
END $$;

-- 5. Fix SRS related table columns for consistency
DO $$ 
BEGIN 
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_learning_states' AND column_name='due_date') THEN
    ALTER TABLE public.user_learning_states RENAME COLUMN due_date TO next_review;
  END IF;
END $$;

-- 6. Ensure fsrs_history table exists
create table if not exists public.fsrs_history (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) not null,
  ku_id text references public.knowledge_units(id) not null,
  rating integer not null,
  prev_state text,
  prev_stability real,
  prev_difficulty real,
  new_stability real,
  new_difficulty real,
  scheduled_days integer,
  review_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. Ensure user_youtube_videos has last_watched_at
ALTER TABLE public.user_youtube_videos ADD COLUMN IF NOT EXISTS last_watched_at timestamp with time zone;

-- 8. Ensure user_daily_stats has 'day' column
DO $$ 
BEGIN 
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_daily_stats' AND column_name='date') THEN
    ALTER TABLE public.user_daily_stats RENAME COLUMN "date" TO "day";
  END IF;
END $$;

-- 9. Ensure Text Search Indexes
CREATE INDEX IF NOT EXISTS idx_ku_search_character ON public.knowledge_units USING btree ("character");
CREATE INDEX IF NOT EXISTS idx_ku_search_meaning ON public.knowledge_units USING btree (meaning);
CREATE INDEX IF NOT EXISTS idx_ku_search_slug ON public.knowledge_units USING btree (slug);

-- 10. Sync Data (Optional updates)
UPDATE public.knowledge_units SET slug = id WHERE slug IS NULL;

UPDATE public.knowledge_units ku
SET "character" = k.character, meaning = (k.meaning_data->>'primary')
FROM public.ku_kanji k
WHERE ku.id = k.ku_id AND (ku."character" IS NULL OR ku.meaning IS NULL);

UPDATE public.knowledge_units ku
SET "character" = v.character, meaning = v.reading_primary || ' ' || (v.meaning_data->>'primary')
FROM public.ku_vocabulary v
WHERE ku.id = v.ku_id AND (ku."character" IS NULL OR ku.meaning IS NULL);
