'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import ReactPlayer from 'react-player/youtube';
import {
    Play,
    Pause,
    RotateCcw,
    Settings,
    ChevronLeft,
    ChevronRight,
    Languages,
    FileText,
    Type,
    Library,
    SkipBack,
    Rewind,
    FastForward,
    SkipForward,
    Repeat,
    Plus,
    Minus,
    Monitor,
    Keyboard,
    BarChart3,
    Maximize2,
    Sparkles,
    Lightbulb
} from 'lucide-react';
// --- Mock Actions ---
const analyzeSentenceAction = async (text: string, options: any) => ({
    sentence: text,
    tokens: [],
    grammar: [],
    explanation: "This is a mock analysis for demonstration purposes."
});
const getLibraryVideosAction = async () => [];
const addVideoToLibraryAction = async (data: any) => ({});
const removeVideoFromLibraryAction = async (videoId: string) => ({});
const getTranscriptAction = async (videoId: string, lang: string) => {
    if (lang === 'ja') return [{ text: "こんにちは、世界！", duration: 3000, offset: 0 }];
    return [{ text: "Hello, World!", duration: 3000, offset: 0 }];
};

import { GrammarPanel } from '@/features/analysis/components/GrammarPanel';
import { toast } from 'sonner';
import { useUser } from '@/features/auth/AuthContext';
import { cn } from '@/lib/utils';
import { FuriganaConverterV2 } from '@/features/analysis/components/FuriganaConverterV2';
import { DictionaryPanel } from '@/features/analysis/components/DictionaryPanel';
import type { TokenResult, AnalyzerResponse } from '@/types/ai.types';

interface TranscriptPart {
    text: string;
    duration: number;
    offset: number;
    englishText?: string;
}

interface YouTubeComponentProps {
    videoId: string;
    onBackToLibrary?: () => void;
}

type PlayerSize = 'S' | 'M' | 'L';
type Tab = 'Transcript' | 'Shortcuts' | 'Progress' | 'Advanced';
type LanguageMode = 'Jp' | 'En' | 'Jp+En';

