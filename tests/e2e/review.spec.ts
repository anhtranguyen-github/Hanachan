import { test, expect } from '@playwright/test';

test.describe('Review Flow', () => {
    test.beforeEach(async ({ page }) => {
        // Login first
        await page.goto('/login');
        await page.fill('input[name="email"]', 'test_worker_1@hanachan.test');
        await page.fill('input[name="password"]', 'Password123!');
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL(/.*dashboard/);
    });

    test('should complete a review session', async ({ page }) => {
        // Find "Reviews Due" card on dashboard
        const reviewLink = page.getByTestId('review-card');

        if (await reviewLink.isVisible()) {
            await reviewLink.click();

            // Should be on Review Overview page - verify UI not just URL
            await expect(page.getByText('Review Session')).toBeVisible();

            const beginBtn = page.getByRole('link', { name: 'Begin Reviews' });
            const caughtUp = page.getByText('All Caught Up!');
            await Promise.race([
                beginBtn.waitFor({ state: 'visible', timeout: 15000 }),
                caughtUp.waitFor({ state: 'visible', timeout: 15000 })
            ]).catch(() => { });

            if (await beginBtn.isVisible()) {
                await beginBtn.click();

                // Should be in session - verify UI
                // Should be in session - wait for debug element which is a reliable signal
                await expect(page.getByTestId('debug-answer').or(page.getByTestId('review-complete-header'))).toBeAttached({ timeout: 15000 });

                // Loop through review items until complete
                let isComplete = false;
                let iterations = 0;
                while (!isComplete && iterations < 50) {
                    iterations++;
                    const debugEl = page.getByTestId('debug-answer');
                    const completeHeader = page.getByTestId('review-complete-header');

                    if (await debugEl.count() > 0) {
                        const input = page.getByRole('textbox');
                        const answer = await debugEl.getAttribute('data-answer');

                        await input.fill(answer || 'force-pass');
                        await input.press('Enter');

                        const nextBtn = page.getByRole('button', { name: /Next Item|Got it, Continue/ });
                        await expect(nextBtn).toBeVisible({ timeout: 5000 });
                        await nextBtn.click();

                        // Wait for transition
                        await expect(nextBtn).not.toBeVisible({ timeout: 5000 }).catch(() => { });
                    } else if (await completeHeader.isVisible()) {
                        isComplete = true;
                    } else {
                        console.log(`Review Loop: Waiting... (Iteration ${iterations})`);
                        // Wait for potential network or state change
                        await page.waitForResponse(r => r.status() === 200, { timeout: 1000 }).catch(() => { });
                        if (await completeHeader.isVisible()) isComplete = true;
                    }
                }

                await expect(page.getByTestId('review-complete-header')).toBeVisible();
                const backBtn = page.getByRole('button', { name: 'Back to Dashboard' });
                await expect(backBtn).toBeVisible();
                await backBtn.click();
                await expect(page.getByTestId('review-card')).toBeVisible();
            } else {
                console.log("Begin Reviews button not visible (likely 0 reviews), checking for 'All Caught Up'");
                await expect(page.getByText('All Caught Up!')).toBeVisible();
            }
        }
    });

    test('should handle empty review session gracefully', async ({ page }) => {
        // Force navigate to review session even if stats say 0
        await page.goto('/review/session');

        // Should show 'Review Complete'
        await expect(page.getByTestId('review-complete-header')).toBeVisible({ timeout: 15000 });
    });
});
