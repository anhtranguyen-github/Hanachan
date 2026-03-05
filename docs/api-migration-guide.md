# API Integration - Migration Guide

## Overview

This guide documents the migration from `openapi-typescript-codegen` to **Hey API** for automatic REST API client generation in the Hanachan project.

## What Changed

### Old Approach (openapi-typescript-codegen)
```typescript
// OLD - openapi-typescript-codegen
import { SessionsService } from '@/lib/api/generated/domain/services/SessionsService';
import { OpenAPI } from '@/lib/api/generated/domain/core/OpenAPI';

OpenAPI.BASE = 'http://localhost:8000';
const result = await SessionsService.startReviewApiV1SessionsReviewStartPost(limit);
```

### New Approach (Hey API)
```typescript
// NEW - Hey API
import { 
  startReviewApiV1SessionsReviewStartPost,
  client as domainClient 
} from '@/client/domain';
import { setBaseUrl } from '@hey-api/client-fetch';

// Configure client
setBaseUrl(domainClient, 'http://localhost:8000');

// Call API with full type safety
const result = await startReviewApiV1SessionsReviewStartPost({
  client: domainClient,
  body: { limit: 10 }
});
```

## Key Differences

| Aspect | Old (openapi-typescript-codegen) | New (Hey API) |
|--------|-----------------------------------|---------------|
| Import path | `@/lib/api/generated/...` | `@/client/...` |
| Service classes | `SessionsService`, `LearningService` | Direct function exports |
| Client config | `OpenAPI.BASE = url` | `setBaseUrl(client, url)` |
| Request body | Positional arguments | Options object with `body` |
| Generated files | Multiple files in nested structure | Flat structure: types, sdk, client |

## Migration Steps

### 1. Update Imports

Old:
```typescript
import { SessionsService } from '@/lib/api/generated/domain/services/SessionsService';
import { OpenAPI } from '@/lib/api/generated/domain/core/OpenAPI';
```

New:
```typescript
import { 
  startReviewApiV1SessionsReviewStartPost,
  client as domainClient 
} from '@/client/domain';
import { setBaseUrl } from '@hey-api/client-fetch';
```

### 2. Update Client Configuration

Old:
```typescript
OpenAPI.BASE = 'http://localhost:8000';
OpenAPI.HEADERS = { Authorization: `Bearer ${token}` };
```

New:
```typescript
import { setBaseUrl, setHeaders } from '@hey-api/client-fetch';

setBaseUrl(domainClient, 'http://localhost:8000');
setHeaders(domainClient, { Authorization: `Bearer ${token}` });
```

### 3. Update API Calls

Old:
```typescript
const result = await SessionsService.startReviewApiV1SessionsReviewStartPost(limit, contentType);
```

New:
```typescript
const result = await startReviewApiV1SessionsReviewStartPost({
  client: domainClient,
  body: { limit },
  headers: { 'Content-Type': contentType }
});
```

## Script Changes

### Package.json Scripts

Old:
```json
{
  "scripts": {
    "generate-client:domain": "openapi-typescript-codegen --input openapi/fastapi-domain-openapi.json --output src/lib/api/generated/domain --client fetch",
    "generate-client:agents": "openapi-typescript-codegen --input openapi/fastapi-agents-openapi.json --output src/lib/api/generated/agents --client fetch"
  }
}
```

New:
```json
{
  "scripts": {
    "generate:api": "pnpm generate:api:domain && pnpm generate:api:agents",
    "generate:api:domain": "openapi-ts -c @hey-api/client-fetch -i ../openapi/domain.json -o src/client/domain",
    "generate:api:agents": "openapi-ts -c @hey-api/client-fetch -i ../openapi/agents.json -o src/client/agents"
  }
}
```

## Files to Migrate

The following files need to be updated to use the new Hey API client:

1. `nextjs/src/lib/domain-client.ts` - Main domain client
2. Any files importing from `@/lib/api/generated/`

Search for old imports:
```bash
grep -r "@/lib/api/generated" nextjs/src --include="*.ts" --include="*.tsx"
```

## Benefits of Hey API

1. **Smaller bundle size** - Only imports what you use
2. **Better TypeScript support** - Improved type inference
3. **Active maintenance** - Regular updates and new features
4. **Flexible client** - Easy to customize and extend
5. **Better error handling** - Improved error types

## Troubleshooting

### Import errors after migration

Make sure to regenerate the client:
```bash
cd nextjs
pnpm generate:api
```

### Type errors for optional fields

Hey API handles optional fields differently. Check the generated types in `src/client/domain/types.gen.ts`.

### Client not configured

Remember to set the base URL before making API calls:
```typescript
import { setBaseUrl } from '@hey-api/client-fetch';
import { client } from '@/client/domain';

setBaseUrl(client, 'http://localhost:8000');
```
