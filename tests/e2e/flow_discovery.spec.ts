
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

    test('Discovery: Fail triggers FSRS penalty and re-queue', async ({ page }) => {
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

            const masteredBtn = page.getByRole('button', { name: /Mastered|Quiz/ });
            await expect(masteredBtn).toBeVisible();

            // Wait for potential network updates before clicking
            await masteredBtn.click();

            // Wait for state transition (either next lesson or quiz)
            await page.waitForResponse(res => res.status() === 200, { timeout: 2000 }).catch(() => { });
        }

        // Should now be in quiz phase (Confirmed by loop exit)
        await expect(page.getByTestId('quiz-phase')).toBeVisible();

        const input = page.getByRole('textbox');
        const debug = page.getByTestId('debug-answer');

        await expect(debug).toBeAttached();
        const kuId = await debug.getAttribute('data-ku-id');

        // Fail the first item
        console.log(`[TEST] Failing item: ${kuId}`);
        await input.fill('wronganswer');
        await input.press('Enter');

        // Wait for result and click continue
        const continueBtn = page.getByRole('button', { name: /Got it, Continue/i });
        await expect(continueBtn).toBeVisible({ timeout: 10000 });

        // The FSRS update happens ON SUBMIT, so no need to wait for continue click to check DB
        const updateResponse = page.waitForResponse(res => res.url().includes('user_learning_states') && res.status() < 400);
        await continueBtn.click();
        await updateResponse.catch(() => { });

        // Verify state was created in DB
        await expect.poll(async () => {
            const { data: states } = await supabase.from('user_learning_states')
                .select('*').eq('user_id', testUserId).eq('ku_id', kuId);
            return states?.length || 0;
        }, { timeout: 10000 }).toBeGreaterThan(0);

        const { data: states } = await supabase.from('user_learning_states')
            .select('*').eq('user_id', testUserId).eq('ku_id', kuId);

        const state = states?.[0];
        console.log(`[TEST] State after fail:`, state);
        expect(state?.lapses).toBeGreaterThan(0);
    });
});
