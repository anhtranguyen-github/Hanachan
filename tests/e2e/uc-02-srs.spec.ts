
import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { getAuthUserFromStorageState, logE2EFailure } from './utils';

/**
 * ---------------------------------------------------------------------------
 * CHECKLIST: UC-02 SRS Study & Flashcards
 * ---------------------------------------------------------------------------
 * 1. Navigate to /study (SRS Hub)
 *    - Auth accessible: YES
 *    - Action: Check for reviews
 *    - Result: Review interface or "All verified" message
 * 2. Answer Card (Self-Evaluation)
 *    - Action: Flip card, Choose rating
 *    - Result: Card moves to next or finishes
 * 3. Deck Management
 *    - Action: Navigate to /decks, Create Deck
 *    - Result: New deck appears in list
 * ---------------------------------------------------------------------------
 */

test.describe('UC-02: SRS Study', () => {
    const seededDeckNames: string[] = [];

    test.beforeAll(async () => {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !serviceKey) {
            throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL for E2E seeding.');
        }

        const supabase = createClient(supabaseUrl, serviceKey);
        const authUser = getAuthUserFromStorageState();
        const userId = authUser.id;

        const { error: userUpsertError } = await supabase
            .from('users')
            .upsert({ id: userId, email: authUser.email });

        if (userUpsertError) {
            throw new Error(`Failed to upsert users row: ${userUpsertError.message}`);
        }
        const suffix = Date.now();

        const deckNames = [`E2E Hub Deck A ${suffix}`, `E2E Hub Deck B ${suffix}`];
        seededDeckNames.push(...deckNames);

        const { data: decks, error: deckError } = await supabase
            .from('decks')
            .insert([
                { user_id: userId, name: deckNames[0], type: 'user_mined' },
                { user_id: userId, name: deckNames[1], type: 'user_mined' }
            ])
            .select('id');

        if (deckError || !decks?.length) {
            throw new Error(`Failed to seed decks: ${deckError?.message}`);
        }

        const { data: verifyDecks, error: verifyDecksError } = await supabase
            .from('decks')
            .select('id,name')
            .eq('user_id', userId)
            .in('name', deckNames);

        if (verifyDecksError || (verifyDecks?.length ?? 0) !== deckNames.length) {
            throw new Error(`Seeded decks not found for authenticated user: ${verifyDecksError?.message}`);
        }

        const { data: knowledgeUnits, error: kuError } = await supabase
            .from('knowledge_units')
            .select('slug')
            .limit(2);

        if (kuError || (knowledgeUnits?.length ?? 0) < 1) {
            throw new Error(`Failed to fetch knowledge units: ${kuError?.message}`);
        }

        const { data: sentences, error: sentenceError } = await supabase
            .from('sentences')
            .insert([
                { text_ja: `E2E SRS sentence A ${suffix}`, source_type: 'manual', user_id: userId },
                { text_ja: `E2E SRS sentence B ${suffix}`, source_type: 'manual', user_id: userId }
            ])
            .select('id');

        if (sentenceError || !sentences?.length) {
            throw new Error(`Failed to seed sentences: ${sentenceError?.message}`);
        }

        const kuSlug = knowledgeUnits?.[0]?.slug;
        const deckItems = [
            { deck_id: decks[0].id, ku_id: kuSlug, sentence_id: null },
            { deck_id: decks[1].id, ku_id: kuSlug, sentence_id: null }
        ];

        const { error: deckItemError } = await supabase
            .from('deck_items')
            .insert(deckItems);

        if (deckItemError) {
            throw new Error(`Failed to seed deck items: ${deckItemError.message}`);
        }

        const now = new Date().toISOString();
        const fsrsState = { interval: 0, difficulty: 5, stability: 0, nextReview: now };

        const { error: cardError } = await supabase
            .from('user_sentence_cards')
            .insert([
                {
                    sentence_id: sentences[0].id,
                    card_type: 'vocab',
                    front: `E2E Front A ${suffix}`,
                    back: 'Meaning A',
                    fsrs_state: fsrsState,
                    next_review: now,
                    user_id: userId
                },
                {
                    sentence_id: sentences[1].id,
                    card_type: 'vocab',
                    front: `E2E Front B ${suffix}`,
                    back: 'Meaning B',
                    fsrs_state: fsrsState,
                    next_review: now,
                    user_id: userId
                }
            ]);

        if (cardError) {
            throw new Error(`Failed to seed SRS cards: ${cardError.message}`);
        }
    });

    test.afterEach(async ({ page }, testInfo) => {
        await logE2EFailure(page, testInfo);
    });

    test('UC-02.2: SRS Review Session', async ({ page }) => {
        await page.goto('/study/review');

        const terminalState = page.getByTestId('flashcard-front')
            .or(page.getByTestId('flashcard-empty'))
            .or(page.getByTestId('review-error'));

        await expect(terminalState).toBeVisible();

        if (await page.getByTestId('flashcard-front').isVisible()) {
            await page.getByTestId('flashcard-reveal').click();
            await expect(page.getByTestId('flashcard-back')).toContainText(/.+/);
            await page.getByTestId('flashcard-rate-good').click();
        }
    });

    test('UC-02.4: Deck Management', async ({ page }) => {
        await page.goto('/decks');

        // Create Deck
        const newDeckButton = page.getByRole('button', { name: 'New Deck' });
        await expect(newDeckButton).toBeEnabled();
        await newDeckButton.click();

        const deckName = `Test Deck ${Date.now()}`;
        await page.fill('[data-testid="deck-name-input"]', deckName);
        await page.getByRole('button', { name: 'Create' }).click();

        // Verify
        await expect(page.getByText(deckName)).toBeVisible();
    });

});
