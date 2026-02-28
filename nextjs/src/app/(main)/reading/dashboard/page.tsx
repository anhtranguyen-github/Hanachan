'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    BarChart3,
    ChevronLeft,
    BookOpen,
    Clock,
    Target,
    Flame,
    Trophy,
    TrendingUp,
    BookMarked,
    CheckCircle2,
    Calendar,
    Loader2,
    Activity,
    Sparkles,
} from 'lucide-react';
import { clsx } from 'clsx';
import { getReadingMetrics, getMetricsHistory } from '@/features/reading/actions';
import type { ReadingMetrics, DailyMetric } from '@/features/reading/types';
import { TOPIC_LABELS, TOPIC_EMOJIS } from '@/features/reading/types';

export default function ReadingDashboardPage() {
    const [metrics, setMetrics] = useState<ReadingMetrics | null>(null);
    const [history, setHistory] = useState<DailyMetric[]>([]);
    const [historyDays, setHistoryDays] = useState(30);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        loadHistory();
    }, [historyDays]);

    const loadData = async () => {
        try {
            const data = await getReadingMetrics();
            setMetrics(data);
            setHistory(data.daily_metrics || []);
        } catch (err) {
            console.error('Failed to load metrics:', err);
        } finally {
            setLoading(false);
        }
    };

    const loadHistory = async () => {
        try {
            const data = await getMetricsHistory(historyDays);
            setHistory(data.history || []);
        } catch (err) {
            console.error('Failed to load history:', err);
        }
    };

    const formatTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        if (hours > 0) return `${hours}h ${mins}m`;
        return `${mins}m`;
    };

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 size={28} className="animate-spin text-[#A2D2FF]" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#CBD5E0]">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    const maxDailyScore = Math.max(...history.map(d => d.avg_score || 0), 1);
    const maxDailyExercises = Math.max(...history.map(d => d.exercises_completed || 0), 1);

    return (
        <main className="max-w-[1400px] mx-auto space-y-4 animate-page-entrance">
            {/* Header */}
            <header className="flex items-center gap-3 pb-2">
                <Link
                    href="/reading"
                    className="flex items-center gap-1 text-[9px] font-black text-[#A0AEC0] hover:text-[#3A6EA5] uppercase tracking-widest transition-colors"
                >
                    <ChevronLeft size={12} /> Reading
                </Link>
                <div className="flex-1">
                    <h1 className="text-xl sm:text-2xl font-black text-[#3E4A61] tracking-tighter">Reading Dashboard</h1>
                    <p className="text-[8px] font-black uppercase tracking-widest text-[#CBD5E0]">Your reading practice analytics</p>
                </div>
                <Link
                    href="/reading"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-[#A2D2FF] to-[#7BB8F0] text-white rounded-2xl text-[9px] font-black shadow-sm"
                >
                    <BookOpen size={10} /> Practice
                </Link>
            </header>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    {
                        label: 'Total Sessions',
                        value: metrics?.total_sessions || 0,
                        color: '#A2D2FF',
                        icon: BookOpen,
                        sub: `${metrics?.pending_sessions || 0} pending`,
                    },
                    {
                        label: 'Avg Score',
                        value: `${metrics?.avg_score || 0}%`,
                        color: '#48BB78',
                        icon: Target,
                        sub: `Best: ${metrics?.best_score || 0}%`,
                    },
                    {
                        label: 'Reading Streak',
                        value: `${metrics?.streak_days || 0}d`,
                        color: '#F4ACB7',
                        icon: Flame,
                        sub: 'consecutive days',
                    },
                    {
                        label: 'Words Read',
                        value: (metrics?.total_words_read || 0).toLocaleString(),
                        color: '#CDB4DB',
                        icon: BookMarked,
                        sub: `${formatTime(metrics?.total_time_seconds || 0)} total`,
                    },
                ].map((s) => (
                    <div key={s.label} className="glass-card p-4 relative overflow-hidden">
                        <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: `linear-gradient(90deg, transparent, ${s.color}40, transparent)` }} />
                        <div className="flex items-start justify-between mb-2">
                            <s.icon size={16} style={{ color: s.color }} />
                            <span className="text-[8px] font-black uppercase tracking-widest text-[#CBD5E0]">{s.sub}</span>
                        </div>
                        <div className="text-2xl font-black tracking-tighter" style={{ color: s.color }}>{s.value}</div>
                        <div className="text-[8px] font-black uppercase tracking-widest text-[#A0AEC0] mt-0.5">{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Daily Score Chart */}
                <div className="glass-card p-4 sm:p-6 relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#48BB78]/30 to-transparent" />
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-base font-black text-[#3E4A61] tracking-tight">Daily Score</h3>
                            <p className="text-[8px] font-black uppercase tracking-widest text-[#CBD5E0] mt-0.5">Average score per day</p>
                        </div>
                        <div className="flex bg-[#F7FAFC] p-0.5 rounded-xl border border-border/20">
                            {[7, 30, 90].map(d => (
                                <button
                                    key={d}
                                    onClick={() => setHistoryDays(d)}
                                    className={clsx(
                                        "px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all",
                                        historyDays === d ? "bg-white text-[#3A6EA5] shadow-sm" : "text-[#A0AEC0]"
                                    )}
                                >
                                    {d}d
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex items-end gap-1 h-32 pb-2">
                        {history.length === 0 ? (
                            <div className="flex-1 flex items-center justify-center text-[10px] text-[#CBD5E0] font-black uppercase tracking-widest">
                                No data yet
                            </div>
                        ) : (
                            history.slice(-historyDays).map((day, i) => {
                                const pct = (day.avg_score / maxDailyScore) * 100;
                                const color = day.avg_score >= 80 ? '#48BB78' : day.avg_score >= 60 ? '#A2D2FF' : '#F4ACB7';
                                return (
                                    <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                                        <div
                                            className="w-full rounded-t-lg transition-all duration-500"
                                            style={{
                                                height: `${Math.max(4, pct)}%`,
                                                backgroundColor: color,
                                                opacity: 0.8,
                                            }}
                                        />
                                        {i % Math.ceil(history.length / 7) === 0 && (
                                            <span className="text-[6px] font-black text-[#CBD5E0] absolute -bottom-4">
                                                {formatDate(day.date)}
                                            </span>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Daily Exercises Chart */}
                <div className="glass-card p-4 sm:p-6 relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#A2D2FF]/30 to-transparent" />
                    <div className="mb-4">
                        <h3 className="text-base font-black text-[#3E4A61] tracking-tight">Daily Exercises</h3>
                        <p className="text-[8px] font-black uppercase tracking-widest text-[#CBD5E0] mt-0.5">Exercises completed per day</p>
                    </div>
                    <div className="flex items-end gap-1 h-32 pb-2">
                        {history.length === 0 ? (
                            <div className="flex-1 flex items-center justify-center text-[10px] text-[#CBD5E0] font-black uppercase tracking-widest">
                                No data yet
                            </div>
                        ) : (
                            history.slice(-historyDays).map((day, i) => {
                                const pct = (day.exercises_completed / maxDailyExercises) * 100;
                                return (
                                    <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                                        <div
                                            className="w-full rounded-t-lg transition-all duration-500 bg-gradient-to-t from-[#A2D2FF] to-[#7BB8F0]"
                                            style={{ height: `${Math.max(4, pct)}%`, opacity: 0.8 }}
                                        />
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            {/* Topic Performance + Recent Sessions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Topic Performance */}
                <div className="glass-card p-4 sm:p-6 relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#CDB4DB]/30 to-transparent" />
                    <div className="mb-4">
                        <h3 className="text-base font-black text-[#3E4A61] tracking-tight">Topic Performance</h3>
                        <p className="text-[8px] font-black uppercase tracking-widest text-[#CBD5E0] mt-0.5">Accuracy by topic</p>
                    </div>

                    {!metrics?.topic_performance?.length ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                            <Activity size={24} className="text-[#CBD5E0] mb-2" />
                            <p className="text-[10px] font-black text-[#CBD5E0] uppercase tracking-widest">No topic data yet</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {metrics.topic_performance.map((tp) => {
                                const accuracy = Math.round(tp.accuracy || 0);
                                const color = accuracy >= 80 ? '#48BB78' : accuracy >= 60 ? '#A2D2FF' : '#F4ACB7';
                                return (
                                    <div key={tp.topic} className="space-y-1">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm">{TOPIC_EMOJIS[tp.topic] || '📖'}</span>
                                                <span className="text-[10px] font-black text-[#3E4A61] uppercase tracking-wide">
                                                    {TOPIC_LABELS[tp.topic] || tp.topic}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[9px] text-[#A0AEC0]">{tp.exercises_count} ex</span>
                                                <span className="text-[10px] font-black" style={{ color }}>{accuracy}%</span>
                                            </div>
                                        </div>
                                        <div className="h-1.5 bg-[#F7FAFC] rounded-full overflow-hidden border border-border/10">
                                            <div
                                                className="h-full rounded-full transition-all duration-1000"
                                                style={{ width: `${accuracy}%`, backgroundColor: color }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Recent Sessions */}
                <div className="glass-card p-4 sm:p-6 relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#F4ACB7]/30 to-transparent" />
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-base font-black text-[#3E4A61] tracking-tight">Recent Sessions</h3>
                            <p className="text-[8px] font-black uppercase tracking-widest text-[#CBD5E0] mt-0.5">Last 7 days</p>
                        </div>
                        <Link href="/reading/sessions" className="text-[9px] font-black text-[#A0AEC0] hover:text-[#3A6EA5] uppercase tracking-widest transition-colors">
                            All →
                        </Link>
                    </div>

                    {!metrics?.recent_sessions?.length ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                            <BookOpen size={24} className="text-[#CBD5E0] mb-2" />
                            <p className="text-[10px] font-black text-[#CBD5E0] uppercase tracking-widest">No sessions yet</p>
                            <Link href="/reading" className="text-[9px] text-[#3A6EA5] font-black mt-2 hover:underline">
                                Start your first session →
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {metrics.recent_sessions.slice(0, 6).map((session) => {
                                const scoreColor = session.score >= 80 ? '#48BB78' : session.score >= 60 ? '#A2D2FF' : '#F4ACB7';
                                return (
                                    <Link
                                        key={session.id}
                                        href={session.status === 'completed' ? `/reading/results/${session.id}` : `/reading/session/${session.id}`}
                                        className="flex items-center gap-3 p-2.5 bg-[#F7FAFC] rounded-2xl border border-border/20 hover:border-[#A2D2FF]/30 transition-all group"
                                    >
                                        <div className={clsx(
                                            "w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-white",
                                            session.status === 'completed' ? "bg-gradient-to-br from-[#48BB78] to-[#38A169]" : "bg-gradient-to-br from-[#A2D2FF] to-[#7BB8F0]"
                                        )}>
                                            {session.status === 'completed' ? <CheckCircle2 size={12} /> : <BookOpen size={12} />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-[10px] font-black text-[#3E4A61]">
                                                {session.total_exercises} exercises
                                            </div>
                                            <div className="text-[8px] text-[#A0AEC0]">
                                                {new Date(session.created_at).toLocaleDateString()}
                                                {session.total_time_seconds > 0 && ` • ${formatTime(session.total_time_seconds)}`}
                                            </div>
                                        </div>
                                        {session.status === 'completed' && (
                                            <span className="text-sm font-black shrink-0" style={{ color: scoreColor }}>
                                                {session.score}%
                                            </span>
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Activity Heatmap */}
            <div className="glass-card p-4 sm:p-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#A2D2FF]/30 to-transparent" />
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-base font-black text-[#3E4A61] tracking-tight">Reading Activity</h3>
                        <p className="text-[8px] font-black uppercase tracking-widest text-[#CBD5E0] mt-0.5">30-day reading heatmap</p>
                    </div>
                    <div className="flex items-center gap-1.5 text-[#A2D2FF]">
                        <Calendar size={12} />
                        <span className="text-[9px] font-black">Last 30 days</span>
                    </div>
                </div>

                {/* Build heatmap from daily metrics */}
                <div className="overflow-x-auto no-scrollbar">
                    <div className="flex gap-1 min-w-[280px]">
                        {Array.from({ length: 30 }).map((_, i) => {
                            const date = new Date();
                            date.setDate(date.getDate() - (29 - i));
                            const dateStr = date.toISOString().split('T')[0];
                            const dayData = history.find(d => d.date === dateStr);
                            const exercises = dayData?.exercises_completed || 0;
                            let intensity = 0;
                            if (exercises > 0) intensity = 1;
                            if (exercises >= 3) intensity = 2;
                            if (exercises >= 6) intensity = 3;
                            if (exercises >= 10) intensity = 4;

                            return (
                                <div
                                    key={i}
                                    title={`${dateStr}: ${exercises} exercises`}
                                    className={clsx(
                                        "flex-1 h-8 rounded-lg transition-all duration-300 hover:scale-110 cursor-crosshair",
                                        intensity === 0 && "bg-[#F7FAFC]",
                                        intensity === 1 && "bg-[#A2D2FF33]",
                                        intensity === 2 && "bg-[#A2D2FF66]",
                                        intensity === 3 && "bg-[#A2D2FFAA]",
                                        intensity === 4 && "bg-[#A2D2FF] shadow-[0_0_6px_rgba(162,210,255,0.4)]"
                                    )}
                                />
                            );
                        })}
                    </div>
                </div>
                <div className="flex justify-between items-center mt-2">
                    <span className="text-[7px] font-black text-[#CBD5E0] uppercase tracking-widest">Less</span>
                    <div className="flex gap-1 items-center">
                        {[0, 1, 2, 3, 4].map(idx => (
                            <div key={idx} className={clsx("w-3 h-3 rounded",
                                idx === 0 && "bg-[#F7FAFC]",
                                idx === 1 && "bg-[#A2D2FF33]",
                                idx === 2 && "bg-[#A2D2FF66]",
                                idx === 3 && "bg-[#A2D2FFAA]",
                                idx === 4 && "bg-[#A2D2FF]"
                            )} />
                        ))}
                    </div>
                    <span className="text-[7px] font-black text-[#CBD5E0] uppercase tracking-widest">More</span>
                </div>
            </div>

            {/* Summary Stats */}
            <div className="relative rounded-[2rem] p-4 sm:p-6 text-white overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[#2D3748] to-[#1A202C]" />
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#A2D2FF]/40 to-transparent" />

                <div className="relative z-10 flex items-center gap-2 mb-4">
                    <div className="p-1.5 bg-white/5 rounded-xl border border-white/10">
                        <Sparkles size={14} className="text-[#A2D2FF]" />
                    </div>
                    <div>
                        <h3 className="text-base font-black text-white/95 tracking-tight">Reading Summary</h3>
                        <p className="text-[8px] font-black uppercase tracking-widest text-white/30">All-time statistics</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 relative z-10">
                    {[
                        { label: 'Sessions', value: metrics?.total_sessions || 0, color: '#A2D2FF' },
                        { label: 'Exercises', value: metrics?.total_exercises || 0, color: '#B7E4C7' },
                        { label: 'Avg Score', value: `${metrics?.avg_score || 0}%`, color: '#F4ACB7' },
                        { label: 'Time', value: formatTime(metrics?.total_time_seconds || 0), color: '#CDB4DB' },
                    ].map((s) => (
                        <div key={s.label} className="space-y-1">
                            <div className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40">{s.label}</div>
                            <div className="text-2xl font-black" style={{ color: s.color }}>{s.value}</div>
                        </div>
                    ))}
                </div>
            </div>
        </main>
    );
}
