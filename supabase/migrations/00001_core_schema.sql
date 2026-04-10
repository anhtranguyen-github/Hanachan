-- ============================================================
-- Hanachan Core Schema — WaniKani-aligned + Custom Decks
-- Migration: 00001_core_schema
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ────────────────────────────────────────────────────────────
-- 1. SUBJECTS
-- All learnable items: radicals, kanji, vocabulary, grammar
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.subjects (
    id          BIGSERIAL PRIMARY KEY,
    object      TEXT NOT NULL DEFAULT 'subject',
    slug        TEXT UNIQUE NOT NULL,
    type        TEXT NOT NULL CHECK (type IN ('radical', 'kanji', 'vocabulary', 'grammar')),
    characters  TEXT,
    level       INTEGER NOT NULL CHECK (level >= 0),
    jlpt        INTEGER CHECK (jlpt IS NULL OR (jlpt >= 1 AND jlpt <= 5)),
    meanings    JSONB NOT NULL DEFAULT '[]',
    -- Primary meaning as top-level column for quick access
    meaning_primary TEXT NOT NULL,
    readings    JSONB DEFAULT '[]',
    auxiliary_meanings JSONB DEFAULT '[]',
    meaning_mnemonic TEXT,
    reading_mnemonic TEXT,
    lesson_position INTEGER DEFAULT 0,
    hidden_at   TIMESTAMPTZ,
    document_url TEXT,
    spaced_repetition_system_id BIGINT DEFAULT 1,
    data_updated_at TIMESTAMPTZ DEFAULT now(),
    created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_subjects_type ON public.subjects(type);
CREATE INDEX idx_subjects_level ON public.subjects(level);
CREATE INDEX idx_subjects_slug ON public.subjects(slug);
CREATE INDEX idx_subjects_characters ON public.subjects(characters);

-- ────────────────────────────────────────────────────────────
-- 2. SUBJECT DETAILS (type-specific data)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.subject_details (
    subject_id  BIGINT PRIMARY KEY REFERENCES public.subjects(id) ON DELETE CASCADE,
    -- Radical-specific
    character_images JSONB,
    image_url   TEXT,
    -- Kanji-specific
    onyomi      TEXT[],
    kunyomi     TEXT[],
    nanori      TEXT[],
    reading_hint TEXT,
    meaning_hint TEXT,
    component_subject_ids INTEGER[] DEFAULT '{}',
    amalgamation_subject_ids INTEGER[] DEFAULT '{}',
    visually_similar_subject_ids INTEGER[] DEFAULT '{}',
    stroke_order_svg TEXT,
    stroke_video_url TEXT,
    -- Vocabulary-specific
    reading_primary TEXT,
    parts_of_speech TEXT[] DEFAULT '{}',
    context_sentences JSONB DEFAULT '[]',
    pronunciation_audios JSONB DEFAULT '[]',
    pitch_accent JSONB DEFAULT '[]',
    audio_url   TEXT,
    -- Grammar-specific
    structure   JSONB,
    explanation TEXT,
    nuance      TEXT,
    cautions    TEXT,
    external_links JSONB DEFAULT '[]',
    example_sentences JSONB DEFAULT '[]',
    -- Shared
    metadata    JSONB DEFAULT '{}'
);

-- ────────────────────────────────────────────────────────────
-- 3. SUBJECT RELATIONS
-- radical→kanji, kanji→vocab, grammar→grammar etc.
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.subject_relations (
    id              BIGSERIAL PRIMARY KEY,
    source_subject_id BIGINT NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    target_subject_id BIGINT NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    relation_type   TEXT NOT NULL CHECK (relation_type IN (
        'component', 'amalgamation', 'visually_similar',
        'synonym', 'antonym', 'similar'
    )),
    comparison_note TEXT,
    created_at      TIMESTAMPTZ DEFAULT now(),
    UNIQUE(source_subject_id, target_subject_id, relation_type)
);

CREATE INDEX idx_subject_relations_source ON public.subject_relations(source_subject_id);
CREATE INDEX idx_subject_relations_target ON public.subject_relations(target_subject_id);

-- ────────────────────────────────────────────────────────────
-- 4. SPACED REPETITION SYSTEMS
-- SRS stage definitions (default, rush, relaxed)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.spaced_repetition_systems (
    id              BIGSERIAL PRIMARY KEY,
    object          TEXT NOT NULL DEFAULT 'spaced_repetition_system',
    name            TEXT NOT NULL,
    description     TEXT,
    unlocking_stage_position INTEGER NOT NULL DEFAULT 0,
    starting_stage_position  INTEGER NOT NULL DEFAULT 1,
    passing_stage_position   INTEGER NOT NULL DEFAULT 5,
    burning_stage_position   INTEGER NOT NULL DEFAULT 9,
    stages          JSONB NOT NULL DEFAULT '[]',
    data_updated_at TIMESTAMPTZ DEFAULT now(),
    created_at      TIMESTAMPTZ DEFAULT now()
);

-- ────────────────────────────────────────────────────────────
-- 5. USER PROFILES
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.users_profile (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id    UUID UNIQUE,
    username        TEXT,
    level           INTEGER NOT NULL DEFAULT 1,
    preferences     JSONB DEFAULT '{}',
    subscription    JSONB DEFAULT '{"active": true, "max_level_granted": 60, "type": "free"}',
    started_at      TIMESTAMPTZ DEFAULT now(),
    current_vacation_started_at TIMESTAMPTZ,
    profile_url     TEXT,
    data_updated_at TIMESTAMPTZ DEFAULT now(),
    created_at      TIMESTAMPTZ DEFAULT now()
);

-- ────────────────────────────────────────────────────────────
-- 6. ASSIGNMENTS
-- Per-user subject progress (SRS stage, availability)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.assignments (
    id              BIGSERIAL PRIMARY KEY,
    object          TEXT NOT NULL DEFAULT 'assignment',
    user_id         UUID NOT NULL,
    subject_id      BIGINT NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    subject_type    TEXT NOT NULL,
    srs_stage       INTEGER NOT NULL DEFAULT 0 CHECK (srs_stage >= 0 AND srs_stage <= 9),
    -- FSRS parameters (kept for algorithmic flexibility)
    stability       DOUBLE PRECISION DEFAULT 0.0,
    difficulty      DOUBLE PRECISION DEFAULT 5.0,
    reps            INTEGER DEFAULT 0,
    lapses          INTEGER DEFAULT 0,
    -- WaniKani timestamps
    unlocked_at     TIMESTAMPTZ,
    started_at      TIMESTAMPTZ,
    passed_at       TIMESTAMPTZ,
    burned_at       TIMESTAMPTZ,
    available_at    TIMESTAMPTZ,
    resurrected_at  TIMESTAMPTZ,
    hidden          BOOLEAN DEFAULT false,
    data_updated_at TIMESTAMPTZ DEFAULT now(),
    created_at      TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, subject_id)
);

