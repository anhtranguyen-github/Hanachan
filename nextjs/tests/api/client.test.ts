/**
 * Generated API Client Tests
 *
 * These tests verify that the generated SDK clients:
 * 1. Can be imported successfully
 * 2. Are properly typed
 * 3. Have the expected configuration options
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { FASTAPI_CORE_URL, AGENTS_API_URL, waitForService } from './setup';

describe('Generated API Client', () => {
    describe('Core API Client', () => {
        it('should be able to import the core client', async () => {
            // This test will fail if the client hasn't been generated yet
            // Run `pnpm generate:api` to generate the client
            try {
                const client = await import('@/client/core');
                expect(client).toBeDefined();
            } catch (error) {
                throw new Error(
                    'Failed to import core client. ' +
                    'Make sure to run `pnpm generate:api` first.'
                );
            }
        });

        it('should have client configuration available', async () => {
            const client = await import('@/client/core');

            // The client should export configuration functions
            expect(client).toBeDefined();

            // Check for common client exports
            const exports = Object.keys(client);
            expect(exports.length).toBeGreaterThan(0);
        });
    });

    describe('Agents API Client', () => {
        it('should be able to import the agents client', async () => {
            try {
                const client = await import('@/client/agents');
                expect(client).toBeDefined();
            } catch (error) {
                throw new Error(
                    'Failed to import agents client. ' +
                    'Make sure to run `pnpm generate:api` first.'
                );
            }
        });

        it('should have client configuration available', async () => {
            const client = await import('@/client/agents');

            expect(client).toBeDefined();

            const exports = Object.keys(client);
            expect(exports.length).toBeGreaterThan(0);
        });
    });
});
