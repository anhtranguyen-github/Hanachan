
'use client';

import React, { useEffect, useState } from 'react';
import { MockDB } from '@/lib/mock-db';
import { useUser } from '@/features/auth/AuthContext';
import Link from 'next/link';
import { Play, Plus, Search, Youtube as YoutubeIcon, Clock, Users, X, Link as LinkIcon } from 'lucide-react';

export default function YouTubeImmersionPage() {
    const { user } = useUser();
    const [videos, setVideos] = useState<any[]>([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [videoUrl, setVideoUrl] = useState('');
    const [loading, setLoading] = useState(false);

    const loadVideos = () => {
        MockDB.getYouTubeVideos().then(setVideos);
    };

    useEffect(() => {
        loadVideos();
    }, []);

    const handleAddVideo = async () => {
        if (!videoUrl.trim() || !user) return;
        setLoading(true);

        // Extract video ID from URL
        let videoId = videoUrl;
        if (videoUrl.includes('youtube.com/watch?v=')) {
            videoId = videoUrl.split('v=')[1].split('&')[0];
        } else if (videoUrl.includes('youtu.be/')) {
            videoId = videoUrl.split('youtu.be/')[1].split('?')[0];
        }

        await MockDB.createYouTubeVideo(user.id, videoId, "Imported Video");
        setVideoUrl('');
        setShowAddModal(false);
        setLoading(false);
        loadVideos();
    };

    return (
        <div className="flex flex-col gap-8 pb-20">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-4xl font-black text-primary-dark tracking-tight">YouTube Immersion</h1>
                    <p className="text-primary-dark/70 font-bold">Learn Japanese from your favorite content.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-dark/40" />
                        <input
                            type="text"
                            placeholder="Search in library..."
                            className="clay-input pl-10 h-11 py-0 w-80"
                        />
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="clay-btn h-11 bg-secondary"
                    >
                        <Plus className="w-5 h-5" />
                        Add Video
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {videos.map((vid) => (
                    <Link
                        href={`/immersion/youtube/${vid.video_id}`}
                        key={vid.id}
                        className="clay-card p-0 overflow-hidden flex flex-col group transition-all hover:-translate-y-2 active:scale-[0.98]"
                    >
                        <div className="aspect-video bg-black relative">
                            <img
                                src={`https://img.youtube.com/vi/${vid.video_id}/mqdefault.jpg`}
                                alt={vid.title}
                                className="w-full h-full object-cover group-hover:opacity-70 transition-opacity"
                            />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="w-16 h-16 bg-red-600 rounded-clay flex items-center justify-center shadow-clay border-2 border-white">
                                    <Play className="w-8 h-8 text-white fill-current" />
                                </div>
                            </div>
                            <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/80 text-white text-[10px] font-black rounded border border-white/20">
                                {Math.floor(vid.duration / 60)}:{(vid.duration % 60).toString().padStart(2, '0')}
                            </div>
                        </div>
                        <div className="p-6 flex flex-col gap-4">
                            <div className="flex flex-col gap-1">
                                <h3 className="font-black text-lg text-primary-dark leading-tight line-clamp-2">
                                    {vid.title}
                                </h3>
                                <div className="flex items-center gap-2 text-primary-dark/60 text-xs font-bold">
                                    <YoutubeIcon className="w-3 h-3 text-red-500" />
                                    {vid.channel}
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t-2 border-primary-dark/5">
                                <div className="flex gap-4">
                                    <div className="flex items-center gap-1 text-[10px] font-black uppercase text-primary-dark/40">
                                        <Clock className="w-3 h-3" />
                                        Recent
                                    </div>
                                </div>
                                <div className="text-xs font-black text-primary hover:underline">
                                    Open Player
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Add Video Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-primary-dark/20 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="clay-card max-w-md w-full bg-white p-8 relative animate-in zoom-in-95 duration-200">
                        <button
                            onClick={() => setShowAddModal(false)}
                            className="absolute top-4 right-4 p-2 hover:bg-primary/5 rounded-full"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="flex flex-col gap-6">
                            <div>
                                <h2 className="text-2xl font-black text-primary-dark">Import YouTube Video</h2>
                                <p className="text-sm font-bold text-primary-dark/50">Add a New video to your immersion library via URL.</p>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-black uppercase text-primary-dark/40 pl-1">YouTube URL</label>
                                <div className="relative">
                                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-dark/40" />
                                    <input
                                        type="text"
                                        placeholder="https://www.youtube.com/watch?v=..."
                                        className="clay-input pl-10 py-3"
                                        value={videoUrl}
                                        onChange={(e) => setVideoUrl(e.target.value)}
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handleAddVideo}
                                disabled={!videoUrl.trim() || loading}
                                className="clay-btn w-full py-4 bg-red-600 !text-white disabled:opacity-50"
                            >
                                {loading ? 'Processing...' : 'Add to Library'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
