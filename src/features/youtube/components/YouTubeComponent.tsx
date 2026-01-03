'use client';

import React, { useState } from 'react';
import { Button } from '@/ui/components/ui/button';
import { Play, Pause, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface YouTubeComponentProps {
    videoId: string;
    onBackToLibrary?: () => void;
}

export function YouTubeComponent({ videoId }: YouTubeComponentProps) {
    const [isPlaying, setIsPlaying] = useState(false);

    return (
        <div className="flex flex-col h-full bg-slate-900 text-white overflow-hidden">
            {/* Mock Player Area */}
            <div className="relative aspect-video bg-black flex items-center justify-center">
                {!isPlaying ? (
                    <div className="text-center space-y-4">
                        <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center mx-auto cursor-pointer hover:bg-red-700 transition" onClick={() => setIsPlaying(true)}>
                            <Play className="w-8 h-8 text-white ml-1" />
                        </div>
                        <p className="font-semibold">Click to Load Video</p>
                        <p className="text-xs text-slate-400">ID: {videoId}</p>
                    </div>
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800">
                        <iframe
                            width="100%"
                            height="100%"
                            src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
                            title="YouTube video player"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        />
                    </div>
                )}
            </div>

            {/* Mock Controls / Transcript Area */}
            <div className="flex-1 bg-white text-slate-900 p-6 overflow-auto">
                <div className="max-w-4xl mx-auto space-y-6">
                    <div className="flex items-center justify-between border-b pb-4">
                        <h2 className="text-xl font-bold">Transcript</h2>
                        <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-500">Auto-Generated</span>
                    </div>

                    <div className="space-y-4">
                        <div className="p-4 rounded-lg hover:bg-slate-50 cursor-pointer border border-transparent hover:border-slate-200 transition">
                            <p className="text-lg font-medium text-slate-800">こんにちは、みなさん。</p>
                            <p className="text-sm text-slate-500">Hello, everyone.</p>
                        </div>
                        <div className="p-4 rounded-lg hover:bg-slate-50 cursor-pointer border border-transparent hover:border-slate-200 transition">
                            <p className="text-lg font-medium text-slate-800">今日は日本語を勉強しましょう。</p>
                            <p className="text-sm text-slate-500">Let's study Japanese today.</p>
                        </div>
                        <div className="p-4 rounded-lg bg-blue-50 border border-blue-100 cursor-pointer transition">
                            <p className="text-lg font-medium text-blue-900">このアプリはフロントエンドのみで動作しています。</p>
                            <p className="text-sm text-blue-600">This app is running frontend-only.</p>
                        </div>
                    </div>

                    <div className="p-4 bg-amber-50 rounded border border-amber-200 flex gap-3 text-amber-800 text-sm">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <p>
                            Video analysis is mocked. To enable full AI features, a backend connection is required.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
