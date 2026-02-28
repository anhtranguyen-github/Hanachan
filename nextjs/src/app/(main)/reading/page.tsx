'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    BookOpen,
    Play,
    Settings,
    BarChart3,
    Clock,
    Target,
    Flame,
    Sparkles,
    ChevronRight,
    Plus,
    Trophy,
    BookMarked,
    Loader2,
    CheckCircle2,
    AlertCircle,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useUser } from '@/features/auth/AuthContext';
import { getReadingMetrics, createReadingSession, listReadingSessions } from '@/features/reading/actions';
import type { ReadingMetrics, ReadingSession } from '@/features/reading/types';
import { TOPIC_LABELS, TOPIC_EMOJIS } from '@/features/reading/types';

export default function ReadingPage() {
    const router = useRouter();
    const { user, openLoginModal } = useUser();
    const [metrics, setMetrics] = useState<ReadingMetrics | null>(null);
    const [pendingSessions, setPendingSessions] = useState<ReadingSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const loadData = async () => {
        if (!user) {
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            const [metricsData, sessionsData] = await Promise.all([
                getReadingMetrics().catch(() => null),
                listReadingSessions({ status: 'pending', limit: 5 }).catch(() => ({ sessions: [], total: 0 })),
            ]);
            setMetrics(metricsData);
            setPendingSessions(sessionsData.sessions);
        } catch (err) {
            console.error('Failed to load reading data:', err);
            setError('Failed to load reading data');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateSession = async () => {
        if (!user) {
            openLoginModal();
            return;
        }
        try {
            setCreating(true);
            setError(null);
            const session = await createReadingSession();
            router.push(`/reading/session/${session.id}`);
        } catch (err: any) {
            setError(err.message || 'Failed to create session');
            setCreating(false);
        }
    };

    const formatTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        if (hours > 0) return `${hours}h ${mins}m`;
        return `${mins}m`;
    };

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                        <div className="absolute inset-0 bg-[#A2D2FF] rounded-2xl blur-xl opacity-20 animate-pulse" />
                        <div className="relative w-14 h-14 bg-gradient-to-br from-[#A2D2FF] to-[#7BB8F0] rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-xl">
                            読
                        </div>
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

    return (
        <main className="max-w-[1400px] mx-auto space-y-4 animate-page-entrance">
            {/* Header */}
            <header className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 overflow-hidden">
                <div className="absolute -top-8 -right-8 w-48 h-48 bg-gradient-to-br from-[#A2D2FF]/8 to-[#CDB4DB]/5 rounded-full blur-3xl pointer-events-none" />
                <div className="flex items-center gap-3 relative z-10">
                    <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-[#A2D2FF] to-[#7BB8F0] rounded-2xl blur-lg opacity-20 animate-pulse-slow" />
                        <div className="relative w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-[#A2D2FF] to-[#7BB8F0] rounded-2xl flex items-center justify-center text-white font-black text-lg sm:text-xl shadow-lg">
                            読
                        </div>
                    </div>
                    <div>
                        <h1 className="text-xl sm:text-3xl font-black text-[#3E4A61] tracking-tighter leading-none">
                            Reading <span className="text-[#3A6EA5]">Practice</span>
                        </h1>
                        <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.3em] text-[#CBD5E0] mt-1 flex items-center gap-1.5">
                            <span className="w-1 h-1 bg-[#A2D2FF] rounded-full inline-block" />
                            AI-Powered Reading Sessions
                        </p>
                    </div>
                </div>
                <div className="flex gap-2 relative z-10">
                    <Link
                        href="/reading/settings"
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white/80 backdrop-blur-sm border border-[#A2D2FF]/20 rounded-2xl shadow-sm hover:border-[#A2D2FF]/40 transition-all"
                    >
                        <Settings size={11} className="text-[#3A6EA5]" />
                        <span className="text-[9px] font-black text-[#3E4A61] uppercase tracking-widest">Settings</span>
                    </Link>
                    <Link
                        href="/reading/dashboard"
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white/80 backdrop-blur-sm border border-[#CDB4DB]/20 rounded-2xl shadow-sm hover:border-[#CDB4DB]/40 transition-all"
                    >
                        <BarChart3 size={11} className="text-[#9B7EC8]" />
                        <span className="text-[9px] font-black text-[#3E4A61] uppercase tracking-widest">Dashboard</span>
                    </Link>
                </div>
            </header>

            {/* Error */}
            {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-sm">
                    <AlertCircle size={16} />
                    <span>{error}</span>
                </div>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { label: 'Sessions', value: metrics?.total_sessions || 0, color: '#A2D2FF', icon: BookOpen },
                    { label: 'Avg Score', value: `${metrics?.avg_score || 0}%`, color: '#48BB78', icon: Target },
                    { label: 'Streak', value: `${metrics?.streak_days || 0}d`, color: '#F4ACB7', icon: Flame },
                    { label: 'Words Read', value: (metrics?.total_words_read || 0).toLocaleString(), color: '#CDB4DB', icon: BookMarked },
                ].map((s) => (
                    <div key={s.label} className="glass-card p-3 sm:p-4 text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: `linear-gradient(90deg, transparent, ${s.color}40, transparent)` }} />
                        <s.icon size={16} className="mx-auto mb-1" style={{ color: s.color }} />
                        <div className="text-xl sm:text-2xl font-black tracking-tighter" style={{ color: s.color }}>{s.value}</div>
                        <div className="text-[8px] font-black uppercase tracking-widest text-[#A0AEC0] mt-0.5">{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Main Action */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Start New Session */}
                <div className="lg:col-span-2 glass-card p-6 relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#A2D2FF]/40 to-transparent" />
                    <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-gradient-to-br from-[#A2D2FF]/10 to-transparent rounded-full blur-2xl" />

                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <h2 className="text-lg font-black text-[#3E4A61] tracking-tight">Start Reading Session</h2>
                            <p className="text-[10px] font-black uppercase tracking-widest text-[#CBD5E0] mt-0.5">
                                AI generates passages based on your learning progress
                            </p>
                        </div>
                        <div className="p-2 bg-[#A2D2FF]/10 rounded-xl border border-[#A2D2FF]/20">
                            <Sparkles size={16} className="text-[#3A6EA5]" />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 mb-5">
                        {[
                            { label: 'Personalized', desc: 'Uses your vocab & grammar', icon: '🎯' },
                            { label: 'Adaptive', desc: 'Matches your level', icon: '📈' },
                            { label: 'Comprehensive', desc: 'Questions & explanations', icon: '✅' },
                        ].map((f) => (
                            <div key={f.label} className="p-3 bg-[#F7FAFC] rounded-2xl border border-border/20">
                                <div className="text-lg mb-1">{f.icon}</div>
                                <div className="text-[10px] font-black text-[#3E4A61] uppercase tracking-wide">{f.label}</div>
                                <div className="text-[9px] text-[#A0AEC0] mt-0.5">{f.desc}</div>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={handleCreateSession}
                        disabled={creating}
                        className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-[#A2D2FF] to-[#7BB8F0] text-white font-black text-sm rounded-2xl shadow-lg shadow-[#A2D2FF]/30 hover:shadow-[#A2D2FF]/50 hover:scale-[1.01] transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {creating ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                <span>Generating Session...</span>
                            </>
                        ) : (
                            <>
                                <Play size={16} />
                                <span>Start New Session</span>
                            </>
                        )}
                    </button>
                </div>

                {/* Pending Sessions */}
                <div className="glass-card p-4 relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#FFD6A5]/40 to-transparent" />
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-black text-[#3E4A61] tracking-tight">Continue Reading</h3>
                        <Link href="/reading/sessions" className="text-[9px] font-black text-[#A0AEC0] hover:text-[#3A6EA5] uppercase tracking-widest transition-colors">
                            View All
                        </Link>
                    </div>

                    {pendingSessions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                            <BookOpen size={24} className="text-[#CBD5E0] mb-2" />
                            <p className="text-[10px] font-black text-[#CBD5E0] uppercase tracking-widest">No pending sessions</p>
                            <p className="text-[9px] text-[#CBD5E0] mt-1">Start a new session above</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {pendingSessions.map((session) => (
                                <Link
                                    key={session.id}
                                    href={`/reading/session/${session.id}`}
                                    className="flex items-center gap-3 p-3 bg-[#F7FAFC] rounded-2xl border border-border/20 hover:border-[#A2D2FF]/30 hover:bg-[#A2D2FF]/5 transition-all group"
                                >
                                    <div className="w-8 h-8 bg-gradient-to-br from-[#A2D2FF]/20 to-[#A2D2FF]/10 rounded-xl flex items-center justify-center text-[#3A6EA5] shrink-0">
                                        <BookOpen size={14} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-[10px] font-black text-[#3E4A61] uppercase tracking-wide">
                                            {session.total_exercises} exercises
                                        </div>
                                        <div className="text-[9px] text-[#A0AEC0]">
                                            {new Date(session.created_at).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <ChevronRight size={12} className="text-[#CBD5E0] group-hover:text-[#3A6EA5] transition-colors" />
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Recent Sessions */}
            {metrics && metrics.recent_sessions.length > 0 && (
                <div className="glass-card p-4 sm:p-6 relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#CDB4DB]/30 to-transparent" />
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-base font-black text-[#3E4A61] tracking-tight">Recent Sessions</h3>
                            <p className="text-[8px] font-black uppercase tracking-widest text-[#CBD5E0] mt-0.5">Your reading history</p>
                        </div>
                        <Link href="/reading/sessions" className="text-[9px] font-black text-[#A0AEC0] hover:text-[#3A6EA5] uppercase tracking-widest transition-colors flex items-center gap-1">
                            View All <ChevronRight size={10} />
                        </Link>
                    </div>

                    <div className="space-y-2">
                        {metrics.recent_sessions.slice(0, 5).map((session) => {
                            const scoreColor = session.score >= 80 ? '#48BB78' : session.score >= 60 ? '#F4ACB7' : '#FF6B6B';
                            return (
                                <Link
                                    key={session.id}
                                    href={session.status === 'completed' ? `/reading/results/${session.id}` : `/reading/session/${session.id}`}
                                    className="flex items-center gap-3 p-3 bg-[#F7FAFC] rounded-2xl border border-border/20 hover:border-[#A2D2FF]/30 transition-all group"
                                >
                                    <div className={clsx(
                                        "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-white font-black text-xs",
                                        session.status === 'completed' ? "bg-gradient-to-br from-[#48BB78] to-[#38A169]" : "bg-gradient-to-br from-[#A2D2FF] to-[#7BB8F0]"
                                    )}>
                                        {session.status === 'completed' ? <CheckCircle2 size={14} /> : <Play size={14} />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-black text-[#3E4A61] uppercase tracking-wide">
                                                {session.total_exercises} exercises
                                            </span>
                                            <span className={clsx(
                                                "text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full",
                                                session.status === 'completed' ? "bg-[#48BB78]/10 text-[#48BB78]" : "bg-[#A2D2FF]/10 text-[#3A6EA5]"
                                            )}>
                                                {session.status}
                                            </span>
                                        </div>
                                        <div className="text-[9px] text-[#A0AEC0]">
                                            {new Date(session.created_at).toLocaleDateString()} •{' '}
                                            {session.total_time_seconds > 0 ? formatTime(session.total_time_seconds) : 'Not started'}
                                        </div>
                                    </div>
                                    {session.status === 'completed' && (
                                        <div className="text-right shrink-0">
                                            <div className="text-base font-black" style={{ color: scoreColor }}>{session.score}%</div>
                                            <div className="text-[8px] text-[#A0AEC0]">score</div>
                                        </div>
                                    )}
                                    <ChevronRight size={12} className="text-[#CBD5E0] group-hover:text-[#3A6EA5] transition-colors" />
                                </Link>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Topic Performance */}
            {metrics && metrics.topic_performance.length > 0 && (
                <div className="glass-card p-4 sm:p-6 relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#A2D2FF]/30 to-transparent" />
                    <div className="mb-4">
                        <h3 className="text-base font-black text-[#3E4A61] tracking-tight">Topic Performance</h3>
                        <p className="text-[8px] font-black uppercase tracking-widest text-[#CBD5E0] mt-0.5">Accuracy by reading topic</p>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                        {metrics.topic_performance.map((tp) => {
                            const accuracy = Math.round(tp.accuracy || 0);
                            const color = accuracy >= 80 ? '#48BB78' : accuracy >= 60 ? '#A2D2FF' : '#F4ACB7';
                            return (
                                <div key={tp.topic} className="p-3 bg-[#F7FAFC] rounded-2xl border border-border/20 text-center">
                                    <div className="text-xl mb-1">{TOPIC_EMOJIS[tp.topic] || '📖'}</div>
                                    <div className="text-[9px] font-black text-[#3E4A61] uppercase tracking-wide mb-1">
                                        {TOPIC_LABELS[tp.topic] || tp.topic}
                                    </div>
                                    <div className="text-base font-black" style={{ color }}>{accuracy}%</div>
                                    <div className="text-[8px] text-[#A0AEC0]">{tp.exercises_count} exercises</div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Best Score Banner */}
            {metrics && metrics.best_score > 0 && (
                <div className="relative rounded-[2rem] p-4 sm:p-6 text-white overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#2D3748] to-[#1A202C]" />
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#A2D2FF]/40 to-transparent" />
                    <div className="relative z-10 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-[#FFD700]/10 rounded-xl border border-[#FFD700]/20">
                                <Trophy size={20} className="text-[#FFD700]" />
                            </div>
                            <div>
                                <div className="text-[10px] font-black uppercase tracking-widest text-white/40">Personal Best</div>
                                <div className="text-2xl font-black text-white">{metrics.best_score}%</div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-[10px] font-black uppercase tracking-widest text-white/40">Total Time</div>
                            <div className="text-xl font-black text-white">{formatTime(metrics.total_time_seconds)}</div>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
