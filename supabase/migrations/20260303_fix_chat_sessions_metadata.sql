
-- Migration: Add missing metadata column to chat_sessions
-- Created: 2026-03-03

-- 1. Add metadata column to chat_sessions if missing
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chat_sessions' AND column_name = 'metadata') THEN
        ALTER TABLE public.chat_sessions ADD COLUMN metadata jsonb DEFAULT '{}'::jsonb;
    END IF;
END $$;

-- 2. Ensure summary and mode columns exist (from previous migrations that might have failed)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chat_sessions' AND column_name = 'summary') THEN
        ALTER TABLE public.chat_sessions ADD COLUMN summary text;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chat_sessions' AND column_name = 'mode') THEN
        ALTER TABLE public.chat_sessions ADD COLUMN mode text DEFAULT 'chat';
    END IF;
END $$;
