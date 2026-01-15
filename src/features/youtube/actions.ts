'use server';

import { youtubeService } from './service';
import { getUserVideos, deleteVideo } from './db';
import { revalidatePath } from 'next/cache';
import { MOCK_VIDEOS, MOCK_TRANSCRIPT } from '@/lib/mock-db/seeds';
import { MockDB } from '@/lib/mock-db';

export async function importVideoAction(url: string) {
    // For mock phase, just return a dummy video
    const video = {
        id: 'yt-mock-' + Math.random().toString(36).substr(2, 9),
        video_id: 'mock-id',
        title: 'MOCK Imported Video',
        channel_title: 'MOCK Channel',
        status: 'learning'
    };
    return { success: true, video };
}

export async function fetchUserVideosAction() {
    try {
        const videos = await getUserVideos("user-1");
        return videos;
    } catch (e) {
        return MOCK_VIDEOS;
    }
}

export async function deleteVideoAction(id: string) {
    await deleteVideo(id);
    revalidatePath('/immersion');
}

export async function getTranscriptAction(videoId: string) {
    return MOCK_TRANSCRIPT;
}

export async function mineCardAction(card: { front: string; back: string; sentence?: string; videoId?: string }) {
    console.log("🛠️ [Mock] Mining card:", card);
    // Add to mock state
    await MockDB.updateUserState("user-1", `vocabulary/${card.front}`, {
        state: 'new',
        srs_stage: 0
    });
    return { success: true, message: "Card mined successfully! (Mocked)" };
}

