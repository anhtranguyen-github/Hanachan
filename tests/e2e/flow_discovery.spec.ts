
import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const TEST_EMAIL = `e2e_discovery_${Date.now()}@hanachan.test`;
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

test.describe('Discovery Flow', () => {

    test.beforeEach(async ({ page }) => {
        page.on('console', msg => {
            if (msg.text().includes('[FSRS]') || msg.text().includes('[ReviewSessionController]') || msg.text().includes('[DB]')) {
                console.log(`BROWSER LOG: ${msg.text()}`);
            }
        });

        await cleanupUser(TEST_EMAIL);
        const { data, error } = await supabase.auth.admin.createUser({
            email: TEST_EMAIL,
            password: TEST_PASS,
            email_confirm: true
        });
        if (error) throw error;
        testUserId = data.user.id;
        await supabase.from('users').update({ level: 1 }).eq('id', testUserId);

        await page.goto('/login');
        await page.fill('input[name="email"]', TEST_EMAIL);
        await page.fill('input[name="password"]', TEST_PASS);
        await page.click('button[type="submit"]');
        await expect(page.getByTestId('dashboard-root')).toBeVisible();
    });

    test.afterEach(async () => {
        await cleanupUser(TEST_EMAIL);
    });

    test('Discovery: Fail does not trigger SRS until KU passed', async ({ page }) => {
        await page.goto('/learn');

        // Wait for stats to load
        await expect(page.getByTestId('begin-session-link')).toBeVisible({ timeout: 15000 });
        await page.getByTestId('begin-session-link').click();

        // Wait for lesson phase 
        await expect(page.getByTestId('lesson-view-phase')).toBeVisible({ timeout: 15000 });

        // Skip through lessons 
        let isQuizPhase = false;
        while (!isQuizPhase) {
            const quizPhase = page.getByTestId('quiz-phase');
            if (await quizPhase.count() > 0) {
                isQuizPhase = true;
                break;
            }

            const masteredBtn = page.getByTestId('lesson-next-button');
            await expect(masteredBtn).toBeVisible();
            await masteredBtn.click();
            await page.waitForResponse(res => res.status() === 200, { timeout: 2000 }).catch(() => { });
        }

        // Should now be in quiz phase
        await expect(page.getByTestId('quiz-phase')).toBeVisible();

        const input = page.getByRole('textbox');
        const debug = page.getByTestId('debug-answer');

        await expect(debug).toBeAttached();
        const kuId = await debug.getAttribute('data-ku-id');
        const facet = await debug.getAttribute('data-facet');

        // 1. Fail the first item - Should NOT create DB record
        console.log(`[TEST] Failing item in Discovery: ${kuId}-${facet}`);
        await input.fill('wronganswer');
        await input.press('Enter');

        const continueBtn = page.getByRole('button', { name: /Got it, Continue/i });
        await expect(continueBtn).toBeVisible({ timeout: 10000 });
        await continueBtn.click();

        // Verify NO state was created in DB after fail
        const { data: earlyStates } = await supabase.from('user_learning_states')
            .select('*').eq('user_id', testUserId).eq('ku_id', kuId);
        expect(earlyStates?.length || 0).toBe(0);

        // 2. Now answer correctly until passed
        console.log(`[TEST] Answering correctly to pass KU: ${kuId}`);
        let attempts = 0;
        while (attempts < 5) { // Safe limit
            const currentDebug = page.getByTestId('debug-answer');
            if (await currentDebug.count() === 0) break; // Phase changed

            const currentKuId = await currentDebug.getAttribute('data-ku-id');
            const currentFacet = await currentDebug.getAttribute('data-facet');
            const answer = await currentDebug.getAttribute('data-answer');

            if (currentKuId === kuId) {
                await input.fill(answer || '');
                await input.press('Enter');
                attempts++;
            } else {
                // Different KU, maybe this one is already passed
                break;
            }
        }

        // Verify state WAS created in DB after success
        await expect.poll(async () => {
            const { data: states } = await supabase.from('user_learning_states')
                .select('*').eq('user_id', testUserId).eq('ku_id', kuId);
            return states?.length || 0;
        }, { timeout: 10000 }).toBeGreaterThan(0);
    });
});
