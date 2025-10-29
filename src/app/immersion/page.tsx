'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    LayoutGrid,
    List,
    Plus,
    Play,
    Trash2,
    Clock,
    ChevronRight,
    Youtube
} from 'lucide-react';
import { SakuraHeader } from '@/components/SakuraHeader';
import { BRAND_COLORS } from '@/config/design.config';
import { cn } from '@/lib/utils';

// Mock components/types fypes for now if not available
interface VideoItem {
    id: string;
    title: string;
    thumbnail: string;
    duration?: string;
    addedAt: string;
}

function YouTubeUrlInputForm({ onSubmit, isLoading }: { onSubmit: (url: string) => void, isLoading: boolean }) {
    return (
        <form onSubmit={(e) => { e.preventDefault(); onSubmit((e.target as any).url.value); }} className="flex gap-2">
            <input name="url" type="text" placeholder="YouTube URL..." className="flex-1 bg-sakura-bg-app border border-sakura-divider rounded-xl px-4 py-2 outline-none focus:border-sakura-cocoa/40" />
            <button type="submit" disabled={isLoading} className="bg-sakura-cocoa text-white px-6 py-2 rounded-xl font-bold uppercase tracking-widest text-[10px]">Add</button>
        </form>
    );
}

function ImmersionLibraryContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [videos, setVideos] = useState<VideoItem[]>([]);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // Load library from local storage
        const saved = localStorage.getItem('immersion-library');
        if (saved) {
            try {
                setVideos(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to load library', e);
            }
        }
    }, []);

    const saveLibrary = (newVideos: VideoItem[]) => {
        setVideos(newVideos);
        localStorage.setItem('immersion-library', JSON.stringify(newVideos));
    };

    const handleAddVideo = async (url: string) => {
        if (!url) return;
        setIsLoading(true);
        // Mock add video
        await new Promise(resolve => setTimeout(resolve, 1000));
        const newVideo: VideoItem = {
            id: Date.now().toString(),
            title: 'New Japanese Lesson (Mock)',
            thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
            duration: '10:05',
            addedAt: new Date().toISOString()
        };
        saveLibrary([newVideo, ...videos]);
        setIsLoading(false);
    };

    const handleDeleteVideo = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        const filtered = videos.filter(v => v.id !== id);
        saveLibrary(filtered);
    };

    return (
        <div className="min-h-screen bg-transparent pb-20 flex flex-col relative">
            {/* Background Texture */}


            <div className="relative z-10 w-full">
                <SakuraHeader
                    title="Immersion Library"
                    subtitle="STUDY ARCHIVE"
                    subtitleColor="#EF4444"
                    actions={
                        <div className="flex items-center gap-3 bg-sakura-bg-app p-1.5 rounded-2xl border border-sakura-divider">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={cn(
                                    "p-2.5 rounded-xl transition-all",
                                    viewMode === 'grid' ? "bg-white text-sakura-ink border border-sakura-border" : "text-sakura-cocoa/40 hover:text-sakura-cocoa"
                                )}
                            >
                                <LayoutGrid size={18} />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={cn(
                                    "p-2.5 rounded-xl transition-all",
                                    viewMode === 'list' ? "bg-white text-sakura-ink border border-sakura-border" : "text-sakura-cocoa/40 hover:text-sakura-cocoa"
                                )}
                            >
                                <List size={18} />
                            </button>
                        </div>
                    }
                />

                <main className="max-w-6xl mx-auto px-6 py-12 w-full">
                    {/* Add Video Secion */}
                    <div className="mb-16">
                        <div className="bg-white rounded-[2.5rem] border border-sakura-divider p-10 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-sakura-cocoa/5 rounded-full -mr-16 -mt-16" />
                            <div className="flex items-center gap-3 mb-6 relative">
                                <div className="w-10 h-10 rounded-xl bg-sakura-cocoa/5 flex items-center justify-center text-sakura-cocoa">
                                    <Plus size={24} />
                                </div>
                                <h2 className="text-xl font-black text-sakura-ink uppercase tracking-tighter">Add New Synthesis</h2>
                            </div>
                            <YouTubeUrlInputForm onSubmit={handleAddVideo} isLoading={isLoading} />
                            <p className="mt-4 text-[10px] text-sakura-cocoa/40 font-black uppercase tracking-widest ml-2">
                                Enter any Japanese YouTube video link to begin deep immersion
                            </p>

                            {/* Sticker */}
                            <div className="absolute -bottom-6 -right-6 w-32 h-32 pointer-events-none opacity-90">
                                <img src="/listening_aesthetic.png" alt="Listening" className="w-full h-full object-contain" />
                            </div>
                        </div>
                    </div>

                    {/* Video List */}
                    {videos.length > 0 ? (
                        <div className={cn(
                            "grid gap-8",
                            viewMode === 'grid' ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
                        )}>
                            {videos.map((video) => (
                                <div
                                    key={video.id}
                                    onClick={() => router.push(`/immersion/${video.id}`)}
                                    className={cn(
                                        "group cursor-pointer bg-white border border-sakura-divider hover:border-sakura-cocoa/30 hover:shadow-lg transition-all duration-300",
                                        viewMode === 'grid'
                                            ? "rounded-[2rem] overflow-hidden flex flex-col"
                                            : "rounded-3xl p-4 flex flex-row items-center gap-6"
                                    )}
                                >
                                    {/* Thumbnail */}
                                    <div className={cn(
                                        "relative overflow-hidden bg-slate-100",
                                        viewMode === 'grid' ? "aspect-video w-full" : "aspect-video w-48 rounded-2xl flex-shrink-0"
                                    )}>
                                        <img
                                            src={video.thumbnail}
                                            alt={video.title}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                        />
                                        <div className="absolute inset-0 bg-sakura-cocoa/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-sakura-cocoa scale-90 group-hover:scale-100 transition-transform border border-sakura-divider">
                                                <Play fill="currentColor" size={24} />
                                            </div>
                                        </div>
                                        {video.duration && (
                                            <div className="absolute bottom-3 right-3 px-2 py-1 bg-sakura-ink text-white text-[10px] font-black rounded-lg">
                                                {video.duration}
                                            </div>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className={cn(
                                        "flex-1 flex flex-col",
                                        viewMode === 'grid' ? "p-6" : "pr-4"
                                    )}>
                                        <div className="flex items-start justify-between gap-4">
                                            <h3 className="text-sm font-black text-sakura-ink line-clamp-2 leading-tight group-hover:text-red-500 transition-colors">
                                                {video.title}
                                            </h3>
                                            <button
                                                onClick={(e) => handleDeleteVideo(e, video.id)}
                                                className="p-2 rounded-xl text-sakura-cocoa/20 hover:bg-red-50 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>

                                        <div className="mt-4 pt-4 border-t border-sakura-divider/40 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-sakura-cocoa/40">
                                            <div className="flex items-center gap-2">
                                                <Clock size={12} />
                                                {new Date(video.addedAt).toLocaleDateString()}
                                            </div>
                                            {viewMode === 'list' && (
                                                <div className="flex items-center gap-1 text-red-500">
                                                    RESUME
                                                    <ChevronRight size={12} />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-32 bg-sakura-bg-app rounded-[3rem] border border-sakura-divider shadow-inner">
                            <div className="w-20 h-20 rounded-[2rem] bg-sakura-cocoa/5 flex items-center justify-center mx-auto mb-6 text-sakura-cocoa/20">
                                <Youtube size={40} />
                            </div>
                            <h3 className="text-2xl font-black text-sakura-ink uppercase tracking-tighter">Null Chronicle</h3>
                            <p className="mt-2 text-[10px] text-sakura-cocoa/40 font-black uppercase tracking-widest">Your immersion library is empty</p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}

export default function ImmersionLibraryPage() {
    return (
        <Suspense fallback={null}>
            <ImmersionLibraryContent />
        </Suspense>
    );
}

function SuggestionChip({ icon: Icon, text, onClick }: { icon: any, text: string, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className="flex items-center gap-3 px-5 py-3 bg-white hover:bg-sakura-bg-app border border-sakura-divider rounded-2xl text-left transition-all group"
        >
            <div className="w-8 h-8 rounded-xl bg-white border border-sakura-divider flex items-center justify-center text-sakura-cocoa/40 group-hover:text-red-500 transition-all">
                <Icon size={16} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-sakura-ink flex-1">{text}</span>
        </button>
    );
}
