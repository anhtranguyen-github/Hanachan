-- ---------------------------------------------------------
-- PART 01: KNOWLEDGE UNITS (CKB)
-- ---------------------------------------------------------

CREATE EXTENSION IF NOT EXISTS "pg_trgm";

DO $$ BEGIN
    CREATE TYPE ku_type AS ENUM ('radical', 'kanji', 'vocabulary', 'grammar');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Registry
CREATE TABLE IF NOT EXISTS knowledge_units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_id TEXT NOT NULL,
    type ku_type NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    level INTEGER,
    search_key TEXT, -- Chữ Hán hoặc Tiêu đề
    search_reading TEXT, -- Cách đọc Hiragana/Katakana (phục vụ UC-01.1)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Detail: Radicals
CREATE TABLE IF NOT EXISTS ku_radicals (
    ku_id UUID PRIMARY KEY REFERENCES knowledge_units(id) ON DELETE CASCADE,
    character TEXT,
    image_json JSONB,
    name TEXT NOT NULL,
    meaning_story JSONB, -- StructuredToken[]
    metadata JSONB DEFAULT '{}'
);

-- Detail: Kanji
CREATE TABLE IF NOT EXISTS ku_kanji (
    ku_id UUID PRIMARY KEY REFERENCES knowledge_units(id) ON DELETE CASCADE,
    character TEXT NOT NULL,
    meaning_data JSONB, -- {primary, alternatives, story: StructuredToken[]}
    reading_data JSONB, -- {on: [], kun: [], stories}
    metadata JSONB DEFAULT '{}'
);

-- Detail: Vocabulary
CREATE TABLE IF NOT EXISTS ku_vocabulary (
    ku_id UUID PRIMARY KEY REFERENCES knowledge_units(id) ON DELETE CASCADE,
    character TEXT NOT NULL,
    reading_primary TEXT NOT NULL,
    meaning_data JSONB,
    audio_assets JSONB,
    metadata JSONB DEFAULT '{}'
);

-- Detail: Grammar
CREATE TABLE IF NOT EXISTS ku_grammar (
    ku_id UUID PRIMARY KEY REFERENCES knowledge_units(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    meaning_summary TEXT, -- Short meaning for cards
    meaning_story JSONB, -- "About" structured
    structure_json JSONB,
    metadata JSONB DEFAULT '{}'
);

-- Internal Graph
CREATE TABLE IF NOT EXISTS ku_graph (
    parent_id UUID REFERENCES knowledge_units(id) ON DELETE CASCADE,
    child_id UUID REFERENCES knowledge_units(id) ON DELETE CASCADE,
    relation_type TEXT NOT NULL, -- 'component', 'similar'
    PRIMARY KEY (parent_id, child_id, relation_type)
);

CREATE INDEX IF NOT EXISTS idx_ku_search_key ON knowledge_units USING gin (search_key gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_ku_search_reading ON knowledge_units USING gin (search_reading gin_trgm_ops);
