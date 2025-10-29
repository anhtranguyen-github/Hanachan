-- ---------------------------------------------------------
-- HANACHAN V2: CORE KNOWLEDGE BASE (CKB) SCHEMA
-- ---------------------------------------------------------

-- 1. ENUMS & EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
DO $$ BEGIN
    CREATE TYPE ku_type AS ENUM ('radical', 'kanji', 'vocabulary', 'grammar');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. BẢNG ĐIỀU PHỐI TRUNG TÂM (REGISTRY)
-- Quản lý định danh và level chung cho mọi KU
CREATE TABLE IF NOT EXISTS knowledge_units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_id TEXT NOT NULL,         -- ID từ WaniKani/Bunpro (UUID string)
    type ku_type NOT NULL,
    slug TEXT NOT NULL UNIQUE,         -- vd: 'kanji/署'
    level INTEGER,                     -- 1-60 hoặc cấp độ JLPT
    search_key TEXT,                   -- Giúp tìm kiếm nhanh (character hoặc title)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CÁC BẢNG DỮ LIỆU ĐẶC TRƯNG CHUYÊN BIỆT (CORE DATA)

-- Radical Detail
CREATE TABLE IF NOT EXISTS ku_radicals (
    ku_id UUID PRIMARY KEY REFERENCES knowledge_units(id) ON DELETE CASCADE,
    character TEXT,
    image_json JSONB,                  -- {alt, url}
    name TEXT NOT NULL,
    meaning_story JSONB,               -- StructuredToken[] (Mnemonic)
    metadata JSONB DEFAULT '{}'        -- {meaning_alternatives: [], slugs: []}
);

-- Kanji Detail
CREATE TABLE IF NOT EXISTS ku_kanji (
    ku_id UUID PRIMARY KEY REFERENCES knowledge_units(id) ON DELETE CASCADE,
    character TEXT NOT NULL,
    meaning_data JSONB,                -- {primary, alternatives, story: StructuredToken[]}
    reading_data JSONB,                -- {on: [], kun: [], nanori: [], story: StructuredToken[]}
    hints_json JSONB,                  -- {meaning_hint, reading_hint}
    stroke_count INTEGER,
    metadata JSONB DEFAULT '{}'
);

-- Vocabulary Detail
CREATE TABLE IF NOT EXISTS ku_vocabulary (
    ku_id PRIMARY KEY REFERENCES knowledge_units(id) ON DELETE CASCADE,
    character TEXT NOT NULL,           -- "贈賄"
    reading_primary TEXT NOT NULL,     -- "ぞうわい"
    meaning_data JSONB,                -- {primary: [], types: [], story: StructuredToken[]}
    audio_assets JSONB,                -- [{url, actor, description}]
    reading_explanation JSONB,         -- StructuredToken[]
    metadata JSONB DEFAULT '{}'        -- {collocations: []}
);

-- Grammar Detail
CREATE TABLE IF NOT EXISTS ku_grammar (
    ku_id PRIMARY KEY REFERENCES knowledge_units(id) ON DELETE CASCADE,
    title TEXT NOT NULL,               -- "〜ほうがいい"
    meaning_summary TEXT,              -- Nghĩa ngắn gọn cho flashcard
    meaning_story JSONB,               -- "About" section -> StructuredToken[]
    structure_json JSONB,              -- {patterns: [], variants: {}, formula: StructuredToken[]}
    usage_notes JSONB,                 -- {register, word_type, rare_kanji}
    metadata JSONB DEFAULT '{}'
);

-- 4. HỆ THỐNG SENTENCE (STATIC + DYNAMIC)

CREATE TABLE IF NOT EXISTS sentences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID DEFAULT NULL,         -- NULL = System, UUID = User Mined
    text_ja TEXT NOT NULL,
    text_en TEXT,
    text_tokens JSONB,                 -- Phân tích Tokenized & Furigana
    audio_url TEXT,                    -- Dành cho System Examples
    source_type TEXT,                  -- 'wanikani', 'bunpro', 'youtube', 'chat'
    source_metadata JSONB,             -- {video_id, timestamp}
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. KNOWLEDGE GRAPH (RELATIONS)

-- Quan hệ giữa các KU (Tĩnh: Radical -> Kanji -> Vocab)
CREATE TABLE IF NOT EXISTS ku_graph (
    parent_id UUID REFERENCES knowledge_units(id) ON DELETE CASCADE,
    child_id UUID REFERENCES knowledge_units(id) ON DELETE CASCADE,
    relation_type TEXT NOT NULL,       -- 'component', 'similar', 'amalgamation'
    PRIMARY KEY (parent_id, child_id, relation_type)
);

-- Quan hệ KU <-> Sentence (Động/Tĩnh)
CREATE TABLE IF NOT EXISTS ku_to_sentence (
    ku_id UUID REFERENCES knowledge_units(id) ON DELETE CASCADE,
    sentence_id UUID REFERENCES sentences(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT false,  -- Đánh dấu ví dụ chuẩn cho level đó
    cloze_positions JSONB,             -- Array of [start, end] để đục lỗ flashcard
    PRIMARY KEY (ku_id, sentence_id)
);

-- 6. INDICES
CREATE INDEX IF NOT EXISTS idx_ku_search ON knowledge_units USING gin (search_key gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_sentences_text ON sentences USING gin (text_ja gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_ku_type_level ON knowledge_units (type, level);
