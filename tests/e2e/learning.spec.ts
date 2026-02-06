import { test, expect } from '@playwright/test';

test.describe('Learning Flow', () => {
    test.beforeEach(async ({ page }) => {
        // Login first
        await page.goto('/login');
        await page.fill('input[name="email"]', 'test_worker_1@hanachan.test');
        await page.fill('input[name="password"]', 'Password123!');
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL(/.*dashboard/);
    });

    test('should navigate to learn page and see available batches', async ({ page }) => {
        // Navigate to Learn page
        await page.goto('/learn');
        await page.waitForLoadState('networkidle');

        // Wait for page to load - use testid
        await expect(page.getByTestId('learning-overview-root')).toBeVisible();

        // Check for batch link or all clear message
        const hasStartLink = await page.getByTestId('begin-session-link').isVisible();
        const hasClearMsg = await page.getByText(/completed all current items/i).isVisible();

        expect(hasStartLink || hasClearMsg).toBeTruthy();
        console.log(`Initial learning state confirmed. Start link: ${hasStartLink}, Clear: ${hasClearMsg}`);
    });

    test('should start a learning session if batch is available', async ({ page }) => {
        await page.goto('/learn');
        await page.waitForLoadState('networkidle');

        const startLink = page.getByTestId('begin-session-link');
        if (!(await startLink.isVisible())) {
            console.log('No active batch found in learning overview, skipping session initialization test');
            test.skip();
            return;
        }

        await startLink.click();

        // Assert on session root or phases
        await expect(page.getByTestId('learning-session-root').or(page.getByTestId('quiz-phase'))).toBeVisible();

        const isLessonPhase = await page.getByTestId('learning-session-root').isVisible();
        const isQuizPhase = await page.getByTestId('quiz-phase').isVisible();

        expect(isLessonPhase || isQuizPhase).toBeTruthy();
        console.log(`Session initialization verified: LessonPhase=${isLessonPhase}, QuizPhase=${isQuizPhase}`);
    });
});
