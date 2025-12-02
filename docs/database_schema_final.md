# HanaChan V2 - Final Database Schema Standard

> **Note**: This document reflects the actual production schema in Supabase. All codebase repository layers (db.ts) must strictly follow these field names and types.

## 1. Core Architecture: Slug-as-Identifier
The system uses the `slug` from the `knowledge_units` table as the primary reference key for all learning-related tables (SRS, Decks, Detail tables). This ensures readability and high-speed lookups in AI/RAG contexts.

## 2. Full Table Definitions

### Knowledge Base (CKB)
- **knowledge_units**:
  - `id`: UUID (Internal)
  - `slug`: TEXT (Unique, Identifier)
  - `character`: TEXT
  - `meaning`: TEXT
  - `type`: kanji | vocabulary | radical | grammar
- **Detail Tables** (`ku_kanji`, `ku_vocabulary`, `ku_radicals`, `ku_grammar`):
  - Primary Key: `ku_id` (TEXT, references `knowledge_units.slug`)

### Learning Engine (SRS)
- **user_learning_states**:
  - Primary Key: `(user_id, ku_id)`
  - `ku_id`: TEXT (Slug)
  - `next_review`: TIMESTAMPTZ
  - `stability`, `difficulty`, `reps`, `lapses`: FSRS metrics.
- **fsrs_history**: 
  - `ku_id`: TEXT (Slug)
  - Records every interaction for analytics.

### Sentence Analysis (The Loop)
- **sentences**:
  - `text_ja`: TEXT (Original sentence)
  - `text_en`: TEXT (Translation)
  - `is_verified`: BOOLEAN
- **ku_to_sentence**:
  - Primary Key: `(ku_id, sentence_id)`
- **user_analysis_history**:
  - `text_ja`: TEXT (Analyzed/Refined sentence)

### Immersion & Analytics
- **user_youtube_videos**:
  - `status`: `new` | `learning` | `analyzed`
  - `last_watched_at`: TIMESTAMPTZ
- **user_daily_stats**:
  - Primary Key: `(user_id, day)`
  - `minutes_spent`: INTEGER (Time tracking unit)

## 3. Multi-User Rules
- `sentences`: Unique by `(user_id, text_ja)`.
- `decks`: Unique by `(user_id, name)`.
- `user_learning_states`: Isolated by `user_id`.
