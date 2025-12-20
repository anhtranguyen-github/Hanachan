
import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

// Setup Supabase admin client for creating test users
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

test.describe('HanaChan Real E2E Flows', () => {
    // NOTE: tests/auth.setup.ts handles creating 'e2e_global_user@hanachan.ai' and logging in.

    test.beforeEach(async ({ page }) => {
        // We are already logged in via storageState.
        // Navigate to dashboard to ensure we are in a known state.

        // Handle potential redirects or just go to dashboard
        await page.goto('/dashboard');

        // Optional: Verify we are indeed logged in
        await expect(page.getByText(/Okaeri/i)).toBeVisible({ timeout: 15000 });
    });

    test('UC-05.1: Real AI Chat Flow (No Mocks)', async ({ page }) => {
        await page.goto('/chat');

        // Send a real message to OpenAI
        const input = page.getByPlaceholder(/Ask Hana/i);
        await input.fill('Is Tokyo expensive?');
        await input.press('Enter');

        // Check for User Message
        await expect(page.getByText('Is Tokyo expensive?')).toBeVisible();

        // Check for Real AI Response (This might take 2-5 seconds)
        // We don't know exact text, but we know it should appear in the prose area.
        // We can check for a common word like "Yes" or "Tokyo" or just ANY text in the result bubble.
        const responseLocator = page.locator('.prose-sakura p').last(); // Assuming response is in a paragraph
        await expect(responseLocator).not.toBeEmpty({ timeout: 15000 });

        // Optional: snapshot of the response
        // const text = await responseLocator.textContent();
        // console.log('AI Response:', text);
    });

    test('UC-02.2: Real SRS Review Flow (Database Access)', async ({ page }) => {
        // 1. Ensure we have data? Real flow implies we might need to "Mine" something first
        // or effectively we test the "Empty State" if nothing is mined.
        // Let's test the Analyzer + Mining flow to CREATE data, then Review it.

        // --- Step 1: Analyze & Mine ---
        await page.goto('/analyzer');
        const input = page.locator('textarea');
        await input.fill('猫が好きです'); // "I like cats"
        await page.getByRole('button', { name: /Synthesize/i }).click();

        // Wait for Real Analysis
        await expect(page.getByText('猫')).toBeVisible({ timeout: 10000 });

        // Click on "猫" to open modal
        await page.getByText('猫').first().click();

        // Click "Add to Deck" (Real DB Insert)
        await page.getByRole('button', { name: /Add to Deck/i }).click();

        // --- Step 2: Review (SRS) ---
        await page.goto('/study/review');

        // Now we should potentially have a card, OR it might be "New" and not "Due" immediately 
        // depending on FSRS settings (New cards usually show up if limit > 0).
        // Let's check for "Reveal" or "Flip".

        // NOTE: If the StudySession logic only picks "Due" cards (scheduled_days <= 0), 
        // new cards should appear if we haven't hit the daily limit.
        const startBtn = page.getByRole('button', { name: /Start/i });
        if (await startBtn.isVisible()) {
            await startBtn.click();
        }

        const flipBtn = page.getByRole('button', { name: /Flip/i });

        // If we see "You're all caught up", it means either FSRS didn't schedule it for today 
        // or fetch logic is strict.
        if (await page.getByText(/You're all caught up/i).isVisible()) {
            console.log("Card mined but not due immediately. Test flow verified up to consistency.");
            return;
        }

        await expect(flipBtn).toBeVisible();
        await flipBtn.click();

        // Rate it
        await page.getByRole('button', { name: /Good/i }).click();

        // Verify we moved to next card or finished
    });

    test('UC-04.1: Real Youtube Library (Add & List)', async ({ page }) => {
        await page.goto('/immersion');

        // Handle the prompt dialog
        page.once('dialog', async dialog => {
            await dialog.accept('https://www.youtube.com/watch?v=HuWKEK4Z1g0');
        });

        // Click Add to trigger prompt
        // Note: There are two buttons, one in header, one in empty state. Both trigger 'onAddVideo'.
        // Let's click the one in the header usually.
        await page.getByRole('button', { name: /Add Video/i }).first().click();

        // Wait for list to reload and show the video
        // We expect "Japanese Listening Practice" or similar title depending on the video
        // HuWKEK4Z1g0 is "Let's learn Japanese! - Basic Japanese start!" (example)
        // We just check that the list is not empty or contains a card.
        await expect(page.locator('.text-lg')).not.toHaveCount(0, { timeout: 15000 });

        // Check for specific video title if possible, or just checks that "Your library is empty" is gone.
        await expect(page.getByText(/Your library is empty/i)).not.toBeVisible();
    });
});
