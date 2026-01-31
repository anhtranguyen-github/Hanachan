
import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const TEST_EMAIL = `e2e_review_${Date.now()}@hanachan.test`;
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

test.describe('Review Flow', () => {

    test.beforeEach(async ({ page }) => {
        // Collect ALL console logs for debugging
        page.on('console', msg => console.log(`BROWSER: ${msg.type()}: ${msg.text()}`));
        page.on('pageerror', err => console.log(`PAGE ERROR: ${err.message}`));

        await cleanupUser(TEST_EMAIL);
        const { data, error } = await supabase.auth.admin.createUser({
            email: TEST_EMAIL,
            password: TEST_PASS,
            email_confirm: true
        });
        if (error) throw error;
        testUserId = data.user.id;
        // Seed user profile
        await supabase.from('users').upsert({ id: testUserId, level: 1 });

        await page.goto('/login');
        await page.fill('input[name="email"]', TEST_EMAIL);
        await page.fill('input[name="password"]', TEST_PASS);
        await page.click('button[type="submit"]');
        await expect(page.getByTestId('dashboard-root')).toBeVisible();
    });

    test.afterEach(async () => {
        await cleanupUser(TEST_EMAIL);
    });

    test('Vocab Fail and FSRS Update', async ({ page }) => {
        if (!supabaseKey) test.skip();

        // Seed vocabulary item with meaning facet
        const { data: v } = await supabase.from('knowledge_units').select('id').eq('type', 'vocabulary').limit(1).single();
        if (!v) { test.skip(); return; }

        const S = 10;
        const pastDate = new Date(Date.now() - 3600000).toISOString(); // 1h ago
        await supabase.from('user_learning_states').insert({
            user_id: testUserId, ku_id: v.id, facet: 'meaning',
            state: 'review', stability: S, next_review: pastDate, reps: 5
        });

        await page.goto('/review');
        await page.getByRole('link', { name: 'Begin Reviews' }).click();

        // Wait for review card
        await expect(page.getByTestId('debug-answer')).toBeAttached({ timeout: 10000 });

        // Fail the item - first Enter reveals result
        await page.getByRole('textbox').fill('wronganswer');
        await page.getByRole('textbox').press('Enter');

        // Wait for result modal
        const continueBtn = page.getByRole('button', { name: 'Got it, Continue' });
        await expect(continueBtn).toBeVisible({ timeout: 5000 });

        // Click to submit rating (force click in case of overlay issues)
        await continueBtn.click({ force: true });

        // Wait for async FSRS call to complete
        await page.waitForTimeout(2000);

        // Wait for FSRS log in console - this confirms the update happened
        await expect(async () => {
            const { data: logs } = await supabase.from('user_learning_logs')
                .select('*').eq('user_id', testUserId).eq('ku_id', v.id);
            expect(logs?.length).toBeGreaterThan(0);
        }).toPass({ timeout: 10000 });

        // Verify stability decreased
        const { data: state } = await supabase.from('user_learning_states')
            .select('stability').eq('user_id', testUserId).eq('ku_id', v.id).eq('facet', 'meaning').single();

        console.log(`[TEST] Final stability: ${state?.stability}, was: ${S}`);
        expect(state?.stability).toBeLessThan(S);
    });
});
