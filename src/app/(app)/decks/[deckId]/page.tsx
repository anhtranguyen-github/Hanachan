'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/ui/components/ui/button';
import { ArrowLeft, Play, Plus, BookOpen, GraduationCap, Flame, Layers } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useUser } from '@/features/auth/AuthContext';
import { fetchDeckStats, fetchLevelContent } from '@/features/srs/service';

export default function DeckDetailPage() {
    const params = useParams<{ deckId: string }>();
    const router = useRouter();
    const { user } = useUser();

    // State
    const [stats, setStats] = useState({ total: 0, learned: 0, due: 0, new: 0 });
    const [content, setContent] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const isLevelDeck = params?.deckId?.startsWith('level-');
    const levelNumber = isLevelDeck ? parseInt(params?.deckId.split('-')[1] || '0') : 0;

    useEffect(() => {
        if (isLevelDeck && user) {
            loadData();
        } else if (!isLevelDeck) {
            setIsLoading(false);
        }
    }, [params?.deckId, user]);

    const loadData = async () => {
        if (!params?.deckId || !user) return;
        try {
            const [statsData, contentData] = await Promise.all([
                fetchDeckStats(user.id, params.deckId),
                fetchLevelContent(levelNumber, user.id)
            ]);
            setStats(statsData);
            setContent(contentData || []);
        } catch (e) {
            console.error("Failed to load data", e);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isLevelDeck) {
        // Fallback for custom decks (Mock implementation for now)
        return (
            <div className="max-w-4xl mx-auto p-6 space-y-6">
                <div className="flex items-start justify-between border-b pb-6">
                    <Button variant="ghost" className="text-slate-400" onClick={() => router.back()}>
                        <ArrowLeft className="w-4 h-4 mr-1" /> Back
                    </Button>
                    <h1 className="text-3xl font-bold text-slate-900">Custom Deck: {params?.deckId}</h1>
                </div>
                <div className="text-center p-20 bg-slate-50 rounded-xl">
                    <p className="text-slate-500">Custom deck logic pending...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-8 pb-20">
            {/* Header */}
            <div>
                <Button variant="ghost" className="text-slate-400 text-xs font-bold uppercase tracking-widest pl-0 hover:text-slate-800 mb-4" onClick={() => router.push('/decks')}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> All Decks
                </Button>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <span className="px-3 py-1 bg-rose-100 text-rose-600 rounded-lg text-xs font-black uppercase tracking-widest">Official Curriculum</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">Level {levelNumber}</h1>
                        <p className="text-lg text-slate-500 max-w-xl leading-relaxed">
                            Master the core Knowledge Units required for Level {levelNumber}. This deck contains Kanji, Vocabulary, and Radicals.
                        </p>
                    </div>

                    <div className="flex gap-4">
                        <Button
                            size="lg"
                            className="h-16 px-8 rounded-full bg-slate-900 text-white font-bold tracking-widest hover:bg-slate-800 hover:scale-105 transition-all shadow-xl shadow-slate-200"
                            onClick={() => router.push(`/study/${params?.deckId}`)}
                        >
                            <Play className="w-5 h-5 mr-3 fill-current" />
                            {stats.due > 0 ? `REVIEW (${stats.due})` : 'STUDY NOW'}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    label="Total Items"
                    value={stats.total}
                    icon={Layers}
                    color="slate"
                />
                <StatCard
                    label="Learned"
                    value={stats.learned}
                    icon={GraduationCap}
                    color="blue"
                    subtext={`${Math.round((stats.learned / (stats.total || 1)) * 100)}% Complete`}
                />
                <StatCard
                    label="Reviews Due"
                    value={stats.due}
                    icon={Flame}
                    color="rose"
                    isActive={stats.due > 0}
                />
                <StatCard
                    label="Available to Learn"
                    value={stats.new}
                    icon={BookOpen}
                    color="emerald"
                />
            </div>

            {/* Content List */}
            <div className="border-t border-slate-100 pt-10">
                <h3 className="text-xl font-bold text-slate-800 mb-6">Deck Content</h3>
                <div className="grid grid-cols-1 gap-4">
                    {content.length === 0 ? (
                        <div className="bg-slate-50 rounded-3xl p-10 text-center border border-slate-100 border-dashed">
                            <p className="text-slate-400 font-medium">No content found for this level.</p>
                        </div>
                    ) : (
                        content.map((item, i) => (
                            <div key={i} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:shadow-sm transition-all group">
                                <div className="flex items-center gap-6">
                                    <div
                                        className={cn(
                                            "w-14 h-14 rounded-xl flex items-center justify-center text-2xl font-black text-slate-700 font-jp cursor-pointer hover:scale-110 transition-transform",
                                            item.type === 'radical' ? "bg-blue-50 text-blue-600" :
                                                item.type === 'kanji' ? "bg-rose-50 text-rose-600" : "bg-purple-50 text-purple-600"
                                        )}
                                        onClick={() => router.push(`/items/${item.type}/${item.slug.split('/').pop()}`)}
                                    >
                                        {item.character || item.slug.split('/').pop()}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{item.type}</span>
                                            {item.user_learning_states?.[0]?.state && (
                                                <span className={cn(
                                                    "px-1.5 py-0.5 rounded text-[9px] font-black uppercase text-white",
                                                    item.user_learning_states[0].state === 'burned' ? "bg-slate-800" :
                                                        item.user_learning_states[0].state === 'review' ? "bg-emerald-500" :
                                                            item.user_learning_states[0].state === 'learning' ? "bg-amber-500" : "bg-blue-400"
                                                )}>
                                                    {item.user_learning_states[0].state}
                                                </span>
                                            )}
                                        </div>
                                        <div className="font-bold text-slate-700">
                                            {item.meaning ||
                                                item.ku_kanji?.[0]?.meaning_data?.meanings?.join(', ') ||
                                                item.ku_vocabulary?.[0]?.meaning_data?.meanings?.join(', ') ||
                                                item.ku_radicals?.[0]?.name || "Unknown"}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    {item.user_learning_states?.[0]?.next_review ? (
                                        <div className="text-xs text-slate-400 font-medium">
                                            Next: {new Date(item.user_learning_states[0].next_review).toLocaleDateString()}
                                        </div>
                                    ) : (
                                        <span className="text-xs text-slate-300 font-bold uppercase tracking-wider">Not Started</span>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

function StatCard({ label, value, icon: Icon, color, subtext, isActive }: { label: string, value: number, icon: any, color: string, subtext?: string, isActive?: boolean }) {
    const colors = {
        slate: "bg-slate-50 text-slate-400 group-hover:bg-slate-100",
        blue: "bg-blue-50 text-blue-500 group-hover:bg-blue-100",
        rose: "bg-rose-50 text-rose-500 group-hover:bg-rose-100",
        emerald: "bg-emerald-50 text-emerald-500 group-hover:bg-emerald-100"
    };

    return (
        <div className={cn(
            "p-6 rounded-[32px] bg-white border border-slate-100 shadow-sm transition-all duration-300 group hover:border-slate-200 hover:shadow-lg",
            isActive && "ring-2 ring-rose-200 border-rose-200 shadow-rose-100"
        )}>
            <div className="flex justify-between items-start mb-4">
                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-colors", colors[color as keyof typeof colors])}>
                    <Icon size={24} />
                </div>
                {isActive && <div className="w-3 h-3 bg-rose-500 rounded-full animate-pulse"></div>}
            </div>
            <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{label}</div>
                <div className="text-3xl font-black text-slate-800">{value}</div>
                {subtext && <div className="text-xs font-bold text-slate-400 mt-1">{subtext}</div>}
            </div>
        </div>
    );
}
