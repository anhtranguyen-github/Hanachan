'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowLeft, BookOpen, ChevronRight, CheckCircle2, PlayCircle, Zap, X } from 'lucide-react';
import { clsx } from 'clsx';
import { startLessonSessionAction, completeLessonBatchAction } from '@/features/learning/actions';
import { useUser } from '@/features/auth/AuthContext';
import { supabase } from '@/lib/supabase';
import { QuizItem } from '@/features/learning/LearningController';
import { Rating } from '@/features/learning/domain/SRSAlgorithm';
import { ReviewCardDisplay } from '@/features/learning/components/ReviewCardDisplay';
import { GlassCard } from '@/components/premium/GlassCard';

function SessionContent() {
    const { user } = useUser();
    const router = useRouter();
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
            const { data: profile } = await supabase
                .from('users')
                .select('level')
                .eq('id', user.id)
                .single();

            const currentLevel = profile?.level || 1;

            // Refactored to use Server Action that enforces limits
            const result = await startLessonSessionAction(user.id, currentLevel);

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
        } catch (error: any) {
            console.error("[LearnSession] loadSession error:", error);
            setError(error.message);
            setPhase('complete');
        }
    };

    useEffect(() => {
        if (user) loadSession();
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

    if (phase === 'init') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-8 gap-8 bg-[#FDF8F8]">
                <Loader2 className="animate-spin text-primary" size={48} />
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-300">Loading...</p>
            </div>
        );
    }

    if (phase === 'complete') {
        const accuracy = stats.totalItems > 0 ? Math.round(((stats.totalItems - stats.mistakes) / stats.totalItems) * 100) : 100;

        if (error) {
            return (
                <div className="min-h-screen bg-[#FDF8F8] flex flex-col items-center justify-center p-8 max-w-2xl mx-auto space-y-12 animate-in fade-in duration-700">
                    <div className="w-32 h-32 bg-rose-100 rounded-[48px] flex items-center justify-center text-rose-500 mb-4 animate-bounce">
                        <Zap size={64} fill="currentColor" />
                    </div>
                    <div className="space-y-6 text-center">
                        <h1 className="text-5xl font-black text-gray-900 tracking-tighter">Daily Limit Reached</h1>
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
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 max-w-2xl mx-auto space-y-16 animate-in fade-in duration-1000">
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
                className="w-full h-[100dvh] bg-white flex flex-col overflow-hidden"
                data-testid="lesson-view-phase"
            >
                <header className="flex justify-between items-center shrink-0 px-6 py-4 border-b border-gray-100 bg-white relative z-20">
                    <div className="flex-1 space-y-2">
                        <div className="flex gap-2">
                            {lessonQueue.map((_, i) => (
                                <div key={i} className={clsx(
                                    "h-2 rounded-full transition-all duration-700",
                                    i < lessonIndex ? "w-8 sm:w-12 bg-primary" :
                                        i === lessonIndex ? "w-10 sm:w-16 bg-primary shadow-lg shadow-primary/20" :
                                            "w-6 sm:w-8 bg-gray-100"
                                )} />
                            ))}
                        </div>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">
                            {lessonIndex + 1} / {lessonQueue.length}
                        </p>
                    </div>
                    <button
                        onClick={() => router.push('/learn')}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-transparent hover:border-gray-200 hover:bg-gray-50 transition-all group"
                        title="Exit Session"
                    >
                        <X size={16} className="text-gray-400 group-hover:text-red-500 group-hover:rotate-90 transition-transform" />
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
        <div className="w-full h-[100dvh] flex flex-col overflow-hidden bg-white" data-testid="quiz-phase">
            <header className="flex justify-between items-center shrink-0 px-6 py-4 border-b border-gray-100 bg-white relative z-20">
                <div className="flex items-center gap-4">
                    <div className="w-32 sm:w-64 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                            className={clsx("h-full transition-all duration-700 ease-out", currentCard?.type === 'kanji' ? 'bg-kanji' : 'bg-primary')}
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] whitespace-nowrap">
                        {stats.completed + 1} / {controller.getProgress().total}
                    </span>
                </div>
                <button
                    onClick={() => router.push('/learn')}
                    className="group flex items-center gap-2 px-3 py-2 hover:bg-gray-50 rounded-xl transition-all duration-300 border border-transparent hover:border-gray-200"
                    title="Exit Quiz"
                >
                    <X size={16} className="text-gray-400 group-hover:text-gray-600 group-hover:rotate-90 transition-transform duration-300" />
                    <span className="text-[10px] font-bold text-gray-400 group-hover:text-gray-600 tracking-widest uppercase hidden sm:inline">Exit</span>
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

function LessonSlide({ item, onNext, isLastLesson }: { item: any, onNext: () => void, isLastLesson: boolean }) {
    // Robust access to details
    const details = item.details || item.vocabulary_details?.[0] || item.kanji_details?.[0] || item.grammar_details?.[0];

    // Type colors matching Tailwind variables
    const typeColors: Record<string, string> = {
        radical: 'bg-[#A2D2FF]/15 text-[#508CAE]',
        kanji: 'bg-[#F4ACB7]/15 text-[#C76F80]',
        vocabulary: 'bg-[#CDB4DB]/15 text-[#9A7BB0]',
        grammar: 'bg-[#B7E4C7]/15 text-[#6EA885]',
    };
    const activeColor = typeColors[item.type] || 'bg-primary/10 text-primary';

    return (
        <div className="flex-1 flex flex-col relative animate-in fade-in duration-500 overflow-hidden w-full">
            {/* Type badge */}
            <div className="absolute top-6 right-6 z-20">
                <span className="px-3 py-1.5 bg-white/50 backdrop-blur-md text-gray-800 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm border border-black/5">
                    New Learning
                </span>
            </div>

            {/* Character hero - Middle Zone (Top) */}
            <div className={clsx(
                "w-full flex flex-col items-center justify-center py-12 sm:py-20 transition-colors duration-500 shrink-0",
                activeColor.split(' ')[0]
            )}>
                <h2 className="text-7xl sm:text-9xl font-black mb-4 relative z-10 drop-shadow-sm jp-text text-gray-900 leading-none">
                    {item.character || item.slug.split(':')[1]}
                </h2>
                <p className="text-base sm:text-lg font-black opacity-80 relative z-10 tracking-[0.2em] uppercase mt-2 text-gray-800">
                    {item.meaning}
                </p>
            </div>

            {/* Details - Middle Zone (Bottom) */}
            <div className="flex-1 overflow-auto bg-white custom-scrollbar w-full">
                <div className="max-w-4xl mx-auto p-6 sm:p-12 space-y-10">
                    <div className="space-y-4">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-400 border-b border-gray-100 pb-2 inline-block">
                            {item.type === 'grammar' ? "Explanation" : "Mnemonic"}
                        </h3>
                        <p className="text-lg sm:text-2xl text-gray-700 leading-relaxed font-medium">
                            {item.type === 'grammar'
                                ? (details?.explanation || "Master this grammar pattern.")
                                : (details?.meaning_mnemonic || "Visualize this character to retain its meaning.")}
                        </p>
                    </div>

                    {item.type !== 'radical' && (
                        <div className="bg-gray-50 p-6 sm:p-8 rounded-[24px] border border-gray-100 grid grid-cols-2 gap-8 shrink-0">
                            {item.type === 'grammar' ? (
                                <div className="col-span-2 space-y-3">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Example</h4>
                                    <p className="text-xl sm:text-2xl font-black text-gray-800 jp-text leading-relaxed">
                                        {details?.example_sentences?.[0]?.ja || details?.sentence_ja || "No example available."}
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <div className="space-y-2">
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Reading</h4>
                                        <p className="text-2xl sm:text-4xl font-black text-gray-800 jp-text">
                                            {item.type === 'vocabulary' ? details?.reading : (details?.onyomi?.[0] || details?.kunyomi?.[0] || "—")}
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Level</h4>
                                        <p className="text-2xl sm:text-4xl font-black text-gray-800">Lv. {item.level}</p>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Footer - Bottom Zone */}
            <footer className="w-full p-6 sm:p-8 border-t border-gray-100 bg-white flex justify-between items-center z-10 shrink-0 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)] mt-auto">
                <div className="max-w-4xl mx-auto w-full flex justify-between items-center">
                    <p className="text-[10px] font-bold text-gray-400 hidden sm:block uppercase tracking-widest">
                        Review each item to continue.
                    </p>
                    <button
                        onClick={onNext}
                        data-testid="lesson-next-button"
                        className="ml-auto px-10 sm:px-14 py-4 sm:py-5 bg-gray-900 text-white font-black rounded-full shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all text-sm sm:text-base flex items-center gap-2"
                    >
                        {isLastLesson ? 'Start Quiz' : 'Next Item'}
                        <ChevronRight size={18} />
                    </button>
                </div>
            </footer>
        </div>
    );
}

export default function LearnSessionPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="animate-spin text-primary" size={48} /></div>}>
            <SessionContent />
        </Suspense>
    );
}
