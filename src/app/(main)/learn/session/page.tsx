'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowLeft, BookOpen, ChevronRight, CheckCircle2, PlayCircle, Zap, X } from 'lucide-react';
import { clsx } from 'clsx';
import { fetchNewItems } from '@/features/learning/service';
import { ReviewSessionController, QuizItem } from '@/features/learning/ReviewSessionController';
import { Rating } from '@/features/learning/domain/FSRSEngine';
import { GlassCard } from '@/components/premium/GlassCard';
import { ReviewCardDisplay } from '@/features/learning/components/ReviewCardDisplay';
import { useUser } from '@/features/auth/AuthContext';
import { supabase } from '@/lib/supabase';

function SessionContent() {
    const { user } = useUser();
    const router = useRouter();
    const [controller, setController] = useState<ReviewSessionController | null>(null);
    const [currentCard, setCurrentCard] = useState<QuizItem | null>(null);
    const [lessonQueue, setLessonQueue] = useState<any[]>([]);
    const [phase, setPhase] = useState<'init' | 'lesson-view' | 'quiz' | 'complete'>('init');
    const [stats, setStats] = useState({ mistakes: 0, totalItems: 0, completed: 0 });
    const [lessonIndex, setLessonIndex] = useState(0);

    const loadSession = async () => {
        if (!user) return;

        try {
            const { data: profile } = await supabase
                .from('users')
                .select('level')
                .eq('id', user.id)
                .single();

            const currentLevel = profile?.level || 1;
            const items = await fetchNewItems(user.id, `level-${currentLevel}`, 5);

            if (items.length === 0) {
                router.push('/learn');
                return;
            }

            setLessonQueue(items);
            setStats({ mistakes: 0, totalItems: items.length, completed: 0 });
            setPhase('lesson-view');
            const newController = new ReviewSessionController(user.id);
            await newController.initSession(items);
            setController(newController);
        } catch (error) {
            console.error("[LearnSession] loadSession error:", error);
            router.push('/learn');
        }
    };

    useEffect(() => {
        if (user) loadSession();
    }, [user]);

    const handleLessonNext = () => {
        if (lessonIndex + 1 < lessonQueue.length) {
            setLessonIndex(prev => prev + 1);
        } else {
            setPhase('quiz');
            if (controller) setCurrentCard(controller.getNextItem());
        }
    };

    const handleAnswer = async (rating: Rating, userInput: string) => {
        if (!controller) return;

        const success = await controller.submitAnswer(rating);
        if (!success) setStats(s => ({ ...s, mistakes: s.mistakes + 1 }));

        const next = controller.getNextItem();
        if (next) {
            setCurrentCard(next);
            setStats(s => ({ ...s, completed: controller.getProgress().completed }));
        } else {
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
                className="h-screen bg-[#FDF8F8] py-8 px-6 flex flex-col max-w-5xl mx-auto space-y-8"
                data-testid="learning-session-root"
            >
                <header className="flex justify-between items-center px-4">
                    <div className="space-y-3">
                        <div className="flex gap-2.5">
                            {lessonQueue.map((_, i) => (
                                <div key={i} className={clsx(
                                    "h-2.5 rounded-full transition-all duration-700",
                                    i < lessonIndex ? "w-12 bg-primary" :
                                        i === lessonIndex ? "w-16 bg-primary shadow-[0_0_10px_rgba(244,172,183,0.4)]" :
                                            "w-8 bg-gray-100"
                                )} />
                            ))}
                        </div>
                        <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">
                            Discovery Batch: {lessonIndex + 1} / {lessonQueue.length} Items Viewed
                        </p>
                    </div>
                    <button onClick={() => router.back()} className="group flex items-center gap-3 text-gray-300 hover:text-red-500 transition-colors">
                        <span className="text-[10px] font-black uppercase tracking-widest">Abort Batch</span>
                        <X size={18} className="group-hover:rotate-90 transition-transform" />
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
        <div className="h-screen bg-background py-8 px-6 flex flex-col max-w-5xl mx-auto space-y-12" data-testid="quiz-phase">
            <header className="flex justify-between items-center px-6">
                <div className="flex items-center gap-6">
                    <div className="space-y-1">
                        <span className={clsx("block text-xl font-black leading-none", currentCard?.type === 'kanji' ? 'text-kanji' : 'text-primary')}>
                            {stats.completed + 1} / {controller.getProgress().total}
                        </span>
                        <span className="block text-[8px] font-black text-gray-300 uppercase tracking-widest leading-none">Items in queue</span>
                    </div>
                    <div className="w-48 h-3 bg-gray-100 rounded-full overflow-hidden border border-gray-100">
                        <div
                            className={clsx("h-full transition-all duration-700 ease-out shadow-[0_0_10px_rgba(0,0,0,0.1)]", currentCard?.type === 'kanji' ? 'bg-kanji' : 'bg-primary')}
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>

                <div className="flex gap-4 items-center">
                    <button
                        onClick={() => router.push('/learn')}
                        className="text-gray-300 hover:text-rose-500 font-black text-[10px] uppercase tracking-[0.2em] transition-colors"
                    >
                        Abort Quiz
                    </button>
                </div>
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
        <div className="flex-1 bg-white border-2 border-gray-300 rounded-[64px] shadow-sm overflow-hidden flex flex-col relative animate-in fade-in slide-in-from-bottom-8 duration-700">
            {/* Visual Cue */}
            <div className="absolute top-8 right-10 z-20">
                <span className="px-4 py-2 bg-primary/10 text-primary rounded-2xl text-[10px] font-black uppercase tracking-widest border border-primary/20">
                    New Discovery
                </span>
            </div>

            {/* Discovery Content Section */}
            <div className={clsx(
                "p-20 text-center text-white relative overflow-hidden transition-colors duration-500",
                activeColor
            )}>
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"></div>
                <h2 className="text-[120px] md:text-[140px] font-black mb-4 relative z-10 drop-shadow-2xl italic">
                    {item.character || item.slug.split(':')[1]}
                </h2>
                <p className="text-2xl font-black opacity-90 relative z-10 tracking-[0.3em] uppercase">
                    {item.meaning}
                </p>
            </div>

            {/* Detailed Information Section */}
            <div className="flex-1 p-12 md:p-16 space-y-12 overflow-auto">
                <div className="space-y-6">
                    <h3 className="text-xs font-black uppercase tracking-[0.3em] text-gray-300 border-b-2 border-gray-50 pb-2">
                        {item.type === 'grammar' ? "Grammar Explanation" : "Mnemonic Strategy"}
                    </h3>
                    <p className="text-2xl text-gray-700 leading-relaxed font-bold italic">
                        {item.type === 'grammar' ? (details?.explanation || "Master this grammar pattern to enhance your sentence structures.") :
                            (details?.meaning_mnemonic || "Visualize this character to better retain its semantic meaning.")}
                    </p>
                </div>

                {item.type !== 'radical' && (
                    <div className="bg-gray-50 p-10 rounded-[40px] border-2 border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-10">
                        {item.type === 'grammar' ? (
                            <div className="col-span-2 space-y-4">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Context Example</h4>
                                <p className="text-4xl font-black text-gray-800 jp-text">
                                    {details?.example_sentences?.[0]?.ja || details?.sentence_ja || "No context provided."}
                                </p>
                            </div>
                        ) : (
                            <>
                                <div>
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Reading</h4>
                                    <p className="text-4xl font-black text-gray-800">
                                        {item.type === 'vocabulary' ? details?.reading : (details?.onyomi?.[0] || details?.kunyomi?.[0] || "N/A")}
                                    </p>
                                </div>
                                <div>
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Curriculum</h4>
                                    <p className="text-4xl font-black text-gray-800">Level {item.level}</p>
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
