'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { fetchUserDashboardStats } from '@/features/learning/service';
import { useUser } from '@/features/auth/AuthContext';

export default function ReviewPage() {
    const { user } = useUser();
    const [stats, setStats] = useState<any>(null);
    const [mounted, setMounted] = useState(false);

    const loadRealStats = async () => {
        if (!user) return;
        const dashboardStats = await fetchUserDashboardStats(user.id);
        const estimatedTime = Math.ceil(dashboardStats.reviewsDue * 0.5);

        setStats({
            due: dashboardStats.reviewsDue,
            breakdown: dashboardStats.dueBreakdown,
            estimatedTime,
            retention: dashboardStats.retention
        });
    };

    useEffect(() => {
        setMounted(true);
        if (user) {
            loadRealStats();
        }
    }, [user]);

    if (!mounted || !stats) {
        return (
            <div className="h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-kanji animate-spin" />
            </div>
        );
    }

    const hasReviews = stats.due > 0;

    return (
        <div className="max-w-2xl mx-auto space-y-8 py-10">
            <div className="text-center space-y-4">
                <h1 className="text-3xl font-black text-gray-900">Review Session</h1>
                <p className="text-gray-500">You have {stats.due} items due for review.</p>
            </div>

            <div className="bg-white border-2 border-gray-300 p-10 rounded-[40px] shadow-xl text-center space-y-8">
                {hasReviews ? (
                    <>
                        <div className="flex justify-center gap-2">
                            {Array.from({ length: Math.min(stats.due, 10) }).map((_, i) => (
                                <div key={i} className="w-8 h-8 border-2 border-kanji/10 bg-kanji/5 rounded-lg shadow-sm"></div>
                            ))}
                        </div>

                        <div className="space-y-1">
                            <h2 className="text-3xl font-black text-kanji tracking-tighter">Active Queue: {stats.due} Items</h2>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Maintaining long-term memory</p>
                        </div>

                        <Link
                            href="/review/session"
                            className="block w-full py-5 bg-kanji text-white text-xl font-black rounded-3xl shadow-lg hover:translate-y-[-2px] transition-all"
                        >
                            Begin Reviews
                        </Link>
                    </>
                ) : (
                    <div className="py-10 space-y-4">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-400">
                            <span className="text-4xl">✓</span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-600">All Caught Up!</h3>
                        <p className="text-gray-400 text-sm">No reviews due right now. Great job!</p>
                        <Link
                            href="/dashboard"
                            className="inline-block px-8 py-3 border-2 border-gray-200 text-gray-500 font-bold rounded-2xl hover:bg-gray-50 transition-colors"
                        >
                            Back to Dashboard
                        </Link>
                    </div>
                )}
            </div>

            {hasReviews && (
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-300 text-center">
                        <span className="block text-xl font-black text-gray-600">{stats.breakdown?.learning || 0}</span>
                        <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Learning</span>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-300 text-center">
                        <span className="block text-xl font-black text-gray-600">{stats.breakdown?.review || 0}</span>
                        <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Review</span>
                    </div>
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
