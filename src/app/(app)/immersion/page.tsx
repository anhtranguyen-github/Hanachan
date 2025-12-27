
'use client';

import React, { useState, useEffect } from 'react';
import { LibraryView } from '@/features/library/components/LibraryView';
import { VideoMetadata } from '@/features/library/types';
import { listVideosAction, addVideoAction } from '@/features/library/actions';

export default function ImmersionPage() {
    const [videos, setVideos] = useState<VideoMetadata[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadVideos = async () => {
        const list = await listVideosAction();
        setVideos(list as any);
        setIsLoading(false);
    };

    useEffect(() => {
        loadVideos();
    }, []);

    const handleAddVideo = async (url: string) => {
        // If url is empty (from button click), prompt user
        const targetUrl = url || prompt("Enter YouTube URL:");
        if (!targetUrl) return;

        setIsLoading(true); // Show generic loading or keep list
        const result = await addVideoAction(targetUrl);
        if (result.success) {
            await loadVideos();
        } else {
            alert(result.error || "Failed to add video");
            setIsLoading(false); // only need to reset if not calling loadVideos
        }
    };

    const handleSelectVideo = (videoId: string) => {
        window.location.href = `/immersion/watch/${videoId}`;
    };

    if (isLoading) return <div className="p-20 text-center font-bold animate-pulse">Scanning Archive...</div>;

    return (
        <div data-testid="immersion-ready">
            <div data-testid="youtube-ready" />
            <LibraryView
                videos={videos}
                onAddVideo={handleAddVideo}
                onSelectVideo={handleSelectVideo}
            />
        </div>
    );
}
