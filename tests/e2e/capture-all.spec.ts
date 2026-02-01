import { test } from '@playwright/test';

test('capture all demo screenshots', async ({ page }) => {
    test.setTimeout(120000);
    const baseUrl = 'http://localhost:3000';
    await page.setViewportSize({ width: 1280, height: 900 });

    const routes = [
        { url: '/demo-v2/learn', name: '01-learn-home' },
        { url: '/demo-v2/learn/section', name: '02-learn-section' },
        { url: '/demo-v2/learn/lesson-batch', name: '03-learn-batch-intro' },
        { url: '/demo-v2/learn/lesson-batch/next', name: '04-learn-quiz-radical' },
        { url: '/demo-v2/learn/lesson-batch/next/kanji-meaning', name: '05-learn-quiz-kanji-meaning' },
        { url: '/demo-v2/learn/lesson-batch/next/kanji', name: '06-learn-quiz-kanji-reading' },
        { url: '/demo-v2/learn/lesson-batch/next/vocab', name: '07-learn-quiz-vocab' },
        { url: '/demo-v2/learn/lesson-batch/complete', name: '08-learn-complete' },

        { url: '/demo-v2/review', name: '09-review-home' },
        { url: '/demo-v2/review/radical', name: '10-review-quiz-radical' },
        { url: '/demo-v2/review/kanji-meaning', name: '11-review-quiz-kanji-meaning' },
        { url: '/demo-v2/review/item', name: '12-review-quiz-kanji-reading' },
        { url: '/demo-v2/review/vocab', name: '13-review-quiz-vocab' },
        { url: '/demo-v2/review/cloze', name: '14-review-quiz-cloze' },
        { url: '/demo-v2/review/sentence', name: '15-review-quiz-sentence' },
        { url: '/demo-v2/review/complete', name: '16-review-complete' },
    ];

    for (const route of routes) {
        try {
            console.log(`[${route.name}] Navigating to ${route.url}...`);
            await page.goto(`${baseUrl}${route.url}`, { waitUntil: 'networkidle' });
            await page.waitForTimeout(1000);
            await page.screenshot({ path: `screenshots/all/${route.name}.png` });
        } catch (err) {
            console.error(`Failed to capture ${route.name}: ${err.message}`);
        }
    }

    // Interaction feedback states
    try {
        console.log('Capturing interactive states...');
        await page.goto(`${baseUrl}/demo-v2/review/item`, { waitUntil: 'networkidle' });
        await page.fill('input', 'umi');
        await page.keyboard.press('Enter');
        await page.waitForTimeout(1000);
        await page.screenshot({ path: `screenshots/all/state-correct-feedback.png` });

        await page.goto(`${baseUrl}/demo-v2/review/item`, { waitUntil: 'networkidle' });
        await page.fill('input', 'wrong');
        await page.keyboard.press('Enter');
        await page.waitForTimeout(1000);
        await page.screenshot({ path: `screenshots/all/state-incorrect-feedback.png` });
    } catch (err) {
        console.error(`Failed to capture interactive states: ${err.message}`);
    }
});
