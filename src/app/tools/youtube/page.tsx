'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { YouTubeUrlInputForm } from '@/modules/youtube/components/YouTubeUrlInputForm';
import { YouTubeComponent } from '@/modules/youtube/components/YouTubeComponent';
import { Library, Play } from 'lucide-react';

export default function YouTubeToolRedirect() {
    const router = useRouter();

    // The original redirect useEffect is removed as the component's purpose changes.
    // If the redirect logic is still needed under certain conditions, it would be re-added conditionally.

    const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);
    const [libraryVideos, setLibraryVideos] = useState<any[]>([]);

    useEffect(() => {
        // Fetch library videos on mount
        const userId = '11111111-1111-1111-1111-111111111111'; // Mock ID
        fetch(`/api/tools/youtube/library?userId=${userId}`)
            .then(res => res.json())
            .then(data => {
                if (data.videos) setLibraryVideos(data.videos);
            })
            .catch(err => console.error('Failed to load library', err));
    }, [currentVideoId]); // Re-fetch when video changes (might have been added/removed)

    return (
        <div className="min-h-screen bg-sakura-bg p-6 lg:p-12">
            <div className="max-w-7xl mx-auto flex flex-col gap-8">
                {/* Header */}
                <div className="flex flex-col gap-2">
                    <h1 className="text-4xl font-black text-sakura-text-primary">
                        YouTube Immersion
                    </h1>
                    <p className="text-sakura-text-muted font-medium">
                        Learn Japanese directly from your favorite videos with AI-powered analysis.
                    </p>
                </div>

                {!currentVideoId ? (
                    <div className="flex flex-col gap-12">
                        {/* URL Input */}
                        <YouTubeUrlInputForm onSubmit={setCurrentVideoId} />

                        {/* Library Section */}
                        {libraryVideos.length > 0 && (
                            <div className="flex flex-col gap-6">
                                <h2 className="text-2xl font-black text-sakura-text-primary flex items-center gap-2">
                                    <Library className="text-sakura-accent-primary" />
                                    My Collection
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {libraryVideos.map((video) => (
                                        <button
                                            key={video.id}
                                            onClick={() => setCurrentVideoId(video.video_id)}
                                            className="group flex flex-col gap-3 p-4 rounded-[2rem] bg-white border border-sakura-divider hover: hover:scale-[1.02] transition-all duration-300 text-left"
                                        >
                                            <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black/5 relative">
                                                <img
                                                    src={video.thumbnail_url || `https://img.youtube.com/vi/${video.video_id}/mqdefault.jpg`}
                                                    alt={video.title}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                />
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                                    <Play className="text-white opacity-0 group-hover:opacity-100 transform scale-50 group-hover:scale-100 transition-all duration-300 drop-" size={48} fill="currentColor" />
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-1 px-1">
                                                <h3 className="font-bold text-sakura-text-primary line-clamp-2 leading-tight group-hover:text-sakura-accent-primary transition-colors">
                                                    {video.title || 'Untitled Video'}
                                                </h3>
                                                <span className="text-xs font-bold text-sakura-text-muted uppercase tracking-wider">
                                                    {video.duration ? `${Math.floor(video.duration / 60)}:${(video.duration % 60).toString().padStart(2, '0')}` : 'Video'}
                                                </span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="animate-in fade-in slide-in-from-bottom-8 duration-500">
                        <YouTubeComponent
                            videoId={currentVideoId}
                            onBackToLibrary={() => setCurrentVideoId(null)}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
