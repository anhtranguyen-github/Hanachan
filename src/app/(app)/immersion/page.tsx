
'use client';

import React, { useState } from 'react';
import { Button } from '@/ui/components/ui/button';
import { PageHeader } from '@/ui/components/PageHeader';
import { Play, Pause, ArrowLeft, Film, Plus, Filter, Trash2, Link as LinkIcon, ChevronDown, Check, Search, ExternalLink, Bookmark, Square, Sparkles, BookOpen, PenTool } from 'lucide-react';
import { cn } from '@/lib/utils'; // Assuming standard utils

// --- Library Data (As Is) ---
const MY_VIDEOS = [
    { id: '1', title: '432 日本人が「外国人」について持って...', channel: 'Miku Real Japanese', thumbnail: 'https://img.youtube.com/vi/UQ0S565tKPc/mqdefault.jpg', category: 'Podcast', status: 'Learning', label: 'Learning' },
    // ... (rest same as before)
    { id: '2', title: '[sub]Japanese Podcast | Ep.2 - 呼び方 | For N3-N1 Learners', channel: 'MAIの日本語Podcast', thumbnail: 'https://img.youtube.com/vi/ZlvcqelxeSI/mqdefault.jpg', category: 'Podcast', status: 'Learning', label: 'Learning' },
    { id: '3', title: "CHUNG HA 청하 | 'I'm Ready' Extended Performance Video", channel: 'CHUNG HA 청하', thumbnail: 'https://img.youtube.com/vi/GzLz9d5gq8s/mqdefault.jpg', category: 'Music', status: 'Unknown', label: null },
    { id: '4', title: '日本人のお給料Japanese Listening Practice N3・N2レベル【中級】...', channel: 'Bite Size Japanese', thumbnail: 'https://img.youtube.com/vi/money/mqdefault.jpg', category: 'Podcast', status: 'Unknown', label: 'Learning' },
];

