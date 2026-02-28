-- ==========================================================
-- MIGRATION 002: Add summary column to chat_sessions table
-- Date: 2026-02-28
-- ==========================================================
-- Adds a 'summary' column to support rolling session summaries
-- which are displayed in the chatbot thread list.
-- ==========================================================

ALTER TABLE public.chat_sessions
    ADD COLUMN IF NOT EXISTS summary text;

-- ==========================================================
-- NOTES
-- ==========================================================
-- This column is populated via a background LLM task 
-- in the memory service whenever a user/assistant exchange
-- occurs.
