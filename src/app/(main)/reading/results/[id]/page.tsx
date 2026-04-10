'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
    Trophy,
    ChevronLeft,
    CheckCircle2,
    XCircle,
    BookOpen,
    Clock,
    Target,
    Loader2,
    ChevronDown,
    ChevronUp,
    Play,
} from 'lucide-react';
import { clsx } from 'clsx';
import { getReadingSession } from '@/features/reading/actions';
import type { ReadingSession, ReadingExercise } from '@/features/reading/types';
import { TOPIC_LABELS, TOPIC_EMOJIS } from '@/features/reading/types';

export const dynamic = "force-dynamic";


export default function ReadingResultsPage() {
    const params = useParams();
    const router = useRouter();
    const sessionId = params.id as string;

    const [session, setSession] = useState<ReadingSession | null>(null);
    const [loading, setLoading] = useState(true);
    const [expandedExercise, setExpandedExercise] = useState<string | null>(null);

    useEffect(() => {
        loadSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sessionId]);

    const loadSession = async () => {
        try {
            const data = await getReadingSession(sessionId);
            setSession(data);
        } catch (err) {
            console.error('Failed to load session:', err);
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        if (m === 0) return `${s}s`;
        return `${m}m ${s}s`;
    };

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center">
                <Loader2 size={24} className="animate-spin text-[#A2D2FF]" />
            </div>
        );
    }

    if (!session) {
        return (
            <div className="max-w-2xl mx-auto text-center py-12">
                <p className="text-[#3E4A61] font-black">Session not found</p>
                <Link href="/reading" className="text-[#3A6EA5] text-sm font-black mt-2 block">← Back to Reading</Link>
            </div>
        );
    }

    const scoreColor = session.score >= 80 ? '#48BB78' : session.score >= 60 ? '#A2D2FF' : '#F4ACB7';
    const scoreGrade = session.score >= 90 ? 'S' : session.score >= 80 ? 'A' : session.score >= 70 ? 'B' : session.score >= 60 ? 'C' : 'D';

    return (
        <main className="max-w-3xl mx-auto space-y-4 animate-page-entrance">
            {/* Header */}
            <header className="flex items-center gap-3 pb-2">
                <Link
                    href="/reading/sessions"
                    className="flex items-center gap-1 text-[9px] font-black text-[#A0AEC0] hover:text-[#3A6EA5] uppercase tracking-widest transition-colors"
                >
                    <ChevronLeft size={12} /> Sessions
                </Link>
                <div className="flex-1">
                    <h1 className="text-xl font-black text-[#3E4A61] tracking-tighter">Session Results</h1>
                    <p className="text-[8px] font-black uppercase tracking-widest text-[#CBD5E0]">
                        {new Date(session.created_at).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </p>
                </div>
            </header>

            {/* Score Card */}
            <div className="glass-card p-6 sm:p-8 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: `linear-gradient(90deg, transparent, ${scoreColor}40, transparent)` }} />
                <div className="absolute inset-0 opacity-5" style={{ background: `radial-gradient(circle at 50% 0%, ${scoreColor}, transparent 70%)` }} />

                {/* Grade */}
                <div
                    className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white font-black text-4xl shadow-xl relative z-10"
                    style={{ background: `linear-gradient(135deg, ${scoreColor}, ${scoreColor}99)`, boxShadow: `0 8px 32px ${scoreColor}40` }}
                >
                    {scoreGrade}
                </div>

                <div className="text-5xl font-black tracking-tighter mb-1 relative z-10" style={{ color: scoreColor }}>
                    {session.score}%
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-[#CBD5E0] mb-6 relative z-10">Final Score</p>

                <div className="grid grid-cols-3 gap-3 relative z-10">
                    {[
                        { label: 'Correct', value: `${session.correct_answers}/${session.total_exercises}`, icon: CheckCircle2, color: '#48BB78' },
                        { label: 'Time', value: formatTime(session.total_time_seconds), icon: Clock, color: '#A2D2FF' },
                        { label: 'Exercises', value: session.completed_exercises, icon: BookOpen, color: '#CDB4DB' },
                    ].map((s) => (
                        <div key={s.label} className="p-3 bg-[#F7FAFC] rounded-2xl border border-border/20">
                            <s.icon size={14} className="mx-auto mb-1" style={{ color: s.color }} />
                            <div className="text-base font-black text-[#3E4A61]">{s.value}</div>
                            <div className="text-[8px] font-black uppercase tracking-widest text-[#A0AEC0]">{s.label}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Exercise Breakdown */}
            {session.exercises && session.exercises.length > 0 && (
                <div className="glass-card p-4 sm:p-6 relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#A2D2FF]/30 to-transparent" />
                    <h3 className="text-sm font-black text-[#3E4A61] uppercase tracking-widest mb-4">Exercise Breakdown</h3>

                    <div className="space-y-2">
                        {session.exercises.map((exercise, i) => (
                            <div key={exercise.id} className="border border-border/20 rounded-2xl overflow-hidden">
                                <button
                                    onClick={() => setExpandedExercise(expandedExercise === exercise.id ? null : exercise.id)}
                                    className="w-full flex items-center gap-3 p-3 hover:bg-[#F7FAFC] transition-colors text-left"
                                >
                                    <div className="w-7 h-7 bg-gradient-to-br from-[#A2D2FF]/20 to-[#A2D2FF]/10 rounded-xl flex items-center justify-center text-[#3A6EA5] shrink-0 text-xs font-black">
                                        {i + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm">{TOPIC_EMOJIS[exercise.topic] || '📖'}</span>
                                            <span className="text-[10px] font-black text-[#3E4A61] uppercase tracking-wide">
                                                {TOPIC_LABELS[exercise.topic] || exercise.topic}
                                            </span>
                                            {exercise.jlpt_level && (
                                                <span className="text-[8px] font-black text-[#A0AEC0]">N{exercise.jlpt_level}</span>
                                            )}
                                        </div>
                                        <div className="text-[9px] text-[#A0AEC0]">
                                            {exercise.questions.length} questions • {exercise.word_count} chars
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className={clsx(
                                            "text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full",
                                            exercise.status === 'completed' ? "bg-[#48BB78]/10 text-[#48BB78]" : "bg-[#CBD5E0]/20 text-[#A0AEC0]"
                                        )}>
                                            {exercise.status}
                                        </span>
                                        {expandedExercise === exercise.id ? <ChevronUp size={12} className="text-[#A0AEC0]" /> : <ChevronDown size={12} className="text-[#A0AEC0]" />}
                                    </div>
                                </button>

                                {expandedExercise === exercise.id && (
                                    <div className="border-t border-border/20 p-4 bg-[#F7FAFC]/50">
                                        {/* Passage preview */}
                                        <div className="mb-3">
                                            <p className="text-[9px] font-black uppercase tracking-widest text-[#A0AEC0] mb-1">Passage</p>
                                            <p className="text-sm text-[#3E4A61] leading-relaxed line-clamp-3">
                                                {exercise.passage_ja}
                                            </p>
                                        </div>

                                        {/* Questions */}
                                        <div>
                                            <p className="text-[9px] font-black uppercase tracking-widest text-[#A0AEC0] mb-2">Questions</p>
                                            <div className="space-y-2">
                                                {exercise.questions.map((q, qi) => (
                                                    <div key={qi} className="p-2.5 bg-white rounded-xl border border-border/20">
                                                        <div className="flex items-start gap-2">
                                                            <span className="text-[8px] font-black text-[#A0AEC0] uppercase tracking-widest shrink-0 mt-0.5">Q{qi + 1}</span>
                                                            <div className="flex-1">
                                                                <p className="text-[10px] font-black text-[#3E4A61]">{q.question_ja}</p>
                                                                <p className="text-[9px] text-[#A0AEC0] italic">{q.question_en}</p>
                                                                <p className="text-[9px] text-[#48BB78] font-black mt-1">✓ {q.correct_answer}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pb-4">
                <Link
                    href="/reading"
                    className="flex-1 py-3 border-2 border-border/30 text-[#A0AEC0] font-black rounded-2xl hover:border-[#A2D2FF]/30 hover:text-[#3A6EA5] transition-all text-center text-sm"
                >
                    Back to Reading
                </Link>
                <Link
                    href="/reading/dashboard"
                    className="flex-1 py-3 bg-gradient-to-r from-[#A2D2FF] to-[#7BB8F0] text-white font-black rounded-2xl shadow-lg hover:scale-[1.01] transition-all text-center text-sm flex items-center justify-center gap-2"
                >
                    <Target size={14} /> View Dashboard
                </Link>
            </div>
        </main>
    );
}
