-- Add summary and mode to chat_sessions
ALTER TABLE public.chat_sessions ADD COLUMN IF NOT EXISTS summary text;
ALTER TABLE public.chat_sessions ADD COLUMN IF NOT EXISTS mode text DEFAULT 'expert' CHECK (mode IN ('expert', 'beginner', 'tutor'));
