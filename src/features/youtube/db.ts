import { MockDB } from '@/lib/mock-db';
import { UserVideo } from './types';

export const TABLE_NAME = 'user_youtube_videos';

export async function addVideo(video: Partial<UserVideo> & { user_id: string; video_id: string }) {
    // Mock implementation
    return {
        id: Math.random().toString(),
        user_id: video.user_id,
        video_id: video.video_id,
        title: video.title || 'MOCK VIDEO',
        status: 'learning',
        created_at: new Date().toISOString()
    } as UserVideo;
}

export async function getUserVideos(userId: string) {
    const videos = await MockDB.getYouTubeVideos();
    return videos.map(v => ({
        id: v.id,
        user_id: userId,
        video_id: v.video_id,
        title: v.title,
        status: 'learning',
        channel_title: v.channel,
        thumbnail_url: v.thumbnail_url
    })) as UserVideo[];
}

export async function deleteVideo(id: string) {
    // No-op for mock
}

export async function getVideoByYoutubeId(userId: string, videoId: string) {
    const video = await MockDB.getYouTubeVideo(videoId);
    if (!video) return null;
    return {
        id: video.id,
        user_id: userId,
        video_id: video.video_id,
        title: video.title,
        status: 'learning'
    } as UserVideo;
}

export async function updateVideoStatus(id: string, status: string) {
    // No-op for mock
}

