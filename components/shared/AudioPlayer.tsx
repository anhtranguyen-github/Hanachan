'use client';

import React from 'react';
import { Volume2 } from 'lucide-react';

interface AudioItem {
    url: string;
    actor?: string;
    description?: string;
    content_type?: string;
}

interface AudioPlayerProps {
    items: AudioItem[];
    showLabels?: boolean;
}

export function AudioPlayer({ items, showLabels }: AudioPlayerProps) {
    // Standardize: Group by actor to avoid showing duplicates (e.g. webm and mpeg for same person)
    const actorsMap = new Map<string, AudioItem>();

    // Process items: prefer mpeg but keep actor uniqueness
    if (Array.isArray(items)) {
        items.forEach(item => {
            if (!item) return;
            const key = item.actor || 'Unknown';
            const existing = actorsMap.get(key);
            if (!existing || (item.content_type === 'audio/mpeg' && existing.content_type !== 'audio/mpeg')) {
                actorsMap.set(key, item);
            }
        });
    }

    const playList = Array.from(actorsMap.values());

    const play = (url: string) => {
        const audio = new Audio(url);
        audio.play().catch(e => console.error("Audio play failed:", e));
    };

    if (playList.length === 0) return null;

    return (
        <div className="flex flex-wrap gap-3">
            {playList.map((audio, idx) => (
                <button
                    key={idx}
                    onClick={() => play(audio.url)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white border-2 border-primary-dark rounded-clay shadow-clay-sm hover:-translate-y-0.5 active:translate-y-0 transition-all group"
                >
                    <Volume2 size={14} className="text-primary group-hover:scale-110 transition-transform" />
                    {showLabels && (
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary-dark">
                            {audio.actor || "Play"}
                            <span className="ml-2 opacity-30 font-bold hidden md:inline">{audio.description?.replace(/[()]/g, '')}</span>
                        </span>
                    )}
                </button>
            ))}
        </div>
    );
}
