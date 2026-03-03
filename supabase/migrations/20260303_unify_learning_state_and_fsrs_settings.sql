-- ==========================================================
-- MIGRATION: Unify Learning State Tables + Add FSRS Settings
-- Created: 2026-03-03
-- Purpose:
--   1. Unify user_learning_states and user_fsrs_states
--   2. Add per-user FSRS settings table
--   3. Ensure both Next.js and FastAPI use same schema
-- ==========================================================

-- ==========================================
-- STEP 1: Create FSRS Settings Table Per User
-- ==========================================
CREATE TABLE IF NOT EXISTS public.user_fsrs_settings (
  user_id uuid NOT NULL PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- FSRS-4.5 Algorithm Weights (w0-w18)
  -- Defaults from FSRS-4.5 paper
  w0 double precision DEFAULT 0.4,   -- Initial stability for new cards
  w1 double precision DEFAULT 0.6,   -- Initial stability for new cards (second)
  w2 double precision DEFAULT 2.4,   -- Initial difficulty
  w3 double precision DEFAULT 5.8,   -- Difficulty adjustment factor
  w4 double precision DEFAULT 4.93,  -- Retrievability threshold
  w5 double precision DEFAULT 0.94,  -- Stability gain factor (Again)
  w6 double precision DEFAULT 0.86,  -- Stability gain factor (Hard)
  w7 double precision DEFAULT 1.01,  -- Stability gain factor (Good)
  w8 double precision DEFAULT 1.05,  -- Stability gain factor (Easy)
  w9 double precision DEFAULT 0.94,  -- Stability decay factor
  w10 double precision DEFAULT 0.74, -- Retrievability factor
  w11 double precision DEFAULT 0.46, -- Difficulty damping
  w12 double precision DEFAULT 0.27, -- Difficulty mean reversion
  w13 double precision DEFAULT 0.29, -- Short-term stability factor
  w14 double precision DEFAULT 0.42, -- Short-term stability exponent
  w15 double precision DEFAULT 0.36, -- Short-term difficulty factor
  w16 double precision DEFAULT 0.29, -- Short-term difficulty exponent
  w17 double precision DEFAULT 1.2,  -- Initial stability for relearning
  w18 double precision DEFAULT 0.25, -- Relearning stability factor
  
  -- User Preferences
  daily_new_cards integer DEFAULT 10,     -- Daily new card limit
  daily_review_limit integer DEFAULT 100, -- Daily review limit
  learning_steps integer[] DEFAULT ARRAY[1, 10], -- Minutes: 1min, 10min
  relearning_steps integer[] DEFAULT ARRAY[10],  -- Minutes: 10min
  graduation_interval integer DEFAULT 1,  -- Days until graduated to review
  easy_interval integer DEFAULT 4,        -- Easy bonus interval
  interval_modifier double precision DEFAULT 1.0, -- Global interval modifier
  
  -- Scheduling Preferences
  show_answer_timer boolean DEFAULT true,
  auto_play_audio boolean DEFAULT false,
  skip_empty_fields boolean DEFAULT true,
  
  -- Timestamps
  created_at timestamp with time zone DEFAULT NOW(),
  updated_at timestamp with time zone DEFAULT NOW()
);

CREATE INDEX idx_user_fsrs_settings_user ON public.user_fsrs_settings(user_id);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_fsrs_settings_updated_at ON public.user_fsrs_settings;
CREATE TRIGGER update_fsrs_settings_updated_at
    BEFORE UPDATE ON public.user_fsrs_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- STEP 2: Modify user_fsrs_states to be the unified table
-- ==========================================

-- Add 'burned' state if not exists (from user_learning_states)
ALTER TABLE public.user_fsrs_states 
DROP CONSTRAINT IF EXISTS user_fsrs_states_state_check;

ALTER TABLE public.user_fsrs_states 
ADD CONSTRAINT user_fsrs_states_state_check 
CHECK (state IN ('new', 'learning', 'review', 'relearning', 'burned'));

-- Add RLS policies for user_fsrs_states
ALTER TABLE public.user_fsrs_states ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own FSRS states" ON public.user_fsrs_states;
CREATE POLICY "Users can view own FSRS states"
  ON public.user_fsrs_states FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own FSRS states" ON public.user_fsrs_states;
CREATE POLICY "Users can insert own FSRS states"
  ON public.user_fsrs_states FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own FSRS states" ON public.user_fsrs_states;
CREATE POLICY "Users can update own FSRS states"
  ON public.user_fsrs_states FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own FSRS states" ON public.user_fsrs_states;
