
'use client';

import React from 'react';
import { HanaButton } from '@/ui/components/hana/Button';
import { HanaCard } from '@/ui/components/hana/Card';
import { Play, Clock, Star, Search, Plus, Youtube } from 'lucide-react';
import { cn } from '@/lib/utils';
import { VideoMetadata } from '../types';

interface LibraryViewProps {
    videos: VideoMetadata[];
    onAddVideo: (url: string) => void;
    onSelectVideo: (videoId: string) => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({ videos, onAddVideo, onSelectVideo }) => {
    return (
        <div data-testid="immersion-library" className="max-w-7xl mx-auto space-y-10 p-6 md:p-12">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-torii-red/10 text-torii-red text-[10px] font-black uppercase tracking-widest">
                        <Youtube size={14} /> Immersion Lab
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-sakura-ink tracking-tight uppercase">Video Library</h1>
                    <p className="text-sakura-cocoa/60 font-bold">Watch, mine, and master Japanese from YouTube.</p>
                </div>
                <div className="flex gap-3">
                    <HanaButton variant="secondary">
                        <Search size={18} />
                    </HanaButton>
                    <HanaButton data-testid="add-video-button" onClick={() => onAddVideo('')}>
                        <Plus size={18} /> Add Video
                    </HanaButton>
                </div>
            </header>

            <div data-testid="video-list" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {videos.map((video) => (
                    <VideoCard
                        key={video.id}
                        video={video}
                        onClick={() => onSelectVideo(video.video_id)}
                    />
                ))}

                {videos.length === 0 && (
                    <div data-testid="video-empty-state" className="col-span-full py-20 flex flex-col items-center justify-center text-center space-y-4 opacity-40">
                        <div className="w-20 h-20 rounded-full bg-sakura-divider flex items-center justify-center">
                            <Youtube size={32} />
                        </div>
                        <p className="font-black text-lg uppercase">Your library is empty</p>
                        <HanaButton data-testid="add-first-video" variant="outline" onClick={() => onAddVideo('')}>Add your first video</HanaButton>
                    </div>
                )}
            </div>
        </div>
    );
};

const VideoCard = ({ video, onClick }: { video: VideoMetadata, onClick: () => void }) => (
    <HanaCard
        variant="clay"
        padding="none"
        className="group overflow-hidden hover:scale-[1.02] cursor-pointer"
        onClick={onClick}
    >
        {/* Thumbnail Area */}
        <div className="relative aspect-video bg-sakura-divider/20 overflow-hidden">
            {video.thumbnail_url ? (
                <img src={video.thumbnail_url} alt={video.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
            ) : (
                <div className="w-full h-full flex items-center justify-center">
                    <Youtube size={48} className="text-sakura-divider" />
                </div>
            )}
            <div className="absolute inset-0 bg-sakura-ink/0 group-hover:bg-sakura-ink/40 transition-colors flex items-center justify-center">
                <div className="w-14 h-14 rounded-full bg-sakura-pink text-white flex items-center justify-center opacity-0 group-hover:opacity-100 scale-50 group-hover:scale-100 transition-all duration-300">
                    <Play size={24} fill="currentColor" />
                </div>
            </div>
            {/* Progress Bar */}
            <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/20">
                <div
                    className="h-full bg-sakura-pink transition-all"
                    style={{ width: `${video.status === 'completed' ? 100 : 30}%` }}
                />
            </div>
        </div>

        {/* Content Area */}
        <div className="p-6 space-y-3">
            <div className="flex items-start justify-between gap-4">
                <h3 className="font-black text-lg leading-tight line-clamp-2 uppercase">{video.title || 'Untitled Video'}</h3>
                <Star size={18} className="text-sakura-divider group-hover:text-banana-yellow transition-colors shrink-0" />
            </div>

            <div className="flex items-center gap-4 text-xs font-black text-sakura-cocoa/40 uppercase tracking-widest">
                <span className="flex items-center gap-1">
                    <Clock size={12} /> 12:45
                </span>
                <span className={cn(
                    "px-2 py-0.5 rounded-md",
                    video.status === 'new' ? "bg-indigo-100 text-indigo-600" :
                        video.status === 'learning' ? "bg-banana-yellow/20 text-yellow-700" :
                            "bg-emerald-100 text-emerald-600"
                )}>
                    {video.status}
                </span>
            </div>
        </div>
    </HanaCard>
);
