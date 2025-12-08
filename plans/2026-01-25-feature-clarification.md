
# Feature Clarification: Knowledge Base, Refinement & Chat Interactions

## 1. Browse & Knowledge Base (CKB)
The goal is to provide a structured way to explore the "System Content" (Levels 1-60) and filter it based on user progress.

### 🔍 Filtering Features
*   **Filters**:
    *   **Type**: Vocabulary, Grammar, Kanji, Radical. (Sentence is secondary).
    *   **Level**: 1-60 (WaniKani style) or N1-N5 (JLPT style).
    *   **Status**: `Locked` | `Learning` | `Mastered`.
    *   **Source**: `System` (Default) vs `User` (Mined).

### 📄 KU Detail View & Actions
*   **Detail View**:
    *   Meanings, Readings (On/Kun).
    *   **Context Sentences**: Links to Sentences in the DB (including YouTube mined ones where this word appears).
*   **Actions**:
    *   **Bookmark**: Toggle `is_bookmarked` flag.
    *   **Add to Deck**: Create a Flashcard referencing this KU.

## 2. AI Refinement (On-Demand)
*   **Input**: A user-provided sentence (Japanese) OR a "Mined" sentence that seems low quality.
*   **Process**: AI analyzes structure, naturalness, and grammar.
*   **Output**: "Golden Sentence" (Corrected & Optimized).
*   **Action**: "Replace Current" or "Save as New Variation".

## 3. Reverse Lookup (Contextual)
*   User Request: "Where did I see this word?"
*   **Logic**:
    *   Query `user_youtube_video_segments` (or local transcript cache).
    *   Filter by `video_id` in User Library.
    *   Match text.
    *   **Result**: List of Timestamped Video Links.

## 4. Chatbot Deck Interaction (The Modal Flow)
*   **Scenario**: User says "Add 'Neko' to my deck".
*   **Chatbot Logic**:
    1.  Detect Intent: `ADD_TO_DECK`.
    2.  Extract Entity: `Neko` (Cat).
    3.  **Action**: Instead of silently adding, return a **Structured Action**.
    4.  **UI Consequence** (Frontend): Chatbot bubble shows a "Confirmation Card" or "Modal Trigger".
    *   *"I found 'Neko' (Cat). Would you like to create a card?"*
    *   [ **Preview Card** ] [ **Confirm Add** ]

---

# Architecture Updates for these Features

## A. Service Layer
1.  **`KnowledgeBaseService`**:
    *   `search(query, filters)`: The main browsing engine.
    *   `getDetail(slug)`: Fetch full KU info + Linked Sentences.
2.  **`RefinementService`**:
    *   `refine(sentence)`: High-temperature LLM call for creative correction.
3.  **`InteractionService`** (Chat):
    *   Generate `ChatAction` payloads (JSON) for the Frontend to render Modals.

## B. Data Layer (Local JSON for now)
*   `data/ckb.json`: Mock data for Levels 1-60 (Vocab/Kanji).
*   `data/user_kus.json`: User progress state (`locked`, `learning`, etc).
