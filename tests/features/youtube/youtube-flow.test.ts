
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { importVideoAction, generateSubtitlesWithWhisperAction } from '@/features/youtube/actions';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Mock DB interactions
vi.mock('@/features/youtube/db', () => ({
    getUserVideos: vi.fn(),
    deleteVideo: vi.fn(),
    getVideoById: vi.fn(),
    saveSubtitles: vi.fn().mockResolvedValue(undefined),
    getVideoByYoutubeId: vi.fn().mockResolvedValue(null),
    addVideo: vi.fn().mockResolvedValue({ id: 'vid-1', video_id: 'yt-1', title: 'Test Video', status: 'learning' })
}));

// Mock fs to avoid stream issues
vi.mock('fs', () => ({
    default: {
        existsSync: vi.fn().mockReturnValue(true),
        writeFileSync: vi.fn(),
        unlinkSync: vi.fn(),
        readdirSync: vi.fn().mockReturnValue(['test_vid_123.webm']),
        statSync: vi.fn().mockReturnValue({ size: 1024 * 1024 }),
        createReadStream: vi.fn().mockReturnValue({
            on: vi.fn().mockReturnThis(),
            pipe: vi.fn().mockReturnThis(),
            destroy: vi.fn()
        })
    },
    existsSync: vi.fn().mockReturnValue(true),
    writeFileSync: vi.fn(),
    unlinkSync: vi.fn(),
    readdirSync: vi.fn().mockReturnValue(['test_vid_123.webm']),
    statSync: vi.fn().mockReturnValue({ size: 1024 * 1024 }),
    createReadStream: vi.fn().mockReturnValue({
        on: vi.fn().mockReturnThis(),
        pipe: vi.fn().mockReturnThis(),
        destroy: vi.fn()
    })
}));

// Mock Service (Scraper)
vi.mock('@/features/youtube/service', () => ({
    youtubeService: {
        importVideo: vi.fn().mockResolvedValue({
            video: { id: 'vid-1', video_id: 'yt-1', title: 'Test Video' },
            hasSubtitles: false
        }),
        getTranscript: vi.fn()
    }
}));

// Mock OpenAI
vi.mock('openai', () => {
    class MockOpenAI {
        audio = {
            transcriptions: {
                create: vi.fn().mockResolvedValue({
                    text: "Full text",
                    segments: [
                        { start: 0, end: 5, text: "Hello World" }
                    ]
                })
            }
        };
        constructor() { }
    }
    return { default: MockOpenAI };
});

// Mock Child Process (yt-dlp)
vi.mock('child_process', () => ({
    exec: vi.fn((cmd, cb) => {
        cb(null, { stdout: 'Simulated Download', stderr: '' });
    })
}));

// Mock Next Cache
vi.mock('next/cache', () => ({
    revalidatePath: vi.fn()
}));

describe('YouTube Integration', () => {
    const tmpDir = os.tmpdir();
    const testVideoId = 'test_vid_123';
    const fakeAudioPath = path.join(tmpDir, `${testVideoId}.webm`);

    beforeEach(() => {
        vi.clearAllMocks();
        process.env.OPENAI_API_KEY = 'test-key';
    });

    it('should import video and report missing subtitles', async () => {
        const result = await importVideoAction('user-1', 'http://youtube.com/watch?v=yt-1');
        expect(result.success).toBe(true);
        expect(result.hasSubtitles).toBe(false);
    });

    it('should generate subtitles with whisper', async () => {
        const result = await generateSubtitlesWithWhisperAction('user-1', 'vid-1', testVideoId);
        expect(result.success).toBe(true);
        expect(result.count).toBe(1);
    });
});