CREATE POLICY "Users can delete own FSRS states"
  ON public.user_fsrs_states FOR DELETE
  USING (auth.uid() = user_id);

-- Add RLS policies for user_fsrs_settings
ALTER TABLE public.user_fsrs_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own FSRS settings" ON public.user_fsrs_settings;
CREATE POLICY "Users can view own FSRS settings"
  ON public.user_fsrs_settings FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can upsert own FSRS settings" ON public.user_fsrs_settings;
CREATE POLICY "Users can upsert own FSRS settings"
  ON public.user_fsrs_settings FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ==========================================
-- STEP 3: Migrate data from user_learning_states to user_fsrs_states
-- ==========================================

-- Migrate KU learning states to the unified table
-- Note: This assumes user_fsrs_states has a more generic structure
INSERT INTO public.user_fsrs_states (
  user_id,
  item_id,
  item_type,
  facet,
  state,
  stability,
  difficulty,
  reps,
  lapses,
  last_review,
  next_review,
  created_at,
  updated_at
)
SELECT 
  uls.user_id,
  uls.ku_id as item_id,
  'ku' as item_type,
  uls.facet,
  uls.state,
  uls.stability,
  uls.difficulty,
  uls.reps,
  uls.lapses,
  uls.last_review,
  uls.next_review,
  NOW() as created_at,
  NOW() as updated_at
FROM public.user_learning_states uls
ON CONFLICT (user_id, item_id, item_type, facet) 
DO UPDATE SET
  state = EXCLUDED.state,
  stability = EXCLUDED.stability,
  difficulty = EXCLUDED.difficulty,
  reps = EXCLUDED.reps,
  lapses = EXCLUDED.lapses,
  last_review = EXCLUDED.last_review,
  next_review = EXCLUDED.next_review,
  updated_at = NOW();

-- Migrate review logs
INSERT INTO public.fsrs_review_logs (
  user_id,
  item_id,
  item_type,
  facet,
  rating,
  state,
  stability,
  difficulty,
  interval_days,
  reviewed_at
)
SELECT 
  ull.user_id,
  ull.ku_id as item_id,
  'ku' as item_type,
  ull.facet,
  CASE 
    WHEN ull.rating = 'pass' THEN 3  -- Good
    WHEN ull.rating = 'again' THEN 1 -- Again
    ELSE 3
  END::integer as rating,
  'unknown' as state, -- Previous state not tracked in old logs
  ull.stability,
  ull.difficulty,
  ull.interval as interval_days,
  ull.created_at as reviewed_at
FROM public.user_learning_logs ull
ON CONFLICT DO NOTHING;

-- ==========================================
-- STEP 4: Create view for backward compatibility
-- ==========================================

-- Create a view that presents user_fsrs_states as user_learning_states
-- This allows Next.js code to work without immediate changes
CREATE OR REPLACE VIEW public.user_learning_states_view AS
SELECT 
  user_id,
  item_id as ku_id,
  facet,
  state,
  stability,
  difficulty,
  last_review,
  next_review,
  reps,
  lapses
FROM public.user_fsrs_states
WHERE item_type = 'ku';

-- ==========================================
-- STEP 5: Create helper functions
-- ==========================================

-- Function to get or create default FSRS settings for a user
CREATE OR REPLACE FUNCTION get_or_create_fsrs_settings(p_user_id uuid)
RETURNS public.user_fsrs_settings AS $$
DECLARE
  settings public.user_fsrs_settings;
BEGIN
  SELECT * INTO settings
  FROM public.user_fsrs_settings
  WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    INSERT INTO public.user_fsrs_settings (user_id)
    VALUES (p_user_id)
    RETURNING * INTO settings;
  END IF;
  
  RETURN settings;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get due items count
CREATE OR REPLACE FUNCTION get_due_items_count(p_user_id uuid)
RETURNS integer AS $$
DECLARE
  due_count integer;
BEGIN
  SELECT COUNT(*) INTO due_count
  FROM public.user_fsrs_states
  WHERE user_id = p_user_id
    AND next_review <= NOW() + INTERVAL '1 day';
  
  RETURN due_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- NOTES
-- ==========================================
-- 1. user_fsrs_states is now the single source of truth for learning state
-- 2. user_fsrs_settings stores per-user FSRS algorithm parameters
-- 3. Old tables (user_learning_states, user_learning_logs) can be dropped after migration verification
-- 4. The view user_learning_states_view provides backward compatibility
-- 5. Both Next.js and FastAPI should migrate to using user_fsrs_states directly
