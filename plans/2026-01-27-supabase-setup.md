# Plan: Local Supabase Setup

## Objective
Set up a local Supabase environment to run on the user's machine without integrating it into the codebase yet.

## Prerequisites
- Docker (Verified: Running)
- Node.js / pnpm (Verified: Running)

## Execution Steps

### Step 1: Initialize Supabase
Run `npx supabase init` to create the local configuration and folder structure.

### Step 2: Start Local Supabase
Run `npx supabase start`. This will:
- Pull necessary Docker images (GoTrue, PostgREST, Realtime, etc.)
- Start the Postgres database.
- Start the local Studio (Dashboard).

### Step 3: Verify & Capture Credentials
Once started, capture the:
- API URL
- Anon Key
- Service Role Key
- DB Connection String
- Studio URL (Default: http://localhost:54323)

## Important Notes
- This setup is completely local. No cloud resources are created.
- Integration with the `.env` or codebase will be deferred as requested.
