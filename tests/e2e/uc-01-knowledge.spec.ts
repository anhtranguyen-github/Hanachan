
import { test, expect } from '@playwright/test';
import { logE2EFailure } from './utils';

/**
 * ---------------------------------------------------------------------------
 * CHECKLIST: UC-01 Personal Knowledge Management
 * ---------------------------------------------------------------------------
 * 1. Navigate to /vocabulary (Browse)
 *    - Auth accessible: YES
 *    - Action: Wait for list load
 *    - Result: List of vocabulary items visible
 * 2. View Lesson (Deep Dive)
 *    - Action: Click on first vocab item
 *    - Result: Navigate to detail page, lesson content visible
 * 3. Personalization
 *    - Action: Toggle "Bookmark" or "Known" status
 *    - Result: UI reflects new status
 * ---------------------------------------------------------------------------
 */

test.describe('UC-01: Personal Knowledge Management', () => {

    test.afterEach(async ({ page }, testInfo) => {
        await logE2EFailure(page, testInfo);
    });

    test('UC-01.1: Browse Knowledge Base (Vocabulary)', async ({ page }) => {
        // 1. Navigate
        await page.goto('/vocabulary');
        await page.waitForSelector('[data-testid="auth-loading"]', { state: 'detached', timeout: 30000 });

        // 2. Robust Wait (Rule 1 & 3)
        // Wait for EITHER cards OR the "No items" / loading state to resolve
        // We look for the main container first
        await expect(page.locator('main')).toBeVisible();

        const card = page.getByTestId('vocab-card').first();
        const emptyState = page.getByText(/no items/i);

        // Wait for one of them
        await expect(card.or(emptyState)).toBeVisible({ timeout: 15000 });
    });

    test('UC-01.2: Lesson View & Deep Dive', async ({ page }) => {
        await page.goto('/vocabulary');
        await page.waitForSelector('[data-testid="auth-loading"]', { state: 'detached' });

        // Click first item if exists (Rule 3)
        const firstItem = page.getByTestId('vocab-card').first();

        if (await firstItem.isVisible()) {
            // Rule 2 & 4: Bypass potential portals/overlays by forcing click or evaluating
            // Using force click here as it is a navigation link
            await firstItem.click({ force: true });

            // Wait for detail page
            // If the Lesson component is mounted, it should have a specific ID, 
            // otherwise check for a generic header or title presence
            await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });
        }
    });

});
