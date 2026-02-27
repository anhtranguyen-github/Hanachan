'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Loader2, BookOpen, ChevronRight, Target, X, Sparkles, GraduationCap } from 'lucide-react';
import { fetchNewItems, fetchLevelStats } from '@/features/learning/service';
import { useUser } from '@/features/auth/AuthContext';
import { supabase } from '@/lib/supabase';
import { clsx } from 'clsx';

export default function LearnOverviewPage() {
    const { user } = useUser();
    const [state, setState] = useState<any>(null);
    const [mounted, setMounted] = useState(false);
    const [userLevel, setUserLevel] = useState(1);

    const refreshData = async () => {
        if (!user) return;
        try {
            const userId = user.id;
            const { data: profile } = await supabase.from('users').select('level').eq('id', userId).single();
            const currentLevel = profile?.level || 1;
            setUserLevel(currentLevel);
            const levelStats = await fetchLevelStats(userId, `level-${currentLevel}`);
            const newItems = await fetchNewItems(userId, `level-${currentLevel}`, 20);
            const batches = [];
            for (let i = 0; i < newItems.length; i += 5) {
                batches.push({ id: (i / 5) + 1, items: newItems.slice(i, i + 5), status: i === 0 ? 'available' : 'locked' });
            }
            setState({ level: currentLevel, batch: batches[0] || null, batches, totalNew: levelStats.new });
        } catch (error) {
            console.error("Failed to load learn state:", error);
            setState({ level: 1, batch: null, batches: [], totalNew: 0 });
        }
    };

    useEffect(() => {
        setMounted(true);
        if (user) refreshData();
    }, [user]);

    if (!mounted || !state) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                        <div className="absolute inset-0 bg-[#A2D2FF] rounded-2xl blur-xl opacity-20 animate-pulse" />
                        <div className="relative w-12 h-12 bg-gradient-to-br from-[#A2D2FF] to-[#7BB8F0] rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg">学</div>
                    </div>
                    <div className="flex gap-1.5">
                        {[0, 1, 2].map(i => (
                            <div key={i} className="w-1.5 h-1.5 bg-[#A2D2FF] rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    const hasActiveBatch = state.batch !== null;

    return (
        <div data-testid="learning-overview-root" className="max-w-2xl mx-auto space-y-4 font-sans text-foreground animate-page-entrance">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2.5">
                    <div className="relative">
                        <div className="absolute inset-0 bg-[#A2D2FF] rounded-xl blur-md opacity-30" />
                        <div className="relative w-8 h-8 bg-gradient-to-br from-[#A2D2FF] to-[#7BB8F0] rounded-xl flex items-center justify-center text-white font-black text-sm shadow-md">学</div>
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-[#3E4A61] tracking-tight uppercase">Discovery Hub</h2>
                        <p className="text-[8px] font-black uppercase tracking-widest text-[#CBD5E0]">Level {userLevel}</p>
                    </div>
                </div>
                <Link href="/dashboard" className="p-2 bg-white/80 border border-border/40 rounded-xl text-[#A0AEC0] hover:text-[#3E4A61] hover:border-primary/20 shadow-sm transition-all group backdrop-blur-sm">
                    <X size={16} className="group-hover:rotate-90 transition-transform duration-300" />
                </Link>
            </div>

            {/* Main action card */}
            <div className="glass-card p-5 sm:p-8 flex flex-col relative overflow-hidden group">
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#A2D2FF]/40 to-transparent" />
                <div className="absolute -right-8 -top-8 text-[#A2D2FF]/5 group-hover:scale-110 group-hover:-rotate-6 transition-all duration-1000 pointer-events-none">
                    <GraduationCap size={160} strokeWidth={1} />
                </div>

                <div className="relative z-10 space-y-4">
                    <div className="flex items-center gap-2">
                        <h3 className="text-2xl sm:text-3xl font-black text-[#3E4A61] tracking-tighter">Level {userLevel}</h3>
                        {hasActiveBatch && (
                            <span className="px-2 py-1 bg-[#A2D2FF]/15 text-[#3A6EA5] rounded-lg text-[8px] font-black uppercase tracking-widest border border-[#A2D2FF]/20">
                                Batch {state.batch.id}
                            </span>
                        )}
                    </div>

                    {hasActiveBatch ? (
                        <div className="bg-gradient-to-br from-[#A2D2FF]/10 to-[#A2D2FF]/5 rounded-2xl p-4 flex items-center justify-between border border-[#A2D2FF]/15">
                            <div>
                                <span className="text-2xl font-black text-[#3A6EA5]">{state.batch.items.length}</span>
                                <span className="text-[8px] font-black uppercase tracking-widest text-[#A0AEC0] block mt-0.5">Items Ready</span>
                            </div>
                            <div className="flex -space-x-2">
                                {state.batch.items.slice(0, 4).map((item: any, i: number) => (
                                    <div key={i} className="w-8 h-8 rounded-full bg-white border-2 border-[#EDF2F7] flex items-center justify-center text-[10px] font-black text-[#3A6EA5] shadow-sm">
                                        {item.knowledge_units?.character?.[0] || '?'}
                                    </div>
                                ))}
                                {state.batch.items.length > 4 && (
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#A2D2FF] to-[#7BB8F0] border-2 border-white flex items-center justify-center text-[9px] text-white font-black shadow-sm">
                                        +{state.batch.items.length - 4}
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="bg-[#F7FAFC] rounded-2xl p-4 border border-border/20">
                            <p className="text-sm text-[#A0AEC0] font-bold">All items completed for this level!</p>
                        </div>
                    )}
                </div>

                {hasActiveBatch && (
                    <Link
                        href="/learn/session"
                        data-testid="begin-session-link"
                        className="relative z-10 mt-5 w-full py-4 bg-gradient-to-r from-[#3A6EA5] to-[#2D5A8A] text-white rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] hover:shadow-xl hover:shadow-[#3A6EA5]/25 hover:scale-[1.02] transition-all duration-300 group/btn"
                    >
                        <Sparkles size={13} />
                        Start Discovery
                        <ChevronRight size={13} className="group-hover/btn:translate-x-1 transition-transform" />
                    </Link>
                )}
            </div>

            {/* Batch overview */}
            <div className="glass-card p-4 sm:p-5 space-y-3 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#CDB4DB]/30 to-transparent" />
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Target size={13} className="text-[#A0AEC0]" />
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#3E4A61]">Batch Overview</h4>
                    </div>
                    <span className="text-[9px] font-black text-[#3A6EA5]">{state.totalNew} available</span>
                </div>

                <div className="space-y-1.5 max-h-[160px] overflow-y-auto custom-scrollbar">
                    {state.batches.length > 0 ? state.batches.map((batch: any) => (
                        <div
                            key={batch.id}
                            className={clsx(
                                "p-3 border rounded-2xl flex items-center gap-2.5 transition-all",
                                batch.status === 'available' ? 'bg-white border-border/30 hover:border-[#A2D2FF]/40' : 'bg-[#F7FAFC] border-transparent opacity-50'
                            )}
                        >
                            <div className={clsx("w-1.5 h-1.5 rounded-full", batch.status === 'available' ? 'bg-[#A2D2FF] shadow-[0_0_6px_rgba(162,210,255,0.5)]' : 'bg-[#CBD5E0]')} />
                            <span className="text-[10px] font-black uppercase tracking-widest text-[#3E4A61] flex-1">Batch {batch.id}</span>
                            <span className="text-[9px] font-bold text-[#A0AEC0]">{batch.items.length} items</span>
                        </div>
                    )) : (
                        <div className="text-center py-6">
                            <p className="text-[10px] font-bold text-[#A0AEC0] uppercase tracking-widest">No batches found</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Back link */}
            <div className="flex justify-center">
                <Link href="/dashboard" className="px-5 py-2.5 bg-white/80 border border-border/30 rounded-xl text-[9px] font-black uppercase tracking-widest text-[#A0AEC0] hover:text-[#3E4A61] hover:border-primary/20 transition-all">
                    Back to Dashboard
                </Link>
            </div>
        </div>
    );
}
