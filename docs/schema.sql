-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.chat_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  role text CHECK (role = ANY (ARRAY['user'::text, 'assistant'::text, 'system'::text])),
  content text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT chat_messages_pkey PRIMARY KEY (id),
  CONSTRAINT chat_messages_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.chat_sessions(id)
);
CREATE TABLE public.chat_sessions (
  id text NOT NULL,
  user_id uuid NOT NULL,
  title text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT chat_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT chat_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.deck_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  deck_id uuid NOT NULL,
  ku_id text,
  sentence_id uuid,
  target_grammar_slug text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT deck_items_pkey PRIMARY KEY (id),
  CONSTRAINT deck_items_deck_id_fkey FOREIGN KEY (deck_id) REFERENCES public.decks(id),
  CONSTRAINT deck_items_ku_id_fkey FOREIGN KEY (ku_id) REFERENCES public.knowledge_units(slug),
  CONSTRAINT deck_items_sentence_id_fkey FOREIGN KEY (sentence_id) REFERENCES public.sentences(id)
);
CREATE TABLE public.decks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  name text NOT NULL,
  description text,
  type text NOT NULL DEFAULT 'user_mined'::text,
  level_index integer,
  category text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT decks_pkey PRIMARY KEY (id),
  CONSTRAINT decks_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT fk_decks_user FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.fsrs_history (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  ku_id text NOT NULL,
  rating integer NOT NULL,
  review_at timestamp with time zone DEFAULT now(),
  sentence_id uuid,
  prev_state USER-DEFINED,
  prev_stability double precision,
  prev_difficulty double precision,
  new_stability double precision,
  new_difficulty double precision,
  elapsed_days integer,
  scheduled_days integer,
  CONSTRAINT fsrs_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT fsrs_history_sentence_id_fkey FOREIGN KEY (sentence_id) REFERENCES public.sentences(id),
  CONSTRAINT fk_history_user FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.knowledge_units (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  external_id text NOT NULL,
  type USER-DEFINED NOT NULL,
  slug text NOT NULL UNIQUE,
  level integer,
  search_key text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  character text,
  meaning text,
  CONSTRAINT knowledge_units_pkey PRIMARY KEY (id)
);
CREATE TABLE public.ku_grammar (
  ku_id text NOT NULL,
  title text NOT NULL,
  meaning_summary text,
  meaning_story jsonb,
  structure_json jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT ku_grammar_pkey PRIMARY KEY (ku_id),
  CONSTRAINT ku_grammar_ku_slug_fkey FOREIGN KEY (ku_id) REFERENCES public.knowledge_units(slug)
);
CREATE TABLE public.ku_kanji (
  ku_id text NOT NULL,
  character text NOT NULL,
  meaning_data jsonb,
  reading_data jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT ku_kanji_pkey PRIMARY KEY (ku_id),
  CONSTRAINT ku_kanji_ku_slug_fkey FOREIGN KEY (ku_id) REFERENCES public.knowledge_units(slug)
);
CREATE TABLE public.ku_radicals (
  ku_id text NOT NULL,
  character text,
  image_json jsonb,
  name text NOT NULL,
  meaning_story jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT ku_radicals_pkey PRIMARY KEY (ku_id),
  CONSTRAINT ku_radicals_ku_slug_fkey FOREIGN KEY (ku_id) REFERENCES public.knowledge_units(slug)
);
CREATE TABLE public.ku_to_sentence (
  ku_id text NOT NULL,
  sentence_id uuid NOT NULL,
  is_primary boolean DEFAULT false,
  cloze_positions jsonb,
  CONSTRAINT ku_to_sentence_pkey PRIMARY KEY (ku_id, sentence_id),
  CONSTRAINT ku_to_sentence_sentence_id_fkey FOREIGN KEY (sentence_id) REFERENCES public.sentences(id),
  CONSTRAINT ku_to_sentence_ku_slug_fkey FOREIGN KEY (ku_id) REFERENCES public.knowledge_units(slug)
);
CREATE TABLE public.ku_vocabulary (
  ku_id text NOT NULL,
  character text NOT NULL,
  reading_primary text NOT NULL,
  meaning_data jsonb,
  audio_assets jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT ku_vocabulary_pkey PRIMARY KEY (ku_id),
  CONSTRAINT ku_vocabulary_ku_slug_fkey FOREIGN KEY (ku_id) REFERENCES public.knowledge_units(slug)
);
CREATE TABLE public.sentences (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  text_ja text NOT NULL,
  text_en text,
  text_tokens jsonb,
  audio_url text,
  source_type text,
  source_metadata jsonb,
  is_verified boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  source_id text,
  timestamp integer,
  CONSTRAINT sentences_pkey PRIMARY KEY (id),
  CONSTRAINT sentences_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT fk_sentences_user FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.user_daily_stats (
  user_id uuid NOT NULL,
  day date NOT NULL,
  new_cards_learned integer DEFAULT 0,
  minutes_spent integer DEFAULT 0,
  reviews_completed integer DEFAULT 0,
  correct_reviews integer DEFAULT 0,
  CONSTRAINT user_daily_stats_pkey PRIMARY KEY (user_id, day),
  CONSTRAINT user_daily_stats_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.user_learning_states (
  user_id uuid NOT NULL,
  ku_id text NOT NULL,
  state USER-DEFINED DEFAULT 'new'::fsrs_state,
  stability double precision DEFAULT 0,
  difficulty double precision DEFAULT 0,
  elapsed_days integer DEFAULT 0,
  scheduled_days integer DEFAULT 0,
  last_review timestamp with time zone,
  next_review timestamp with time zone DEFAULT now(),
  lapses integer DEFAULT 0,
  reps integer DEFAULT 0,
  CONSTRAINT user_learning_states_pkey PRIMARY KEY (user_id, ku_id),
  CONSTRAINT user_learning_states_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT fk_uls_user FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT user_learning_states_ku_slug_fkey FOREIGN KEY (ku_id) REFERENCES public.knowledge_units(slug)
);
CREATE TABLE public.user_sentence_cards (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  sentence_id uuid NOT NULL,
  card_type text CHECK (card_type = ANY (ARRAY['vocab'::text, 'cloze'::text])),
  front text NOT NULL,
  back text NOT NULL,
  target_slug text,
  fsrs_state jsonb DEFAULT '{"interval": 0, "stability": 0, "difficulty": 0}'::jsonb,
  next_review timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_sentence_cards_pkey PRIMARY KEY (id),
  CONSTRAINT user_sentence_cards_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT user_sentence_cards_sentence_id_fkey FOREIGN KEY (sentence_id) REFERENCES public.sentences(id)
);
CREATE TABLE public.user_settings (
  user_id uuid NOT NULL,
  target_retention double precision DEFAULT 0.9,
  fsrs_weights ARRAY DEFAULT '{0.4,0.6,2.4,5.8,4.9,0.4,0.9,0,1.5,0.4,0.7,0.8,0.1,0.3,1.5,0.4,2.4}'::double precision[],
  preferred_voice text DEFAULT 'Tokyo'::text,
  theme text DEFAULT 'dark'::text,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_settings_pkey PRIMARY KEY (user_id),
  CONSTRAINT user_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.user_youtube_videos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  video_id text NOT NULL,
  title text,
  thumbnail_url text,
  channel_title text,
  status text DEFAULT 'new'::text,
  last_watched_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_youtube_videos_pkey PRIMARY KEY (id),
  CONSTRAINT user_youtube_videos_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email text UNIQUE,
  display_name text,
  avatar_url text,
  created_at timestamp with time zone DEFAULT now(),
  role text DEFAULT 'USER'::text,
  CONSTRAINT users_pkey PRIMARY KEY (id)
);