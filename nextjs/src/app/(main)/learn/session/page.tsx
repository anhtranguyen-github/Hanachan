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

    const loadSession = async () => {
        if (!user) return;

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
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-300">Synchronizing Curriculum...</p>
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
                    <p className="text-[10px] font-black uppercase text-gray-300 tracking-[0.4em]">Rest is part of the training</p>
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
                className="min-h-screen bg-[#FDF8F8] pt-16 pb-12 px-6 flex flex-col max-w-5xl mx-auto space-y-12"
                data-testid="lesson-view-phase"
            >
                <header className="flex justify-between items-center px-4 shrink-0">
                    <div className="flex-1 space-y-3">
                        <div className="flex gap-2">
                            {lessonQueue.map((_, i) => (
                                <div key={i} className={clsx(
                                    "h-1.5 rounded-full transition-all duration-700",
                                    i < lessonIndex ? "w-8 bg-primary" :
                                        i === lessonIndex ? "w-12 bg-primary shadow-lg shadow-primary/20" :
                                            "w-6 bg-gray-100"
                                )} />
                            ))}
                        </div>
                        <p className="text-[9px] font-black text-foreground/30 uppercase tracking-[0.2em]">
                            Lesson {lessonIndex + 1} of {lessonQueue.length}
                        </p>
                    </div>
                    <button
                        onClick={() => router.push('/learn')}
                        className="flex items-center gap-2 pr-4 pl-2 py-2 rounded-2xl bg-white border border-border shadow-sm hover:border-red-200 hover:bg-red-50 transition-all group group"
                        title="Exit Session"
                    >
                        <div className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-50 group-hover:bg-red-100 transition-colors">
                            <X size={16} className="text-gray-400 group-hover:text-red-500 group-hover:rotate-90 transition-transform" />
                        </div>
                        <span className="text-[9px] font-black text-gray-400 group-hover:text-red-500 tracking-widest uppercase">Exit</span>
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
        <div className="min-h-screen bg-background pt-16 pb-12 px-6 flex flex-col max-w-5xl mx-auto space-y-12" data-testid="quiz-phase">
            <header className="flex justify-between items-center px-6 shrink-0">
                <div className="flex items-center gap-6">
                    <div className="space-y-1">
                        <span className={clsx("block text-xl font-black leading-none", currentCard?.type === 'kanji' ? 'text-kanji' : 'text-primary')}>
                            {stats.completed + 1} / {controller.getProgress().total}
                        </span>
                        <span className="block text-[8px] font-black text-foreground/20 uppercase tracking-widest leading-none">Quiz Progress</span>
                    </div>
                    <div className="w-48 h-2.5 bg-gray-100 rounded-full overflow-hidden border border-gray-100">
                        <div
                            className={clsx("h-full transition-all duration-700 ease-out shadow-[0_0_10px_rgba(0,0,0,0.1)]", currentCard?.type === 'kanji' ? 'bg-kanji' : 'bg-primary')}
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>

                <button
                    onClick={() => router.push('/learn')}
                    className="flex items-center gap-2 pr-4 pl-2 py-2 rounded-2xl bg-white border border-border shadow-sm hover:border-red-200 hover:bg-red-50 transition-all group group"
                    title="Exit Quiz"
                >
                    <div className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-50 group-hover:bg-red-100 transition-colors">
                        <X size={16} className="text-gray-400 group-hover:text-red-500 group-hover:rotate-90 transition-transform" />
                    </div>
                    <span className="text-[9px] font-black text-gray-400 group-hover:text-red-500 tracking-widest uppercase">Exit</span>
                </button>
            </header>

            <div className="flex-1 flex items-center justify-center">
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
        radical: 'bg-radical',
        kanji: 'bg-kanji',
        vocabulary: 'bg-vocab',
        grammar: 'bg-grammar',
    };
    const activeColor = typeColors[item.type] || 'bg-primary';

    return (
        <div className="flex-1 bg-white border-2 border-gray-300 rounded-[48px] shadow-sm overflow-hidden flex flex-col relative animate-in fade-in slide-in-from-bottom-8 duration-700 max-h-[85vh]">
            {/* Visual Cue */}
            <div className="absolute top-6 right-8 z-20">
                <span className="px-3 py-1.5 bg-primary/10 text-primary rounded-xl text-[9px] font-black uppercase tracking-widest border border-primary/20">
                    New Discovery
                </span>
            </div>

            {/* Discovery Content Section */}
            <div className={clsx(
                "p-12 md:p-14 text-center text-white relative overflow-hidden transition-colors duration-500 shrink-0",
                activeColor
            )}>
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"></div>
                <h2 className="text-7xl md:text-8xl font-black mb-2 relative z-10 drop-shadow-2xl italic">
                    {item.character || item.slug.split(':')[1]}
                </h2>
                <p className="text-xl font-black opacity-90 relative z-10 tracking-[0.2em] uppercase">
                    {item.meaning}
                </p>
            </div>

            {/* Detailed Information Section */}
            <div className="flex-1 p-8 md:p-10 space-y-8 overflow-auto min-h-0 bg-white">
                <div className="space-y-4">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-300 border-b-2 border-gray-50 pb-2">
                        {item.type === 'grammar' ? "Grammar Explanation" : "Mnemonic Strategy"}
                    </h3>
                    <p className="text-xl text-gray-700 leading-relaxed font-bold italic">
                        {item.type === 'grammar' ? (details?.explanation || "Master this grammar pattern to enhance your sentence structures.") :
                            (details?.meaning_mnemonic || "Visualize this character to better retain its semantic meaning.")}
                    </p>
                </div>

                {item.type !== 'radical' && (
                    <div className="bg-gray-50 p-6 md:p-8 rounded-[32px] border-2 border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-8 shrink-0">
                        {item.type === 'grammar' ? (
                            <div className="col-span-2 space-y-2">
                                <h4 className="text-[9px] font-black uppercase tracking-widest text-gray-400">Context Example</h4>
                                <p className="text-2xl font-black text-gray-800 jp-text leading-tight">
                                    {details?.example_sentences?.[0]?.ja || details?.sentence_ja || "No context provided."}
                                </p>
                            </div>
                        ) : (
                            <>
                                <div>
                                    <h4 className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">Reading</h4>
                                    <p className="text-3xl font-black text-gray-800">
                                        {item.type === 'vocabulary' ? details?.reading : (details?.onyomi?.[0] || details?.kunyomi?.[0] || "N/A")}
                                    </p>
                                </div>
                                <div>
                                    <h4 className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">Curriculum</h4>
                                    <p className="text-3xl font-black text-gray-800">Level {item.level}</p>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Footer Interaction - integrated in card */}
            <footer className="p-10 border-t border-gray-50 flex justify-between items-center bg-gray-50/30">
                <div className="text-xs font-bold text-gray-400">
                    * All items must be acknowledged to complete this batch.
                </div>
                <button
                    onClick={onNext}
                    data-testid="lesson-next-button"
                    className="px-16 py-5 bg-primary text-white font-black rounded-[28px] shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all text-xl"
                >
                    {isLastLesson ? 'Mastery Quiz →' : 'Mastered →'}
                </button>
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
