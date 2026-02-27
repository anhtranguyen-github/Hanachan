'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Loader2, BookOpen, ChevronRight, Target, X } from 'lucide-react';
import { fetchNewItems, fetchLevelStats } from '@/features/learning/service';
import { useUser } from '@/features/auth/AuthContext';
import { supabase } from '@/lib/supabase';

export default function LearnOverviewPage() {
    const { user } = useUser();
    const [state, setState] = useState<any>(null);
    const [mounted, setMounted] = useState(false);
    const [userLevel, setUserLevel] = useState(1);

    const refreshData = async () => {
        if (!user) return;
        try {
            const userId = user.id;

            // 1. Fetch user profile to get level
            const { data: profile } = await supabase
                .from('users')
                .select('level')
                .eq('id', userId)
                .single();

            const currentLevel = profile?.level || 1;
            setUserLevel(currentLevel);

            const levelStats = await fetchLevelStats(userId, `level-${currentLevel}`);
            const newItems = await fetchNewItems(userId, `level-${currentLevel}`, 20);

            // Group into batches of 5
            const batches = [];
            for (let i = 0; i < newItems.length; i += 5) {
                batches.push({
                    id: (i / 5) + 1,
                    items: newItems.slice(i, i + 5),
                    status: i === 0 ? 'available' : 'locked'
                });
            }

            setState({
                level: currentLevel,
                batch: batches[0] || null,
                batches: batches,
                totalNew: levelStats.new
            });
        } catch (error) {
            console.error("Failed to load learn state:", error);
            setState({ level: 1, batch: null, batches: [], totalNew: 0 });
        }
    };

    useEffect(() => {
        setMounted(true);
        if (user) {
            refreshData();
        }
    }, [user]);

    if (!mounted || !state) {
        return (
            <div className="h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-[#FFB5B5] animate-spin" />
            </div>
        );
    }

    const hasActiveBatch = state.batch !== null;

    return (
        <div data-testid="learning-overview-root" className="max-w-5xl mx-auto pt-12 pb-16 space-y-sm font-sans text-foreground animate-in fade-in duration-1000">
            {/* Immersive Header */}
            <div className="flex justify-between items-center mb-12">
                <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 bg-[#FFB5B5] rounded-full" />
                    <h2 className="text-xl font-black text-[#3E4A61] tracking-tight uppercase">Discovery Hub</h2>
                </div>
                <Link
                    href="/dashboard"
                    className="p-3 bg-[#F7FAFC] border border-[#EDF2F7] rounded-2xl text-[#A0AEC0] hover:text-[#3E4A61] hover:bg-white hover:border-[#FFB5B5] shadow-sm transition-all group"
                    title="Close and Return to Dashboard"
                >
                    <X size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                <div className="bg-white border-2 border-[#F0E0E0] rounded-[40px] p-8 shadow-xl shadow-[#3E4A61]/5 flex flex-col justify-between relative overflow-hidden group min-h-[300px]">
                    <div className="absolute -right-6 -top-6 text-[#F7FAFC] transition-transform duration-700 group-hover:scale-110 group-hover:rotate-6">
                        <Loader2 size={160} strokeWidth={1} className="opacity-10" />
                    </div>

                    <div className="relative z-10 space-y-6">
                        <div className="space-y-1">
                            <h3 className="text-3xl font-black text-[#3E4A61]">Level {userLevel}</h3>
                            <p className="text-sm font-black text-[#FFB5B5] tracking-tight">
                                {hasActiveBatch ? `Batch ${state.batch.id}` : 'No Batches Available'}
                            </p>
                        </div>

                        {hasActiveBatch ? (
                            <div className="bg-[#F2E8E8] rounded-2xl p-4 flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase tracking-widest text-[#3E4A61]">
                                    {state.batch.items.length} Items Selected
                                </span>
                                <div className="flex -space-x-2.5">
                                    {state.batch.items.slice(0, 3).map((item: any, i: number) => (
                                        <div key={i} className="w-8 h-8 rounded-full bg-white border-2 border-[#F2E8E8] flex items-center justify-center text-[10px] font-black text-[#FFB5B5]">
                                            {item.knowledge_units?.character?.[0] || '?'}
                                        </div>
                                    ))}
                                    {state.batch.items.length > 3 && (
                                        <div className="w-8 h-8 rounded-full bg-[#FFB5B5] border-2 border-[#F2E8E8] flex items-center justify-center text-[10px] text-white font-bold">
                                            +{state.batch.items.length - 3}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-[#A0AEC0]">You've completed all current items!</p>
                        )}
                    </div>

                    {hasActiveBatch && (
                        <Link
                            href="/learn/session"
                            data-testid="begin-session-link"
                            className="relative z-10 mt-8 w-full py-4 px-8 border-2 border-[#F0E0E0] rounded-2xl flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-[#3E4A61] hover:bg-[#3E4A61] hover:text-white hover:border-[#3E4A61] transition-all group/btn shadow-sm"
                        >
                            Start Discovery
                            <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                        </Link>
                    )}
                </div>

                <div className="bg-white border-2 border-[#F0E0E0] rounded-[40px] p-8 shadow-sm space-y-6 flex flex-col justify-center">
                    <div className="flex items-center gap-2.5">
                        <Target size={14} className="text-[#A0AEC0]" />
                        <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-[#3E4A61]">Batch Overview</h4>
                    </div>

                    <div className="space-y-3 overflow-y-auto max-h-[180px] custom-scrollbar pr-2">
                        {state.batches.length > 0 ? (
                            state.batches.map((batch: any) => (
                                <div
                                    key={batch.id}
                                    className={`p-4 border-2 rounded-2xl flex items-center gap-3 transition-all ${batch.status === 'available'
                                        ? 'bg-white border-[#F0E0E0] hover:border-[#FFB5B5] cursor-pointer'
                                        : 'bg-[#F7FAFC] border-transparent opacity-60'
                                        }`}
                                >
                                    <div className={`w-2 h-2 rounded-full ${batch.status === 'available' ? 'bg-[#FFB5B5]' : 'bg-[#CBD5E0]'}`} />
                                    <div className="flex-1">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-[#3E4A61]">Batch {batch.id}</span>
                                    </div>
                                    <span className="text-[10px] font-bold text-[#A0AEC0]">{batch.items.length} Items</span>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8">
                                <p className="text-xs font-bold text-[#A0AEC0] uppercase tracking-widest">No batches found</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Quick Progress Banner */}
            <div className="bg-white border-2 border-[#F0E0E0] rounded-[40px] p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
                <div className="flex items-center gap-4 text-center md:text-left">
                    <div className="w-12 h-12 bg-[#FFF5F5] rounded-xl flex items-center justify-center">
                        <BookOpen size={24} className="text-[#FFB5B5]" />
                    </div>
                    <h4 className="text-sm font-black text-[#3E4A61] uppercase tracking-tight">Ready to Learn</h4>
                </div>
                <Link
                    href="/dashboard"
                    className="px-8 py-3 bg-[#F7FAFC] border border-[#EDF2F7] rounded-xl text-[10px] font-black uppercase tracking-widest text-[#A0AEC0] hover:text-[#3E4A61] hover:bg-white hover:border-[#FFB5B5] transition-all"
                >
                    Back to Dashboard
                </Link>
            </div>
        </div>
    );
}
