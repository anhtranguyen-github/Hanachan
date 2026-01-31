-- Migration: Add facet column to user_learning_states
-- This enables independent FSRS tracking per facet (meaning, reading, cloze)

-- Step 1: Add facet column with default value
ALTER TABLE public.user_learning_states 
ADD COLUMN IF NOT EXISTS facet TEXT DEFAULT 'meaning';

-- Step 2: Update existing rows to have correct facet based on KU type
-- For radicals: only 'meaning'
-- For kanji/vocabulary: default is 'meaning', we'll need to create 'reading' rows
-- For grammar: 'cloze'

-- Step 3: Drop old primary key and create new composite key
ALTER TABLE public.user_learning_states DROP CONSTRAINT IF EXISTS user_learning_states_pkey;
ALTER TABLE public.user_learning_states 
ADD CONSTRAINT user_learning_states_pkey PRIMARY KEY (user_id, ku_id, facet);

-- Step 4: Add check constraint for valid facets
ALTER TABLE public.user_learning_states 
ADD CONSTRAINT user_learning_states_facet_check 
CHECK (facet IN ('meaning', 'reading', 'cloze'));

-- Step 5: Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_learning_states_facet 
ON public.user_learning_states(user_id, facet);

-- Step 6: Add facet to user_learning_logs as well
ALTER TABLE public.user_learning_logs 
ADD COLUMN IF NOT EXISTS facet TEXT DEFAULT 'meaning';
