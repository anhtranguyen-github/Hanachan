# Human-Design: Package Architecture (Refined)

This document describes the organization of the Hanachan codebase, following a **KU-centric (Knowledge Unit)** and **Sentence-centric** approach.

## 1. Modular Structure

The project is organized into business domains within `src/modules/`. Each module is a Bounded Context that communicates via a clear public API.

```text
src/
├── app/            # Delivery Layer: Routing, Pages, Layouts (Next.js)
├── modules/        # Domain Modules (Business Logic)
│   ├── analysis    # Linguistic analysis, mapping to CKB & AI Refinement
│   ├── ckb         # Core Knowledge Base (The stable "Ground Truth" library)
│   ├── sentence    # Sentence management (Entry Point & Context Pocket)
│   ├── learning    # Progress tracking & SRS Engine (The Learning State)
│   ├── flashcard   # Presentation/Renderer for SRS study sessions
│   ├── youtube     # Source provider: Subtitles & Immersion
│   ├── chatbot     # AI Tutor interaction logic
│   └── auth        # Identity, Quotas & Access
├── services/       # External Adapters (OpenAI, YouTube API)
├── db/             # Persistence logic & Schema
└── lib/            # Shared UI components & Utils
```

## 2. Dependency Rules & Boundaries

1.  **CKB (The Stable Core)**: The Core Knowledge Base is the source of truth for all Radical, Kanji, Vocab, and Grammar. Other modules reference KU IDs from here.
2.  **Sentence-Centric Flow**: Every learning journey starts with a `Sentence`. The `analysis` module breaks down the sentence and links it to `ckb` units.
3.  **Learning State Isolation**: The `learning` module tracks the user's relationship with a KU (Spaced Repetition data) but does not store the linguistic data itself.
4.  **AI as a Service**: The `chatbot` and `analysis` modules use external AI services but are wrapped in adapters to remain flexible.

## 3. Module Internal Layout (Clean-lite)

We avoid over-engineering by using a "Clean-lite" structure inside modules:

```
modules/[feature]/
├── components/     # UI Components
├── hooks/          # UI Logic & Data fetching (Using Repositories)
├── domain/         # Pure logic (e.g., SRS math, static rules)
├── infrastructure/ # Implementation details (Optional)
└── index.ts        # Public exports (Clean API)
```
