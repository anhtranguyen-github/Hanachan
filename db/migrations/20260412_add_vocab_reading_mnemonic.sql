-- Adding reading_mnemonic to vocabulary_details
ALTER TABLE public.vocabulary_details ADD COLUMN IF NOT EXISTS reading_mnemonic text;
