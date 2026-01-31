'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
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
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        );
    }

    const hasActiveBatch = state.batch !== null;

    return (
        <div className="max-w-2xl mx-auto space-y-8 py-10" data-testid="learning-overview-root">
            <div className="text-center space-y-4">
                <h1 className="text-3xl font-black text-gray-900">Start Learning</h1>
                <p className="text-gray-500">You have {state.totalNew} items ready to learn today.</p>
            </div>

            <div className="bg-white border-2 border-gray-300 p-10 rounded-[40px] shadow-xl text-center space-y-8">
                {hasActiveBatch ? (
                    <>
                        <div className="flex justify-center gap-4">
                            {state.batch.items.slice(0, 5).map((item: any, i: number) => (
                                <div
                                    key={i}
                                    className="w-16 h-16 border-2 border-primary/10 bg-primary/5 rounded-2xl flex items-center justify-center text-primary font-black text-xl shadow-sm"
                                >
                                    {item.knowledge_units?.character || '?'}
                                </div>
                            ))}
                        </div>

                        <div className="space-y-1">
                            <h2 className="text-3xl font-black tracking-tighter">New Batch: {state.batch.items.length} Items</h2>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Approx. time: {state.batch.items.length * 2} minutes</p>
                        </div>

                        <Link
                            href="/learn/session"
                            data-testid="begin-session-link"
                            className="block w-full py-5 bg-primary text-white text-xl font-black rounded-3xl shadow-lg hover:translate-y-[-2px] transition-all"
                        >
                            Begin Session
                        </Link>
                    </>
                ) : (
                    <div className="py-10 space-y-4">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto text-gray-300">
                            <span className="text-4xl">✓</span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-400">All Clear!</h3>
                        <p className="text-gray-400 text-sm">No new items to learn at this level.</p>
                        <Link
                            href="/dashboard"
                            className="inline-block px-8 py-3 border-2 border-gray-200 text-gray-500 font-bold rounded-2xl hover:bg-gray-50 transition-colors"
                        >
                            Back to Dashboard
                        </Link>
                    </div>
                )}
            </div>

            {state.batches.length > 1 && (
                <div className="grid grid-cols-3 gap-4">
                    {state.batches.map((b: any) => (
                        <div
                            key={b.id}
                            className={`p-4 rounded-2xl border text-center ${b.status === 'available'
                                ? 'border-primary/40 bg-primary/5'
                                : 'border-gray-200 bg-gray-50 opacity-50'
                                }`}
                        >
                            <span className="block text-xl font-black text-gray-600">{b.items.length}</span>
                            <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Batch {b.id}</span>
                        </div>
                    ))}
                </div>
            )}

            <div className="text-center">
                <Link href="/dashboard" className="text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors">
                    Back to Dashboard
                </Link>
            </div>
        </div>
    );
}
