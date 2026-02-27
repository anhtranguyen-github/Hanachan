-- ==========================================================
-- MIGRATION 001: Add extended profile fields to users table
-- Date: 2026-02-27
-- ==========================================================
-- Adds: avatar_color, bio, native_language, learning_goals
-- These fields support the editable user profile feature.
-- ==========================================================

-- Add avatar_color (references a predefined palette ID like 'pink', 'purple', etc.)
ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS avatar_color text DEFAULT 'pink';

-- Add bio (short personal description, max 200 chars enforced at app layer)
ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS bio text;

-- Add native_language (user's first language)
ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS native_language text;

-- Add learning_goals (array of goal strings like 'Pass JLPT N5', 'Travel to Japan')
ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS learning_goals text[] DEFAULT '{}';

-- ==========================================================
-- NOTES
-- ==========================================================
-- avatar_color: stores palette ID ('pink', 'purple', 'blue', etc.)
-- bio: free-text, max 200 chars enforced in UI
-- native_language: free-text or from predefined list
-- learning_goals: array of strings, managed by user
