# Hanachan V2 (Final)

Hanachan is an advanced Japanese learning platform built with **Next.js 14**, **Supabase**, and **TailwindCSS**. It features a custom "Sakura" design system and implements the **FSRS (Free Spaced Repetition Scheduler)** algorithm for optimized long-term memory retention.

## 🌸 Core Features

### Learning System
*   **Binary SRS Rating**: Simplified `pass`/`again` rating system with 1.5x stability growth for successful recalls.
*   **FSRS Algorithm**: Full implementation of the Free Spaced Repetition Scheduler v4 for optimal review scheduling.
*   **Immediate Persistence**: FSRS updates are committed **immediately** upon the user's first answer attempt to ensure data integrity.
*   **Atomic Life-cycle**: Once an item is answered correctly in Review, it is instantly rescheduled and removed from the active queue, even if the session is interrupted.
*   **Facet-Based Mastery**: Vocabulary units track Reading and Meaning facets independently (Independence Law).

### AI Chatbot (Hanachan AI)
*   **Progress Reporting**: Ask "What is my current progress?" to get live stats (Level, Items Mastered, Reviews Due).
*   **Entity Linking**: AI responses automatically detect Knowledge Units (Kanji, Vocabulary, Grammar) and provide interactive CTA buttons.
*   **QuickView Modal**: Click any linked KU to see detailed information without leaving the chat.

### UI/UX
*   **Sakura Design System**: Premium UI with rounded aesthetics (`rounded-[40px]`), glassmorphism, and a curated pastel palette.
*   **Batch Learning**: Structured "Discovery Batches" of 5 items to manage cognitive load.
*   **Content Library**: Unified interface to browse Kanji, Radicals, Vocabulary, and Grammar with advanced filtering.
*   **Interactive Dashboard**: Real-time analytics, daily streaks, heatmaps, and level progression tracking.

## 🚀 Getting Started

### Prerequisites

- Node.js (Latest LTS recommended)
- pnpm (Package Manager)

### Installation

1.  Clone the repository.
2.  Install dependencies:

    ```bash
    pnpm install
    # or
    npm install
    ```

3.  Set up your `.env.local` file with your Supabase credentials:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=your_project_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
    SUPABASE_SERVICE_ROLE_KEY=your_service_role_key # For admin tasks/seeding
    OPENAI_API_KEY=your_openai_key # For AI Chatbot
    ```

### Running Locally

To start the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 🔑 Test Accounts

Use these pre-configured accounts to explore the platform immediately.

| Email                         | Password       | Level | Note |
| :---------------------------- | :------------- | :---: | :--- |
| `test_worker_1@hanachan.test` | `Password123!` | 1     | **Primary Test User** |
| `test_worker_2@hanachan.test` | `Password123!` | 5     | Mid-level content unlocked |
| `test_worker_3@hanachan.test` | `Password123!` | 10    | Advanced content unlocked |

> **Note:** If these users do not exist, they should be created in the Supabase dashboard or via a migration script.

## 🧪 Running Tests

We use **Vitest** for unit and integration testing.

### Run All Tests
```bash
npm test
```

## 📂 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (main)/             # Authenticated routes (dashboard, learn, review, etc.)
│   └── api/                # API routes (chat, auth)
├── features/               # Feature-based architecture
│   ├── auth/               # Authentication (Supabase Auth)
│   ├── chat/               # AI Chatbot (LangChain + OpenAI)
│   ├── knowledge/          # Knowledge Units (Kanji, Vocab, Grammar)
│   ├── learning/           # SRS Engine, Session Controller
│   └── analytics/          # User stats and progress tracking
├── components/             # Reusable UI components
│   ├── shared/             # QuickViewModal, AudioPlayer, etc.
│   └── premium/            # GlassCard, SRSProgressIcon
└── lib/                    # Utilities (Supabase client, validation)

tests/
├── unit/                   # Unit tests
└── integration/            # Integration tests

docs/
├── businessflow/           # Business logic documentation
├── class/                  # Class design specifications
├── er/                     # Entity Relationship diagrams
├── fsrs/                   # FSRS algorithm documentation
└── reports/                # Audit and test reports
```

## 📚 Documentation

| Document | Description |
| :--- | :--- |
| `docs/fsrs/FSRS_LOGIC.md` | FSRS algorithm implementation details |
| `docs/businessflow/bussinessflow.md` | Study session business rules |
| `docs/class/classes.md` | Class design and responsibilities |
| `docs/er/full-system-er.md` | Complete Entity-Relationship diagram |

## 🛠 Database Management

Ensure your Supabase instance is running and configured.

-   **Schema**: See `docs/database/final_schema.sql` for the complete database schema.
-   **Verify Connection**: `pnpm exec tsx verify_init.ts`

## 📄 License

This project is for educational purposes as part of a graduation thesis.
