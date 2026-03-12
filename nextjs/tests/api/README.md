# API Integration Tests

This directory contains integration tests that verify the generated API client can successfully communicate with the backend services.

## Test Structure

- `health.test.ts` - Health endpoint tests for all services
- `core-api.test.ts` - Core API integration tests
- `agents-api.test.ts` - Agents API integration tests
- `client.test.ts` - SDK client configuration tests

## Running Tests

```bash
# Run all API tests
pnpm test:api

# Run specific test file
pnpm vitest run tests/api/health.test.ts
```

## Test Environment

These tests expect the backend services to be running:
- Core API: http://localhost:6100 (Docker) / http://localhost:6200 (Dev)
- Agents API: http://localhost:8765

You can override these URLs using environment variables:
- `FASTAPI_CORE_URL`
- `AGENTS_API_URL`

## Generated Client

These tests use the generated API client from `src/client/`. The client is generated from OpenAPI schemas using Hey API.

To regenerate the client:
```bash
pnpm generate:api
```

**Note:** The generated client code should NOT be committed to git.
