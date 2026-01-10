"use client";

import React from 'react';
import { Brain } from 'lucide-react';
import { useEffect } from 'react';

export default function Loading() {
    useEffect(() => {
        // Ensure pointer events are restored when unmounted
        return () => {
            document.body.style.pointerEvents = 'auto';
        };
    }, []);

    return (
        <div data-testid="global-loading">
            <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white pointer-events-none">
                <div className="relative flex flex-col items-center gap-8">
                    {/* Simple Spinner */}
                    <div className="relative w-32 h-32 flex items-center justify-center">
                        <div className="w-16 h-16 bg-white border-2 border-slate-200 rounded-2xl flex items-center justify-center z-10 animate-spin">
                            <Brain className="text-blue-500" size={32} />
                        </div>
                    </div>

                    {/* Progress Text */}
                    <div className="text-center space-y-2 z-10">
                        <h2 className="text-xl font-bold text-slate-800 animate-pulse">
                            Loading...
                        </h2>
                    </div>
                </div>
            </div>
        </div>
    );
}
