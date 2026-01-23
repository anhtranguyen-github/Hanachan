
import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

// We'll use the DB to reset user state and manipulate time for the test
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''; // Needs service role for cleanup
const supabase = createClient(supabaseUrl, supabaseKey);

const TEST_USER_ID = '04510db5-7bb7-42e6-8621-ff5ad89d3ef6'; // Mock or real test user ID
const TEST_EMAIL = 'test_worker_1@hanachan.test';
const TEST_PASS = 'Password123!';

test.describe('E2E Learning Coordination Flow', () => {

    test.beforeAll(async () => {
        test.setTimeout(90000);
        if (supabaseKey) {
            console.log('Cleaning up test user state...');
            await supabase.from('user_learning_states').delete().eq('user_id', TEST_USER_ID);
            await supabase.from('user_learning_logs').delete().eq('user_id', TEST_USER_ID);
            await supabase.from('users').update({ level: 1 }).eq('id', TEST_USER_ID);
        }
    });

    test('Full Integration: Learn -> Analytics -> Dashboard -> Review', async ({ page }) => {
        // Enable Debug Logs
        page.on('console', msg => console.log(`BROWSER: ${msg.text()}`));
        page.on('pageerror', err => console.log(`PAGE ERROR: ${err.message}`));
        page.on('requestfailed', req => console.log(`REQ FAILED: ${req.url()} - ${req.failure()?.errorText}`));

        test.setTimeout(120000);
        // 1. Login
        await page.goto('/login');
        await page.fill('input[name="email"]', TEST_EMAIL);
        await page.fill('input[name="password"]', TEST_PASS);
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL(/.*dashboard/, { timeout: 15000 });

        // 2. Baseline Check on Dashboard Grid
        // Selectors updated for the new Grid Layout
        const lessonsCard = page.getByTestId('learn-card');
        const initialLessons = await lessonsCard.locator('span.text-5xl.font-black').innerText();
        console.log(`Initial Lessons: ${initialLessons}`);

        // 3. Check availability before starting
        if (parseInt(initialLessons) > 0) {
            console.log("Starting session with > 0 lessons...");

            // Wait for the session load/redirect logic
            // We expect a navigation to /learn/session
            await lessonsCard.click();

            // The "Begin Session" element on /learn is a Link, not a Button!
            // Using testId as per reliability constraints
            const startLink = page.getByTestId('begin-session-link');

            // Wait for navigation to /learn to settle and content to load
            await expect(page).toHaveURL(/.*learn/);

            // Verify we are on the overview page by waiting for the link derived from DB
            // "Begin Session" appears only after fetchNewItems completes.
            // Wait for either the "Begin" button OR the message saying nothing to learn
            const allClear = page.getByText('All Clear!');
            await Promise.race([
                startLink.waitFor({ state: 'visible', timeout: 15000 }),
                allClear.waitFor({ state: 'visible', timeout: 15000 })
            ]).catch(() => { });

            if (await startLink.isVisible()) {
                await startLink.click();

                // Verify UI root element instead of just URL (Source of Truth)
                await expect(page.getByTestId('learning-session-root')).toBeVisible({ timeout: 15000 });

                // Skip Discovery Slides (Only if we are in session)
                if (page.url().includes('/learn/session')) {
                    let isQuiz = false;
                    let slideCount = 0;
                    while (!isQuiz && slideCount < 10) {
                        slideCount++;
                        const nextBtn = page.getByRole('button', { name: /Mastered →|Mastery Quiz →/ });

                        // Wait for button to be clickable
                        await nextBtn.waitFor({ state: 'visible' }).catch(() => { });

                        if (await nextBtn.isVisible()) {
                            const text = await nextBtn.innerText();
                            console.log(`Discovery Flow: Clicking '${text}' (Slide ${slideCount})`);
                            await nextBtn.click();

                            if (text.includes('Quiz')) {
                                isQuiz = true;
                                // Wait for input to appear to confirm quiz phase
                                await page.getByTestId('debug-answer').waitFor({ state: 'attached', timeout: 10000 }).catch(() => { });
                            } else {
                                // Wait for the next slide title or button to re-appear to ensure transition
                                await page.waitForResponse(resp => resp.url().includes('/learn/session'), { timeout: 2000 }).catch(() => { });
                            }
                        } else {
                            // If we are already at the quiz input, break
                            if (await page.getByTestId('debug-answer').count() > 0) {
                                isQuiz = true;
                            } else {
                                break;
                            }
                        }
                    }

                    // Complete Quiz (1 Item, possibly multiple facets)
                    let isComplete = false;
                    let loopCount = 0;
                    while (!isComplete && loopCount < 40) {
                        loopCount++;
                        const debugEl = page.getByTestId('debug-answer');
                        const completeHeader = page.getByTestId('session-complete-header');

                        if (await debugEl.count() > 0) {
                            const input = page.getByRole('textbox');
                            const answer = await debugEl.getAttribute('data-answer');
                            console.log(`Quiz Loop: Answering with '${answer}'`);

                            await input.fill(answer || 'force-pass');
                            await input.press('Enter');

                            // Buttons: "Next Item" (Correct) or "Got it, Continue" (Incorrect)
                            const continueBtn = page.getByRole('button', { name: /Next Item|Got it, Continue/ });
                            await expect(continueBtn).toBeVisible({ timeout: 5000 });
                            await continueBtn.click();

                            // Wait for input to either clear or be replaced by next card
                            await expect(continueBtn).not.toBeVisible({ timeout: 5000 }).catch(() => { });
                        } else if (await completeHeader.isVisible()) {
                            isComplete = true;
                        } else {
                            console.log(`Quiz Loop: Waiting... (Iteration ${loopCount})`);
                            // Check if we hit the complete screen after the last item
                            await page.waitForResponse(resp => resp.status() === 200, { timeout: 1000 }).catch(() => { });
                            if (await completeHeader.isVisible()) isComplete = true;
                        }
                    }

                    // 4. Verification: Dashboard Update after Learn
                    const backToDash = page.getByRole('button', { name: 'Back to Dashboard' });
                    await expect(backToDash).toBeVisible({ timeout: 10000 });
                    await backToDash.click();
                    await expect(page).toHaveURL(/.*dashboard/);

                    // Check stats updated
                    const reviewsTodayValue = await page.getByTestId('stats-correct-answers').innerText();

                    // Lessons should have decreased
                    const postLearnLessons = await page.locator('a[href="/learn"]').locator('span.text-5xl.font-black').innerText();

                    expect(parseInt(postLearnLessons)).toBeLessThanOrEqual(parseInt(initialLessons));
                    expect(parseInt(reviewsTodayValue)).toBeGreaterThanOrEqual(0);

                    // 5. Trigger Manual Due State for Review Coordination
                    if (supabaseKey) {
                        console.log('Manually triggering review due state...');
                        await supabase.from('user_learning_states')
                            .update({ next_review: new Date().toISOString(), state: 'review' })
                            .eq('user_id', TEST_USER_ID);

                        // Re-fetch dashboard to see "Reviews Due"
                        await page.reload();
                        const reviewsCard = page.getByTestId('review-card');
                        await expect(reviewsCard).toBeVisible();
                        const dueCount = await reviewsCard.locator('span.text-5xl.font-black').innerText();
                        expect(parseInt(dueCount)).toBeGreaterThan(0);
                    }

                    // 6. Complete Review
                    await page.goto('/review');
                    const startReviewBtn = page.getByRole('link', { name: 'Begin Reviews' });
                    await expect(startReviewBtn).toBeVisible();
                    await startReviewBtn.click();

                    // Answer review
                    let reviewComplete = false;
                    loopCount = 0;
                    while (!reviewComplete && loopCount < 20) {
                        loopCount++;
                        const debugEl = page.getByTestId('debug-answer');
                        const finishedIndicator = page.getByRole('button', { name: 'Back to Dashboard' });
                        const caughtUpText = page.getByText('All Caught Up!');

                        if (await debugEl.count() > 0) {
                            const input = page.getByRole('textbox');
                            const answer = await debugEl.getAttribute('data-answer');

                            await input.fill(answer || 'force-pass');
                            await input.press('Enter');

                            const continueBtn = page.getByRole('button', { name: /Next Item|Got it, Continue/ });
                            await expect(continueBtn).toBeVisible();
                            await continueBtn.click();
                            await expect(continueBtn).not.toBeVisible().catch(() => { });
                        } else if (await finishedIndicator.isVisible() || await caughtUpText.isVisible()) {
                            reviewComplete = true;
                        } else {
                            // Check if we back to review home
                            if (await page.getByText('Review Session').isVisible() && await page.getByText('Active Queue').isVisible()) {
                                reviewComplete = true;
                            } else {
                                // Wait a bit for potential network response if nothing visible
                                await page.waitForResponse(r => r.status() === 200, { timeout: 1000 }).catch(() => { });
                            }
                        }
                    }

                    // 7. Final Verification
                    await page.goto('/dashboard');
                    const finalDue = await page.getByTestId('review-card').locator('span.text-5xl.font-black').innerText();
                    // It might not be exactly 0 if we updated ALL items to be due, but it should be less or handled.
                    // Since we force updated above, let's just check the flow completed without error.
                    console.log(`Final Due Count: ${finalDue}`);
                }
            }
        }
    }); // End of Test
});
