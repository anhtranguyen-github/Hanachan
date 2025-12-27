
import { test, expect } from '@playwright/test';
import { getAuthUserFromStorageState, logE2EFailure } from './utils';
import { createClient } from '@supabase/supabase-js';

/**
 * ---------------------------------------------------------------------------
 * CHECKLIST: UC-04 YouTube Immersion
 * ---------------------------------------------------------------------------
 * 1. Connect/Manage Video
 *    - Navigate to /immersion
 *    - Action: Paste YouTube URL or Select existing
 *    - Result: Video loads
 * 2. Subtitle Sync
 *    - Action: Check for subtitle container
 *    - Result: Subtitles visible
 * 3. Interactive Mining
 *    - Action: Click word in subtitle
 *    - Result: Popup/Modal for mining appears
 * ---------------------------------------------------------------------------
 */

test.describe('UC-04: YouTube Immersion', () => {

    const seededVideoId = 'dQw4w9WgXcQ';

    test.afterEach(async ({ page }, testInfo) => {
        await logE2EFailure(page, testInfo);
    });

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

        const { error: seedVideoError } = await supabase
            .from('user_youtube_videos')
            .upsert({
                user_id: userId,
                video_id: seededVideoId,
                title: 'E2E Seed Video',
                thumbnail_url: `https://img.youtube.com/vi/${seededVideoId}/mqdefault.jpg`,
                channel_title: 'E2E',
                status: 'new',
                last_watched_at: new Date().toISOString(),
            }, { onConflict: 'user_id,video_id' });

        if (seedVideoError) {
            throw new Error(`Failed to seed user_youtube_videos: ${seedVideoError.message}`);
        }
    });

    test('UC-04.1: Connect/manage library and open a video', async ({ page }) => {
        await page.goto('/immersion');

        await expect(page.getByTestId('immersion-ready')).toBeVisible();
        await expect(page.getByTestId('video-list')).toBeVisible();
        await expect(page.getByText('E2E Seed Video')).toBeVisible();

        await page.getByText('E2E Seed Video').click();

        await expect(page.getByTestId('yt-watch-ready')).toBeVisible();
        await expect(page.getByTestId('yt-component-ready')).toBeVisible();
        await expect(page.getByTestId('yt-transcript')).toBeVisible();
        await expect(page.getByTestId('yt-transcript-line').first()).toBeVisible();
    });

    test('UC-04.2 + UC-04.3 + UC-04.5: Transcript sync, analyze a line, and open dictionary modal', async ({ page }) => {
        await page.goto(`/immersion/watch/${seededVideoId}`);

        await expect(page.getByTestId('yt-watch-ready')).toBeVisible();
        await expect(page.getByTestId('yt-component-ready')).toBeVisible();

        // UC-04.2: Transcript visible + language mode toggle
        await expect(page.getByTestId('yt-transcript')).toBeVisible();
        await expect(page.getByTestId('yt-transcript-line').first()).toBeVisible();

        await page.getByTestId('yt-lang-en').click();
        await expect(page.getByText(/synthesis for:/i)).toBeVisible();

        await page.getByTestId('yt-lang-jp-en').click();
        await expect(page.getByText(/synthesis for:/i)).toBeVisible();

        await page.getByTestId('yt-lang-jp').click();

        // UC-04.3: Analyze current line (opens analysis panel)
        await page.getByTestId('yt-synthesis-button').click();
        await expect(page.getByTestId('yt-analysis-panel')).toBeVisible();

        // UC-04.5: Click a token in the active subtitle line to open dictionary modal
        await page.getByTestId('yt-transcript-line').first().click();
        await expect(page.getByTestId('yt-dictionary-modal')).toBeVisible();
        await page.getByTestId('yt-dictionary-close').click();
        await expect(page.getByTestId('yt-dictionary-modal')).toBeHidden();
    });

});
