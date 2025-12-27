import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * Playwright Config for Hana-chan E2E
 * Supports:
 * - High timeout for AI responses (OpenAI/LangChain)
 * - Flexible Snapshot Testing (5% threshold for fonts/anti-aliasing)
 * - Worker-level authentication state
 */
export default defineConfig({
    testDir: './tests/e2e',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 1,
    workers: process.env.CI ? 2 : 4,
    reporter: [
        ['html'],
        ['list'],
        ['json', { outputFile: 'tests/e2e-report.json' }]
    ],
    timeout: 60 * 1000, // 60s global timeout
    expect: {
        timeout: 10000,
        toHaveScreenshot: {
            maxDiffPixelRatio: 0.05, // 5% flexible threshold
            animations: 'disabled',
        },
    },
    use: {
        baseURL: 'http://localhost:3000',
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
        video: 'on-first-retry',
        actionTimeout: 30000, // 30s for AI/DB actions
    },
    projects: [
        {
            name: 'setup',
            testMatch: /auth\.setup\.ts/,
            testDir: './tests',
        },
        {
            name: 'chromium',
            use: {
                ...devices['Desktop Chrome'],
                storageState: path.join(__dirname, 'playwright/.auth/user.json'),
            },
            dependencies: ['setup'],
        },
    ],
    webServer: {
        command: 'pnpm run dev',
        url: 'http://localhost:3000',
        reuseExistingServer: true,
        timeout: 120 * 1000,
    },
});
