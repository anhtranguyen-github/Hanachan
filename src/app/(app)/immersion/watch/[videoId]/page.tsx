'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { YouTubeComponent } from '@/features/youtube/components/YouTubeComponent';

export default function ImmersionWatchPage() {
    const params = useParams<{ videoId: string }>();
    const videoId = params?.videoId;

    if (!videoId) {
        return (
            <div data-testid="yt-watch-error" className="p-10">
                Missing video id.
            </div>
        );
    }

    return (
        <div data-testid="yt-watch-ready" className="h-[calc(100vh-0px)]">
            <YouTubeComponent videoId={videoId} />
        </div>
    );
}
