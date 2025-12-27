
'use server';

import { videoLibraryService } from './video-library';
import { createClient } from '@/services/supabase/server';
import { youtubeScraper } from '@/features/youtube/scraper';

export async function listVideosAction() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('Unauthorized');
    }

    return await videoLibraryService.listVideos(user.id);
}

export async function addVideoAction(url: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('Unauthorized');
    }

    const videoId = youtubeScraper.extractVideoId(url);
    if (!videoId) {
        return { success: false, error: 'Invalid YouTube URL' };
    }

    try {
        // Fetch metadata via oEmbed (No API key needed)
        const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
        const res = await fetch(oembedUrl);
        if (!res.ok) throw new Error('Failed to fetch video metadata');

        const meta = await res.json();

        await videoLibraryService.addVideo({
            video_id: videoId,
            title: meta.title,
            thumbnail_url: meta.thumbnail_url,
            channel_title: meta.author_name,
            status: 'new'
        }, user.id);

        return { success: true };
    } catch (e) {
        console.error('Failed to add video:', e);
        return { success: false, error: 'Failed to add video. Make sure it is public.' };
    }
}
