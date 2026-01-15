-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.chat_message_actions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL,
  action_type text CHECK (action_type = ANY (ARRAY['ANALYZE'::text, 'CREATE_FLASHCARD'::text, 'START_SRS'::text])),
  target_ku_id uuid,
  target_sentence_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT chat_message_actions_pkey PRIMARY KEY (id),
  CONSTRAINT cma_message_fkey FOREIGN KEY (message_id) REFERENCES public.chat_messages(id),
  CONSTRAINT cma_ku_fkey FOREIGN KEY (target_ku_id) REFERENCES public.knowledge_units(id),
  CONSTRAINT cma_sentence_fkey FOREIGN KEY (target_sentence_id) REFERENCES public.sentences(id)
);
CREATE TABLE public.chat_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL,
  role text CHECK (role = ANY (ARRAY['user'::text, 'assistant'::text])),
  content text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT chat_messages_pkey PRIMARY KEY (id),
  CONSTRAINT chat_messages_session_fkey FOREIGN KEY (session_id) REFERENCES public.chat_sessions(id)
);
CREATE TABLE public.chat_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  mode text CHECK (mode = ANY (ARRAY['chat'::text, 'analyze'::text, 'srs'::text])),
  started_at timestamp with time zone DEFAULT now(),
  CONSTRAINT chat_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT chat_sessions_user_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.cloze_sentence_cards (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  sentence_id uuid NOT NULL,
  focus_ku_id uuid CHECK (focus_ku_id IS NOT NULL),
  cloze_data jsonb NOT NULL,
  note text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT cloze_sentence_cards_pkey PRIMARY KEY (id),
  CONSTRAINT cloze_sentence_cards_sentence_id_fkey FOREIGN KEY (sentence_id) REFERENCES public.sentences(id),
  CONSTRAINT cloze_focus_grammar_fkey FOREIGN KEY (focus_ku_id) REFERENCES public.grammar_units(ku_id)
);
CREATE TABLE public.deck_flashcards (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  deck_id uuid NOT NULL,
  flashcard_id uuid NOT NULL,
  position integer,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT deck_flashcards_pkey PRIMARY KEY (id),
  CONSTRAINT deck_flashcards_deck_fkey FOREIGN KEY (deck_id) REFERENCES public.decks(id),
  CONSTRAINT deck_flashcards_flashcard_fkey FOREIGN KEY (flashcard_id) REFERENCES public.flashcards(id)
);
CREATE TABLE public.decks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  owner_id uuid,
  name text NOT NULL,
  description text,
  deck_type text CHECK (deck_type = ANY (ARRAY['system'::text, 'user'::text])),
  level integer,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT decks_pkey PRIMARY KEY (id),
  CONSTRAINT decks_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id)
);
CREATE TABLE public.flashcard_allowed_ku (
  ku_id uuid NOT NULL,
  type text NOT NULL CHECK (type = ANY (ARRAY['radical'::text, 'kanji'::text, 'vocabulary'::text])),
  CONSTRAINT flashcard_allowed_ku_pkey PRIMARY KEY (ku_id),
  CONSTRAINT flashcard_allowed_ku_ku_id_fkey FOREIGN KEY (ku_id) REFERENCES public.knowledge_units(id)
);
CREATE TABLE public.flashcards (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  ku_id uuid UNIQUE,
  cloze_id uuid UNIQUE,
  card_type text NOT NULL CHECK (card_type = ANY (ARRAY['radical'::text, 'kanji'::text, 'vocab'::text, 'cloze'::text])),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT flashcards_pkey PRIMARY KEY (id),
  CONSTRAINT flashcards_ku_allowed_fkey FOREIGN KEY (ku_id) REFERENCES public.flashcard_allowed_ku(ku_id),
  CONSTRAINT flashcards_cloze_fkey FOREIGN KEY (cloze_id) REFERENCES public.cloze_sentence_cards(id)
);
CREATE TABLE public.fsrs_history (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  ku_id uuid,
  sentence_id uuid,
  rating integer,
  prev_state text CHECK (prev_state = ANY (ARRAY['new'::text, 'learning'::text, 'review'::text, 'relearning'::text, 'burned'::text])),
  prev_stability double precision,
  prev_difficulty double precision,
  new_stability double precision,
  new_difficulty double precision,
  reviewed_at timestamp with time zone DEFAULT now(),
  CONSTRAINT fsrs_history_pkey PRIMARY KEY (id),
  CONSTRAINT fsrs_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT fsrs_history_ku_id_fkey FOREIGN KEY (ku_id) REFERENCES public.knowledge_units(id),
  CONSTRAINT fsrs_history_sentence_id_fkey FOREIGN KEY (sentence_id) REFERENCES public.sentences(id)
);
CREATE TABLE public.grammar_prerequisites (
  grammar_id uuid NOT NULL,
  prerequisite_grammar_id uuid NOT NULL,
  CONSTRAINT grammar_prerequisites_pkey PRIMARY KEY (grammar_id, prerequisite_grammar_id),
  CONSTRAINT grammar_prereq_grammar_fkey FOREIGN KEY (grammar_id) REFERENCES public.knowledge_units(id),
  CONSTRAINT grammar_prereq_prereq_fkey FOREIGN KEY (prerequisite_grammar_id) REFERENCES public.knowledge_units(id)
);
CREATE TABLE public.grammar_relations (
  grammar_id uuid NOT NULL,
  related_grammar_id uuid NOT NULL,
  type text NOT NULL CHECK (type = ANY (ARRAY['synonym'::text, 'antonym'::text, 'similar'::text, 'contrast'::text])),
  CONSTRAINT grammar_relations_pkey PRIMARY KEY (grammar_id, related_grammar_id, type),
  CONSTRAINT fk_gr_1 FOREIGN KEY (grammar_id) REFERENCES public.knowledge_units(id),
  CONSTRAINT fk_gr_2 FOREIGN KEY (related_grammar_id) REFERENCES public.knowledge_units(id)
);
CREATE TABLE public.grammar_sentences (
  grammar_id uuid NOT NULL,
  sentence_id uuid NOT NULL,
  note text,
  CONSTRAINT grammar_sentences_pkey PRIMARY KEY (grammar_id, sentence_id),
  CONSTRAINT grammar_sentences_grammar_fkey FOREIGN KEY (grammar_id) REFERENCES public.knowledge_units(id),
  CONSTRAINT grammar_sentences_sentence_fkey FOREIGN KEY (sentence_id) REFERENCES public.sentences(id)
);
CREATE TABLE public.grammar_units (
  ku_id uuid NOT NULL,
  CONSTRAINT grammar_units_pkey PRIMARY KEY (ku_id),
  CONSTRAINT grammar_units_fkey FOREIGN KEY (ku_id) REFERENCES public.knowledge_units(id),
  CONSTRAINT grammar_units_type_fk FOREIGN KEY (ku_id) REFERENCES public.knowledge_units(id)
);
CREATE TABLE public.grammar_vocabulary (
  grammar_id uuid NOT NULL,
  vocab_id uuid NOT NULL,
  note text,
  CONSTRAINT grammar_vocabulary_pkey PRIMARY KEY (grammar_id, vocab_id),
  CONSTRAINT grammar_vocab_grammar_fkey FOREIGN KEY (grammar_id) REFERENCES public.knowledge_units(id),
  CONSTRAINT grammar_vocab_vocab_fkey FOREIGN KEY (vocab_id) REFERENCES public.knowledge_units(id)
);
CREATE TABLE public.kanji_radicals (
  kanji_id uuid NOT NULL,
  radical_id uuid NOT NULL,
  position smallint,
  role text,
  CONSTRAINT kanji_radicals_pkey PRIMARY KEY (kanji_id, radical_id),
  CONSTRAINT kanji_radicals_kanji_fkey FOREIGN KEY (kanji_id) REFERENCES public.knowledge_units(id),
  CONSTRAINT kanji_radicals_radical_fkey FOREIGN KEY (radical_id) REFERENCES public.knowledge_units(id)
);
CREATE TABLE public.knowledge_units (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  type text NOT NULL CHECK (type = ANY (ARRAY['radical'::text, 'kanji'::text, 'vocabulary'::text, 'grammar'::text])),
  level integer,
  character text,
  meaning text,
  search_key text,
  mnemonics jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT knowledge_units_pkey PRIMARY KEY (id)
);
CREATE TABLE public.ku_grammar (
  ku_id uuid NOT NULL,
  structure jsonb,
  details text,
  cautions text,
  CONSTRAINT ku_grammar_pkey PRIMARY KEY (ku_id),
  CONSTRAINT ku_grammar_ku_id_fkey FOREIGN KEY (ku_id) REFERENCES public.knowledge_units(id)
);
CREATE TABLE public.ku_kanji (
  ku_id uuid NOT NULL,
  video text,
  meaning_data jsonb,
  reading_data jsonb,
  CONSTRAINT ku_kanji_pkey PRIMARY KEY (ku_id),
  CONSTRAINT ku_kanji_ku_id_fkey FOREIGN KEY (ku_id) REFERENCES public.knowledge_units(id)
);
CREATE TABLE public.ku_radicals (
  ku_id uuid NOT NULL,
  name text NOT NULL,
  CONSTRAINT ku_radicals_pkey PRIMARY KEY (ku_id),
  CONSTRAINT ku_radicals_ku_id_fkey FOREIGN KEY (ku_id) REFERENCES public.knowledge_units(id)
);
CREATE TABLE public.ku_to_sentence (
  ku_id uuid NOT NULL,
  sentence_id uuid NOT NULL,
  is_primary boolean DEFAULT false,
  CONSTRAINT ku_to_sentence_pkey PRIMARY KEY (ku_id, sentence_id),
  CONSTRAINT ku_to_sentence_ku_id_fkey FOREIGN KEY (ku_id) REFERENCES public.knowledge_units(id),
  CONSTRAINT ku_to_sentence_sentence_id_fkey FOREIGN KEY (sentence_id) REFERENCES public.sentences(id)
);
CREATE TABLE public.ku_vocabulary (
  ku_id uuid NOT NULL,
  reading_primary text NOT NULL,
  audio text,
  pitch jsonb,
  parts_of_speech ARRAY,
  meaning_data jsonb,
  CONSTRAINT ku_vocabulary_pkey PRIMARY KEY (ku_id),
  CONSTRAINT ku_vocabulary_ku_id_fkey FOREIGN KEY (ku_id) REFERENCES public.knowledge_units(id)
);
CREATE TABLE public.sentences (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  text_ja text NOT NULL,
  text_en text,
  origin text NOT NULL,
  source_text text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT sentences_pkey PRIMARY KEY (id),
  CONSTRAINT sentences_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id)
);
CREATE TABLE public.user_cloze_learning_states (
  user_id uuid NOT NULL,
  cloze_id uuid NOT NULL,
  state text DEFAULT 'new'::text CHECK (state = ANY (ARRAY['new'::text, 'learning'::text, 'review'::text, 'relearning'::text, 'burned'::text])),
  stability double precision DEFAULT 0,
  difficulty double precision DEFAULT 0,
  last_review timestamp with time zone,
  next_review timestamp with time zone,
  CONSTRAINT user_cloze_learning_states_pkey PRIMARY KEY (user_id, cloze_id),
  CONSTRAINT user_cloze_learning_states_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT user_cloze_learning_states_cloze_fkey FOREIGN KEY (cloze_id) REFERENCES public.cloze_sentence_cards(id)
);
CREATE TABLE public.user_learning_states (
  user_id uuid NOT NULL,
  ku_id uuid NOT NULL,
  state text DEFAULT 'new'::text CHECK (state = ANY (ARRAY['new'::text, 'learning'::text, 'review'::text, 'relearning'::text, 'burned'::text])),
  stability double precision DEFAULT 0,
  difficulty double precision DEFAULT 0,
  last_review timestamp with time zone,
  next_review timestamp with time zone,
  lapses integer DEFAULT 0,
  reps integer DEFAULT 0,
  CONSTRAINT user_learning_states_pkey PRIMARY KEY (user_id, ku_id),
  CONSTRAINT user_learning_states_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT user_learning_states_ku_id_fkey FOREIGN KEY (ku_id) REFERENCES public.knowledge_units(id)
);
CREATE TABLE public.user_settings (
  user_id uuid NOT NULL,
  target_retention double precision DEFAULT 0.9,
  fsrs_weights ARRAY,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_settings_pkey PRIMARY KEY (user_id),
  CONSTRAINT user_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email text UNIQUE,
  display_name text,
  avatar_url text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id)
);
CREATE TABLE public.vocab_kanji (
  vocab_id uuid NOT NULL,
  kanji_id uuid NOT NULL,
  position smallint,
  CONSTRAINT vocab_kanji_pkey PRIMARY KEY (vocab_id, kanji_id),
  CONSTRAINT vocab_kanji_vocab_fkey FOREIGN KEY (vocab_id) REFERENCES public.knowledge_units(id),
  CONSTRAINT vocab_kanji_kanji_fkey FOREIGN KEY (kanji_id) REFERENCES public.knowledge_units(id)
);
CREATE TABLE public.youtube_subtitles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  video_id uuid NOT NULL,
  start_time double precision NOT NULL,
  end_time double precision NOT NULL,
  text_ja text NOT NULL,
  sentence_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT youtube_subtitles_pkey PRIMARY KEY (id),
  CONSTRAINT yt_sub_video_fkey FOREIGN KEY (video_id) REFERENCES public.youtube_videos(id),
  CONSTRAINT yt_sub_sentence_fkey FOREIGN KEY (sentence_id) REFERENCES public.sentences(id)
);
CREATE TABLE public.youtube_videos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  video_id text NOT NULL UNIQUE,
  title text,
  channel text,
  duration integer,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT youtube_videos_pkey PRIMARY KEY (id),
  CONSTRAINT youtube_videos_user_fkey FOREIGN KEY (created_by) REFERENCES public.users(id)
);