# API Integration Workflow

This document describes the automated contract-driven REST integration workflow between the FastAPI backend and Next.js frontend using **Hey API**.

## Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  FastAPI        │────▶│  OpenAPI        │────▶│  Generated      │
│  Backend        │     │  Schema         │     │  SDK            │
│                 │     │  (/openapi.json)│     │  (Hey API)      │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                                               │
         │                                               │
         │           ┌─────────────────┐                 │
         └──────────▶│  Next.js        │◀────────────────┘
                     │  Frontend       │
                     │  (Typed Client) │
                     └─────────────────┘
                                │
                                ▼
                     ┌─────────────────┐
                     │  CI Pipeline    │
                     │  (Validation)   │
                     └─────────────────┘
```

## Architecture Principles

1. **Backend is the Single Source of Truth**
   - API contracts are defined in FastAPI using Pydantic schemas
   - OpenAPI schema is auto-generated from FastAPI

2. **Generated Code is Never Manually Edited**
   - TypeScript SDK is generated automatically from OpenAPI
   - All changes flow from backend → frontend

3. **CI Prevents Contract Drift**
   - Build fails if API types change without SDK regeneration
   - Integration tests verify contract compliance

4. **pnpm Only**
   - All Node.js tooling uses pnpm exclusively
   - npm and yarn are blocked by preinstall hook

## File Structure

```
repo/
├── fastapi-domain/              # Domain API backend
│   └── app/main.py
├── fastapi-agents/              # Agents API backend
│   └── app/main.py
├── nextjs/                      # Next.js frontend
│   ├── src/client/              # Generated SDK (gitignored)
│   │   ├── domain/              # Domain API client
│   │   └── agents/              # Agents API client
│   ├── tests/api/               # API integration tests
│   │   ├── client.test.ts       # SDK import tests
│   │   ├── health.test.ts       # Health endpoint tests
│   │   └── contract-drift.test.ts  # Contract validation tests
│   ├── package.json             # Scripts and dependencies
│   └── openapi-ts.config.ts     # Hey API configuration
├── openapi/                     # OpenAPI schemas
│   ├── domain.json              # Domain API schema
│   └── agents.json              # Agents API schema
├── scripts/
│   └── export-openapi.sh        # Export schemas from backends
├── heyapi.config.ts             # Root Hey API config
└── .github/workflows/
    ├── api-integration.yml      # Full integration workflow
    ├── fastapi-domain-ci.yml    # Domain API CI
    ├── fastapi-agents-ci.yml    # Agents API CI
    └── nextjs-ci.yml            # Frontend CI
```

## Quick Start

### 1. Install Dependencies

```bash
# Install backend dependencies
cd fastapi-domain && uv sync
cd ../fastapi-agents && uv sync

# Install frontend dependencies
cd ../nextjs && pnpm install
```

### 2. Start Backend Services

```bash
# Terminal 1: Domain API
cd fastapi-domain
uv run uvicorn app.main:app --port 8000 --reload

# Terminal 2: Agents API
cd fastapi-agents
uv run uvicorn app.main:app --port 8001 --reload
```

### 3. Export OpenAPI Schemas

```bash
./scripts/export-openapi.sh
```

This fetches OpenAPI schemas from running backends and saves them to `openapi/`.

### 4. Generate SDK

```bash
cd nextjs
pnpm generate:api
```

This generates the TypeScript SDK in `src/client/`.

### 5. Build and Test

```bash
# Build frontend (validates types)
pnpm build

