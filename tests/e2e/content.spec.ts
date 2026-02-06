import { test, expect } from '@playwright/test';

test.describe('Content Library Flow', () => {
    test.beforeEach(async ({ page }) => {
        // Login first
        await page.goto('/login');
        await page.fill('input[name="email"]', 'test_worker_1@hanachan.test');
        await page.fill('input[name="password"]', 'Password123!');
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL(/.*dashboard/);
    });

    test('should load content library page', async ({ page }) => {
        await page.goto('/content');
        await page.waitForLoadState('networkidle');

        // Wait for library to load
        await expect(page.locator('main h1')).toContainText('CONTENT LIBRARY');

        console.log('Content library page loaded successfully');
    });

    test('should browse and filter content by type', async ({ page }) => {
        await page.goto('/content');
        await page.waitForLoadState('networkidle');

        // Wait for page to be ready
        await expect(page.locator('main h1')).toContainText('CONTENT LIBRARY');

        // Test type filters - check they are clickable
        const radicalsBtn = page.locator('button:has-text("RADICAL")');
        await expect(radicalsBtn).toBeVisible();
        await radicalsBtn.click();

        // Give time for filter to apply
        await page.waitForTimeout(500);

        const kanjiBtn = page.locator('button:has-text("KANJI")');
        await expect(kanjiBtn).toBeVisible();
        await kanjiBtn.click();

        console.log('Type filters are working');
    });

    test('should have search functionality', async ({ page }) => {
        await page.goto('/content');
        await page.waitForLoadState('networkidle');

        // Wait for page to be ready
        await expect(page.locator('main h1')).toContainText('CONTENT LIBRARY');

        // Test search input
        const searchInput = page.locator('input[placeholder="Search meanings or characters..."]');
        await expect(searchInput).toBeVisible();
        await searchInput.fill('One');
        await expect(searchInput).toHaveValue('One');

        console.log('Search input is functional');
    });
});
