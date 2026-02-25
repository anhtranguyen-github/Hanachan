
-- Extension for UUIDs if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Knowledge Units
CREATE TABLE IF NOT EXISTS public.knowledge_units (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL,
    character TEXT NOT NULL,
    meaning TEXT NOT NULL,
    level INTEGER NOT NULL,
    mnemonics JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Details Tables
CREATE TABLE IF NOT EXISTS public.radical_details (
    ku_id UUID PRIMARY KEY REFERENCES public.knowledge_units(id) ON DELETE CASCADE,
    name TEXT,
    meaning_story JSONB,
    image_json JSONB,
    metadata JSONB
);

CREATE TABLE IF NOT EXISTS public.kanji_details (
    ku_id UUID PRIMARY KEY REFERENCES public.knowledge_units(id) ON DELETE CASCADE,
    character TEXT NOT NULL,
    meaning_data JSONB,
    reading_data JSONB,
    metadata JSONB
);

CREATE TABLE IF NOT EXISTS public.vocabulary_details (
    ku_id UUID PRIMARY KEY REFERENCES public.knowledge_units(id) ON DELETE CASCADE,
    character TEXT NOT NULL,
    reading_primary TEXT NOT NULL,
    meaning_data JSONB,
    audio_assets JSONB,
    metadata JSONB
);

CREATE TABLE IF NOT EXISTS public.grammar_details (
    ku_id UUID PRIMARY KEY REFERENCES public.knowledge_units(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    meaning_summary TEXT,
    meaning_story JSONB,
    structure_json JSONB,
    metadata JSONB
);

-- User states
CREATE TABLE IF NOT EXISTS public.user_learning_states (
    user_id UUID NOT NULL,
    ku_id UUID NOT NULL REFERENCES public.knowledge_units(id) ON DELETE CASCADE,
    state TEXT NOT NULL DEFAULT 'new',
    next_review TIMESTAMPTZ DEFAULT now(),
    last_review TIMESTAMPTZ,
    stability DOUBLE PRECISION DEFAULT 0.0,
    difficulty DOUBLE PRECISION DEFAULT 5.0,
    reps INTEGER DEFAULT 0,
    lapses INTEGER DEFAULT 0,
    PRIMARY KEY (user_id, ku_id)
);

-- Chat System
CREATE TABLE IF NOT EXISTS public.chat_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    title TEXT,
    summary TEXT,
    mode TEXT DEFAULT 'chat',
    started_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.chat_message_actions (
    id SERIAL PRIMARY KEY,
    message_id UUID REFERENCES public.chat_messages(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL,
    target_ku_id TEXT,
    target_sentence_id UUID,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Relations
CREATE TABLE IF NOT EXISTS public.kanji_radicals (
    kanji_id UUID REFERENCES public.knowledge_units(id) ON DELETE CASCADE,
    radical_id UUID REFERENCES public.knowledge_units(id) ON DELETE CASCADE,
    PRIMARY KEY (kanji_id, radical_id)
);

CREATE TABLE IF NOT EXISTS public.vocabulary_kanji (
    vocab_id UUID REFERENCES public.knowledge_units(id) ON DELETE CASCADE,
    kanji_id UUID REFERENCES public.knowledge_units(id) ON DELETE CASCADE,
    PRIMARY KEY (vocab_id, kanji_id)
);

CREATE TABLE IF NOT EXISTS public.grammar_relations (
    grammar_id UUID REFERENCES public.knowledge_units(id) ON DELETE CASCADE,
    related_id UUID REFERENCES public.knowledge_units(id) ON DELETE CASCADE,
    type TEXT,
    comparison_note TEXT,
    PRIMARY KEY (grammar_id, related_id)
);
