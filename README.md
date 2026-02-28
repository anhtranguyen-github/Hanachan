# Hanachan

A Japanese learning platform built with Next.js 14 and FastAPI, using Supabase for data and FSRS for spaced repetition.

## Stack

- **Frontend**: Next.js 14, Tailwind CSS, TypeScript
- **Backend**: FastAPI (Python)
- **Database**: Supabase (PostgreSQL)
- **AI**: OpenAI GPT-4o, LangChain
- **Memory**: Qdrant (episodic), Neo4j (semantic)

## Quick Start

```bash
# Install frontend
cd nextjs && pnpm install

# Copy env
cp .env.example nextjs/.env.local
# Fill in your keys

# Run
./run.sh
```

Open [http://localhost:3000](http://localhost:3000)

## Test Accounts

Test account credentials are stored securely and not committed to the repository.  
See your Supabase dashboard or contact the project maintainer for access.

## Structure

```
nextjs/     # Frontend
fastapi/    # Backend
database/   # Schema
```
