/**
 * API Integration Test Setup
 *
 * This file provides common utilities and configuration for API integration tests.
 */

import { beforeAll, afterAll } from 'vitest';

// API Base URLs - can be overridden via environment variables
export const BACKEND_API_URL = process.env.BACKEND_API_URL || process.env.FASTAPI_CORE_URL || 'http://localhost:6100/api/v1';
export const AGENTS_API_URL = process.env.AGENTS_API_URL || 'http://localhost:6100';

/**
 * Wait for a service to be available
 */
export async function waitForService(url: string, maxRetries = 30, delay = 1000): Promise<boolean> {
    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await fetch(`${url}/health`, { method: 'GET' });
            if (response.ok) {
                return true;
            }
        } catch {
            // Service not available yet
        }
        await new Promise(resolve => setTimeout(resolve, delay));
    }
    return false;
}

/**
 * Check if services are running before tests
 */
beforeAll(async () => {
    // Check Core API
    const coreHealthy = await waitForService(BACKEND_API_URL, 5, 500);
    if (!coreHealthy) {
        console.warn(`Warning: Backend API at ${BACKEND_API_URL} is not available`);
    }

    // Check Agents API
    const agentsHealthy = await waitForService(AGENTS_API_URL, 5, 500);
    if (!agentsHealthy) {
        console.warn(`Warning: Agents API at ${AGENTS_API_URL} is not available`);
    }
}, 10000);

afterAll(async () => {
    // Cleanup if needed
});
