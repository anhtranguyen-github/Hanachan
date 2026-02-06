import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
    test('should redirect unauthenticated user to login', async ({ page }) => {
        await page.goto('/dashboard');
        await expect(page).toHaveURL(/.*login/);
    });

    test('should login successfully with valid credentials', async ({ page }) => {
        await page.goto('/login');

        await page.fill('input[name="email"]', 'test_worker_1@hanachan.test');
        await page.fill('input[name="password"]', 'Password123!');

        await page.click('button[type="submit"]');

        // Should redirect to dashboard
        await expect(page).toHaveURL(/.*dashboard/);

        // Should show welcome message
        await expect(page.locator('main')).toContainText('Suggested Actions');
    });

    test('should show error with invalid credentials', async ({ page }) => {
        await page.goto('/login');

        await page.fill('input[name="email"]', 'wrong@example.com');
        await page.fill('input[name="password"]', 'WrongPassword');

        await page.click('button[type="submit"]');

        // Should show error message
        await expect(page.locator('text=ERROR')).toBeVisible();
    });

    test('should logout successfully', async ({ page }) => {
        // Login first
        await page.goto('/login');
        await page.fill('input[name="email"]', 'test_worker_1@hanachan.test');
        await page.fill('input[name="password"]', 'Password123!');
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL(/.*dashboard/);

        // Find and click Sign Out button in Sidebar
        await page.click('button:has-text("Sign Out")');

        // Should redirect to login
        await expect(page).toHaveURL(/.*login/);
    });
});