CREATE INDEX idx_assignments_user ON public.assignments(user_id);
CREATE INDEX idx_assignments_user_srs ON public.assignments(user_id, srs_stage);
CREATE INDEX idx_assignments_available ON public.assignments(user_id, available_at) WHERE burned_at IS NULL;
CREATE INDEX idx_assignments_subject ON public.assignments(subject_id);

-- ────────────────────────────────────────────────────────────
-- 7. REVIEWS
-- Individual review submissions
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.reviews (
    id                          BIGSERIAL PRIMARY KEY,
    object                      TEXT NOT NULL DEFAULT 'review',
    user_id                     UUID NOT NULL,
    assignment_id               BIGINT NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
    subject_id                  BIGINT NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    spaced_repetition_system_id BIGINT REFERENCES public.spaced_repetition_systems(id),
    starting_srs_stage          INTEGER NOT NULL,
    ending_srs_stage            INTEGER NOT NULL,
    incorrect_meaning_answers   INTEGER NOT NULL DEFAULT 0,
    incorrect_reading_answers   INTEGER NOT NULL DEFAULT 0,
    data_updated_at             TIMESTAMPTZ DEFAULT now(),
    created_at                  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_reviews_user ON public.reviews(user_id);
CREATE INDEX idx_reviews_assignment ON public.reviews(assignment_id);
CREATE INDEX idx_reviews_subject ON public.reviews(subject_id);

-- ────────────────────────────────────────────────────────────
-- 8. REVIEW STATISTICS
-- Aggregated per-subject review accuracy stats
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.review_statistics (
    id                      BIGSERIAL PRIMARY KEY,
    object                  TEXT NOT NULL DEFAULT 'review_statistic',
    user_id                 UUID NOT NULL,
    subject_id              BIGINT NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    subject_type            TEXT NOT NULL,
    meaning_correct         INTEGER NOT NULL DEFAULT 0,
    meaning_incorrect       INTEGER NOT NULL DEFAULT 0,
    meaning_max_streak      INTEGER NOT NULL DEFAULT 0,
    meaning_current_streak  INTEGER NOT NULL DEFAULT 0,
    reading_correct         INTEGER NOT NULL DEFAULT 0,
    reading_incorrect       INTEGER NOT NULL DEFAULT 0,
    reading_max_streak      INTEGER NOT NULL DEFAULT 0,
    reading_current_streak  INTEGER NOT NULL DEFAULT 0,
    percentage_correct      INTEGER NOT NULL DEFAULT 0,
    hidden                  BOOLEAN DEFAULT false,
    data_updated_at         TIMESTAMPTZ DEFAULT now(),
    created_at              TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, subject_id)
);

