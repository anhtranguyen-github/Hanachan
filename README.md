# Hanachan V2

Hanachan is a Japanese learning application built with Next.js and Supabase, featuring a "Vibrant Sakura" design aesthetic.

## Getting Started

### Prerequisites

- Node.js
- pnpm (Package Manager)

### Installation

1.  Clone the repository.
2.  Install dependencies:

    ```bash
    pnpm install
    ```

3.  Set up your `.env` file (ensure you have the necessary Supabase credentials).

### Running Locally

To start the development server:

```bash
pnpm dev
```

The application will be available at `http://localhost:3000`.

## Test Accounts

The following accounts are pre-configured for testing purposes during development.

| Email                         | Password       | Role        |
| :---------------------------- | :------------- | :---------- |
| `test_worker_1@hanachan.test` | `Password123!` | Test Worker |
| `test_worker_2@hanachan.test` | `Password123!` | Test Worker |
| `test_worker_3@hanachan.test` | `Password123!` | Test Worker |
| `test_worker_4@hanachan.test` | `Password123!` | Test Worker |

### Seeding Test Accounts

If these accounts do not exist in your local Supabase instance, you can create them by running:

```bash
npx tsx tests/init-test-user.ts
```

## Database Management

The database schema and seeding scripts are located in the `dbsu/` directory.

-   **Verify Database Connection**: run `npx tsx dbsu/scripts/verify-supabase.ts`
-   **Main Seed Script**: run `npx tsx dbsu/scripts/seed.ts` (Check scripts in `dbsu/scripts` for more details)
