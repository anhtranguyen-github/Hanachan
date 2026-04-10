/**
 * Health Endpoint Integration Tests
 *
 * These tests verify that the generated API clients can successfully
 * communicate with the backend health endpoints.
 */

import { describe, it, expect } from 'vitest';
import { BACKEND_API_URL, AGENTS_API_URL } from './setup';

describe('Health Endpoints', () => {
    describe('Core API Health', () => {
        it('should return healthy status from core API', async () => {
            const response = await fetch(`${BACKEND_API_URL}/health`);

            expect(response.ok).toBe(true);
            expect(response.status).toBe(200);

            const data = await response.json();
            expect(data).toHaveProperty('status');
            expect(data.status).toBe('healthy');
            expect(data).toHaveProperty('service');
        });
    });

    describe('Agents API Health', () => {
        it('should return healthy status from agents API', async () => {
            // Agents API health endpoint is at /api/v1/health (not /health)
            const response = await fetch(`${AGENTS_API_URL}/api/v1/health`);

            expect(response.ok).toBe(true);
            expect(response.status).toBe(200);

            const data = await response.json();
            expect(data).toHaveProperty('status');
            expect(data.status).toBe('ok');
        });
    });

    describe('OpenAPI Schema Availability', () => {
        it('should serve OpenAPI schema from core API', async () => {
            const response = await fetch(`${BACKEND_API_URL}/openapi.json`);

            expect(response.ok).toBe(true);
            expect(response.status).toBe(200);

            const schema = await response.json();
            expect(schema).toHaveProperty('openapi');
            expect(schema).toHaveProperty('info');
            expect(schema).toHaveProperty('paths');
        });

        it('should serve OpenAPI schema from agents API', async () => {
            const response = await fetch(`${AGENTS_API_URL}/openapi.json`);

            expect(response.ok).toBe(true);
            expect(response.status).toBe(200);

            const schema = await response.json();
            expect(schema).toHaveProperty('openapi');
            expect(schema).toHaveProperty('info');
            expect(schema).toHaveProperty('paths');
        });
    });
});
