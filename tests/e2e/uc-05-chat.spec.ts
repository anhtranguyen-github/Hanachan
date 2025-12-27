
import { test, expect } from '@playwright/test';
import { logE2EFailure } from './utils';

/**
 * ---------------------------------------------------------------------------
 * CHECKLIST: UC-05 AI Tutor (Chatbot)
 * ---------------------------------------------------------------------------
 * 1. UC-05.1: Normal conversation & intent routing
 *    - Send greeting, receive assistant response
 * 2. UC-05.3: In-chat sentence analysis
 *    - Send "Analyze 猫が好き", expect analysis result text
 * 3. UC-05.4: Trigger Add Card modal from chat
 *    - Send "Save this word", expect add-card modal
 * 4. UC-05.6: SRS quiz mode through chat
 *    - Send "Quiz me", expect quiz banner
 * ---------------------------------------------------------------------------
 */

test.describe('UC-05: AI Tutor', () => {

    test.afterEach(async ({ page }, testInfo) => {
        await logE2EFailure(page, testInfo);
    });

    test('UC-05.1: Basic Conversation', async ({ page }) => {
        await page.goto('/chat');

        await expect(page.getByTestId('chat-ready')).toBeVisible();

        const newConversation = page.getByTestId('chat-new-session');
        await expect(newConversation).toBeEnabled();

        // Wait for navigation after clicking new session
        const navigationPromise = page.waitForURL(/\/chat\?id=/);
        await newConversation.click();
        await navigationPromise;

        const input = page.getByTestId('chat-input');
        await expect(input).toBeEnabled();
        await input.fill('Hello Hana');
        await page.getByTestId('send-button').click();

        // Wait for the final bot message instead of transient typing indicators
        const botMsg = page.getByTestId('bot-message').last();
        await expect(botMsg).toBeVisible({ timeout: 30000 });
        await expect(botMsg).toContainText(/.+/);
    });

    test('UC-05.3: In-Chat Analysis', async ({ page }) => {
        await page.goto('/chat');

        await expect(page.getByTestId('chat-ready')).toBeVisible();

        const newConversation = page.getByTestId('chat-new-session');
        await expect(newConversation).toBeEnabled();

        const navigationPromise = page.waitForURL(/\/chat\?id=/);
        await newConversation.click();
        await navigationPromise;

        const input = page.getByTestId('chat-input');
        await expect(input).toBeEnabled();
        await input.fill('Analyze 猫が好き');
        await page.getByTestId('send-button').click();

        // Wait directly for the action button which signifies response is processed
        const analyzeBtn = page.getByTestId('chat-analyze-action');
        await expect(analyzeBtn).toBeVisible({ timeout: 30000 });
        await analyzeBtn.click();
        await expect(page.getByTestId('chat-analysis-result')).toBeVisible();
    });

    test('UC-05.4: Trigger Add Card modal', async ({ page }) => {
        await page.goto('/chat');

        await expect(page.getByTestId('chat-ready')).toBeVisible();

        const newConversation = page.getByTestId('chat-new-session');
        const navigationPromise = page.waitForURL(/\/chat\?id=/);
        await newConversation.click();
        await navigationPromise;

        const input = page.getByTestId('chat-input');
        await input.fill('Save this word');
        await page.getByTestId('send-button').click();

        const addCardBtn = page.getByTestId('chat-open-add-card');
        await expect(addCardBtn).toBeVisible({ timeout: 30000 });
        await addCardBtn.click();

        await expect(page.getByTestId('chat-add-card-modal')).toBeVisible();
        await page.getByTestId('chat-add-card-cancel').click();
        await expect(page.getByTestId('chat-add-card-modal')).toBeHidden();
    });

    test('UC-05.6: Chat-triggered SRS quiz mode', async ({ page }) => {
        await page.goto('/chat');

        await expect(page.getByTestId('chat-ready')).toBeVisible();

        const newConversation = page.getByTestId('chat-new-session');
        const navigationPromise = page.waitForURL(/\/chat\?id=/);
        await newConversation.click();
        await navigationPromise;

        const input = page.getByTestId('chat-input');
        await input.fill('Quiz me');
        await page.getByTestId('send-button').click();

        const startQuizBtn = page.getByTestId('chat-start-quiz');
        await expect(startQuizBtn).toBeVisible({ timeout: 30000 });
        await startQuizBtn.click();

        await expect(page.getByTestId('chat-quiz-mode')).toBeVisible();
        await expect(page.getByTestId('bot-message').last()).toContainText(/Q1:/i);
    });

});
