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
                <p className="text-xs font-bold uppercase tracking-widest text-foreground/40">Synchronizing memory state...</p>
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
        <div className="min-h-screen bg-background py-12 px-6 flex flex-col max-w-5xl mx-auto space-y-12" data-testid="review-session-root">
            <div className="absolute top-0 left-0 w-full h-[300px] bg-gradient-to-b from-primary/10 to-transparent -z-10" />

            <header className="flex justify-between items-center px-6 shrink-0">
                <div className="flex items-center gap-6">
                    <div className="space-y-1">
                        <span className={clsx("block text-xl font-black leading-none", currentCard?.type === 'kanji' ? 'text-kanji' : 'text-primary')}>
                            {stats.completed + 1} / {stats.totalItems}
                        </span>
                        <span className="block text-[8px] font-black text-foreground/20 uppercase tracking-widest leading-none">Review Progress</span>
                    </div>
                    <div className="w-48 h-2.5 bg-gray-100 rounded-full overflow-hidden border border-gray-100">
                        <div
                            className={clsx("h-full transition-all duration-700 ease-out shadow-[0_0_10px_rgba(0,0,0,0.1)]", currentCard?.type === 'kanji' ? 'bg-kanji' : 'bg-primary')}
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>

                <div className="flex gap-4 items-center">
                    <div className="hidden md:block bg-orange-50 px-3 py-1.5 rounded-xl border border-orange-100 italic text-[9px] font-black text-orange-400">
                        Intra-session Loop
                    </div>
                    <button
                        onClick={() => router.push('/review')}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface-muted/50 hover:bg-surface border border-border text-foreground/40 hover:text-red-500 transition-all group"
                        title="End Session"
                    >
                        <X size={18} className="group-hover:rotate-90 transition-transform" />
                    </button>
                </div>
            </header>

            <div className="relative z-10">
                <ReviewCardDisplay
                    card={currentCard}
                    mode="review"
                    onReveal={() => { }}
                    onRate={handleAnswer}
                />
            </div>

            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 text-[9px] font-black text-foreground/5 uppercase tracking-[0.5em] pointer-events-none font-mono">
                SECURE_LEARNING_PROTOCOL // SAKURA-V2-ALGO-ACTIVE
            </div>
        </div >
    );
}

export default function ReviewSessionPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="animate-spin text-primary" size={48} /></div>}>
            <SessionContent />
        </Suspense>
    );
}
