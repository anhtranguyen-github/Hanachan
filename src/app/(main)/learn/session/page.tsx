'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, ArrowLeft, BookOpen, ChevronRight, CheckCircle2, PlayCircle, Zap, X } from 'lucide-react';
import { clsx } from 'clsx';
import { startLessonSessionAction, completeLessonBatchAction } from '@/features/learning/actions';
import { useUser } from '@/features/auth/AuthContext';
import { getUserLevelOrDefault } from '@/features/auth/db';
import { QuizItem } from '@/features/learning/LearningController';
import { Rating } from '@/features/learning/core/SRSAlgorithm';
import { ReviewCardDisplay } from '@/features/learning/components/ReviewCardDisplay';
import { LessonSlide } from '@/features/learning/components/LessonSlide';


function SessionContent() {
    const { user } = useUser();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [controller, setController] = useState<any>(null);
    const [currentCard, setCurrentCard] = useState<QuizItem | null>(null);
    const [lessonQueue, setLessonQueue] = useState<any[]>([]);
    const [phase, setPhase] = useState<'init' | 'lesson-view' | 'quiz' | 'complete'>('init');
    const [stats, setStats] = useState({ mistakes: 0, totalItems: 0, completed: 0 });
    const [lessonIndex, setLessonIndex] = useState(0);
    const [batchId, setBatchId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const hasLoaded = React.useRef(false);

    const loadSession = async () => {
        if (!user || hasLoaded.current) return;
        hasLoaded.current = true;

        try {
            const currentLevel = await getUserLevelOrDefault(user.id);
            const deckId = searchParams.get('deckId') || undefined;

            // Refactored to use Server Action that enforces limits
            const result = await startLessonSessionAction(user.id, deckId ? undefined : currentLevel, deckId);

            if (!result.success) {
                setError(result.error || "Failed to start session");
                setPhase('complete'); // Use complete as a terminal state with error message
                return;
            }

            const { items, batch } = result.data;

            if (!items || items.length === 0) {
                router.push('/learn');
                return;
            }

            setBatchId(batch.id);

            // 2. Initialize Controller
            // Need to import Controller if not already done correctly
            const { LearningController } = await import('@/features/learning/LearningController');
            const newController = new LearningController(user.id, batch.id);
            const initializedItems = await newController.init(items);

            setLessonQueue(initializedItems);
            setController(newController);
            setStats({ mistakes: 0, totalItems: initializedItems.length, completed: 0 });
            setPhase('lesson-view');
        } catch (error: unknown) {
            console.error("[LearnSession] loadSession error:", error);
            setError((error instanceof Error ? error.message : String(error)));
            setPhase('complete');
        }
    };

    useEffect(() => {
        if (user) loadSession();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const handleLessonNext = async () => {
        if (!controller) return;

        const hasNext = await controller.nextLessonItem();
        if (hasNext) {
            setLessonIndex(controller.getCurrentLessonIndex());
        } else {
            // Start Quiz Phase
            const quizItems = controller.startQuiz();
            setCurrentCard(controller.getCurrentQuizItem());
            setPhase('quiz');
        }
    };

    const handleAnswer = async (rating: Rating, userInput: string) => {
        if (!controller) return;

        const success = await controller.submitQuizAnswer(rating);

        if (!success) {
            setStats(s => ({ ...s, mistakes: s.mistakes + 1 }));
        }

        const next = controller.getCurrentQuizItem();
        if (next) {
            setCurrentCard(next);
            setStats(s => ({ ...s, completed: controller.getProgress().completed }));
        } else {
            // Batch Complete
            if (batchId) {
                await completeLessonBatchAction(batchId);
            }
            setPhase('complete');
        }
    };

    useEffect(() => {
        // Hard-lock the viewport for session layouts
        document.documentElement.classList.add('screen-locked');
        document.body.classList.add('screen-locked');

        // Cleanup: restore normal scrolling when leaving the session
        return () => {
            document.documentElement.classList.remove('screen-locked');
            document.body.classList.remove('screen-locked');
        };
    }, []);

    if (phase === 'init') {
        return (
            <div className="h-full flex flex-col items-center justify-center p-8 gap-8 bg-[#FDF8F8] overflow-hidden">
                <Loader2 className="animate-spin text-primary" size={48} />
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-300">Loading...</p>
            </div>
        );
    }

    if (phase === 'complete') {
        const accuracy = stats.totalItems > 0 ? Math.round(((stats.totalItems - stats.mistakes) / stats.totalItems) * 100) : 100;

        if (error) {
            return (
                <div className="h-full bg-[#FDF8F8] flex flex-col items-center justify-center p-8 max-w-2xl mx-auto space-y-12 animate-in fade-in duration-700 overflow-hidden">
                    <div className="w-32 h-32 bg-rose-100 rounded-[48px] flex items-center justify-center text-rose-500 mb-4 animate-bounce">
                        <Zap size={64} fill="currentColor" />
                    </div>
                    <div className="space-y-6 text-center">
                        <h1 className="text-5xl font-black text-gray-900 tracking-tighter">
                            {error.toLowerCase().includes('limit') ? 'Daily Limit Reached' : 'Session Error'}
                        </h1>
                        <p className="text-gray-500 text-xl font-medium leading-relaxed">
                            {error}
                        </p>
                    </div>
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="w-full py-6 bg-gray-900 text-white text-2xl font-black rounded-[32px] shadow-2xl hover:scale-105 transition-all"
                    >
                        Back to Dashboard
                    </button>
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-300">Come back tomorrow to continue</p>
                </div>
            );
        }

        return (
            <div className="h-full bg-background flex flex-col items-center justify-center p-8 max-w-2xl mx-auto space-y-16 animate-in fade-in duration-1000 overflow-hidden">
                <div className="space-y-4 text-center">
                    <h1 className="text-6xl font-black text-gray-900 tracking-tighter" data-testid="review-complete-header">Excellent Work!</h1>
                    <p className="text-gray-400 font-medium">{stats.totalItems} items learned. Growth in progress.</p>
                </div>

                <div className="grid grid-cols-3 gap-6 w-full">
                    {[
                        { label: 'Accuracy', val: `${accuracy}%` },
                        { label: 'Mistakes', val: stats.mistakes.toString() },
                        { label: 'Next Due', val: '4h' }
                    ].map(s => (
                        <div key={s.label} className="bg-white border-2 border-gray-100 p-8 rounded-[40px] text-center shadow-sm">
                            <span className="block text-3xl font-black text-primary mb-1">{s.val}</span>
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

    if (phase === 'lesson-view') {
        const item = lessonQueue[lessonIndex];
        const isLastLesson = lessonIndex === lessonQueue.length - 1;

        return (
            <div
                className="w-full h-full bg-white flex flex-col overflow-hidden"
                data-testid="lesson-view-phase"
            >
                <header className="flex justify-between items-center shrink-0 px-5 py-3.5 border-b border-gray-100 bg-white relative z-20">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden max-w-xs">
                            <div
                                className="h-full bg-primary rounded-full transition-all duration-700 ease-out"
                                style={{ width: `${((lessonIndex + 1) / lessonQueue.length) * 100}%` }}
                            />
                        </div>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">
                            Step {lessonIndex + 1} of {lessonQueue.length}
                        </span>
                    </div>
                    <button
                        onClick={() => router.push('/learn')}
                        className="ml-3 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all group"
                        title="Close Session"
                    >
                        <X size={15} className="text-gray-400 group-hover:text-red-500 transition-colors" />
                        <span className="text-[10px] font-black text-gray-400 group-hover:text-red-500 tracking-widest uppercase hidden sm:inline">Exit</span>
                    </button>
                </header>

                <LessonSlide
                    item={item.knowledge_units}
                    onNext={handleLessonNext}
                    isLastLesson={isLastLesson}
                />
            </div>
        );
    }

    // Quiz Phase
    if (!currentCard || !controller) return null;
    const progress = (stats.completed / Math.max(controller.getProgress().total, 1)) * 100;

    return (
        <div className="w-full h-full flex flex-col overflow-hidden bg-white" data-testid="quiz-phase">
            <header className="flex justify-between items-center shrink-0 px-5 py-3.5 border-b border-gray-100 bg-white relative z-20">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden max-w-xs">
                        <div
                            className={clsx('h-full rounded-full transition-all duration-700 ease-out', currentCard?.type === 'kanji' ? 'bg-kanji' : 'bg-primary')}
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">
                        Step {stats.completed + 1} of {controller.getProgress().total}
                    </span>
                </div>
                <button
                    onClick={() => router.push('/learn')}
                    className="ml-3 group flex items-center gap-1.5 px-3 py-2 hover:bg-gray-50 rounded-xl transition-all duration-300 border border-gray-200 hover:border-gray-300"
                    title="Close Session"
                >
                    <X size={15} className="text-gray-400 group-hover:text-red-500 transition-colors duration-300" />
                    <span className="text-[10px] font-bold text-gray-400 group-hover:text-red-500 tracking-widest uppercase hidden sm:inline">Exit</span>
                </button>
            </header>

            <div className="flex-1 flex flex-col relative z-10 w-full">
                <ReviewCardDisplay
                    card={currentCard}
                    mode="learn"
                    onReveal={() => { }}
                    onRate={handleAnswer}
                />
            </div>
        </div>
    );
}


export default function LearnSessionPage() {
    return (
        <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-md flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-300">
            <div className="w-full max-w-5xl h-full max-h-[85vh] bg-white rounded-[32px] sm:rounded-[40px] shadow-2xl overflow-hidden flex flex-col relative ring-1 ring-black/5">
                <Suspense fallback={<div className="h-full flex items-center justify-center bg-background"><Loader2 className="animate-spin text-primary" size={48} /></div>}>
                    <SessionContent />
                </Suspense>
            </div>
        </div>
    );
}
