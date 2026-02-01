import { test, expect } from '@playwright/test';

test.describe('Chatbot Advanced Features', () => {
    test.beforeEach(async ({ page }) => {
        // Login first
        await page.goto('/login');
        await page.fill('input[name="email"]', 'test_worker_1@hanachan.test');
        await page.fill('input[name="password"]', 'Password123!');
        await page.click('button[type="submit"]');
        await expect(page.getByTestId('dashboard-root')).toBeVisible({ timeout: 15000 });
    });

    test('should search for knowledge (SEARCH_KU intent)', async ({ page }) => {
        await page.goto('/immersion/chatbot');
        await page.waitForLoadState('networkidle');

        // Wait for welcome
        await expect(page.getByTestId('chat-message').first()).toBeVisible({ timeout: 10000 });

        const input = page.getByTestId('chat-input');
        await input.fill('Find the word for water');
        await page.getByTestId('chat-send-button').click();

        // Wait for AI response that mentions search results
        const lastMessage = page.getByTestId('chat-message').last();
        // Since we are using keywords, it should trigger search and the reply should mention results
        await expect(lastMessage).toContainText(/matches|I found|water/i, { timeout: 20000 });

        console.log('Chatbot successfully searched for knowledge');
    });

    test('should detect KUs and show CTA buttons', async ({ page }) => {
        await page.goto('/immersion/chatbot');
        await page.waitForLoadState('networkidle');

        const input = page.getByTestId('chat-input');
        // Ask about something likely to be in the database
        await input.fill('Tell me about water');
        await page.getByTestId('chat-send-button').click();

        // Check for CTA button
        const ctaButton = page.getByTestId('ku-cta-button').first();
        await expect(ctaButton).toBeVisible({ timeout: 30000 });

        const ctaText = await ctaButton.innerText();
        const character = ctaText.split('•')[0].trim();

        // Click CTA to open modal
        await ctaButton.click();

        // Verify QuickView Modal opens
        await expect(page.getByTestId('quick-view-modal')).toBeVisible();
        // CTA text is uppercase due to CSS, modal uses title case. Use regex for flexible match.
        const escapedChar = character.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        await expect(page.getByTestId('quick-view-character')).toHaveText(new RegExp(escapedChar, 'i'));

        console.log('Chatbot entity linking and CTA functional');
    });
});
