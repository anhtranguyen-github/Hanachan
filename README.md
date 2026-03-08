# Hanachan

A Japanese learning platform built with Next.js 14 and FastAPI, using Supabase for data and FSRS for spaced repetition.

## Stack

- **Frontend**: Next.js 14, Tailwind CSS, TypeScript
- **Backend**: FastAPI (Python)
- **Database**: Supabase (PostgreSQL)
- **AI**: OpenAI GPT-4o, LangChain
- **Memory**: Qdrant (episodic), Neo4j (semantic)

## Quick Start

### Prerequisites

- Node.js 20+ and pnpm
- Python 3.11+
- Supabase CLI (for local development)
- Docker & Docker Compose (optional)

### Local Development

```bash
# Install frontend
cd src/nextjs && pnpm install

# Copy env
cp src/nextjs/.env.example src/nextjs/.env.local
# Fill in your keys

# Run
pnpm dev
# (or ./scripts/run.sh)
```

Open [http://localhost:43100](http://localhost:43100)

---

## Docker Setup

### Prerequisites

- Docker Engine 24.0+
- Docker Compose 2.20+

### Quick Start with Docker Compose

```bash
# 1. Copy and configure environment files
cp src/nextjs/.env.example src/nextjs/.env
cp src/fastapi/.env.example src/fastapi/.env

# 2. Edit the .env files with your credentials
# See Environment Variables section below

# 3. Start all services
docker compose up -d

# 4. View logs
docker compose logs -f

# 5. Stop services
docker compose down
```

### Services

| Service | Port | Description |
|---------|------|-------------|
| nextjs | 43100 | Next.js frontend |
| fastapi | 43110 | FastAPI backend API |

### Docker Commands

```bash
# Build and start services
docker compose up --build

# Start in detached mode
docker compose up -d

# Stop all services
docker compose down

# View logs
docker compose logs -f
docker compose logs -f nextjs
docker compose logs -f fastapi

# Restart a specific service
docker restart fastapi

# Shell into a container
docker compose exec nextjs sh
docker compose exec fastapi bash
```

### Running Tests with Docker

```bash
# Run FastAPI tests
docker compose --profile test run --rm fastapi-test

# Run Next.js tests
docker compose --profile test run --rm nextjs-test
```

### Environment Variables

#### Next.js (src/nextjs/.env)

```env
# Required
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
AGENTS_API_URL=http://fastapi:43110
OPENAI_API_KEY=your_openai_key

# Optional
AZURE_SPEECH_KEY=your_azure_key
AZURE_SPEECH_REGION=eastus
```

#### FastAPI (src/fastapi/.env)

```env
# Required
OPENAI_API_KEY=your_openai_key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_role_key
SUPABASE_JWT_SECRET=your_jwt_secret

# Database
DB_HOST=your-db-host
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=your_password

# Vector Store (Qdrant)
QDRANT_URL=http://your-qdrant:6333
QDRANT_API_KEY=your_key
QDRANT_COLLECTION=episodic_memory

# Knowledge Graph (Neo4j)
NEO4J_URI=bolt://your-neo4j:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=your_password

# CORS
ALLOWED_ORIGINS=["http://localhost:43100"]
```

### Production Deployment

```bash
# Set production environment
cp .env.example .env
# Edit .env and set: NODE_ENV=production

# Build and deploy
docker compose -f docker-compose.yml up -d
```

---

## Structure

```
src/nextjs/     # Frontend
src/fastapi/    # Backend
database/   # Schema
```
