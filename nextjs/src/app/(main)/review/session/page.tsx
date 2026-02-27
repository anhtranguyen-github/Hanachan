'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, ArrowLeft, CheckCircle2, Zap, X } from 'lucide-react';
import { fetchDueItems } from '@/features/learning/service';
import { ReviewSessionController, QuizItem } from '@/features/learning/ReviewSessionController';
import { Rating } from '@/features/learning/domain/FSRSEngine';
import { GlassCard } from '@/components/premium/GlassCard';
import { ReviewCardDisplay } from '@/features/learning/components/ReviewCardDisplay';
import { clsx } from 'clsx';
import { useUser } from '@/features/auth/AuthContext';

function SessionContent() {
    const { user } = useUser();
    const searchParams = useSearchParams();
    const router = useRouter();
    const [controller, setController] = useState<ReviewSessionController | null>(null);
    const [currentCard, setCurrentCard] = useState<QuizItem | null>(null);
    const [phase, setPhase] = useState<'init' | 'quiz' | 'complete'>('init');
    const [stats, setStats] = useState({ mistakes: 0, totalItems: 0, completed: 0 });

    const loadSession = async () => {
        if (!user) return;
        const userId = user.id;

        try {
            const items = await fetchDueItems(userId);

            if (items.length === 0) {
                setPhase('complete');
                console.log(`[ReviewSession] Phase changed to 'complete' (no items due).`);
                return;
            }

            const newController = new ReviewSessionController(userId);
            await newController.initSession(items);

            setController(newController);
            const firstCard = newController.getNextItem();
            setCurrentCard(firstCard);
            setStats({ mistakes: 0, totalItems: items.length, completed: 0 });
            setPhase('quiz');
        } catch (error) {
            console.error("[ReviewSession] loadSession error:", error);
            setPhase('complete');
        }
    };

    useEffect(() => {
        if (user) {
            loadSession();
        }
    }, [user]);

    const handleAnswer = async (rating: Rating, userInput: string) => {
        if (!controller) return;

        const success = await controller.submitAnswer(rating);
        if (!success) {
            setStats(s => ({ ...s, mistakes: s.mistakes + 1 }));
        }

        const next = controller.getNextItem();
        if (next) {
            setCurrentCard(next);
            const progress = controller.getProgress();
            setStats(s => ({ ...s, completed: progress.completed }));
        } else {
            setPhase('complete');
        }
    };

    if (phase === 'init') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-8 gap-8">
                <Loader2 className="animate-spin text-primary" size={48} />
                <p className="text-xs font-bold uppercase tracking-widest text-foreground/40">Loading...</p>
            </div>
        );
    }

    if (phase === 'complete') {
        const accuracy = stats.totalItems > 0 ? Math.round(((stats.totalItems - stats.mistakes) / stats.totalItems) * 100) : 100;

        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 max-w-2xl mx-auto space-y-16 animate-in fade-in duration-1000">
                <div className="space-y-4 text-center">
                    <h1 className="text-6xl font-black text-gray-900 tracking-tighter" data-testid="review-complete-header">Excellent Work!</h1>
                    <p className="text-gray-400 font-medium">{stats.totalItems} items reviewed. Everything is up to date.</p>
                </div>

                <div className="grid grid-cols-3 gap-6 w-full">
                    {[
                        { label: 'Accuracy', val: `${accuracy}%` },
                        { label: 'Mistakes', val: stats.mistakes.toString() },
                        { label: 'Next Due', val: '2h' }
                    ].map(s => (
                        <div key={s.label} className="bg-white border-2 border-gray-100 p-8 rounded-[40px] text-center shadow-sm">
                            <span className="block text-3xl font-black text-kanji mb-1">{s.val}</span>
                            <span className="text-[10px] font-black uppercase text-gray-300 tracking-widest">{s.label}</span>
                        </div>
                    ))}
                </div>

                <button
                    onClick={() => router.push('/dashboard')}
                    className="block w-full py-6 bg-gray-900 text-white text-2xl font-black rounded-[32px] shadow-2xl hover:translate-y-[-4px] transition-all active:scale-95"
                >
                    Back to Dashboard
                </button>
            </div>
        );
    }

    if (!currentCard || !controller) return null;

    const progress = (stats.completed / Math.max(stats.totalItems * 2, 1)) * 100;

    return (
        <div className="min-h-screen bg-[#FDFDFD] pt-4 sm:pt-8 pb-4 sm:pb-12 px-4 sm:px-6 flex flex-col max-w-4xl mx-auto" data-testid="review-session-root">
            <header className="flex justify-between items-center mb-8 sm:mb-16 shrink-0 h-10">
                <div className="flex items-center gap-3">
                    <div className="w-24 sm:w-48 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                            className={clsx("h-full transition-all duration-700 ease-out", currentCard?.type === 'kanji' ? 'bg-kanji' : 'bg-primary')}
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.15em] whitespace-nowrap">
                        {stats.completed + 1} / {stats.totalItems}
                    </span>
                </div>
                <button
                    onClick={() => router.push('/review')}
                    className="group flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-gray-100 rounded-2xl transition-all duration-300"
                    title="Exit Review"
                >
                    <X size={14} className="text-gray-400 group-hover:text-gray-600 group-hover:rotate-90 transition-transform duration-300" />
                    <span className="text-[9px] font-bold text-gray-400 group-hover:text-gray-600 tracking-widest uppercase hidden sm:inline">Exit</span>
                </button>
            </header>

            <div className="relative z-10 flex-1 flex items-center justify-center">
                <ReviewCardDisplay
                    card={currentCard}
                    mode="review"
                    onReveal={() => { }}
                    onRate={handleAnswer}
                />
            </div>
        </div>
    );
}

export default function ReviewSessionPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="animate-spin text-primary" size={48} /></div>}>
            <SessionContent />
        </Suspense>
    );
}
