
'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MockDB } from '@/lib/mock-db';
import { useUser } from '@/features/auth/AuthContext';
import {
    ChevronLeft,
    Play,
    Pause,
    SkipBack,
    SkipForward,
    Volume2,
    Settings,
    Maximize,
    Search,
    Plus,
    Zap,
    MessageCircle,
    Sparkles,
    Youtube as YoutubeIcon,
    History,
    Languages,
    Type,
    ArrowRight,
    X,
    Layers,
    Activity,
    BookOpen,
    Repeat,
    FastForward,
    Wand2,
    Save
} from 'lucide-react';
import { clsx } from 'clsx';
import Link from 'next/link';

export default function YouTubePlayerPage() {
    const { id } = useParams();
    const router = useRouter();
    const { user } = useUser();
    const [video, setVideo] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [selectedSub, setSelectedSub] = useState<any>(null);
    const [furiganaEnabled, setFuriganaEnabled] = useState(true);
    const [translationEnabled, setTranslationEnabled] = useState(true);
    const [selectedToken, setSelectedToken] = useState<any>(null);
    const [showAnalysis, setShowAnalysis] = useState(false);

    // Mining state
    const [miningSentence, setMiningSentence] = useState<any>(null);
    const [isMining, setIsMining] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);

    const transcriptRef = useRef<HTMLDivElement>(null);

    // Mock subtitles with segmentation
    const subtitles = [
        {
            id: 'sub-1', start: 0, end: 5,
            text: 'こんにちは、皆さん。',
            translation: 'Hello, everyone.',
            tokens: [
                { surface: 'こんにちは', reading: 'こんにちは', meaning: 'Hello', type: 'vocabulary' },
                { surface: '、', reading: '', meaning: 'Punctuation', type: 'punctuation' },
                { surface: '皆さん', reading: 'みなさん', meaning: 'Everyone', type: 'vocabulary' },
                { surface: '。', reading: '', meaning: 'Punctuation', type: 'punctuation' },
            ]
        },
        {
            id: 'sub-2', start: 5, end: 10,
            text: '今日は日本語の「イメージ」と「印象」の違いについて話します。',
            translation: 'Today I will talk about the difference between "image" and "impression" in Japanese.',
            tokens: [
                { surface: '今日', reading: 'きょう', meaning: 'Today', type: 'vocabulary' },
                { surface: 'は', reading: 'は', meaning: 'Topic Marker', type: 'particle' },
                { surface: '日本語', reading: 'にほんご', meaning: 'Japanese', type: 'vocabulary' },
                { surface: 'の', reading: 'の', meaning: 'Possessive', type: 'particle' },
                { surface: 'イメージ', reading: 'いめーじ', meaning: 'Image', type: 'vocabulary' },
                { surface: 'と', reading: 'と', meaning: 'And', type: 'particle' },
                { surface: '印象', reading: 'いんしょう', meaning: 'Impression', type: 'vocabulary' },
                { surface: 'の', reading: 'の', meaning: 'Possessive', type: 'particle' },
                { surface: '違い', reading: 'ちがい', meaning: 'Difference', type: 'vocabulary' },
                { surface: 'について', reading: 'について', meaning: 'About', type: 'grammar' },
                { surface: '話します', reading: 'はなします', meaning: 'Will speak', type: 'vocabulary' },
            ]
        },
        {
            id: 'sub-3', start: 10, end: 15,
            text: 'まず、イメージという言葉はカタカナですが...',
            translation: 'First, while the word "image" is Katakana...',
            tokens: [
                { surface: 'まず', reading: 'まず', meaning: 'First', type: 'vocabulary' },
                { surface: 'イメ', reading: 'いめーじ', meaning: 'Image', type: 'vocabulary' },
                { surface: 'ー', reading: '', meaning: '', type: 'vocabulary' },
                { surface: 'ジ', reading: '', meaning: '', type: 'vocabulary' },
                { surface: 'という', reading: 'という', meaning: 'Called', type: 'grammar' },
                { surface: '言葉', reading: 'ことば', meaning: 'Word', type: 'vocabulary' },
                { surface: 'は', reading: 'は', meaning: 'Topic Marker', type: 'particle' },
                { surface: 'カタカナ', reading: 'かたかな', meaning: 'Katakana', type: 'vocabulary' },
                { surface: 'ですが', reading: 'ですが', meaning: 'But', type: 'grammar' },
            ]
        },
        {
            id: 'sub-4', start: 15, end: 20,
            text: '英語の image とは少し使い方が違いますね。',
            translation: 'it is used slightly differently from the English word "image".',
            tokens: [
                { surface: '英語', reading: 'えいご', meaning: 'English', type: 'vocabulary' },
                { surface: 'の', reading: 'の', meaning: 'Possessive', type: 'particle' },
                { surface: 'image', reading: '', meaning: 'image', type: 'vocabulary' },
                { surface: 'とは', reading: 'とは', meaning: 'As for', type: 'grammar' },
                { surface: '少し', reading: 'すこし', meaning: 'Little', type: 'vocabulary' },
                { surface: '使い方', reading: 'つかいかた', meaning: 'Usage', type: 'vocabulary' },
                { surface: 'が', reading: 'が', meaning: 'Subject Marker', type: 'particle' },
                { surface: '違い', reading: 'ちがい', meaning: 'Different', type: 'vocabulary' },
                { surface: 'ます', reading: 'ます', meaning: 'Polite', type: 'suffix' },
                { surface: 'ね', reading: 'ね', meaning: 'Right?', type: 'particle' },
            ]
        },
    ];

    useEffect(() => {
        if (id) {
            MockDB.getYouTubeVideo(id as string).then(res => {
                setVideo(res);
                setLoading(false);
            });
        }
    }, [id]);

    useEffect(() => {
        let interval: any;
        if (isPlaying) {
            interval = setInterval(() => {
                setCurrentTime(t => {
                    const next = t + 0.1;
                    return next >= 20 ? 0 : next;
                });
            }, 100);
        }
        return () => clearInterval(interval);
    }, [isPlaying]);

    const activeSub = subtitles.find(s => currentTime >= s.start && currentTime < s.end);

    useEffect(() => {
        if (activeSub && transcriptRef.current) {
            const activeEl = document.getElementById(`sub-${activeSub.id}`);
            if (activeEl) {
                activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }, [activeSub]);

    const handleMine = (sub: any) => {
        setMiningSentence({
            text_ja: sub.text,
            text_en: sub.translation,
            source: video?.title || 'YouTube'
        });
        setIsMining(true);
        setIsPlaying(false);
    };

    const saveMinedSentence = async () => {
        if (!user || !miningSentence) return;
        await MockDB.createSentence({
            text_ja: miningSentence.text_ja,
            text_en: miningSentence.text_en,
            origin: 'youtube',
            source_text: miningSentence.source,
            created_by: user.id
        });
        setIsMining(false);
        setMiningSentence(null);
    };

    const simulateAIRewrite = async () => {
        setIsGenerating(true);
        await new Promise(r => setTimeout(r, 1200));
        setMiningSentence({
            ...miningSentence,
            text_ja: miningSentence.text_ja + " (AI Corrected)",
            text_en: "AI Refined translation for better natural flow."
        });
        setIsGenerating(false);
    };

    if (loading) return <div className="p-12 animate-pulse text-center font-black">Loading Player Ecosystem...</div>;
    if (!video) return <div className="p-12 text-center font-black">Video not found.</div>;

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)]">
            <header className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="w-10 h-10 bg-white border-2 border-primary-dark rounded-clay flex items-center justify-center text-primary-dark hover:bg-primary/5 transition-all shadow-clay active:scale-95"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <div className="flex flex-col">
                        <h1 className="text-xl font-black text-primary-dark line-clamp-1">{video.title}</h1>
                        <div className="flex items-center gap-2 text-[10px] font-black text-primary uppercase">
                            <span className="bg-red-600 text-white px-1 rounded">LIVE</span>
                            {video.channel}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => activeSub && handleMine(activeSub)}
                        className="clay-btn bg-secondary px-6"
                    >
                        <Zap className="w-4 h-4 fill-current" />
                        Mine Phrase
                    </button>
                </div>
            </header>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 overflow-hidden">
                {/* Main Content Area */}
                <div className="lg:col-span-3 flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-2">
                    {/* 1. Video Player Container */}
                    <div className="clay-card p-0 bg-black relative group overflow-hidden border-8 border-primary-dark aspect-video w-full shrink-0">
                        <img
                            src={`https://img.youtube.com/vi/${video.video_id}/maxresdefault.jpg`}
                            className="w-full h-full object-cover opacity-90"
                            alt="Video placeholder"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors pointer-events-none">
                            {!isPlaying && (
                                <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border-4 border-white shadow-xl">
                                    <Play className="w-10 h-10 text-white fill-current translate-x-1" />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 2. All Player Control Buttons Section */}
                    <section className="clay-card p-4 bg-primary-dark border-primary-dark shadow-clay shrink-0">
                        <div className="flex flex-col gap-4">
                            {/* Progress bar */}
                            <div className="w-full h-2 bg-white/10 rounded-full cursor-pointer relative group/bar">
                                <div
                                    className="absolute h-full bg-primary rounded-full"
                                    style={{ width: `${(currentTime / 20) * 100}%` }}
                                />
                                <div
                                    className="absolute h-4 w-4 bg-white border-2 border-primary-dark rounded-full -top-1 shadow-lg cursor-grab active:cursor-grabbing"
                                    style={{ left: `calc(${(currentTime / 20) * 100}% - 8px)` }}
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-6">
                                    <div className="flex items-center gap-4">
                                        <button className="p-2 text-white/60 hover:text-white transition-colors" title="Previous Sub">
                                            <SkipBack className="w-6 h-6" />
                                        </button>
                                        <button
                                            onClick={() => setIsPlaying(!isPlaying)}
                                            className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-primary-dark shadow-clay-lg active:scale-95 transition-all"
                                        >
                                            {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current translate-x-0.5" />}
                                        </button>
                                        <button className="p-2 text-white/60 hover:text-white transition-colors" title="Next Sub">
                                            <SkipForward className="w-6 h-6" />
                                        </button>
                                    </div>

                                    <div className="h-8 w-px bg-white/10 mx-2" />

                                    <div className="flex items-center gap-4">
                                        <button className="p-2 text-white/60 hover:text-secondary hover:opacity-100 transition-all" title="Seek -5s">
                                            <History className="w-5 h-5" />
                                        </button>
                                        <button className="p-2 text-white/60 hover:text-primary hover:opacity-100 transition-all" title="Loop current segment">
                                            <Repeat className="w-5 h-5" />
                                        </button>
                                        <button className="p-2 text-white/60 hover:text-secondary hover:opacity-100 transition-all" title="Seek +5s">
                                            <FastForward className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6">
                                    <div className="hidden md:flex flex-col items-end mr-2">
                                        <span className="text-[10px] font-black uppercase text-white/30 tracking-widest">Playback</span>
                                        <span className="text-sm font-black text-white tracking-widest">
                                            {Math.floor(currentTime / 60)}:{(Math.floor(currentTime) % 60).toString().padStart(2, '0')} / 0:20
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4 text-white/40">
                                        <Volume2 className="w-5 h-5 cursor-pointer hover:text-white" />
                                        <Settings className="w-5 h-5 cursor-pointer hover:text-white" />
                                        <Maximize className="w-5 h-5 cursor-pointer hover:text-white" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* 3. Subtitles with Switch and Buttons Section */}
                    <section className="clay-card p-6 bg-white border-dashed flex flex-col gap-6 shrink-0">
                        {/* Control Row: Switch and Action Buttons */}
                        <div className="flex items-center justify-between border-b-2 border-primary-dark/5 pb-6">
                            <div className="flex items-center gap-8">
                                {/* Furigana Switch */}
                                <div className="flex items-center gap-3">
                                    <span className="text-[10px] font-black uppercase text-primary-dark/40 tracking-widest">Furigana</span>
                                    <button
                                        onClick={() => setFuriganaEnabled(!furiganaEnabled)}
                                        className={clsx(
                                            "w-12 h-6 rounded-full relative transition-all border-2 border-primary-dark shadow-inset",
                                            furiganaEnabled ? "bg-primary" : "bg-background"
                                        )}
                                    >
                                        <div className={clsx(
                                            "absolute top-0.5 w-4 h-4 rounded-full bg-white border-2 border-primary-dark transition-all",
                                            furiganaEnabled ? "left-7" : "left-0.5"
                                        )} />
                                    </button>
                                </div>

                                {/* Translation Switch */}
                                <div className="flex items-center gap-3">
                                    <span className="text-[10px] font-black uppercase text-primary-dark/40 tracking-widest">English</span>
                                    <button
                                        onClick={() => setTranslationEnabled(!translationEnabled)}
                                        className={clsx(
                                            "w-12 h-6 rounded-full relative transition-all border-2 border-primary-dark shadow-inset",
                                            translationEnabled ? "bg-secondary" : "bg-background"
                                        )}
                                    >
                                        <div className={clsx(
                                            "absolute top-0.5 w-4 h-4 rounded-full bg-white border-2 border-primary-dark transition-all",
                                            translationEnabled ? "left-7" : "left-0.5"
                                        )} />
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => { setShowAnalysis(!showAnalysis); setSelectedSub(activeSub); }}
                                    className={clsx(
                                        "clay-btn px-6 transition-all",
                                        showAnalysis ? "bg-primary !text-white" : "bg-white !text-primary border-primary border-2 shadow-none"
                                    )}
                                >
                                    <Zap className={clsx("w-4 h-4", showAnalysis ? "fill-current" : "")} />
                                    {showAnalysis ? 'Hide Analysis' : 'Analyze Segment'}
                                </button>
                                <button
                                    onClick={() => activeSub && handleMine(activeSub)}
                                    className="shadow-clay hover:-translate-y-1 active:translate-y-0 transition-all p-3 bg-secondary !text-white border-2 border-primary-dark rounded-clay"
                                >
                                    <Save className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Interactive Subtitle Display */}
                        <div className="p-8 bg-background rounded-clay border-4 border-primary-dark shadow-inset text-center min-h-[160px] flex flex-col justify-center gap-4 relative">
                            <div className="absolute top-2 left-2 px-2 py-0.5 bg-primary-dark text-white text-[8px] font-black rounded uppercase letter-spacing-widest">Active Transcription</div>

                            {activeSub ? (
                                <>
                                    <div className="flex flex-wrap justify-center gap-x-2 gap-y-6">
                                        {activeSub.tokens.map((token: any, i: number) => (
                                            <div
                                                key={i}
                                                className="flex flex-col items-center cursor-pointer hover:bg-primary/5 p-1 rounded-clay transition-all group/word active:scale-95 border-b-2 border-transparent hover:border-primary"
                                                onClick={() => { setSelectedToken(token); setShowAnalysis(true); }}
                                            >
                                                {furiganaEnabled && token.reading && token.reading !== token.surface && (
                                                    <span className="text-xs font-black text-primary leading-none mb-1 opacity-60 group-hover/word:opacity-100">
                                                        {token.reading}
                                                    </span>
                                                )}
                                                <span className="text-4xl font-black text-primary-dark">
                                                    {token.surface}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                    {translationEnabled && (
                                        <div className="text-xl font-bold text-primary-dark/30 italic flex items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                            <div className="h-px w-8 bg-primary-dark/5" />
                                            “{activeSub.translation}”
                                            <div className="h-px w-8 bg-primary-dark/5" />
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="flex flex-col items-center opacity-10 py-10">
                                    <Sparkles className="w-16 h-16 animate-pulse" />
                                    <p className="font-black italic mt-2 uppercase tracking-[0.2em] text-xs">Waiting for Signal</p>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* 4. Details / Additional Data Explained Section */}
                    {showAnalysis && (activeSub || selectedToken) && (
                        <section className="clay-card p-8 bg-white border-primary border-4 animate-in slide-in-from-bottom-4 duration-300">
                            <div className="flex justify-between items-start mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-primary rounded-clay border-2 border-primary-dark flex items-center justify-center text-white shadow-clay">
                                        {selectedToken ? <Search className="w-6 h-6" /> : <Layers className="w-6 h-6" />}
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-primary-dark uppercase tracking-tight">
                                            {selectedToken ? `Entry Analysis: ${selectedToken.surface}` : 'Morphological Breakdown'}
                                        </h2>
                                        <p className="text-xs font-bold text-primary-dark/40">Automated linguistic extraction from segment.</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => { setShowAnalysis(false); setSelectedToken(null); }}
                                    className="p-2 hover:bg-primary-dark/5 rounded-full"
                                >
                                    <X className="w-6 h-6 text-primary-dark/40" />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                {/* Details Column */}
                                <div className="flex flex-col gap-8">
                                    <div className="flex flex-col gap-4">
                                        <h3 className="text-[10px] font-black uppercase text-primary tracking-widest flex items-center gap-2">
                                            <BookOpen className="w-4 h-4" />
                                            Vocabulary Explained
                                        </h3>
                                        <div className="p-6 bg-background rounded-clay border-2 border-primary-dark shadow-inset flex flex-col gap-4">
                                            <div className="flex justify-between items-center">
                                                <span className="text-3xl font-black text-primary-dark">{selectedToken?.surface || (activeSub?.tokens[0].surface)}</span>
                                                <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-black border-2 border-primary/20">
                                                    {(selectedToken || activeSub?.tokens[0]).type.toUpperCase()}
                                                </div>
                                            </div>
                                            <div className="h-px bg-primary-dark/5 w-full" />
                                            <div className="flex flex-col gap-1">
                                                <div className="text-xs font-black text-primary-dark/40 uppercase">Reading</div>
                                                <div className="text-xl font-black text-primary">{selectedToken?.reading || (activeSub?.tokens[0].reading)}</div>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <div className="text-xs font-black text-primary-dark/40 uppercase">Common Meaning</div>
                                                <div className="text-xl font-bold text-primary-dark capitalize">{selectedToken?.meaning || (activeSub?.tokens[0].meaning)}</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-4">
                                        <button className="clay-btn w-full bg-secondary py-4 shadow-clay group">
                                            <span className="flex items-center justify-center gap-3">
                                                <Plus className="w-5 h-5" />
                                                Add to Personalized Deck
                                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                            </span>
                                        </button>
                                    </div>
                                </div>

                                {/* Grammar/Context Column */}
                                <div className="flex flex-col gap-8">
                                    <div className="flex flex-col gap-4">
                                        <h3 className="text-[10px] font-black uppercase text-secondary tracking-widest flex items-center gap-2">
                                            <Sparkles className="w-4 h-4 fill-current" />
                                            Grammar Points
                                        </h3>
                                        <div className="flex flex-col gap-4">
                                            <div className="p-5 bg-white border-2 border-primary-dark rounded-clay shadow-clay-sm hover:-translate-y-1 transition-all cursor-pointer group">
                                                <div className="flex justify-between items-center mb-1">
                                                    <div className="font-black text-primary text-lg">～について</div>
                                                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </div>
                                                <p className="text-xs font-bold text-primary-dark/60 leading-relaxed">
                                                    Topic marker equivalent to "About" or "Regarding". Connects a noun to the topic of discussion.
                                                </p>
                                            </div>
                                            <div className="p-5 bg-white border-2 border-primary-dark rounded-clay shadow-clay-sm hover:-translate-y-1 transition-all cursor-pointer group">
                                                <div className="flex justify-between items-center mb-1">
                                                    <div className="font-black text-primary text-lg">～は (Topic Maker)</div>
                                                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </div>
                                                <p className="text-xs font-bold text-primary-dark/60 leading-relaxed">
                                                    The fundamental particle identifying the subject/topic of the entire sentence.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-6 bg-primary/5 rounded-clay border-2 border-dashed border-primary mt-auto">
                                        <div className="flex items-center gap-3 mb-2">
                                            <Activity className="w-5 h-5 text-primary" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-primary-dark">Mastery Confidence</span>
                                        </div>
                                        <div className="flex items-end gap-2">
                                            <span className="text-3xl font-black text-primary-dark">84%</span>
                                            <span className="text-[10px] font-bold text-primary-dark/40 mb-1">Retention Stability</span>
                                        </div>
                                        <div className="w-full h-2 bg-primary-dark/10 rounded-full mt-3 overflow-hidden border border-primary-dark/10">
                                            <div className="h-full bg-primary" style={{ width: '84%' }} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>
                    )}
                </div>

                {/* Tracking Sidebar: Transcript List */}
                <aside className="lg:col-span-1 flex flex-col bg-white rounded-clay border-4 border-primary-dark overflow-hidden shadow-clay h-full">
                    <div className="p-4 bg-background border-b-4 border-primary-dark flex items-center justify-between shadow-sm shrink-0">
                        <div className="flex items-center gap-2">
                            <History className="w-5 h-5 text-primary" />
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-primary-dark">Full Transcript</h3>
                        </div>
                        <div className="bg-primary-dark text-white px-2 py-0.5 rounded text-[8px] font-black">
                            {subtitles.length} UNITS
                        </div>
                    </div>

                    <div
                        ref={transcriptRef}
                        className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 custom-scrollbar"
                    >
                        {subtitles.map((s) => (
                            <div
                                key={s.id}
                                id={`sub-${s.id}`}
                                onClick={() => { setCurrentTime(s.start); setSelectedSub(s); }}
                                className={clsx(
                                    "p-4 rounded-clay border-2 transition-all cursor-pointer group relative overflow-hidden",
                                    activeSub?.id === s.id
                                        ? "bg-primary border-primary-dark text-white shadow-clay scale-[1.02] z-10"
                                        : "bg-white border-primary-dark/5 hover:bg-primary/5 text-primary-dark"
                                )}
                            >
                                {activeSub?.id === s.id && (
                                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-secondary animate-pulse" />
                                )}
                                <div className="flex justify-between items-center mb-1">
                                    <span className={clsx("text-[9px] font-black uppercase tracking-widest", activeSub?.id === s.id ? "text-white/60" : "text-primary-dark/30")}>
                                        {Math.floor(s.start / 60)}:{(Math.floor(s.start) % 60).toString().padStart(2, '0')}
                                    </span>
                                    {activeSub?.id === s.id && <Repeat className="w-3 h-3 text-secondary" />}
                                </div>
                                <div className="font-bold text-sm leading-relaxed">{s.text}</div>
                                {translationEnabled && (
                                    <div className={clsx("text-[10px] font-medium leading-tight mt-1 opacity-70", activeSub?.id === s.id ? "text-white" : "text-primary-dark")}>
                                        {s.translation}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="p-4 bg-background border-t-4 border-primary-dark flex flex-col gap-2 shrink-0">
                        <button className="clay-btn w-full !bg-white !text-primary-dark text-[10px] py-3 border-dashed">
                            Generate SRS Batch
                        </button>
                    </div>
                </aside>
            </div>

            {/* Mining Modal */}
            {isMining && miningSentence && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-primary-dark/20 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="clay-card max-w-lg w-full bg-white p-8 relative animate-in zoom-in-95 duration-200">
                        <button
                            onClick={() => setIsMining(false)}
                            className="absolute top-4 right-4 p-2 hover:bg-primary/5 rounded-full text-primary-dark/30"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="flex flex-col gap-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-secondary/10 rounded-clay border-2 border-secondary border-dashed flex items-center justify-center text-secondary">
                                    <Save className="w-6 h-6" />
                                </div>
                                <h2 className="text-2xl font-black text-primary-dark">Mine Phrase</h2>
                            </div>

                            <div className="flex flex-col gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <div className="flex justify-between items-center">
                                        <label className="text-[10px] font-black uppercase text-primary-dark/40 ml-1">Japanese Text</label>
                                        <button
                                            onClick={simulateAIRewrite}
                                            disabled={isGenerating}
                                            className="text-[10px] font-black text-secondary hover:underline flex items-center gap-1 uppercase tracking-widest disabled:opacity-30"
                                        >
                                            <Wand2 className="w-3 h-3" />
                                            AI Rewrite
                                        </button>
                                    </div>
                                    <textarea
                                        className="clay-input min-h-[100px] py-4"
                                        value={miningSentence.text_ja}
                                        onChange={(e) => setMiningSentence({ ...miningSentence, text_ja: e.target.value })}
                                    />
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[10px] font-black uppercase text-primary-dark/40 ml-1">English Translation</label>
                                    <textarea
                                        className="clay-input min-h-[80px] py-4"
                                        value={miningSentence.text_en}
                                        onChange={(e) => setMiningSentence({ ...miningSentence, text_en: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={saveMinedSentence}
                                    className="clay-btn bg-secondary py-4 !text-white"
                                >
                                    Confirm & Save to Library
                                </button>
                                <p className="text-[10px] text-center font-bold text-primary-dark/30 uppercase tracking-[0.2em] mt-2">
                                    Source: {miningSentence.source}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
