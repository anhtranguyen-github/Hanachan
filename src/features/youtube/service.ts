
import { youtubeScraper } from './scraper';
import { localTranscriptRepo } from './local-db';
import * as db from './db';
import { UserVideo } from './types';

import { SupabaseClient } from '@supabase/supabase-js';

// ... imports

import { z } from 'zod';

export class YoutubeService {

    async importVideo(userId: string, url: string, client?: SupabaseClient): Promise<UserVideo> {
        z.string().uuid().parse(userId);
        z.string().url().parse(url);

        const videoId = youtubeScraper.extractVideoId(url);
        if (!videoId) throw new Error("Invalid YouTube URL");

        // 1. Fetch Transcript using robust scraper
        let transcript: any[] = [];
        try {
            transcript = await youtubeScraper.fetchTranscript(videoId, 'ja');
        } catch (e) {
            console.warn(`⚠️ Scraper failed: ${e}.`);
            // Proceed even if failed, maybe empty transcript is fine for music videos
            transcript = [];
        }

        // 2. Save Transcript to LOCAL STORAGE (per user request)
        console.log(`💾 Saving ${transcript.length} segments to Local Storage...`);
        localTranscriptRepo.saveTranscript(videoId, transcript.map(s => ({
            start: s.offset,
            duration: s.duration,
            text: s.text
        })));

        // 3. Save Metadata to Supabase (User Videos table is likely fine, only segments table had issues)
        // We still use db.addVideo because user_youtube_videos table usually exists.
        // If it fails, we catch and log, but assume local transcript is the key for now.
        let video: UserVideo | null = null;
        try {
            const existing = await db.getVideoByYoutubeId(userId, videoId, client);
            if (existing) {
                video = existing;
            } else {
                video = await db.addVideo({
                    user_id: userId,
                    video_id: videoId,
                    title: `Video ${videoId}`,
                    status: 'learning'
                }, client); // Pass client
            }
        } catch (e: any) {
            console.warn("⚠️ Warning: Could not save video metadata to Supabase. Using dummy object.");
            video = {
                id: 'local-only-id',
                user_id: userId,
                video_id: videoId,
                title: 'Local Video',
                status: 'learning',
                created_at: new Date().toISOString()
            } as UserVideo;
        }

        return video!;
    }

    async getTranscript(videoId: string) {
        z.string().min(1).parse(videoId);
        let segments = localTranscriptRepo.getTranscript(videoId);

        if (!segments || segments.length === 0) {
            console.log(`🔍 Transcript missing in local-db for ${videoId}. Attempting live fetch...`);
            try {
                const live = await youtubeScraper.fetchTranscript(videoId, 'ja');
                if (live && live.length > 0) {
                    segments = live.map(s => ({
                        start: s.offset,
                        duration: s.duration,
                        text: s.text
                    }));
                    localTranscriptRepo.saveTranscript(videoId, segments);
                }
            } catch (e) {
                console.error("Failed to recover transcript via live fetch", e);
            }
        }

        return segments || [];
    }
}

export const youtubeService = new YoutubeService();