# Run API integration tests
pnpm test:api
```

## Workflow for Developers

### Backend Developer Workflow

1. **Modify API**: Update FastAPI routes or Pydantic schemas
2. **Test Locally**: Start service and verify `/openapi.json`
3. **Export Schema**: Run `./scripts/export-openapi.sh`
4. **Commit Changes**: Include updated `openapi/*.json` files

```bash
# Example workflow
cd fastapi-domain
# Edit app/adapters/http/sessions.py
uv run uvicorn app.main:app --port 8000 --reload
# In another terminal:
./scripts/export-openapi.sh
git add openapi/domain.json
git commit -m "feat: update session API with new fields"
```

### Frontend Developer Workflow

1. **Pull Changes**: Get latest code including `openapi/*.json`
2. **Regenerate SDK**: Run `pnpm generate:api`
3. **Update Code**: Use new types/methods from generated client
4. **Type Check**: Run `pnpm build` to validate types
5. **Test**: Run `pnpm test:api` to verify integration

```bash
# Example workflow
cd nextjs
git pull origin main
pnpm generate:api
# Update code using new SDK types
pnpm build
pnpm test:api
```

## Available Scripts

### Root Scripts

```bash
./scripts/export-openapi.sh [environment]  # Export OpenAPI from backends
```

### Frontend Scripts (nextjs/package.json)

```bash
# SDK Generation
pnpm generate:api              # Generate all clients
pnpm generate:api:domain       # Generate domain client only
pnpm generate:api:agents       # Generate agents client only

# Building
pnpm build                     # Generate SDK + build Next.js
pnpm typecheck                 # TypeScript type check only

# Testing
pnpm test:api                  # Run API integration tests
pnpm test:unit                 # Run unit tests
pnpm test:integration          # Run other integration tests
```

## Using the Generated Client

### Basic Usage

```typescript
// Import from generated client
import { getHealth } from '@/client/domain';
import { getHealth as getAgentsHealth } from '@/client/agents';

// Call API with full type safety
const health = await getHealth({
  client: createClient({ baseUrl: 'http://localhost:8000' })
});
// health is fully typed!
```

### With React/Next.js

```typescript
// lib/api/client.ts
import { createClient, createConfig } from '@hey-api/client-fetch';

export const domainClient = createClient(createConfig({
  baseUrl: process.env.NEXT_PUBLIC_DOMAIN_API_URL || 'http://localhost:8000',
}));

export const agentsClient = createClient(createConfig({
  baseUrl: process.env.NEXT_PUBLIC_AGENTS_API_URL || 'http://localhost:8001',
}));
```

```typescript
// app/page.tsx
import { getHealth } from '@/client/domain';
import { domainClient } from '@/lib/api/client';

export default async function Page() {
  const health = await getHealth({ client: domainClient });

  return (
    <div>
      <p>Service: {health.service}</p>
      <p>Status: {health.status}</p>
    </div>
  );
}
```

## CI/CD Integration

### Workflow Triggers

The `api-integration.yml` workflow runs on:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`
- Changes to backend, frontend, or OpenAPI-related files

### CI Pipeline Flow

```
1. Start Backend Services
   └─ uvicorn fastapi-domain (port 8000)
   └─ uvicorn fastapi-agents (port 8001)

2. Health Check
   └─ Verify /health endpoints respond

3. Export OpenAPI Schemas
   └─ curl /openapi.json → openapi/domain.json
   └─ curl /openapi.json → openapi/agents.json

4. Install Frontend Dependencies
   └─ pnpm install

5. Generate SDK
   └─ pnpm generate:api (Hey API)

6. Build Frontend
   └─ pnpm build (validates TypeScript)

7. Run API Integration Tests
   └─ pnpm test:api

8. Upload Artifacts
   └─ OpenAPI schemas
   └─ Generated SDK
```

### Failure Conditions

CI fails if:
- Backend services fail to start
- OpenAPI schemas cannot be exported
- SDK generation fails
- Frontend build fails (type errors)
- API integration tests fail
- Health endpoints are unreachable

## Configuration

### Hey API Configuration

**`nextjs/openapi-ts.config.ts`**:

```typescript
import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  client: '@hey-api/client-fetch',
  plugins: [
    '@hey-api/typescript',
    {
      name: '@hey-api/sdk',
      operationId: true,
    },
  ],
});
```

### Package.json Scripts

```json
{
  "scripts": {
    "build": "pnpm generate:api && next build",
    "generate:api": "pnpm generate:api:domain && pnpm generate:api:agents",
    "generate:api:domain": "openapi-ts --config openapi-ts.config.ts --input ../openapi/domain.json --output src/client/domain",
    "generate:api:agents": "openapi-ts --config openapi-ts.config.ts --input ../openapi/agents.json --output src/client/agents"
  }
}
```

## Troubleshooting

### Client Not Found

```
Error: Cannot find module '@/client/domain'
```

**Solution**: Run `pnpm generate:api` to generate the client.

### Type Errors After API Change

```
Type error: Property 'x' does not exist on type 'Y'
```

**Solution**: Backend API changed. Run `pnpm generate:api` to update types.

### CI Fails on SDK Generation

```
Error: Input file does not exist: openapi/domain.json
```

**Solution**: OpenAPI schemas not committed. Run `./scripts/export-openapi.sh` locally and commit.

### Backend Not Running

```
Error: connect ECONNREFUSED 127.0.0.1:8000
```

**Solution**: Start backend services before exporting OpenAPI or running tests.

## Migration from openapi-typescript-codegen

The project previously used `openapi-typescript-codegen`. The migration to Hey API provides:

- Better TypeScript type inference
- Smaller bundle size
- Improved error handling
- Active maintenance

Old scripts (deprecated):
```bash
pnpm generate-client:domain  # OLD - uses openapi-typescript-codegen
pnpm generate-client:agents  # OLD - uses openapi-typescript-codegen
```

New scripts:
```bash
pnpm generate:api:domain     # NEW - uses Hey API
pnpm generate:api:agents     # NEW - uses Hey API
```

## References

- [Hey API Documentation](https://heyapi.dev/)
- [OpenAPI Specification](https://spec.openapis.org/)
- [FastAPI OpenAPI](https://fastapi.tiangolo.com/tutorial/metadata/)
- [pnpm Documentation](https://pnpm.io/)
