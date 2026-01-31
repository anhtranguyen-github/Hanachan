
import { test, expect } from '@playwright/test';

const TEST_EMAIL = 'test_worker_1@hanachan.test';
const TEST_PASS = 'Password123!';

test.describe('Chatbot Flow', () => {

    test.beforeEach(async ({ page }) => {
        page.on('console', msg => console.log(`BROWSER: ${msg.text()}`));
        await page.goto('/login');
        await page.fill('input[name="email"]', TEST_EMAIL);
        await page.fill('input[name="password"]', TEST_PASS);
        await page.click('button[type="submit"]');
        await expect(page.getByTestId('dashboard-root')).toBeVisible();
    });

    test('Sentence Analysis & Intent', async ({ page }) => {
        await page.goto('/immersion/chatbot');
        await page.waitForLoadState('networkidle');

        const input = page.getByTestId('chat-input');

        // Test intent: Study
        await input.fill('I want to study');
        await page.getByTestId('chat-send-button').click();
        await expect(page.getByTestId('chat-message').last()).toContainText(/Shall we|practice|learn|study/i, { timeout: 30000 });

        // Test Analysis + Detection
        // Using common characters
        await input.fill('analyze: 私は猫が好きです');
        await page.getByTestId('chat-send-button').click();

        await expect(page.getByTestId('chat-message').last()).toContainText(/Analysis/i, { timeout: 30000 });

        // Wait for potential CTA buttons (if any character was found in DB)
        const cta = page.getByTestId('ku-cta-button').or(page.getByTestId('analysis-cta-button'));
        await expect(cta.first()).toBeVisible({ timeout: 20000 });
        console.log('Chatbot detection verified');
    });
});
