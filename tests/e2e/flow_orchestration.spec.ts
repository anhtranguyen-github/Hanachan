
import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Shared utilities for deterministic E2E state
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

test.describe('Flow 1: Learning Initialization (Discovery Loop)', () => {
    const uniqueEmail = `e2e_discovery_${Date.now()}@hanachan.test`;
    const password = 'Password123!';
    let userId: string;

    test.beforeAll(async () => {
        await cleanupUser(uniqueEmail);
        const { data, error } = await supabase.auth.admin.createUser({
            email: uniqueEmail, password: password, email_confirm: true
        });
        if (error) throw error;
        userId = data.user.id;
        await supabase.from('users').upsert({ id: userId, level: 1 });
        await new Promise(r => setTimeout(r, 2000)); // Allow Auth to propagate
    });

    test.afterAll(async () => {
        await cleanupUser(uniqueEmail);
    });

    test('should progress from New to Learning via Discovery', async ({ page }) => {
        await page.goto('/login');
        await page.fill('input[name="email"]', uniqueEmail);
        await page.fill('input[name="password"]', password);
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL(/.*dashboard/, { timeout: 30000 });
        await expect(page.getByTestId('dashboard-root')).toBeVisible({ timeout: 15000 });

        await page.goto('/learn');
        const startLink = page.getByTestId('begin-session-link');
        await expect(startLink).toBeVisible({ timeout: 20000 });
        await startLink.click();

        await expect(page).toHaveURL(/learn\/session/);

        // 2. Lesson Phase: Master all 5 items
        for (let i = 0; i < 5; i++) {
            const btn = page.getByRole('button', { name: /Mastered|Mastery Quiz/ });
            await expect(btn).toBeVisible({ timeout: 20000 });
            await btn.click({ force: true });
            await page.waitForTimeout(1000);
        }

        // 3. Quiz Phase
        await expect(page.getByTestId('quiz-phase')).toBeVisible({ timeout: 25000 });

        for (let i = 0; i < 20; i++) {
            const completeHeader = page.getByTestId('review-complete-header');
            if (await completeHeader.count() > 0 && await completeHeader.isVisible()) break;

            const debugTag = page.getByTestId('debug-answer');
            if (await debugTag.count() > 0) {
                const answer = await debugTag.getAttribute('data-answer');
                const revealBtn = page.getByRole('button', { name: "Verify Answer" });

                await page.fill('input[type="text"]', answer || "force-pass");
                if (await revealBtn.isVisible()) {
                    await revealBtn.click({ force: true });
                } else {
                    await page.keyboard.press('Enter');
                }

                const nextBtn = page.getByRole('button', { name: /Next Item|Got it, Continue/ });
                await expect(nextBtn).toBeVisible({ timeout: 20000 });
                await nextBtn.click({ force: true });
                await page.waitForTimeout(1000);
            } else {
                await page.waitForTimeout(1000);
            }
        }

        await expect(page.getByTestId('review-complete-header')).toBeVisible({ timeout: 35000 });
    });
});

test.describe('Flow 2: Spaced Repetition (Review Loop)', () => {
    const uniqueEmail = `e2e_review_${Date.now()}@hanachan.test`;
    const password = 'Password123!';
    let userId: string;

    test.beforeAll(async () => {
        await cleanupUser(uniqueEmail);
        const { data, error } = await supabase.auth.admin.createUser({
            email: uniqueEmail, password: password, email_confirm: true
        });
        if (error) throw error;
        userId = data.user.id;
        await supabase.from('users').upsert({ id: userId, level: 1 });

        // Seed reviews (Use real items from DB)
        const { data: kus } = await supabase.from('knowledge_units').select('id').neq('type', 'grammar').limit(2);
        if (kus) {
            for (const ku of kus) {
                await supabase.from('user_learning_states').upsert({
                    user_id: userId, ku_id: ku.id, facet: 'meaning', state: 'review',
                    stability: 1.0, difficulty: 3.0, reps: 2,
                    next_review: new Date(Date.now() - 172800000).toISOString()
                }, { onConflict: 'user_id,ku_id,facet' });
            }
        }
        await new Promise(r => setTimeout(r, 2000));
    });

    test('should progress through review items', async ({ page }) => {
        await page.goto('/login');
        await page.fill('input[name="email"]', uniqueEmail);
        await page.fill('input[name="password"]', password);
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL(/.*dashboard/, { timeout: 30000 });

        await page.goto('/review');
        const reviewBtn = page.getByRole('link', { name: /Begin Reviews/i });
        await expect(reviewBtn).toBeVisible({ timeout: 25000 });
        await reviewBtn.click();

        for (let i = 0; i < 10; i++) {
            if (await page.getByTestId('review-complete-header').isVisible()) break;
            const debugTag = page.getByTestId('debug-answer');
            if (await debugTag.count() > 0) {
                const answer = await debugTag.getAttribute('data-answer');
                const revealBtn = page.getByRole('button', { name: "Verify Answer" });

                await page.fill('input[type="text"]', answer || "force-pass");
                if (await revealBtn.isVisible()) {
                    await revealBtn.click({ force: true });
                } else {
                    await page.keyboard.press('Enter');
                }

                const nextBtn = page.getByRole('button', { name: /Next Item|Got it, Continue/ });
                await expect(nextBtn).toBeVisible({ timeout: 20000 });
                await nextBtn.click({ force: true });
                await page.waitForTimeout(1000);
            } else {
                await page.waitForTimeout(1000);
            }
        }
        await expect(page.getByTestId('review-complete-header')).toBeVisible({ timeout: 35000 });
    });
});

test.describe('Flow 3: Immersion / Assistant Loop', () => {
    const uniqueEmail = `e2e_immersion_${Date.now()}@hanachan.test`;
    const password = 'Password123!';
    let userId: string;

    test.beforeAll(async () => {
        await cleanupUser(uniqueEmail);
        const { data, error } = await supabase.auth.admin.createUser({
            email: uniqueEmail, password: password, email_confirm: true
        });
        if (error) throw error;
        userId = data.user.id;
        await supabase.from('users').upsert({ id: userId, level: 1 });
        await new Promise(r => setTimeout(r, 2000));
    });

    test('should recognize knowledge units from AI response', async ({ page }) => {
        // Find a real KU at level 1 to search for
        const { data: kus } = await supabase.from('knowledge_units').select('character').eq('level', 1).limit(1);
        const searchChar = kus && kus.length > 0 ? kus[0].character : "川";

        await page.goto('/login');
        await page.fill('input[name="email"]', uniqueEmail);
        await page.fill('input[name="password"]', password);
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL(/.*dashboard/, { timeout: 30000 });

        await page.goto('/immersion/chatbot');
        await expect(page.getByTestId('chat-input')).toBeVisible({ timeout: 20000 });

        const input = page.getByTestId('chat-input');
        await input.fill(`Search for ${searchChar}`);
        await input.press('Enter');

        // Wait for response (welcome + user + assistant = 3)
        await expect(async () => {
            const msgs = await page.getByTestId('chat-message').count();
            expect(msgs).toBeGreaterThanOrEqual(2);
        }).toPass({ timeout: 20000 });

        // Wait for Assistant to finish streaming and render CTA
        const cta = page.getByTestId('ku-cta-button').first();
        await expect(cta).toBeVisible({ timeout: 45000 });
        await cta.click({ force: true });

        const modal = page.getByTestId('quick-view-modal');
        await expect(modal).toBeVisible({ timeout: 15000 });
        await expect(modal.getByText(/Meaning|Kun|On|Type/i).first()).toBeVisible({ timeout: 10000 });
    });
});
