'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    BookOpen,
    ChevronLeft,
    ChevronRight,
    Play,
    CheckCircle2,
    Clock,
    Filter,
    Plus,
    Loader2,
    AlertCircle,
} from 'lucide-react';
import { clsx } from 'clsx';
import { listReadingSessions, createReadingSession } from '@/features/reading/actions';
import type { ReadingSession } from '@/features/reading/types';

const STATUS_FILTERS = ['all', 'pending', 'active', 'completed', 'abandoned'] as const;
type StatusFilter = typeof STATUS_FILTERS[number];

export default function ReadingSessionsPage() {
    const router = useRouter();
    const [sessions, setSessions] = useState<ReadingSession[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [page, setPage] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const LIMIT = 10;

    useEffect(() => {
        loadSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [statusFilter, page]);

    const loadSessions = async () => {
        try {
            setLoading(true);
            const data = await listReadingSessions({
                status: statusFilter === 'all' ? undefined : statusFilter,
                limit: LIMIT,
                offset: page * LIMIT,
            });
            setSessions(data.sessions);
            setTotal(data.total);
        } catch (err) {
            console.error('Failed to load sessions:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateSession = async () => {
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
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        if (m === 0) return `${s}s`;
        return `${m}m ${s}s`;
    };

    const totalPages = Math.ceil(total / LIMIT);

    return (
        <main className="max-w-3xl mx-auto space-y-4 animate-page-entrance">
            {/* Header */}
            <header className="flex items-center gap-3 pb-2">
                <Link
                    href="/reading"
                    className="flex items-center gap-1 text-[9px] font-black text-[#A0AEC0] hover:text-[#3A6EA5] uppercase tracking-widest transition-colors"
                >
                    <ChevronLeft size={12} /> Reading
                </Link>
                <div className="flex-1">
                    <h1 className="text-xl font-black text-[#3E4A61] tracking-tighter">All Sessions</h1>
                    <p className="text-[8px] font-black uppercase tracking-widest text-[#CBD5E0]">{total} total sessions</p>
                </div>
                <button
                    onClick={handleCreateSession}
                    disabled={creating}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-[#A2D2FF] to-[#7BB8F0] text-white rounded-2xl text-[9px] font-black shadow-sm hover:shadow-md transition-all disabled:opacity-60"
                >
                    {creating ? <Loader2 size={10} className="animate-spin" /> : <Plus size={10} />}
                    New Session
                </button>
            </header>

            {/* Error */}
            {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-2xl text-red-600">
                    <AlertCircle size={14} />
                    <span className="text-[11px] font-black">{error}</span>
                </div>
            )}

            {/* Filters */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                {STATUS_FILTERS.map((status) => (
                    <button
                        key={status}
                        onClick={() => { setStatusFilter(status); setPage(0); }}
                        className={clsx(
                            "px-3 py-1.5 rounded-2xl text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all",
                            statusFilter === status
                                ? "bg-[#A2D2FF] text-white shadow-sm"
                                : "bg-[#F7FAFC] text-[#A0AEC0] border border-border/20 hover:border-[#A2D2FF]/30"
                        )}
                    >
                        {status}
                    </button>
                ))}
            </div>

            {/* Sessions List */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 size={24} className="animate-spin text-[#A2D2FF]" />
                </div>
            ) : sessions.length === 0 ? (
                <div className="glass-card p-8 text-center">
                    <BookOpen size={32} className="mx-auto text-[#CBD5E0] mb-3" />
                    <p className="text-sm font-black text-[#3E4A61] mb-1">No sessions found</p>
                    <p className="text-[10px] text-[#A0AEC0] mb-4">
                        {statusFilter === 'all' ? 'Start your first reading session!' : `No ${statusFilter} sessions`}
                    </p>
                    <button
                        onClick={handleCreateSession}
                        className="px-4 py-2 bg-gradient-to-r from-[#A2D2FF] to-[#7BB8F0] text-white font-black text-sm rounded-2xl"
                    >
                        Create Session
                    </button>
                </div>
            ) : (
                <div className="space-y-2">
                    {sessions.map((session) => {
                        const scoreColor = session.score >= 80 ? '#48BB78' : session.score >= 60 ? '#A2D2FF' : '#F4ACB7';
                        const href = session.status === 'completed'
                            ? `/reading/results/${session.id}`
                            : `/reading/session/${session.id}`;

                        return (
                            <Link
                                key={session.id}
                                href={href}
                                className="glass-card p-4 flex items-center gap-3 hover:border-[#A2D2FF]/30 transition-all group"
                            >
                                {/* Status Icon */}
                                <div className={clsx(
                                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-white",
                                    session.status === 'completed' && "bg-gradient-to-br from-[#48BB78] to-[#38A169]",
                                    session.status === 'active' && "bg-gradient-to-br from-[#A2D2FF] to-[#7BB8F0]",
                                    session.status === 'pending' && "bg-gradient-to-br from-[#FFD6A5] to-[#FFA500]",
                                    session.status === 'abandoned' && "bg-gradient-to-br from-[#CBD5E0] to-[#A0AEC0]",
                                )}>
                                    {session.status === 'completed' ? <CheckCircle2 size={18} /> :
                                        session.status === 'active' ? <Play size={18} /> :
                                            session.status === 'pending' ? <BookOpen size={18} /> :
                                                <BookOpen size={18} />}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className="text-sm font-black text-[#3E4A61]">
                                            {session.total_exercises} exercises
                                        </span>
                                        <span className={clsx(
                                            "text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full",
                                            session.status === 'completed' && "bg-[#48BB78]/10 text-[#48BB78]",
                                            session.status === 'active' && "bg-[#A2D2FF]/10 text-[#3A6EA5]",
                                            session.status === 'pending' && "bg-[#FFD6A5]/20 text-[#D4A017]",
                                            session.status === 'abandoned' && "bg-[#CBD5E0]/20 text-[#A0AEC0]",
                                        )}>
                                            {session.status}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 text-[9px] text-[#A0AEC0]">
                                        <span>{new Date(session.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                        {session.total_time_seconds > 0 && (
                                            <span className="flex items-center gap-1">
                                                <Clock size={8} /> {formatTime(session.total_time_seconds)}
                                            </span>
                                        )}
                                        {session.status !== 'pending' && (
                                            <span>{session.completed_exercises}/{session.total_exercises} done</span>
                                        )}
                                    </div>
                                </div>

                                {/* Score */}
                                {session.status === 'completed' && (
                                    <div className="text-right shrink-0">
                                        <div className="text-xl font-black" style={{ color: scoreColor }}>{session.score}%</div>
                                        <div className="text-[8px] text-[#A0AEC0]">score</div>
                                    </div>
                                )}

                                <ChevronRight size={14} className="text-[#CBD5E0] group-hover:text-[#3A6EA5] transition-colors shrink-0" />
                            </Link>
                        );
                    })}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 py-2">
                    <button
                        onClick={() => setPage(p => Math.max(0, p - 1))}
                        disabled={page === 0}
                        className="px-3 py-1.5 bg-[#F7FAFC] border border-border/20 rounded-xl text-[9px] font-black text-[#A0AEC0] disabled:opacity-40 hover:border-[#A2D2FF]/30 transition-all"
                    >
                        ← Prev
                    </button>
                    <span className="text-[9px] font-black text-[#A0AEC0] uppercase tracking-widest">
                        {page + 1} / {totalPages}
                    </span>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                        disabled={page >= totalPages - 1}
                        className="px-3 py-1.5 bg-[#F7FAFC] border border-border/20 rounded-xl text-[9px] font-black text-[#A0AEC0] disabled:opacity-40 hover:border-[#A2D2FF]/30 transition-all"
                    >
                        Next →
                    </button>
                </div>
            )}
        </main>
    );
}
