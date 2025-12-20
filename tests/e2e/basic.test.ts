import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
    page.on('console', msg => {
        console.log(`BROWSER [${msg.type()}]: ${msg.text()}`);
    });
});

test.describe('Public Access Flows', () => {
    test('Landing page should load and display core brand elements', async ({ page }) => {
        await page.goto('/');

        // Wait for global loading overlay to disappear
        await expect(page.getByTestId('global-loading')).toBeHidden({ timeout: 15000 });

        // Verify Title and important SEO elements
        await expect(page).toHaveTitle(/hanachan/i);

        // Check for the "H" logo or brand name
        const brandName = page.getByText(/hanachan/i).first();
        await expect(brandName).toBeVisible();

        // Check for a CTA button (could be Begin Sync or Enter Matrix if already logged in)
        const ctaBtn = page.locator('a, button').filter({ hasText: /(Begin Sync|Enter Matrix|Matrix)/i }).first();
        await expect(ctaBtn).toBeVisible();
    });

    test('Should navigate to App/Auth pages from landing', async ({ page }) => {
        await page.goto('/');

        // Wait for global loading overlay to disappear
        await expect(page.getByTestId('global-loading')).toBeHidden({ timeout: 15000 });

        const ctaBtn = page.locator('a, button').filter({ hasText: /(Begin Sync|Enter Matrix|Matrix)/i }).first();
        await ctaBtn.click();

        // Should redirect to signin or dashboard/decks
        await expect(page).toHaveURL(/\/(auth\/signin|dashboard|decks)/);
    });
});

test.describe('Hana Component System Verification', () => {
    test('Verify theme switching in sidebar if present', async ({ page }) => {
        // We'll need to bypass auth or test a page where sidebar is visible
        // Landing page usually doesn't have the main sidebar
        // Let's check a public tool page if one exists
    });
});