CREATE INDEX idx_review_stats_user ON public.review_statistics(user_id);

-- ────────────────────────────────────────────────────────────
-- 9. STUDY MATERIALS
-- User notes and synonyms per subject
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.study_materials (
    id              BIGSERIAL PRIMARY KEY,
    object          TEXT NOT NULL DEFAULT 'study_material',
    user_id         UUID NOT NULL,
    subject_id      BIGINT NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    subject_type    TEXT NOT NULL,
    meaning_note    TEXT,
    reading_note    TEXT,
    meaning_synonyms TEXT[] DEFAULT '{}',
    hidden          BOOLEAN DEFAULT false,
    data_updated_at TIMESTAMPTZ DEFAULT now(),
    created_at      TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, subject_id)
);

-- ────────────────────────────────────────────────────────────
-- 10. LEVEL PROGRESSIONS
-- User level advancement history
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.level_progressions (
    id              BIGSERIAL PRIMARY KEY,
    object          TEXT NOT NULL DEFAULT 'level_progression',
    user_id         UUID NOT NULL,
    level           INTEGER NOT NULL,
    unlocked_at     TIMESTAMPTZ,
    started_at      TIMESTAMPTZ,
    passed_at       TIMESTAMPTZ,
    completed_at    TIMESTAMPTZ,
    abandoned_at    TIMESTAMPTZ,
    data_updated_at TIMESTAMPTZ DEFAULT now(),
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_level_progressions_user ON public.level_progressions(user_id);

-- ────────────────────────────────────────────────────────────
-- 11. CUSTOM DECKS
-- User-created decks with learning config
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.custom_decks (
    id              BIGSERIAL PRIMARY KEY,
    object          TEXT NOT NULL DEFAULT 'custom_deck',
    user_id         UUID NOT NULL,
    name            TEXT NOT NULL,
    description     TEXT,
    current_level   INTEGER NOT NULL DEFAULT 1,
    -- Config: learning speed presets and custom settings
    config          JSONB NOT NULL DEFAULT '{
        "preset": "default",
        "srs_system_id": 1,
        "interval_multiplier": 1.0,
        "lessons_per_session": 5,
        "max_reviews_per_day": null,
        "auto_advance_level": true,
        "shuffle_reviews": true
    }',
    data_updated_at TIMESTAMPTZ DEFAULT now(),
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_custom_decks_user ON public.custom_decks(user_id);

-- ────────────────────────────────────────────────────────────
-- 12. CUSTOM DECK ITEMS
-- Subject→Deck mapping with custom levels
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.custom_deck_items (
    id              BIGSERIAL PRIMARY KEY,
    object          TEXT NOT NULL DEFAULT 'custom_deck_item',
    deck_id         BIGINT NOT NULL REFERENCES public.custom_decks(id) ON DELETE CASCADE,
    subject_id      BIGINT NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    custom_level    INTEGER NOT NULL DEFAULT 1,
    data_updated_at TIMESTAMPTZ DEFAULT now(),
    created_at      TIMESTAMPTZ DEFAULT now(),
    UNIQUE(deck_id, subject_id)
);

CREATE INDEX idx_custom_deck_items_deck ON public.custom_deck_items(deck_id);

-- ────────────────────────────────────────────────────────────
-- 13. CUSTOM DECK PROGRESS
-- Per-deck SRS stage/next_review overrides
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.custom_deck_progress (
    id                      BIGSERIAL PRIMARY KEY,
    object                  TEXT NOT NULL DEFAULT 'custom_deck_progress',
    deck_id                 BIGINT NOT NULL REFERENCES public.custom_decks(id) ON DELETE CASCADE,
    user_id                 UUID NOT NULL,
    subject_id              BIGINT NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    custom_srs_stage        INTEGER NOT NULL DEFAULT 0 CHECK (custom_srs_stage >= 0 AND custom_srs_stage <= 9),
    custom_next_review_at   TIMESTAMPTZ,
    -- FSRS params specific to this deck
    stability               DOUBLE PRECISION DEFAULT 0.0,
    difficulty              DOUBLE PRECISION DEFAULT 5.0,
    reps                    INTEGER DEFAULT 0,
    lapses                  INTEGER DEFAULT 0,
    data_updated_at         TIMESTAMPTZ DEFAULT now(),
    created_at              TIMESTAMPTZ DEFAULT now(),
    UNIQUE(deck_id, user_id, subject_id)
);

CREATE INDEX idx_custom_deck_progress_deck ON public.custom_deck_progress(deck_id);
CREATE INDEX idx_custom_deck_progress_user ON public.custom_deck_progress(user_id);
CREATE INDEX idx_custom_deck_progress_review ON public.custom_deck_progress(deck_id, user_id, custom_next_review_at)
    WHERE custom_srs_stage < 9;

-- ────────────────────────────────────────────────────────────
-- 14. SUMMARY / CONVENIENCE VIEWS
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW public.v_assignment_summary AS
SELECT
    a.user_id,
    COUNT(*) FILTER (WHERE a.srs_stage = 0) AS initiate_count,
    COUNT(*) FILTER (WHERE a.srs_stage BETWEEN 1 AND 4) AS apprentice_count,
    COUNT(*) FILTER (WHERE a.srs_stage BETWEEN 5 AND 6) AS guru_count,
    COUNT(*) FILTER (WHERE a.srs_stage = 7) AS master_count,
    COUNT(*) FILTER (WHERE a.srs_stage = 8) AS enlightened_count,
    COUNT(*) FILTER (WHERE a.srs_stage = 9) AS burned_count,
    COUNT(*) FILTER (WHERE a.available_at <= now() AND a.burned_at IS NULL) AS reviews_available,
    COUNT(*) FILTER (WHERE a.srs_stage = 0 AND a.started_at IS NULL) AS lessons_available
FROM public.assignments a
GROUP BY a.user_id;

-- ────────────────────────────────────────────────────────────
-- 15. SEED DEFAULT SRS SYSTEMS
-- ────────────────────────────────────────────────────────────
INSERT INTO public.spaced_repetition_systems (id, name, description, stages) VALUES
(1, 'Default', 'Standard WaniKani-style SRS intervals', '[
    {"position": 0, "interval": null, "interval_unit": null},
    {"position": 1, "interval": 4, "interval_unit": "hours"},
    {"position": 2, "interval": 8, "interval_unit": "hours"},
    {"position": 3, "interval": 1, "interval_unit": "days"},
    {"position": 4, "interval": 2, "interval_unit": "days"},
    {"position": 5, "interval": 7, "interval_unit": "days"},
    {"position": 6, "interval": 14, "interval_unit": "days"},
    {"position": 7, "interval": 30, "interval_unit": "days"},
    {"position": 8, "interval": 120, "interval_unit": "days"},
    {"position": 9, "interval": null, "interval_unit": null}
]'),
(2, 'Rush', 'Accelerated learning — shorter intervals for faster progression', '[
    {"position": 0, "interval": null, "interval_unit": null},
    {"position": 1, "interval": 2, "interval_unit": "hours"},
    {"position": 2, "interval": 4, "interval_unit": "hours"},
    {"position": 3, "interval": 8, "interval_unit": "hours"},
    {"position": 4, "interval": 1, "interval_unit": "days"},
    {"position": 5, "interval": 3, "interval_unit": "days"},
    {"position": 6, "interval": 7, "interval_unit": "days"},
    {"position": 7, "interval": 14, "interval_unit": "days"},
    {"position": 8, "interval": 60, "interval_unit": "days"},
    {"position": 9, "interval": null, "interval_unit": null}
]'),
(3, 'Relaxed', 'Slower pace — longer intervals for casual learning', '[
    {"position": 0, "interval": null, "interval_unit": null},
    {"position": 1, "interval": 8, "interval_unit": "hours"},
    {"position": 2, "interval": 1, "interval_unit": "days"},
    {"position": 3, "interval": 2, "interval_unit": "days"},
    {"position": 4, "interval": 4, "interval_unit": "days"},
    {"position": 5, "interval": 14, "interval_unit": "days"},
    {"position": 6, "interval": 30, "interval_unit": "days"},
    {"position": 7, "interval": 60, "interval_unit": "days"},
    {"position": 8, "interval": 180, "interval_unit": "days"},
    {"position": 9, "interval": null, "interval_unit": null}
]')
ON CONFLICT DO NOTHING;
