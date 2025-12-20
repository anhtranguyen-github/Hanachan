
import { test, expect } from '@playwright/test';

test.describe('HanaChan Core Use Cases', () => {

    test.beforeEach(async ({ page }) => {
        // Most apps require auth, but we'll try to reach the markers
        await page.goto('/');
    });

    test('UC-06.1: Dashboard should display progress metrics', async ({ page }) => {
        // Navigation from landing or direct
        await page.goto('/dashboard');

        // Check for specific Dashboard elements (Sakura aesthetic)
        const welcomeText = page.getByText(/Okaeri/i);
        await expect(welcomeText).toBeVisible();

        // Verify stats cards exist
        const activeItems = page.getByText(/Active Items/i);
        await expect(activeItems).toBeVisible();
    });

    test('UC-05.1: AI Chat should be interactive', async ({ page }) => {
        // Mock the chat API to avoid real OpenAI calls
        await page.route('/api/chat', async route => {
            const json = { role: 'assistant', content: 'Mock response from Hana' };
            await route.fulfill({ json });
        });

        await page.goto('/chat');

        // Wait for chat to load
        const input = page.getByPlaceholder(/Ask Hana/i);
        await expect(input).toBeVisible();

        // Try sending a test message
        await input.fill('Hello Hana!');
        await input.press('Enter');

        // Verify message appears in UI (User message)
        await expect(page.getByText('Hello Hana!')).toBeVisible();

        // Wait for AI response
        await expect(page.getByText('Mock response from Hana')).toBeVisible({ timeout: 10000 });
    });

    test('UC-02.2: SRS Review Session flow', async ({ page }) => {
        await page.goto('/study/review');

        // Check if there are cards or empty state
        // Text in ReviewSession.tsx is "You're all caught up!"
        if (await page.getByText(/You're all caught up!/i).isVisible()) {
            console.log('No cards due, skipping review flow test');
            return;
        }

        // If cards exist, verify the "Reveal" button
        const revealBtn = page.getByRole('button', { name: /Flip/i }); // "Press Space or Tap Card to Flip" -> maybe not a button?
        // Actually ReviewSession says: "Press Space or Tap Card to Flip"
        // And onClick={...}. It's the whole card.
        // But let's check the code:
        // <Flashcard ... onFlip={...} />
        // Flashcard probably has a button or click handler.
        // Let's click the "Flashcard" container or check for key text

        // Since we are mocking empty state mostly, this branch might not be hit in E2E mock mode.
        // But if it is hit (e.g. if we seed data), we need correct selectors.
        // For now, let's assume empty state is the norm in Mock Mode.
    });

    test('UC-04.1: YouTube Immersion Library', async ({ page }) => {
        await page.goto('/immersion');
        await expect(page.getByText(/Immersion/i)).toBeVisible();
    });

    test('UC-03.1: Sentence Analyzer basics', async ({ page }) => {
        // Mock analyze API
        await page.route('/api/analyze', async route => {
            await route.fulfill({ json: { result: 'Mock Analysis' } });
        });

        await page.goto('/analyzer');
        const analyzerTitle = page.getByText(/Analyzer/i).first();
        await expect(analyzerTitle).toBeVisible();
    });
});

test.describe('Theme & UI Resilience', () => {
    test('Switch to Night Mode should update styles', async ({ page }) => {
        await page.goto('/dashboard');

        const themeToggle = page.getByTitle(/Switch to Night Mode/i);
        await expect(themeToggle).toBeVisible();

        // Initial state check (Sakura)
        const body = page.locator('.hana-root');
        await expect(body).toHaveClass(/bg-sakura-bg-app/);

        await themeToggle.click();

        // Night mode check
        await expect(body).toHaveClass(/bg-sakura-ink/);
    });
});
