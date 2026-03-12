/**
 * API Contract Drift Detection Tests
 *
 * These tests verify that the frontend's expectations match the backend's
 * actual API contracts. If these tests fail, it indicates that:
 *
 * 1. The backend API has changed
 * 2. The generated client needs to be regenerated
 * 3. Frontend code may need updates to match new API contracts
 *
 * This is a critical part of the contract-driven development workflow.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { FASTAPI_CORE_URL, AGENTS_API_URL, waitForService } from './setup';

describe('API Contract Drift Detection', () => {
    let coreAvailable = false;
    let agentsAvailable = false;

    beforeAll(async () => {
        coreAvailable = await waitForService(FASTAPI_CORE_URL, 3, 500);
        agentsAvailable = await waitForService(AGENTS_API_URL, 3, 500);
    });

    describe('Core API Contract', () => {
        it('should have expected API structure', async () => {
            if (!coreAvailable) {
                console.warn('Core API not available, skipping contract test');
                return;
            }

            const response = await fetch(`${FASTAPI_CORE_URL}/openapi.json`);
            const schema = await response.json();

            // Verify expected endpoints exist
            expect(schema.paths).toBeDefined();

            // Health endpoint should exist
            expect(schema.paths).toHaveProperty('/health');
            expect(schema.paths['/health']).toHaveProperty('get');

            // API v1 endpoints should exist
            const hasApiV1 = Object.keys(schema.paths).some(path => path.startsWith('/api/v1'));
            expect(hasApiV1).toBe(true);

            // Verify expected schemas exist
            expect(schema.components).toBeDefined();
            expect(schema.components.schemas).toBeDefined();
        });

        it('should maintain health endpoint contract', async () => {
            if (!coreAvailable) {
                console.warn('Core API not available, skipping contract test');
                return;
            }

            const response = await fetch(`${FASTAPI_CORE_URL}/health`);
            const data = await response.json();

            // These properties must exist for the contract to be valid
            expect(data).toHaveProperty('status');
            expect(data).toHaveProperty('service');
            expect(typeof data.status).toBe('string');
            expect(typeof data.service).toBe('string');
        });
    });

    describe('Agents API Contract', () => {
        it('should have expected API structure', async () => {
            if (!agentsAvailable) {
                console.warn('Agents API not available, skipping contract test');
                return;
            }

            const response = await fetch(`${AGENTS_API_URL}/openapi.json`);
            const schema = await response.json();

            // Verify expected endpoints exist
            expect(schema.paths).toBeDefined();

            // Health endpoint should exist
            expect(schema.paths).toHaveProperty('/health');
            expect(schema.paths['/health']).toHaveProperty('get');

            // API v1 endpoints should exist
            const hasApiV1 = Object.keys(schema.paths).some(path => path.startsWith('/api/v1'));
            expect(hasApiV1).toBe(true);

            // Verify expected schemas exist
            expect(schema.components).toBeDefined();
            expect(schema.components.schemas).toBeDefined();
        });

        it('should maintain health endpoint contract', async () => {
            if (!agentsAvailable) {
                console.warn('Agents API not available, skipping contract test');
                return;
            }

            const response = await fetch(`${AGENTS_API_URL}/health`);
            const data = await response.json();

            // These properties must exist for the contract to be valid
            expect(data).toHaveProperty('status');
            expect(data).toHaveProperty('service');
            expect(typeof data.status).toBe('string');
            expect(typeof data.service).toBe('string');
        });
    });

    describe('OpenAPI Schema Versions', () => {
        it('should use valid OpenAPI version in core API', async () => {
            if (!coreAvailable) {
                console.warn('Core API not available, skipping contract test');
                return;
            }

            const response = await fetch(`${FASTAPI_CORE_URL}/openapi.json`);
            const schema = await response.json();

            expect(schema.openapi).toMatch(/^3\.\d+\.\d+$/);
        });

        it('should use valid OpenAPI version in agents API', async () => {
            if (!agentsAvailable) {
                console.warn('Agents API not available, skipping contract test');
                return;
            }

            const response = await fetch(`${AGENTS_API_URL}/openapi.json`);
            const schema = await response.json();

            expect(schema.openapi).toMatch(/^3\.\d+\.\d+$/);
        });
    });
});
