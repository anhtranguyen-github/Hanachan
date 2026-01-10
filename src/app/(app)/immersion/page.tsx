
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/ui/components/ui/button';
import { PageHeader } from '@/ui/components/PageHeader';
import { Play, Pause, ArrowLeft, Film, Plus, Filter, Trash2, Link as LinkIcon, ChevronDown, Check, Search, ExternalLink, Bookmark, Square, Sparkles, BookOpen, PenTool, Youtube, Loader2, RefreshCcw, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { importVideoAction, fetchUserVideosAction, deleteVideoAction, getTranscriptAction } from '@/features/youtube/actions';
import { MineSentenceParams, mineSentenceAction } from '@/features/mining/actions';
import { UserVideo } from '@/features/youtube/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/ui/components/ui/dialog";
import { MiningModal } from '@/features/mining/components/MiningModal';


export default function ImmersionPage() {
    const [selectedVideo, setSelectedVideo] = useState<UserVideo | null>(null);
    const [videos, setVideos] = useState<UserVideo[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isImporting, setIsImporting] = useState(false);
    const [importUrl, setImportUrl] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    useEffect(() => {
        loadLibrary();
    }, []);

    const loadLibrary = async () => {
        try {
            const data = await fetchUserVideosAction();
            setVideos(data || []);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleImport = async () => {
        if (!importUrl) return;
        setIsImporting(true);
        try {
            const res = await importVideoAction(importUrl);
            if (res.success && res.video) {
                // Refresh full list to be safe, or prepend
                await loadLibrary();
                setImportUrl('');
                setIsDialogOpen(false);
            } else {
                alert("Import failed: " + res.error);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsImporting(false);
        }
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!confirm("Remove this video from your library?")) return;
        try {
            await deleteVideoAction(id);
            setVideos(prev => prev.filter(v => v.id !== id));
        } catch (e) {
            console.error(e);
        }
    };

    // If watching a video, show the Player Layout
    if (selectedVideo) {
        return <HybridImmersionPlayer video={selectedVideo} onBack={() => setSelectedVideo(null)} />;
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">

            {/* Header Section */}
            <PageHeader
                title="Immersion Library"
                subtitle="Build your Japanese video collection from YouTube"
                icon={Film}
                iconColor="text-rose-600"
                action={
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="rounded-full bg-rose-500 hover:bg-rose-600 font-bold text-white shadow-lg shadow-rose-200">
                                <Plus className="w-4 h-4 mr-2" /> ADD VIDEO
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                                <DialogTitle>Add YouTube Video</DialogTitle>
                            </DialogHeader>
                            <div className="flex flex-col gap-4 py-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-500">YouTube URL</label>
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                            <input
                                                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-200"
                                                placeholder="https://www.youtube.com/watch?v=..."
                                                value={importUrl}
                                                onChange={(e) => setImportUrl(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-400">
                                        We'll fetch subtitles automatically.
                                    </p>
                                </div>
                                <Button className="btn-primary w-full" onClick={handleImport} disabled={isImporting}>
                                    {isImporting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Importing...</> : 'Import Video'}
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                }
            />

            {isLoading ? (
                <div className="text-center py-20 text-slate-400 font-bold animate-pulse">Loading library...</div>
            ) : videos.length === 0 ? (
                <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                    <Youtube className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-slate-600">Your library is empty</h3>
                    <p className="text-slate-400 mt-2">Add a YouTube video to start immersing.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {videos.map((video) => (
                        <div key={video.id} className="bg-white rounded-xl overflow-hidden shadow-sm border border-slate-100 flex flex-col group hover:border-rose-200 transition-colors">
                            <div className="aspect-video relative bg-slate-100 cursor-pointer overflow-hidden" onClick={() => setSelectedVideo(video)}>
                                {video.thumbnail_url ? (
                                    <img src={video.thumbnail_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-slate-200">
                                        <Film className="text-slate-400" />
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                    <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-all">
                                        <Play className="ml-1 w-5 h-5 text-rose-500" fill="currentColor" />
                                    </div>
                                </div>
                                {video.status && (<span className="absolute top-2 right-2 bg-slate-900/80 text-white text-[10px] font-black px-2 py-0.5 rounded shadow-sm uppercase tracking-wider backdrop-blur-sm">{video.status}</span>)}
                            </div>
                            <div className="p-4 flex-1 flex flex-col">
                                <h3 className="font-bold text-slate-800 mb-1 line-clamp-2 text-sm leading-snug group-hover:text-rose-600 transition-colors cursor-pointer" onClick={() => setSelectedVideo(video)}>{video.title || 'Untitled Video'}</h3>
                                <div className="flex justify-between items-end mt-auto">
                                    <p className="text-xs text-slate-500 truncate mr-2">{video.channel_title || 'Unknown Channel'}</p>
                                    <button className="text-slate-300 hover:text-red-500 transition-colors" onClick={(e) => handleDelete(e, video.id)}>
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// --- NEW HYBRID PLAYER (With Transcripts) ---
function HybridImmersionPlayer({ video, onBack }: { video: UserVideo, onBack: () => void }) {
    const [activeTab, setActiveTab] = useState<'word' | 'grammar' | 'add'>('add');
    const [transcript, setTranscript] = useState<any[]>([]);
    const [activeSegmentIndex, setActiveSegmentIndex] = useState(0);
    const [videoTime, setVideoTime] = useState(0);

    // Mining Form
    const [front, setFront] = useState('');
    const [back, setBack] = useState('');
    const [miningLoading, setMiningLoading] = useState(false);
    const [sentence, setSentence] = useState('');

    const [isTranscriptLoading, setIsTranscriptLoading] = useState(false);

    // Modal State
    const [mineModalOpen, setMineModalOpen] = useState(false);
    const [mineMode, setMineMode] = useState<'word' | 'sentence'>('word');
    const [mineInitialData, setMineInitialData] = useState<any>({});

    const openMineModal = (mode: 'word' | 'sentence', data: any) => {
        setMineMode(mode);
        setMineInitialData(data);
        setMineModalOpen(true);
    };


    useEffect(() => {
        loadTranscript();
    }, [video.video_id]);

    const loadTranscript = async () => {
        setIsTranscriptLoading(true);
        try {
            const data = await getTranscriptAction(video.video_id);
            setTranscript(data || []);
            if (data && data.length > 0) {
                setSentence(data[0].text);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsTranscriptLoading(false);
        }
    };

    const currentSegment = transcript[activeSegmentIndex] || { text: isTranscriptLoading ? "Retrieving transcript data..." : "No text available", start: 0 };

    const handleSegmentClick = (i: number) => {
        setActiveSegmentIndex(i);
        setSentence(transcript[i].text);
    };

    const handleWordClick = (word: string) => {
        setFront(word);
        setBack("Loading definition...");
        setActiveTab('add');

        setTimeout(() => {
            const mockDefs: any = {
                '外国': 'Foreign Country',
                '人': 'Person',
                'イメージ': 'Image / Impression'
            };
            setBack(mockDefs[word] || 'Dictionary lookup failed (Mock)');
        }, 500);
    };

    const handleMine = async () => {
        if (!front || !back) return;
        setMiningLoading(true);
        try {
            const res = await mineSentenceAction({
                textJa: sentence,
                textEn: "Mined from YouTube", // We can add translation fetch later
                targetWord: front,
                targetMeaning: back,
                sourceType: 'youtube',
                sourceId: video.video_id
            });

            if (res.success) {
                alert("Sentence mined and card created!");
                setFront('');
                setBack('');
            } else {
                alert("Mining failed: " + res.error);
            }
        } catch (e: any) {
            alert(e.message);
        } finally {
            setMiningLoading(false);
        }
    }

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden">
            <div className="flex-1 flex gap-6 overflow-hidden">
                {/* Left Column: Video & Subtitle Stream */}
                <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-2">
                    {/* Header */}
                    <div className="flex items-center justify-between shrink-0">
                        <Button variant="ghost" className="text-slate-400 text-xs font-bold uppercase tracking-widest hover:text-slate-800 pl-0" onClick={onBack}>
                            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Library
                        </Button>
                        <h2 className="font-bold text-slate-700 truncate max-w-md">{video.title}</h2>
                    </div>

                    {/* Video Player */}
                    <div className="w-full aspect-video bg-black rounded-3xl overflow-hidden shadow-lg relative group shrink-0">
                        <iframe
                            width="100%"
                            height="100%"
                            src={`https://www.youtube.com/embed/${video.video_id}?autoplay=1&start=${Math.floor(currentSegment.start)}`}
                            title="YouTube video player"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                            className="w-full h-full"
                        ></iframe>
                    </div>

                    {/* Subtitle Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-rose-500 font-bold text-xs uppercase tracking-widest">
                                <Sparkles size={14} /> Transcript
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-[10px] font-black uppercase text-slate-400 hover:text-rose-500"
                                onClick={loadTranscript}
                                disabled={isTranscriptLoading}
                            >
                                {isTranscriptLoading ? <Loader2 size={12} className="animate-spin" /> : <RefreshCcw size={12} className="mr-1" />}
                                {isTranscriptLoading ? 'Fetching...' : 'Refresh'}
                            </Button>
                        </div>

                        {isTranscriptLoading ? (
                            <div className="py-10 flex flex-col items-center justify-center text-slate-400 gap-4">
                                <Loader2 className="w-8 h-8 animate-spin text-rose-300" />
                                <div className="text-center">
                                    <p className="font-bold text-sm">Syncing YouTube Transcripts...</p>
                                    <p className="text-[10px] uppercase tracking-widest opacity-60 mt-1">Checking Japanese, Japanese (Auto), and Fallback Tracks</p>
                                </div>
                            </div>
                        ) : transcript.length > 0 ? (
                            <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2">
                                {transcript.map((seg, i) => (
                                    <div
                                        key={i}
                                        className={cn(
                                            "p-3 rounded-xl cursor-pointer transition-all text-sm font-medium border border-transparent",
                                            activeSegmentIndex === i ? "bg-rose-50 text-slate-800 border-rose-100 shadow-sm" : "text-slate-500 hover:bg-slate-50"
                                        )}
                                        onClick={() => handleSegmentClick(i)}
                                    >
                                        <div className="flex gap-4">
                                            <span className="text-xs font-bold text-slate-300 w-10 shrink-0 tabular-nums pt-0.5">
                                                {formatTime(seg.start)}
                                            </span>
                                            <span className="leading-relaxed">{seg.text}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-10 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                <Film className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                <p className="text-slate-500 text-sm font-bold">No transcript track found in Japanese.</p>
                                <p className="text-slate-400 text-xs mt-1">This video may not have closed captions enabled on YouTube.</p>
                            </div>
                        )}

                        {/* Active Interactive Line */}
                        <div className="text-center font-jp border-t border-slate-50 pt-6">
                            <div className="text-2xl font-bold text-slate-800 leading-relaxed flex flex-wrap justify-center gap-1">
                                {currentSegment.text}
                            </div>
                            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-2">
                                {activeSegmentIndex + 1} of {transcript.length} Segments
                            </p>
                        </div>
                    </div>
                </div>


                {/* Right Sidebar: Analysis & Details */}
                <div className="w-[400px] flex flex-col bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden shrink-0 h-full">

                    {/* Tabs */}
                    <div className="flex border-b border-slate-100">
                        <button onClick={() => setActiveTab('add')} className={cn("flex-1 py-3 text-xs font-bold uppercase tracking-wide border-b-2 transition-colors", activeTab === 'add' ? "border-emerald-500 text-emerald-600 bg-emerald-50/50" : "border-transparent text-slate-400 hover:bg-slate-50")}>Mine Card</button>
                        <button onClick={() => setActiveTab('word')} className={cn("flex-1 py-3 text-xs font-bold uppercase tracking-wide border-b-2 transition-colors", activeTab === 'word' ? "border-blue-500 text-blue-600 bg-blue-50/50" : "border-transparent text-slate-400 hover:bg-slate-50")}>Dictionary</button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-6">

                        {/* ADD CARD TAB - Now simplified in favor of direct modal triggers */}
                        {activeTab === 'add' && (
                            <div className="space-y-6 animate-in slide-in-from-right-2">
                                <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100/50 space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-100">
                                            <PenTool size={20} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-800">Mining Zone</h4>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Create flashcards instantly</p>
                                        </div>
                                    </div>

                                    <div className="space-y-3 pt-2">
                                        <Button
                                            className="w-full bg-slate-900 text-white font-bold h-12 rounded-xl flex items-center justify-between px-4 group hover:bg-emerald-600 transition-all"
                                            onClick={() => openMineModal('sentence', {
                                                textJa: sentence,
                                                sourceType: 'youtube',
                                                sourceId: video.video_id
                                            })}
                                        >
                                            <span className="flex items-center gap-2">
                                                <Zap size={16} /> Mine Full Sentence
                                            </span>
                                            <ChevronDown size={14} className="-rotate-90 opacity-40 group-hover:opacity-100 transition-all" />
                                        </Button>

                                        <Button
                                            variant="outline"
                                            className="w-full border-slate-200 text-slate-600 font-bold h-12 rounded-xl flex items-center justify-between px-4 group hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 transition-all"
                                            onClick={() => openMineModal('word', {
                                                textJa: sentence,
                                                targetWord: front,
                                                targetMeaning: back,
                                                sourceType: 'youtube',
                                                sourceId: video.video_id
                                            })}
                                        >
                                            <span className="flex items-center gap-2">
                                                <BookOpen size={16} /> Mine Specific Word
                                            </span>
                                            <ChevronDown size={14} className="-rotate-90 opacity-40 group-hover:opacity-100 transition-all" />
                                        </Button>
                                    </div>
                                </div>

                                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Active Context</span>
                                    <p className="text-sm font-bold text-slate-700 leading-relaxed font-jp">{sentence}</p>
                                </div>
                            </div>
                        )}


                        {activeTab === 'word' && (
                            <div className="text-center p-10 text-slate-400">
                                <Search className="w-10 h-10 mx-auto mb-2 opacity-50" />
                                <p className="text-sm font-medium">Dictionary lookups require Kuromoji integration.</p>
                            </div>
                        )}

                    </div>
                </div>

            </div>


            <MiningModal
                isOpen={mineModalOpen}
                onClose={() => setMineModalOpen(false)}
                initialData={mineInitialData}
                mode={mineMode}
            />
        </div >
    );
}


function formatTime(seconds: number) {
    if (!seconds && seconds !== 0) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
}