export default function ImmersionPage() {
    const [selectedVideo, setSelectedVideo] = useState<string | null>(null);

    // If watching a video, show the Player Layout
    if (selectedVideo) {
        return <HybridImmersionPlayer onBack={() => setSelectedVideo(null)} />;
    }

    // Otherwise show the Library (Grid) - SAME AS BEFORE
    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">

            {/* Header Section */}
            <PageHeader
                title="My Custom Videos"
                subtitle="Add and manage your personal YouTube video collection"
                icon={Film}
                iconColor="text-blue-600"
            />

            {/* Add New Video Form & Filter Bar & Video Grid (Abbreviated, keeping structure) */}
            {/* ... Assume standard grid here ... */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {MY_VIDEOS.map((video) => (
                    <div key={video.id} className="bg-white rounded-xl overflow-hidden shadow-sm border border-slate-100 flex flex-col group">
                        <div className="aspect-video relative bg-slate-100 cursor-pointer" onClick={() => setSelectedVideo(video.id)}>
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                            <img src={video.thumbnail} className="w-full h-full object-cover" />
                            {video.label && (<span className="absolute top-2 right-2 bg-amber-400 text-amber-900 text-[10px] font-black px-2 py-0.5 rounded shadow-sm uppercase tracking-wider">{video.label}</span>)}
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center shadow-lg"><Play className="ml-1 w-5 h-5 text-slate-900" /></div>
                            </div>
                        </div>
                        <div className="p-4 flex-1 flex flex-col">
                            <h3 className="font-bold text-slate-800 mb-1 line-clamp-2 text-sm leading-snug group-hover:text-blue-600 transition-colors cursor-pointer" onClick={() => setSelectedVideo(video.id)}>{video.title}</h3>
                            <p className="text-xs text-slate-500 mb-4">{video.channel}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// --- NEW HYBRID PLAYER (Standard Light Layout + Analyzers) ---
function HybridImmersionPlayer({ onBack }: { onBack: () => void }) {
    const [activeTab, setActiveTab] = useState<'word' | 'grammar' | 'add'>('word');

    // Using the same tokens/colors as Analyze page for consistency
    const tokens = [
        { t: '外国', c: 'blue', reading: 'がいこく', type: 'Noun' },
        { t: '人', c: 'blue', reading: 'じん', type: 'Noun' },
        { t: 'の', c: 'green', reading: 'no', type: 'Particle' },
        { t: 'イメージ', c: 'rose', reading: 'imēji', type: 'Noun' },
        { t: 'について', c: 'green', reading: 'ni tsuite', type: 'Expression' },
        { t: '話し', c: 'blue', reading: 'hana', type: 'Verb' },
        { t: 'たい', c: 'orange', reading: 'tai', type: 'Aux' },
        { t: 'と', c: 'green', reading: 'to', type: 'Particle' },
        { t: '思い', c: 'blue', reading: 'omo', type: 'Verb' },
        { t: 'ます', c: 'orange', reading: 'masu', type: 'Aux' },
        { t: '。', c: 'slate', reading: '', type: '' }
    ];

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
                    </div>

                    {/* Video Player */}
                    <div className="w-full aspect-video bg-black rounded-3xl overflow-hidden shadow-lg relative group shrink-0">
                        <img src="https://img.youtube.com/vi/UQ0S565tKPc/maxresdefault.jpg" className="w-full h-full object-contain opacity-90" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-16 h-16 bg-rose-500 rounded-full flex items-center justify-center text-white shadow-lg cursor-pointer hover:scale-110 transition-transform">
                                <Play fill="white" className="ml-1 w-6 h-6" />
                            </div>
                        </div>
                    </div>

                    {/* Current Sentence Card (Analyze Style - Compact) */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-rose-500 font-bold text-xs uppercase tracking-widest">
                                <Sparkles size={14} /> Analysis
                            </div>
                            <div className="flex gap-2">
                                <Button variant="ghost" size="sm" className="h-6 text-[10px] text-slate-400 hover:text-blue-600"><BookOpen size={10} className="mr-1" /> Dictionary</Button>
                                <Button variant="ghost" size="sm" className="h-6 text-[10px] text-slate-400 hover:text-rose-600"><Plus size={10} className="mr-1" /> Mine</Button>
                            </div>
                        </div>

                        {/* Interactive Tokenizer View - Compact */}
                        <div className="flex flex-wrap gap-1.5 justify-center leading-relaxed">
                            {tokens.map((item, i) => (
                                <div key={i} className="group relative flex flex-col items-center cursor-pointer">
                                    <span className="text-[9px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity absolute -top-3 whitespace-nowrap font-bold h-3">{item.reading}</span>
                                    <span className={cn(
                                        "px-1.5 py-0.5 rounded-md text-sm font-medium transition-colors border border-transparent",
                                        item.c === 'blue' ? "bg-blue-50/50 text-blue-700 hover:bg-blue-100 hover:border-blue-200" :
                                            item.c === 'green' ? "bg-emerald-50/50 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-200" :
                                                item.c === 'rose' ? "bg-rose-50/50 text-rose-700 hover:bg-rose-100 hover:border-rose-200" :
                                                    item.c === 'orange' ? "bg-orange-50/50 text-orange-700 hover:bg-orange-100 hover:border-orange-200" : ""
                                    )}>
                                        {item.t}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div className="text-center text-slate-500 text-sm font-medium border-t border-slate-50 pt-3">
                            I would like to talk about the image (impression) regarding foreigners.
                        </div>
                    </div>
                </div>


                {/* Right Sidebar: Analysis & Details (Reusing Analyze Page Layout) */}
                <div className="w-[400px] flex flex-col bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden shrink-0 h-full">

                    {/* Tabs */}
                    <div className="flex border-b border-slate-100">
                        <button onClick={() => setActiveTab('word')} className={cn("flex-1 py-3 text-xs font-bold uppercase tracking-wide border-b-2 transition-colors", activeTab === 'word' ? "border-blue-500 text-blue-600 bg-blue-50/50" : "border-transparent text-slate-400 hover:bg-slate-50")}>Word</button>
                        <button onClick={() => setActiveTab('grammar')} className={cn("flex-1 py-3 text-xs font-bold uppercase tracking-wide border-b-2 transition-colors", activeTab === 'grammar' ? "border-rose-500 text-rose-600 bg-rose-50/50" : "border-transparent text-slate-400 hover:bg-slate-50")}>Grammar</button>
                        <button onClick={() => setActiveTab('add')} className={cn("flex-1 py-3 text-xs font-bold uppercase tracking-wide border-b-2 transition-colors", activeTab === 'add' ? "border-emerald-500 text-emerald-600 bg-emerald-50/50" : "border-transparent text-slate-400 hover:bg-slate-50")}>Add Card</button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-6">

                        {/* WORD TAB */}
                        {activeTab === 'word' && (
                            <div className="space-y-6 animate-in slide-in-from-right-2">
                                <div>
                                    <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-[10px] font-bold rounded uppercase">Noun</span>
                                    <h2 className="text-4xl font-black text-slate-800 mt-2 mb-1">外国</h2>
                                    <p className="text-lg font-medium text-slate-500">gaikoku</p>
                                </div>

                                <div className="space-y-4">
                                    <div className="p-4 bg-slate-50 rounded-xl">
                                        <div className="text-xs font-bold text-slate-400 uppercase mb-1">Meaning</div>
                                        <div className="font-bold text-slate-800 text-lg">Foreign country</div>
                                    </div>
                                    <div className="p-4 bg-slate-50 rounded-xl">
                                        <div className="text-xs font-bold text-slate-400 uppercase mb-1">Example</div>
                                        <div className="font-medium text-slate-800">外国に行きたい。</div>
                                        <div className="text-slate-500 text-sm mt-1">I want to go to a foreign country.</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* GRAMMAR TAB */}
                        {activeTab === 'grammar' && (
                            <div className="space-y-4 animate-in slide-in-from-right-2">
                                <div className="p-4 border border-rose-100 bg-rose-50/30 rounded-xl">
                                    <h3 className="font-bold text-rose-700 mb-1">〜について</h3>
                                    <p className="text-sm text-slate-600 mb-2">"About", "concerning", "regarding".</p>
                                    <div className="text-xs bg-white p-2 rounded border border-rose-100 text-slate-500">
                                        Structure: Noun + について
                                    </div>
                                </div>
                                <div className="p-4 border border-slate-200 bg-white rounded-xl">
                                    <h3 className="font-bold text-slate-800 mb-1">〜たい (Tai)</h3>
                                    <p className="text-sm text-slate-600 mb-2">Expresses desire ("want to do").</p>
                                    <div className="text-xs bg-slate-50 p-2 rounded border border-slate-100 text-slate-500">
                                        Structure: Verb Stem + たい
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ADD CARD TAB */}
                        {activeTab === 'add' && (
                            <div className="space-y-4 animate-in slide-in-from-right-2">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase">Front</label>
                                    <input className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-700" defaultValue="外国" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase">Back</label>
                                    <input className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-700" defaultValue="Foreign country" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase">Sentence</label>
                                    <textarea className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 min-h-[80px]" defaultValue="外国人のイメージについて話したいと思います。" />
                                </div>
                                <Button className="w-full btn-primary mt-4">Save to Flashcards</Button>
                            </div>
                        )}

                    </div>
                </div>

            </div>
        </div>
    );
}
