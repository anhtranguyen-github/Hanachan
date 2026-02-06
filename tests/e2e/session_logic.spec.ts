import { test, expect } from '@playwright/test';

test.describe('Comprehensive Session Logic', () => {
    test.beforeEach(async ({ page }) => {
        // Login first
        await page.goto('/login');
        await page.fill('input[name="email"]', 'test_worker_1@hanachan.test');
        await page.fill('input[name="password"]', 'Password123!');
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL(/.*dashboard/);
    });

    test('should progress through a learning session with sub-tasks', async ({ page }) => {
        const learnCard = page.getByTestId('learn-card');
        await learnCard.click();

        // Intermediate page
        const startLink = page.getByTestId('begin-session-link');
        if (!(await startLink.isVisible())) {
            console.log('No batch found, skipping');
            test.skip();
            return;
        }
        await startLink.click();

        // Phase 1: Lesson Slides
        await expect(page.getByTestId('learning-session-root')).toBeVisible();

        let isQuiz = false;
        let safety = 0;
        while (!isQuiz && safety < 10) {
            safety++;
            const nextBtn = page.getByRole('button', { name: /Mastered →|Mastery Quiz →/ });
            await expect(nextBtn).toBeVisible();

            const text = await nextBtn.innerText();
            if (text.includes('Quiz')) isQuiz = true;

            await nextBtn.click();
            // Wait for slide transition
            if (!isQuiz) {
                await expect(nextBtn).toBeVisible();
            }
        }

        // Phase 2: Quiz Logic (Using debug-answer contract)
        await expect(page.getByTestId('quiz-phase')).toBeVisible();

        let isComplete = false;
        safety = 0;

        while (!isComplete && safety < 50) {
            safety++;
            const debugEl = page.getByTestId('debug-answer');
            const completeHeader = page.getByTestId('review-complete-header');

            if (await debugEl.count() > 0) {
                const answer = await debugEl.getAttribute('data-answer');
                const input = page.getByRole('textbox');
                await input.fill(answer || 'test');
                await input.press('Enter');

                const continueBtn = page.getByRole('button', { name: /Next Item|Got it, Continue/ });
                await expect(continueBtn).toBeVisible();
                await continueBtn.click();
            } else if (await completeHeader.count() > 0) {
                isComplete = true;
            } else {
                // Wait for network/state
                await page.waitForResponse(r => r.status() === 200).catch(() => { });
                if (await completeHeader.count() > 0) isComplete = true;
            }
        }

        await expect(page.getByTestId('review-complete-header')).toBeVisible();
        await page.getByRole('button', { name: 'Back to Dashboard' }).click();
        await expect(page.getByTestId('dashboard-root')).toBeVisible();
    });
});
