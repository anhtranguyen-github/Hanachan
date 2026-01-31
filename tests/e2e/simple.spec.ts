import { test, expect } from '@playwright/test';

test('simple login page load', async ({ page }) => {
    console.log('Navigating to login...');
    await page.goto('/login');
    console.log('Current URL:', page.url());
    await expect(page.getByRole('button', { name: /Login/i })).toBeVisible({ timeout: 10000 });
});
