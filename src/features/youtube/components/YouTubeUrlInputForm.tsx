'use client';

import React, { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';

interface YouTubeUrlInputFormProps {
    onSubmit: (url: string) => void;
    isLoading?: boolean;
}

export function YouTubeUrlInputForm({ onSubmit, isLoading }: YouTubeUrlInputFormProps) {
    const [url, setUrl] = useState('');
    const [error, setError] = useState<string | null>(null);

    const validateUrl = (value: string) => {
        const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
        return regex.test(value);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedUrl = url.trim();

        if (!trimmedUrl) return;

        if (!validateUrl(trimmedUrl)) {
            setError('Invalid YouTube URL. Please provide a valid video link.');
            return;
        }

        setError(null);
        onSubmit(trimmedUrl);
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-sakura-text-muted" size={20} />
                    <input
                        type="url"
                        placeholder="Paste YouTube URL (e.g. https://www.youtube.com/watch?v=...)"
                        value={url}
                        onChange={(e) => {
                            setUrl(e.target.value);
                            if (error) setError(null);
                        }}
                        className="w-full pl-12 pr-4 py-4 rounded-2xl bg-sakura-bg-soft border border-sakura-divider focus:border-sakura-accent-primary outline-none font-bold text-sakura-text-primary transition-all"
                        required
                    />
                </div>
                <button
                    type="submit"
                    disabled={isLoading}
                    className="px-8 py-4 bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 min-w-[160px]"
                >
                    {isLoading ? <Loader2 className="animate-spin" /> : 'Add Video'}
                </button>
            </div>
            {error && (
                <p className="text-red-500 text-sm font-bold ml-2 animate-in fade-in slide-in-from-top-1">
                    {error}
                </p>
            )}
        </form>
    );
}
