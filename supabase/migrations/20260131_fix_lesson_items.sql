
-- Migration: Fix lesson_items status column
-- Created: 2026-01-31

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lesson_items' AND column_name = 'status') THEN
        ALTER TABLE public.lesson_items ADD COLUMN status text NOT NULL DEFAULT 'unseen';
    END IF;
END $$;
