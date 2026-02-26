# Hanachan V2 (Final)

Hanachan is a high-performance Japanese learning platform built with a modern split-stack architecture: **Next.js 14** (Frontend) and **FastAPI** (Backend). It utilizes **Supabase** for data persistence and implements the **FSRS (Free Spaced Repetition Scheduler)** algorithm for optimized long-term memory retention.

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
*   **Density-Optimized Layout**: Refactored to maximize content area by removing duplicate headers and reducing vertical white space.
*   **Streamlined Data**: All technical metadata (Hashes, IDs, counts) is hidden from the main learning interface for a clean, immersive experience.
*   **Batch Learning**: Structured "Discovery Batches" of 5 items to manage cognitive load.
*   **Content Library**: Unified interface to browse Kanji, Radicals, Vocabulary, and Grammar with advanced filtering.
*   **Interactive Dashboard**: Real-time analytics, daily streaks, heatmaps, and level progression tracking.

## 🚀 Getting Started

### Prerequisites

- Node.js (Latest LTS recommended)
- pnpm (Package Manager)

### Installation

1.  Clone the repository.
2.  Install frontend dependencies:
    ```bash
    cd nextjs && pnpm install
    ```
3.  Install backend dependencies (requires `uv`):
    ```bash
    cd fastapi && uv sync
    ```
4.  Set up your `.env` file in the root directory (see `.env.example`).

### Running Locally

Hanachan provides a centralized startup script to launch the entire environment (Infrastructure + Services) simultaneously:

```bash
./run.sh
```

This script:
1.  **Orchestrates Infrastructure**: Starts the **Supabase** local stack (PostgreSQL, Auth, Storage).
2.  **Cleans Environment**: Force-cleans zombie processes on ports `3000` and `8765` to avoid conflicts.
3.  **Starts Backend**: Launches the **FastAPI** server using `uv`.
4.  **Starts Frontend**: Launches the **Next.js** dev server using `pnpm`.

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 🔑 Test Accounts

Use these pre-configured accounts to explore the platform immediately.

| Email                         | Password       | Level | Note |
| :---------------------------- | :------------- | :---: | :--- |
| `test_worker_1@hanachan.test` | `Password123!` | 1     | **Primary Test User** |
| `test_worker_2@hanachan.test` | `Password123!` | 5     | Mid-level content unlocked |
| `test_worker_3@hanachan.test` | `Password123!` | 10    | Advanced content unlocked |

> **Note:** These accounts are automatically provisioned. If you need to reset them or seed them for the first time, run:
> ```bash
> node nextjs/scripts/seed-test-workers.js
> ```

## 🧪 Running Tests

We use **Vitest** for unit and integration testing.

### Run All E2E Tests
```bash
npm test
```

## 📂 Project Structure

```bash
.
├── nextjs/                 # Frontend (Next.js 14 + Tailwind)
│   ├── src/app/            # App Router pages
│   ├── src/features/       # Feature-based components & logic
│   └── src/components/     # Shared UI components
├── fastapi/                # Backend (Python + FastAPI)
│   ├── app/                # Core logic & API endpoints
│   ├── core/               # Configuration & security
│   └── scripts/            # Database migrations & utilities
├── docs/                   # System Documentation
│   ├── businessflow/       # Business logic documentation
│   ├── er/                 # Entity Relationship diagrams
│   └── fsrs/               # Algorithm documentation
└── run.sh                  # Centralized startup script
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

## 🛠 Troubleshooting

### Port Already in Use (EADDRINUSE)
If you encounter `Error: listen EADDRINUSE: address already in use :::3000`, simply restart the startup script:
```bash
./run.sh
```
The script is designed to aggressively clear existing processes on ports `3000` and `8765` before starting.

## 📄 License

This project is for educational purposes as part of a graduation thesis.
