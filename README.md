# Hanachan V2 (Final)

Hanachan is an advanced Japanese learning platform built with **Next.js 14**, **Supabase**, and **TailwindCSS**. It features a custom "Sakura" design system and implements the **FSRS (Free Spaced Repetition Scheduler)** algorithm for optimized long-term memory retention.

## 🌸 Core Features

*   **Sakura Design System**: A premium, vibrant UI using rounded aesthetics (`rounded-[40px]`), glassmorphism, and a curated pastel palette (Pink, Blue, Green, Purple).
*   **FSRS Algorithm**: A fully client-side implementation of the Free Spaced Repetition Scheduler v4 to handle review intervals efficiently.
*   **Batch Learning**: Structured "Discovery Batches" of 5 items to manage cognitive load.
*   **Content Library**: A unified interface to browse Kanji, Radicals, Vocabulary, and Grammar with advanced filtering.
*   **Interactive Dashboard**: Real-time analytics, daily streaks, heatmaps, and level progression tracking.
*   **E2E Coordination**: Full coordination between Learning, Reviewing, and Dashboard states verified by Playwright.

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
    ```

### Running Locally

To start the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 🔑 Test Accounts

Use these pre-configured accounts to explore the platform immediately without registration logic.

| Email                         | Password       | Level | Note |
| :---------------------------- | :------------- | :---: | :--- |
| `test_worker_1@hanachan.test` | `Password123!` | 1     | **Primary Test User** |
| `test_worker_2@hanachan.test` | `Password123!` | 5     | Mid-level content unlocked |
| `test_worker_3@hanachan.test` | `Password123!` | 10    | Advanced content unlocked |

> **Note:** If these users do not exist, run the initialization script:
> ```bash
> pnpm exec tsx tests/init-test-user.ts
> ```

## 🧪 Running Tests

We use **Playwright** for End-to-End (E2E) testing.

### Run All Tests
```bash
npx playwright test
```

### Run Specific Flows
```bash
# Test the full Learning -> Dashboard -> Review loop
npx playwright test tests/e2e/learning_coordination.spec.ts

# Test just the Review Session logic
npx playwright test tests/e2e/review.spec.ts
```

## 📂 Project Structure

*   `src/app`: Next.js App Router pages.
*   `src/features`: Feature-based architecture (Auth, Learning, Knowledge, Analytics).
*   `src/components`: Reusable UI components (Sakura design system).
*   `tests/e2e`: Playwright test suites.
*   `docs/`: Detailed documentation on FSRS, Batch Logic, and System Architecture.

## 🛠 Database Management

Ensure your local Supabase instance is running.

-   **Seed Database**: `pnpm exec tsx dbsu/scripts/seed.ts`
-   **Verify Connection**: `pnpm exec tsx dbsu/scripts/verify-supabase.ts`
