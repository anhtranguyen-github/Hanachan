
import { describe, it, expect, vi } from 'vitest';
import { youtubeService } from '@/features/youtube/service';
import { youtubeScraper } from '@/features/youtube/scraper';
import { localTranscriptRepo } from '@/features/youtube/local-db';
import * as db from '@/features/youtube/db';

vi.mock('@/features/youtube/scraper', () => ({
    youtubeScraper: {
        extractVideoId: vi.fn(),
        fetchTranscript: vi.fn()
    }
}));

vi.mock('@/features/youtube/local-db', () => ({
    localTranscriptRepo: {
        saveTranscript: vi.fn(),
        getTranscript: vi.fn()
    }
}));

vi.mock('@/features/youtube/db', () => ({
    getVideoByYoutubeId: vi.fn(),
    addVideo: vi.fn(),
    saveSubtitles: vi.fn()
}));

describe('YoutubeService', () => {
    it('should import video and save subtitles', async () => {
        const userId = '00000000-0000-4000-8000-000000000001';
        const url = 'https://www.youtube.com/watch?v=123';
        const videoId = '123';
        const mockTranscript = [{ offset: 0, duration: 1, text: 'test' }];

        (youtubeScraper.extractVideoId as any).mockReturnValue(videoId);
        (youtubeScraper.fetchTranscript as any).mockResolvedValue(mockTranscript);
        (db.getVideoByYoutubeId as any).mockResolvedValue(null);
        (db.addVideo as any).mockResolvedValue({ id: 'v-1', video_id: videoId });

        const result = await youtubeService.importVideo(userId, url);

        expect(result).toBeDefined();
        expect(db.saveSubtitles).toHaveBeenCalled();
        expect(localTranscriptRepo.saveTranscript).toHaveBeenCalled();
    });
});
