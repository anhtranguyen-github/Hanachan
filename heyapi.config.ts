import { defineConfig } from '@hey-api/openapi-ts';

/**
 * Hey API Configuration
 *
 * This configuration generates TypeScript SDK clients from OpenAPI schemas.
 * It processes both the Domain API and Agents API schemas.
 *
 * Generated code locations:
 *   - Domain API: nextjs/src/client/domain
 *   - Agents API: nextjs/src/client/agents
 *
 * Usage:
 *   pnpm generate:api          # Generate both clients
 *   pnpm generate:api:domain   # Generate domain client only
 *   pnpm generate:api:agents   # Generate agents client only
 */

// Domain API Client Configuration
export const domainConfig = defineConfig({
    input: 'openapi/domain.json',
    output: 'nextjs/src/client/domain',
    plugins: [
        '@hey-api/client-fetch',
        '@hey-api/typescript',
        {
            name: '@hey-api/sdk',
            // Generate SDK methods from operation IDs
            operationId: true,
        },
    ],
});

// Agents API Client Configuration
export const agentsConfig = defineConfig({
    input: 'openapi/agents.json',
    output: 'nextjs/src/client/agents',
    plugins: [
        '@hey-api/client-fetch',
        '@hey-api/typescript',
        {
            name: '@hey-api/sdk',
            // Generate SDK methods from operation IDs
            operationId: true,
        },
    ],
});

// Default export for single API generation
export default domainConfig;
