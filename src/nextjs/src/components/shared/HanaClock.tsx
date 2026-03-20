
'use client';

import React, { useState, useEffect } from 'react';
import { HanaTime } from '@/lib/time';
import { Clock, Play, Pause, FastForward, RotateCcw, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';

export const HanaClock = () => {
    const [currentTime, setCurrentTime] = useState(HanaTime.getNow());
    const [speed, setSpeed] = useState(HanaTime.getSpeed());
    const [isPaused, setIsPaused] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(HanaTime.getNow());
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const handleSpeedChange = (newSpeed: number) => {
        HanaTime.setSpeed(newSpeed);
        setSpeed(newSpeed);
    };

    const handleTogglePause = () => {
        HanaTime.togglePause();
        setIsPaused(!isPaused);
    };

    const handleSkipHour = () => {
        HanaTime.skipTime(3600 * 1000);
        setCurrentTime(HanaTime.getNow());
    };

    const handleReset = () => {
        HanaTime.reset();
        setSpeed(1);
        setIsPaused(false);
        setCurrentTime(HanaTime.getNow());
    };

    return (
        <div className={clsx(
            "fixed bottom-6 right-6 z-[9999] transition-all duration-500",
            isExpanded ? "w-80" : "w-14"
        )}>
            <div className="bg-[#3E4A61] text-white rounded-3xl shadow-2xl overflow-hidden border border-white/10">
                {/* Header / Toggle */}
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="w-full h-14 flex items-center justify-between px-4 hover:bg-white/5 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <div className={clsx(
                            "w-8 h-8 rounded-xl flex items-center justify-center transition-all",
                            speed > 1 ? "bg-primary text-white" : "bg-white/10 text-white/40"
                        )}>
                            <Clock size={16} className={clsx(speed > 1 && "animate-spin-slow")} />
                        </div>
                        {isExpanded && (
                            <div className="text-left">
                                <span className="text-[10px] font-black uppercase tracking-widest text-white/40 block leading-none">HanaTime</span>
                                <span className="text-sm font-black tracking-tight">{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                            </div>
                        )}
                    </div>
                    {isExpanded ? (
                        <div className="flex items-center gap-1.5 bg-black/20 px-2 py-1 rounded-lg">
                            <span className="text-[8px] font-black uppercase tracking-widest text-[#FFB5B5]">{speed}x</span>
                        </div>
                    ) : (
                        <ChevronRight size={14} className={clsx("text-white/20 transition-transform", isExpanded && "rotate-180")} />
                    )}
                </button>

                {/* Controls */}
                {isExpanded && (
                    <div className="p-6 space-y-6 border-t border-white/5 animate-in fade-in slide-in-from-bottom-2">
                        {/* Speed Presets */}
                        <div className="grid grid-cols-4 gap-2">
                            {[1, 60, 1440, 8640].map(s => (
                                <button
                                    key={s}
                                    onClick={() => handleSpeedChange(s)}
                                    className={clsx(
                                        "py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all",
                                        speed === s ? "bg-primary border-primary text-white" : "bg-white/5 border-white/5 text-white/40 hover:bg-white/10"
                                    )}
                                >
                                    {s === 1 ? 'REAL' : s === 60 ? '1H/M' : s === 1440 ? '4H/10S' : '6D/M'}
                                </button>
                            ))}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleTogglePause}
                                className="flex-1 h-12 bg-white/5 hover:bg-white/10 rounded-2xl flex items-center justify-center gap-2 transition-all border border-white/5"
                            >
                                {isPaused ? <Play size={16} /> : <Pause size={16} />}
                                <span className="text-[9px] font-black uppercase tracking-widest">{isPaused ? 'RESUME' : 'PAUSE'}</span>
                            </button>
                            <button
                                onClick={handleSkipHour}
                                className="w-12 h-12 bg-white/5 hover:bg-white/10 rounded-2xl flex items-center justify-center transition-all border border-white/5"
                                title="Skip 1 Hour"
                            >
                                <FastForward size={16} />
                            </button>
                            <button
                                onClick={handleReset}
                                className="w-12 h-12 bg-white/5 hover:bg-white/10 rounded-2xl flex items-center justify-center transition-all border border-white/5"
                                title="Reset to Real Time"
                            >
                                <RotateCcw size={16} />
                            </button>
                        </div>

                        <div className="pt-4 border-t border-white/5">
                            <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.2em] leading-relaxed">
                                Accelerated simulation active. SRS due dates and dashboard forecasts will respond to this clock.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