export function YouTubeComponent({ videoId, onBackToLibrary }: YouTubeComponentProps) {
    // Player State
    const [playing, setPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [looping, setLooping] = useState(false);
    const [playerSize, setPlayerSize] = useState<PlayerSize>('M');

    // Data State
    const [transcript, setTranscript] = useState<TranscriptPart[]>([]);
    const [englishTranscript, setEnglishTranscript] = useState<TranscriptPart[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaved, setIsSaved] = useState(false);
    const [selectedToken, setSelectedToken] = useState<TokenResult | null>(null);

    // UI State
    const [activeTab, setActiveTab] = useState<Tab>('Transcript');
    const [langMode, setLangMode] = useState<LanguageMode>('Jp');
    const [fontSize, setFontSize] = useState(100); // Percentage
    const [showFurigana, setShowFurigana] = useState(true);

    // Analysis State
    const [analysisResult, setAnalysisResult] = useState<AnalyzerResponse | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [showAnalysis, setShowAnalysis] = useState(false);

    const playerRef = useRef<ReactPlayer>(null);
    const transcriptListRef = useRef<HTMLDivElement>(null);

    // --- Data Fetching (Same as before) ---
    useEffect(() => {
        const checkLibrary = async () => {
            try {
                const videos = await getLibraryVideosAction();
                const saved = videos.some((v: any) => v.video_id === videoId);
                setIsSaved(saved);
            } catch (e) {
                console.error('Failed to check library status', e);
            }
        };
        checkLibrary();
    }, [videoId]);

    const toggleLibrary = async () => {
        try {
            if (isSaved) {
                await removeVideoFromLibraryAction(videoId);
                setIsSaved(false);
                toast.success("Removed from library");
            } else {
                await addVideoToLibraryAction({
                    videoId,
                    title: `Video ${videoId}`,
                    duration: Math.floor(duration),
                    thumbnail_url: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
                });
                setIsSaved(true);
                toast.success("Saved to library");
            }
        } catch (e) {
            console.error('Failed to toggle library', e);
        }
    };

    useEffect(() => {
        const fetchTranscripts = async () => {
            setIsLoading(true);
            try {
                const cacheKey = `yt-transcript-${videoId}`;
                const cached = localStorage.getItem(cacheKey);

                if (cached) {
                    const data = JSON.parse(cached);
                    setTranscript(Array.isArray(data.ja) ? data.ja : []);
                    setEnglishTranscript(Array.isArray(data.en) ? data.en : []);
                    setIsLoading(false);
                    return;
                }

                const jaData = await getTranscriptAction(videoId, 'ja');
                let enData = [];
                try {
                    enData = await getTranscriptAction(videoId, 'en');
                } catch (e) {
                    console.warn('Failed to fetch English transcript');
                }

                const safeJaData = Array.isArray(jaData) ? jaData : [];
                const safeEnData = Array.isArray(enData) ? enData : [];

                setTranscript(safeJaData);
                setEnglishTranscript(safeEnData);

                localStorage.setItem(cacheKey, JSON.stringify({ ja: safeJaData, en: safeEnData }));
            } catch (err) {
                console.error('Failed to load transcripts:', err);
                setTranscript([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchTranscripts();
    }, [videoId]);

    // --- Helper Functions ---
    const currentPartIndex = useMemo(() => {
        if (!Array.isArray(transcript)) return -1;
        return transcript.findIndex(p =>
            currentTime * 1000 >= p.offset &&
            currentTime * 1000 < p.offset + p.duration
        );
    }, [transcript, currentTime]);

    const currentJapanese = Array.isArray(transcript) ? transcript[currentPartIndex] : null;

    const currentEnglish = useMemo(() => {
        if (!currentJapanese || !Array.isArray(englishTranscript) || englishTranscript.length === 0) return null;
        return englishTranscript.find(p =>
            (p.offset >= currentJapanese.offset && p.offset < currentJapanese.offset + currentJapanese.duration) ||
            (currentJapanese.offset >= p.offset && currentJapanese.offset < p.offset + p.duration)
        );
    }, [currentJapanese, englishTranscript]);

    const handleProgress = (state: { playedSeconds: number }) => {
        setCurrentTime(state.playedSeconds);
    };

    const seekTo = (seconds: number) => {
        playerRef.current?.seekTo(seconds, 'seconds');
        setCurrentTime(seconds);
    };

    const skipTime = (seconds: number) => {
        const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
        seekTo(newTime);
    };

    const prevLine = () => {
        if (currentPartIndex > 0) {
            seekTo(transcript[currentPartIndex - 1].offset / 1000);
        }
    };

    const nextLine = () => {
        if (currentPartIndex < transcript.length - 1) {
            seekTo(transcript[currentPartIndex + 1].offset / 1000);
        }
    };

    const handleAnalyzeLine = async () => {
        if (!currentJapanese) return;
        setIsAnalyzing(true);
        try {
            const result = await analyzeSentenceAction(currentJapanese.text, {
                include_dictionary: true,
                include_grammar: true,
                explain: true
            });
            setAnalysisResult(result as any);
            setShowAnalysis(true);
        } catch (err) {
            console.error('Failed to analyze line:', err);
            toast.error("Failed to analyze line");
        } finally {
            setIsAnalyzing(false);
        }
    };

    // --- Render Helpers ---
    const getContainerWidth = () => {
        switch (playerSize) {
            case 'S': return 'max-w-2xl';
            case 'M': return 'max-w-4xl';
            case 'L': return 'max-w-6xl';
            default: return 'max-w-4xl';
        }
    };

    return (
        <div className="flex flex-col lg:grid lg:grid-cols-12 gap-0 h-full overflow-hidden bg-transparent">
            {/* Left Column: Player & Controls (8 cols) */}
            <div className="lg:col-span-8 flex flex-col h-full bg-sakura-ink relative">
                {/* 1. Video Area (Ocean Waves aesthetic) */}
                <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">

                    <div className="w-full aspect-video z-10 shadow-2xl relative">
                        <ReactPlayer
                            ref={playerRef}
                            url={`https://www.youtube.com/watch?v=${videoId}`}
                            width="100%"
                            height="100%"
                            playing={playing}
                            loop={looping}
                            onProgress={handleProgress}
                            onDuration={setDuration}
                            onPlay={() => setPlaying(true)}
                            onPause={() => setPlaying(false)}
                            config={{
                                playerVars: { cc_load_policy: 0, modestbranding: 1 }
                            }}
                        />
                    </div>

                    {/* Overlay: Current Subtitle (Hana Solid) */}
                    <div className="absolute bottom-12 left-0 right-0 p-8 flex justify-center pointer-events-none z-20">
                        <div className="bg-white px-10 py-5 rounded-[2.5rem] border border-sakura-divider text-center max-w-4xl shadow-lg">
                            <div className="text-2xl md:text-3xl font-black text-sakura-ink leading-tight tracking-tight">
                                {currentJapanese?.text || <span className="opacity-20">---</span>}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Controls Bar (Sakura V2 Neutral) */}
                <div className="bg-white border-t border-sakura-divider p-4 lg:p-6 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <button onClick={() => skipTime(-5)} className="p-3 rounded-xl bg-white text-sakura-cocoa/40 hover:text-sakura-ink border border-sakura-divider transition-all shadow-sm">
                            <Rewind size={18} fill="currentColor" />
                        </button>
                        <button
                            onClick={() => setPlaying(!playing)}
                            className="w-14 h-14 rounded-2xl bg-sakura-cocoa text-white flex items-center justify-center transition-all active:scale-95 shadow-lg shadow-sakura-cocoa/20"
                        >
                            {playing ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" className="ml-1" />}
                        </button>
                        <button onClick={() => skipTime(5)} className="p-3 rounded-xl bg-white text-sakura-cocoa/40 hover:text-sakura-ink border border-sakura-divider transition-all shadow-sm">
                            <FastForward size={18} fill="currentColor" />
                        </button>
                    </div>

                    <div className="hidden md:flex items-center gap-4">
                        <div className="flex items-center gap-2 bg-sakura-bg-app px-3 py-2 rounded-xl border border-sakura-divider">
                            <button onClick={() => setFontSize(Math.max(80, fontSize - 10))} className="text-sakura-cocoa/40 hover:text-sakura-ink"><Minus size={14} /></button>
                            <span className="text-[10px] font-black min-w-[32px] text-center text-sakura-ink uppercase tracking-widest">{fontSize}%</span>
                            <button onClick={() => setFontSize(Math.min(150, fontSize + 10))} className="text-sakura-cocoa/40 hover:text-sakura-ink"><Plus size={14} /></button>
                        </div>
                        <button
                            onClick={() => setLooping(!looping)}
                            className={cn(
                                "p-3 rounded-xl border transition-all",
                                looping ? "bg-purple-500 text-white border-purple-600" : "bg-white text-sakura-cocoa/40 border-sakura-divider"
                            )}
                        >
                            <Repeat size={18} />
                        </button>
                        <button
                            onClick={toggleLibrary}
                            className={cn(
                                "p-3 rounded-xl border transition-all",
                                isSaved
                                    ? "bg-red-500 text-white border-red-600"
                                    : "bg-white text-sakura-cocoa/40 border-sakura-divider"
                            )}
                        >
                            <Library size={18} fill={isSaved ? "currentColor" : "none"} />
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleAnalyzeLine}
                            disabled={isAnalyzing}
                            className="px-6 py-3 rounded-xl bg-sakura-ink text-white font-black text-[10px] uppercase tracking-widest flex items-center gap-3 hover:opacity-90 transition-all active:scale-95 shadow-lg"
                        >
                            {isAnalyzing ? <RotateCcw size={14} className="animate-spin" /> : <Sparkles size={14} className="text-purple-400" />}
                            Synthesis
                        </button>
                    </div>
                </div>
            </div>

            {/* Right Column: Transcript (4 cols) */}
            <div className="lg:col-span-4 flex flex-col h-full border-l border-sakura-divider bg-white">
                <div className="p-5 border-b border-sakura-divider bg-white flex items-center justify-between">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-sakura-cocoa/60">Chronicle Transcript</h3>
                    <div className="flex gap-1">
                        {(['Jp', 'En', 'Jp+En'] as LanguageMode[]).map(mode => (
                            <button
                                key={mode}
                                onClick={() => setLangMode(mode)}
                                className={cn(
                                    "px-3 py-1.5 rounded-lg text-[9px] font-black transition-all border uppercase tracking-wider",
                                    langMode === mode
                                        ? "bg-sakura-cocoa text-white border-sakura-cocoa shadow-md"
                                        : "bg-sakura-bg-app text-sakura-cocoa/40 border-sakura-divider hover:bg-white"
                                )}
                            >
                                {mode}
                            </button>
                        ))}
                    </div>
                </div>

                <div
                    ref={(el) => { (transcriptListRef.current as any) = el; }}
                    className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar scroll-smooth"
                >
                    {isLoading ? (
                        <div className="h-full flex flex-col items-center justify-center gap-3">
                            <RotateCcw className="animate-spin text-purple-600" size={32} />
                            <p className="text-[10px] font-black uppercase tracking-widest text-sakura-cocoa/40">Loading Archive…</p>
                        </div>
                    ) : transcript.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-sakura-cocoa/40 font-black uppercase tracking-widest text-[10px]">
                            No Chronicle Subtitles
                        </div>
                    ) : (
                        transcript.map((line, idx) => {
                            const isActive = idx === currentPartIndex;
                            return (
                                <div
                                    key={idx}
                                    onClick={() => seekTo(line.offset / 1000)}
                                    className={cn(
                                        "p-5 rounded-[1.5rem] transition-all cursor-pointer border",
                                        isActive
                                            ? "bg-white border-sakura-divider shadow-md scale-[1.02] z-10"
                                            : "bg-sakura-bg-app border-transparent hover:bg-white hover:border-sakura-divider"
                                    )}
                                >
                                    <div className={cn(
                                        "font-black leading-relaxed transition-all tracking-tight",
                                        isActive ? "text-sakura-ink text-lg" : "text-sakura-cocoa/40 text-sm"
                                    )}>
                                        {showFurigana && isActive ? (
                                            <FuriganaConverterV2 text={line.text} onTokenClick={setSelectedToken} />
                                        ) : (
                                            line.text
                                        )}
                                    </div>
                                    {(langMode === 'En' || langMode === 'Jp+En') && (
                                        <div className={cn(
                                            "text-[11px] font-medium mt-2 leading-relaxed opacity-60",
                                            isActive ? "text-sakura-cocoa" : "text-sakura-cocoa/40"
                                        )}>
                                            {/* In a real app index-match englishTranscript */}
                                            {line.englishText || `Synthesis for: ${line.text}`}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Dictionary/Analysis Panel (Overlays bottom of transcript) */}
                {analysisResult && showAnalysis && (
                    <div className="h-2/5 border-t border-sakura-divider bg-white overflow-y-auto animate-in slide-in-from-bottom duration-500 z-30 shadow-2xl">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-purple-600">Deep Analysis</h4>
                                <button onClick={() => setShowAnalysis(false)} className="p-2 text-sakura-cocoa/40 hover:text-red-500 transition-colors">
                                    <Minus size={18} />
                                </button>
                            </div>
                            <div className="space-y-6">
                                <div className="bg-sakura-bg-app p-5 rounded-2xl border border-sakura-divider">
                                    <p className="text-xs text-sakura-ink leading-relaxed font-bold">
                                        {analysisResult.explanation}
                                    </p>
                                </div>
                                <GrammarPanel matches={analysisResult.grammar} />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Selection Popup (Dictionary) */}
            {selectedToken && (
                <div className="fixed inset-0 bg-[#4A3728]/80 z-[100] flex items-center justify-center p-6">
                    <div className="bg-white w-full max-w-md rounded-[3rem] p-10 shadow-2xl border border-sakura-divider relative animate-in zoom-in duration-300">
                        <button
                            onClick={() => setSelectedToken(null)}
                            title="Close"
                            className="absolute top-8 right-8 p-2 text-sakura-cocoa/40 hover:text-sakura-ink bg-sakura-cocoa/5 rounded-full transition-all"
                        >
                            <Minus size={20} />
                        </button>
                        <DictionaryPanel token={selectedToken} onClose={() => setSelectedToken(null)} />
                    </div>
                </div>
            )}
        </div>
    );
}

// Helper Control component removed/integrated above for cleaner code
