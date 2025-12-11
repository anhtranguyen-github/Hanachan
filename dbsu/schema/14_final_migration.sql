
-- =========================================================
-- FINAL CONSOLIDATED SCHEMA MIGRATION (Refined per User Schema)
-- Combines all modular scripts into a single guaranteed logic
-- =========================================================

-- 1. Extensions
create extension if not exists "pg_trgm" with schema public;

-- 2. Core Tables

-- Users
create table if not exists public.users (
  id uuid not null default gen_random_uuid() primary key,
  email text unique,
  display_name text,
  avatar_url text,
  role text default 'USER',
  created_at timestamp with time zone default now()
);

-- Knowledge Units
create table if not exists public.knowledge_units (
  id uuid not null default gen_random_uuid() primary key,
  external_id text not null,
  type text not null, -- Enum type in DB, mapped to text for compatibility
  slug text not null unique,
  level integer,
  search_key text,
  character text,
  meaning text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Detail Tables (Reference Slug)
create table if not exists public.ku_kanji (
  ku_id text primary key references public.knowledge_units(slug),
  character text not null,
  meaning_data jsonb,
  reading_data jsonb,
  metadata jsonb default '{}'::jsonb
);

create table if not exists public.ku_vocabulary (
  ku_id text primary key references public.knowledge_units(slug),
  character text not null,
  reading_primary text not null,
  meaning_data jsonb,
  audio_assets jsonb,
  metadata jsonb default '{}'::jsonb
);

create table if not exists public.ku_radicals (
  ku_id text primary key references public.knowledge_units(slug),
  character text,
  image_json jsonb,
  name text not null,
  meaning_story jsonb,
  metadata jsonb default '{}'::jsonb
);

create table if not exists public.ku_grammar (
  ku_id text primary key references public.knowledge_units(slug),
  title text not null,
  meaning_summary text,
  meaning_story jsonb,
  structure_json jsonb,
  metadata jsonb default '{}'::jsonb
);

-- Sentences
create table if not exists public.sentences (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid references public.users(id),
  text_ja text not null,
  text_en text,
  text_tokens jsonb,
  audio_url text,
  source_type text,
  source_metadata jsonb,
  is_verified boolean default true,
  youtube_video_id uuid,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  constraint sentences_user_text_unique unique (user_id, text_ja)
);

create table if not exists public.ku_to_sentence (
  ku_id text references public.knowledge_units(slug) not null,
  sentence_id uuid references public.sentences(id) not null,
  is_primary boolean default false,
  cloze_positions jsonb,
  primary key (ku_id, sentence_id)
);

-- Learning States
create table if not exists public.user_learning_states (
  user_id uuid references public.users(id) not null,
  ku_id text references public.knowledge_units(slug) not null,
  state text default 'new',
  stability double precision default 0,
  difficulty double precision default 0,
  elapsed_days integer default 0,
  scheduled_days integer default 0,
  last_review timestamp with time zone,
  next_review timestamp with time zone default now(),
  lapses integer default 0,
  reps integer default 0,
  primary key (user_id, ku_id)
);

-- Review History
create table if not exists public.fsrs_history (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid references public.users(id) not null,
  ku_id text references public.knowledge_units(slug) not null,
  rating integer not null,
  prev_state text,
  prev_stability double precision,
  prev_difficulty double precision,
  new_stability double precision,
  new_difficulty double precision,
  elapsed_days integer,
  scheduled_days integer,
  review_at timestamp with time zone default now()
);

-- Decks
create table if not exists public.decks (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid references public.users(id),
  name text not null,
  description text,
  type text not null default 'user_mined',
  level_index integer,
  category text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  constraint decks_user_name_unique unique (user_id, name)
);

create table if not exists public.deck_items (
  deck_id uuid references public.decks(id) not null,
  ku_id text references public.knowledge_units(slug) not null,
  sentence_id uuid references public.sentences(id),
  created_at timestamp with time zone default now(),
  primary key (deck_id, ku_id)
);

create table if not exists public.deck_item_interactions (
  user_id uuid references public.users(id) not null,
  deck_id uuid references public.decks(id) not null,
  ku_id text references public.knowledge_units(slug) not null,
  state text default 'new',
  interaction_count integer default 0,
  local_difficulty_score double precision default 0,
  last_interaction_at timestamp with time zone default now(),
  primary key (user_id, deck_id, ku_id)
);

-- User Settings
create table if not exists public.user_settings (
  user_id uuid references public.users(id) not null primary key,
  target_retention double precision default 0.9,
  fsrs_weights float[] default '{0.4, 0.6, 2.4, 5.8, 4.9, 0.4, 0.9, 0.0, 1.5, 0.4, 0.7, 0.8, 0.1, 0.3, 1.5, 0.4, 2.4}',
  preferred_voice text default 'Tokyo',
  theme text default 'dark',
  updated_at timestamp with time zone default now()
);

-- YouTube
create table if not exists public.user_youtube_videos (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid references public.users(id) not null,
  video_id text not null,
  title text,
  thumbnail_url text,
  channel_title text,
  status text default 'new',
  last_watched_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  unique(user_id, video_id)
);

create table if not exists public.user_youtube_video_segments (
  id uuid not null default gen_random_uuid() primary key,
  video_id uuid references public.user_youtube_videos(id) not null,
  text_ja text not null,
  text_en text,
  start_time double precision not null,
  end_time double precision not null,
  created_at timestamp with time zone default now()
);

-- Analytics
create table if not exists public.user_analysis_history (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid references public.users(id) not null,
  text_ja text not null,
  analysis_result jsonb,
  created_at timestamp with time zone default now()
);

create table if not exists public.user_daily_stats (
  user_id uuid references public.users(id) not null,
  day date not null,
  new_cards_learned integer default 0,
  cards_reviewed integer default 0,
  minutes_spent integer default 0,
  success_rate double precision,
  primary key (user_id, day)
);
