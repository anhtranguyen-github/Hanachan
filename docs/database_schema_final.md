
# HanaChan V2 - Production Database Schema

> **Source of Truth**: This document maps 1:1 to the Supabase Production Schema.
> **Last Verified**: 2026-01-25

## 1. User & Profile
- **users** (`public.users`):
  - `id`: UUID (PK) - Links to `auth.users`
  - `email`, `display_name`, `avatar_url`
  - `role`: 'USER'
- **user_settings**:
  - `user_id`: UUID (PK)
  - `target_retention`: Float (0.9)
  - `fsrs_weights`: Array
  - `preferred_voice`, `theme`

## 2. Knowledge Base (Static Content)
- **knowledge_units** (The Core):
  - `id`: UUID (PK)
  - `slug`: Text (Unique Identifier)
  - `type`, `character`, `meaning`, `level`
- **Detail Tables**:
  - `ku_kanji`, `ku_vocabulary`, `ku_grammar`, `ku_radicals`
  - All linked via `ku_id` (slug).

## 3. Sentences & Context (The "Root")
- **sentences**:
  - `id`: UUID (PK)
  - `user_id`: UUID (Owner)
  - `text_ja`, `text_en`: Text
  - `source_type`: 'youtube', 'chat', 'manual'
  - `source_id`: Text (VideoID or SessionID)
  - `timestamp`: Integer (Context Seconds)
  - `audio_url`, `text_tokens`: JSONB
- **ku_to_sentence** (Relationship Map):
  - `ku_id`, `sentence_id`
  - `cloze_positions`: JSONB

## 4. Learning Engine (Flashcards)
### A. Vocabulary / Kanji Focus (Mặt chữ & Nghĩa)
- **user_learning_states**:
  - `user_id`, `ku_id`
  - `state`: Enum (New, Learning, Review, Relearning)
  - `stability`, `difficulty`, `next_review`

### B. Grammar / Sentence Focus (Ngữ cảnh & Cloze)
- **user_sentence_cards**:
  - `id`: UUID (PK)
  - `sentence_id`: UUID (Root)
  - `card_type`: 'vocab' | 'cloze'
  - `front`, `back`: Text
  - `target_slug`: Text (Target Grammar/Word)
  - `fsrs_state`: JSONB
  - `next_review`: Timestamptz

## 5. Decks (Custom Collections)
- **decks**:
  - `id`: UUID (PK)
  - `name`, `type`, `description`
- **deck_items**:
  - `id`: UUID (PK)
  - `deck_id`: UUID
  - `ku_id`: Text (Nullable - for Vocab/Kanji)
  - `sentence_id`: UUID (Nullable - for Grammar/Cloze)
  - `target_grammar_slug`: Text (Required if sentence_id present)
  - *Logic Check*: One item must target either a KU or a Grammar-in-Sentence.

## 6. Chatbot (Persistence)
- **chat_sessions**:
  - `id`: Text (PK)
  - `user_id`, `title`
- **chat_messages**:
  - `id`: UUID (PK)
  - `session_id`, `role`, `content`, `metadata`

## 7. Analytics & History
- **user_daily_stats**:
  - `user_id`, `day` (PK)
  - `reviews_completed`, `correct_reviews`
  - `new_cards_learned`, `minutes_spent`
- **fsrs_history** (Review Logs):
  - `id`, `ku_id`, `sentence_id`, `rating`, `review_at`
- **user_youtube_videos** (Immersion Progress):
  - `id`, `video_id`, `status`, `progress`
- **user_analysis_history** (Logs):
  - `text_ja`, `analysis_result`
