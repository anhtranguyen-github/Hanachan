
import { test, expect } from '@playwright/test';
import { logE2EFailure } from './utils';

/**
 * ---------------------------------------------------------------------------
 * CHECKLIST: UC-06 Analytics & Tracking
 * ---------------------------------------------------------------------------
 * 1. Progress Dashboard
 *    - Navigate to /dashboard
 *    - Result: Dashboard visible
 * 2. Charts
 *    - Action: Verify presence of charts
 *    - Result: Heatmap or Progress chart visible
 * ---------------------------------------------------------------------------
 */

test.describe('UC-06: Analytics', () => {

    test.afterEach(async ({ page }, testInfo) => {
        await logE2EFailure(page, testInfo);
    });

    test('UC-06.1: Dashboard Loading', async ({ page }) => {
        await page.goto('/dashboard');
        await page.waitForSelector('[data-testid="auth-loading"]', { state: 'detached' });

        await page.waitForSelector('[data-testid="dashboard-ready"]', { timeout: 30000 });

        await expect(page.getByTestId('progress-summary')).toBeVisible();
        await expect(page.getByTestId('stats-chart')).toBeVisible();
    });

});
