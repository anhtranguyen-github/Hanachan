
import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const TEST_EMAIL = `e2e_coord_${Date.now()}@hanachan.test`;
const TEST_PASS = 'Password123!';
let testUserId: string;

async function cleanupUser(email: string) {
    const { data: userData } = await supabase.auth.admin.listUsers();
    const user = userData.users.find(u => u.email === email);
    if (user) {
        await supabase.from('user_learning_states').delete().eq('user_id', user.id);
        await supabase.from('user_learning_logs').delete().eq('user_id', user.id);
        await supabase.auth.admin.deleteUser(user.id);
        console.log(`[E2E Cleanup] Deleted user: ${email}`);
    }
}

test.describe('E2E Learning Coordination Flow', () => {

    test.beforeAll(async () => {
        test.setTimeout(150000);
        await cleanupUser(TEST_EMAIL);
        const { data, error } = await supabase.auth.admin.createUser({
            email: TEST_EMAIL, password: TEST_PASS, email_confirm: true
        });
        if (error) throw error;
        testUserId = data.user.id;
        await supabase.from('users').upsert({ id: testUserId, level: 1 });
        await new Promise(r => setTimeout(r, 2000));
    });

    test.afterAll(async () => {
        await cleanupUser(TEST_EMAIL);
    });

    test('Full Integration: Learn -> Analytics -> Dashboard -> Review', async ({ page }) => {
        test.setTimeout(240000);

        await page.goto('/login');
        await page.fill('input[name="email"]', TEST_EMAIL);
        await page.fill('input[name="password"]', TEST_PASS);
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL(/.*dashboard/, { timeout: 35000 });
        await expect(page.getByTestId('dashboard-root')).toBeVisible({ timeout: 15000 });

        const lessonsCard = page.getByTestId('learn-card');
        await expect(lessonsCard).toBeVisible({ timeout: 20000 });
        await lessonsCard.click();

        const startLink = page.getByTestId('begin-session-link');
        await expect(startLink).toBeVisible({ timeout: 25000 });
        await startLink.click();

        await expect(page.getByTestId('lesson-view-phase').or(page.getByTestId('quiz-phase'))).toBeVisible({ timeout: 25000 });

        // Discovery Phase
        for (let i = 0; i < 15; i++) {
            if (await page.getByTestId('quiz-phase').isVisible()) break;
            const nextBtn = page.getByRole('button', { name: /Mastered|Mastery Quiz/ });
            if (await nextBtn.isVisible()) {
                await nextBtn.click({ force: true });
                await page.waitForTimeout(1000);
            } else {
                await page.waitForTimeout(1000);
            }
        }

        // Quiz Phase
        for (let i = 0; i < 30; i++) {
            if (await page.getByTestId('review-complete-header').isVisible()) break;
            const debugEl = page.getByTestId('debug-answer');
            if (await debugEl.count() > 0) {
                const answer = await debugEl.getAttribute('data-answer');
                const revealBtn = page.getByRole('button', { name: "Verify Answer" });

                await page.fill('input[type="text"]', answer || "force-pass");
                if (await revealBtn.isVisible()) {
                    await revealBtn.click({ force: true });
                } else {
                    await page.keyboard.press('Enter');
                }

                const continueBtn = page.getByRole('button', { name: /Next Item|Got it, Continue/ });
                await expect(continueBtn).toBeVisible({ timeout: 20000 });
                await continueBtn.click({ force: true });
                await page.waitForTimeout(1200);
            } else {
                await page.waitForTimeout(1000);
            }
        }
        await expect(page.getByTestId('review-complete-header')).toBeVisible({ timeout: 35000 });

        await page.getByRole('button', { name: 'Back to Dashboard' }).click();
        await expect(page).toHaveURL(/.*dashboard/, { timeout: 15000 });

        // Reviews
        console.log('Manually triggering reviews (48h ago)...');
        await supabase.from('user_learning_states')
            .update({ next_review: new Date(Date.now() - 172800000).toISOString(), state: 'review' })
            .eq('user_id', testUserId);

        await expect(async () => {
            await page.reload();
            const dueCount = await page.getByTestId('review-card').locator('span.text-5xl.font-black').innerText();
            expect(parseInt(dueCount)).toBeGreaterThan(0);
        }).toPass({ timeout: 35000 });

        await page.goto('/review');
        await page.getByRole('link', { name: /Begin Reviews/i }).click();

        for (let i = 0; i < 15; i++) {
            if (await page.getByTestId('review-complete-header').isVisible()) break;
            const debugEl = page.getByTestId('debug-answer');
            if (await debugEl.count() > 0) {
                const answer = await debugEl.getAttribute('data-answer');
                const revealBtn = page.getByRole('button', { name: "Verify Answer" });

                await page.fill('input[type="text"]', answer || "force-pass");
                if (await revealBtn.isVisible()) {
                    await revealBtn.click({ force: true });
                } else {
                    await page.keyboard.press('Enter');
                }

                const continueBtn = page.getByRole('button', { name: /Next Item|Got it, Continue/ });
                await expect(continueBtn).toBeVisible({ timeout: 20000 });
                await continueBtn.click({ force: true });
                await page.waitForTimeout(1200);
            } else {
                await page.waitForTimeout(1000);
            }
        }
        await expect(page.getByTestId('review-complete-header')).toBeVisible({ timeout: 35000 });
    });
});
