
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { analyzeSentenceAction, saveMinedSentenceAction } from '@/features/mining/actions';
import { generateSubtitlesWithWhisperAction, importVideoAction } from '@/features/youtube/actions';
import { createClient } from '@supabase/supabase-js';

// Skip if keys missing
const runRealTests = !!process.env.OPENAI_API_KEY && !!process.env.NEXT_PUBLIC_SUPABASE_URL;

describe.skipIf(!runRealTests)('REAL Integration Tests (Live API & DB)', () => {

    // Setup Real DB Client
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // User ID for test
    let userId: string;

    beforeAll(async () => {
        // Find or create test user
        const { data: users } = await supabase.from('users').select('id').limit(1);
        if (users && users.length > 0) {
            userId = users[0].id;
        } else {
            // Create dummy
            const { data } = await supabase.from('users').insert({ email: 'e2e_test@example.com' }).select().single();
            userId = data.id;
        }
        console.log(`[E2E] Using User ID: ${userId}`);
    });

    it('should analyze a sentence using Real OpenAI', async () => {
        const text = "明日は図書館に行きます。";
        console.log(`[E2E] Analyzing: ${text}`);

        const result = await analyzeSentenceAction(text);

        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();

        const candidates = result.data?.candidates || [];
        expect(candidates.length).toBeGreaterThan(0);

        console.log(`[E2E] AI Analysis Candidates:`, candidates.map(c => c.pattern));
    }, 20000);

    it('should save to Real DB', async () => {
        const text = "E2E Test Sentence " + Date.now();
        const params = {
            text_ja: text,
            text_en: "E2E Meaning",
            notes: "Real DB test",
            grammar_ids: []
        };

        console.log(`[E2E] Saving: ${text}`);
        const result = await saveMinedSentenceAction(userId, params);

        expect(result.success).toBe(true);

        // Verify in DB
        const { data } = await supabase.from('sentences').select().eq('text_ja', text).single();
        expect(data).toBeDefined();
        expect(data.created_by).toBe(userId);

        // Cleanup
        await supabase.from('sentences').delete().eq('id', data.id);
    });

    it('should attempt YouTube Import (Real Scraper)', async () => {
        const videoId = 'nuVGQDJOwHU';
        const url = `https://www.youtube.com/watch?v=${videoId}`;

        console.log(`[E2E] Importing YouTube: ${url}`);
        const result = await importVideoAction(userId, url);

        if (result.success) {
            console.log(`[E2E] Import Success. Has Subs: ${result.hasSubtitles}`);
            if (result.video) {
                await supabase.from('youtube_videos').delete().eq('id', result.video.id);
            }
        } else {
            console.warn(`[E2E] Import Failed (Expected if blocked): ${result.error}`);
        }
    }, 30000);

    it('should attempt Whisper Generation (Real yt-dlp + OpenAI)', async () => {
        const videoId = 'jNQXAC9IVRw';
        let internalId: string | undefined;

        const { data: existing } = await supabase.from('youtube_videos').select().eq('video_id', videoId).eq('created_by', userId).maybeSingle();

        if (existing) {
            internalId = existing.id;
        } else {
            // Updated: Use created_by not user_id
            const { data: video, error } = await supabase.from('youtube_videos').insert({
                created_by: userId,  // CORRECT
                video_id: videoId,
                title: 'Me at the zoo',
                status: 'learning'
            }).select().single();

            if (error) {
                console.warn("[E2E] Create Video Error:", error);
                return;
            }
            internalId = video.id;
        }

        if (!internalId) return;

        console.log(`[E2E] Running Whisper on: ${videoId}`);
        const result = await generateSubtitlesWithWhisperAction(userId, internalId, videoId);

        if (result.success) {
            console.log(`[E2E] Whisper Success! Segments: ${result.count}`);
            expect(result.count).toBeGreaterThan(0);
        } else {
            console.warn(`[E2E] Whisper Failed: ${result.error}`);
            if (result.error?.includes('403') || result.error?.includes('Status code')) {
                console.log("[E2E] Error confirmed (YouTube blocking env).");
            }
        }

        await supabase.from('youtube_videos').delete().eq('id', internalId);

    }, 60000);
});
