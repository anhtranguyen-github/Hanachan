
-- Migration: Harmonize chat schema with Agentic logic
-- Created: 2026-01-31

-- 1. Add metadata column to chat_messages if missing
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chat_messages' AND column_name = 'metadata') THEN
        ALTER TABLE public.chat_messages ADD COLUMN metadata jsonb DEFAULT '{}'::jsonb;
    END IF;
END $$;

-- 2. Add mode column to chat_sessions if we want to distinguish (e.g. 'chat' vs 'roleplay')
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chat_sessions' AND column_name = 'mode') THEN
        ALTER TABLE public.chat_sessions ADD COLUMN mode text DEFAULT 'chat';
    END IF;
END $$;

-- 3. Cleanup: Rename started_at to created_at if necessary, but we already have created_at.
-- Just ensure the sort column exists.
