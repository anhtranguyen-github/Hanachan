-- Fix Vocabulary Array and add Audio Data
ALTER TABLE public.ku_vocabulary 
  ALTER COLUMN parts_of_speech TYPE text[] USING parts_of_speech::text[],
  ADD COLUMN IF NOT EXISTS audio_data jsonb DEFAULT '[]'::jsonb;

-- Add Name back to Radicals to avoid trimming
ALTER TABLE public.ku_radicals 
  ADD COLUMN IF NOT EXISTS name text;

-- Update Grammar Relations to handle Prerequisite move
ALTER TABLE public.grammar_relations 
  DROP CONSTRAINT IF EXISTS grammar_relations_type_check,
  ADD CONSTRAINT grammar_relations_type_check 
    CHECK (type = ANY (ARRAY['synonym'::text, 'antonym'::text, 'similar'::text, 'contrast'::text, 'prerequisite'::text]));

-- Add Audio weight to User Settings array
ALTER TABLE public.user_settings 
  ALTER COLUMN fsrs_weights TYPE double precision[] USING fsrs_weights::double precision[];