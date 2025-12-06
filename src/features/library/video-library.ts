
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const LIBRARY_FILE = path.join(DATA_DIR, 'library.json');

export interface VideoMetadata {
    id: string;
    title: string;
    thumbnailUrl: string;
    duration: number;
    status: 'new' | 'learning' | 'completed';
    progress: number; // 0-100
    addedAt: string;
}

export class VideoLibraryService {
    private load(): VideoMetadata[] {
        if (!fs.existsSync(LIBRARY_FILE)) return [];
        try {
            return JSON.parse(fs.readFileSync(LIBRARY_FILE, 'utf-8'));
        } catch { return []; }
    }

    private save(data: VideoMetadata[]) {
        if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
        fs.writeFileSync(LIBRARY_FILE, JSON.stringify(data, null, 2), 'utf-8');
    }

    /**
     * Adds a video to the user's library.
     */
    addVideo(metadata: VideoMetadata) {
        const videos = this.load();
        if (videos.find(v => v.id === metadata.id)) {
            console.log(`⚠️ Video ${metadata.id} already in library. Skipping.`);
            return;
        }
        videos.push(metadata);
        this.save(videos);
        console.log(`📚 Added to Library: ${metadata.title}`);
    }

    /**
     * Lists all videos in library.
     */
    listVideos(): VideoMetadata[] {
        return this.load().sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime());
    }

    /**
     * Update learning progress.
     */
    updateProgress(videoId: string, progress: number) {
        const videos = this.load();
        const video = videos.find(v => v.id === videoId);
        if (video) {
            video.progress = progress;
            if (progress >= 100) video.status = 'completed';
            else if (progress > 0) video.status = 'learning';
            this.save(videos);
        }
    }

    deleteVideo(videoId: string) {
        let videos = this.load();
        videos = videos.filter(v => v.id !== videoId);
        this.save(videos);
    }
}

export const videoLibraryService = new VideoLibraryService();
