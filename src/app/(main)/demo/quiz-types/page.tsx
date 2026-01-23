'use client';

import React, { useState } from 'react';
import { ReviewCardDisplay } from '@/features/learning/components/ReviewCardDisplay';
import { KanjiReviewCard, GrammarReviewCard, VocabReviewCard } from '@/features/learning/types/review-cards';
import { ArrowRight, BookOpen, Repeat, CheckCircle2, Sparkles, Brain, Zap, Target, ChevronLeft, RotateCcw } from 'lucide-react';
import { clsx } from 'clsx';

export default function QuizTypesPage() {
    const [activeQuiz, setActiveQuiz] = useState<'fill-in' | 'cloze' | null>(null);
    const [completed, setCompleted] = useState(false);
    const [streak, setStreak] = useState(0);

    // Mock Kanji Card for Fill-in
    const kanjiCard: KanjiReviewCard = {
        id: 'quiz-k1',
        ku_id: 'k1-1',
        ku_type: 'kanji',
        level: 1,
        character: '日',
        meaning: 'Sun, Day',
        prompt_variant: 'reading',
        readings: {
            primary: 'にち',
            onyomi: ['にち', 'じつ'],
            kunyomi: ['ひ', 'か']
        }
    };

    // Mock Grammar Card for Cloze
    const grammarCard: GrammarReviewCard = {
        id: 'quiz-g1',
        ku_id: 'g1-1',
        ku_type: 'grammar',
        level: 1,
        meaning: 'Topic Marker',
        prompt_variant: 'cloze',
        sentence_ja: 'これは本です。',
        cloze_display: 'これ______本です。',
        cloze_answer: 'は',
        sentence_id: 's1',
        sentence_source: 'official'
    };

    const handleRate = (rating: 'pass' | 'fail') => {
        if (rating === 'pass') {
            setStreak(prev => prev + 1);
            setCompleted(true);
            setTimeout(() => {
                setCompleted(false);
                setActiveQuiz(null);
            }, 2500);
        }
    };

    // Success Screen
    if (completed) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center space-y-8 bg-gradient-to-b from-primary/5 to-transparent">
                <div className="relative">
                    <div className="w-32 h-32 bg-gradient-to-br from-primary to-primary-dark rounded-full flex items-center justify-center shadow-2xl shadow-primary/30 animate-pulse">
                        <CheckCircle2 size={64} className="text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-10 h-10 bg-accent rounded-full flex items-center justify-center text-white font-black text-sm animate-bounce">
                        +1
                    </div>
                </div>
                <div className="text-center space-y-2">
                    <h2 className="text-4xl font-black uppercase tracking-tighter text-foreground">正解!</h2>
                    <p className="text-foreground/40 font-bold uppercase text-xs tracking-widest">Memory Strengthened</p>
                </div>
                <div className="flex items-center gap-2 px-6 py-3 bg-surface border border-border rounded-2xl">
                    <Sparkles size={16} className="text-accent" />
                    <span className="text-sm font-bold text-foreground">Streak: {streak}</span>
                </div>
            </div>
        );
    }

    // Fill-in Quiz Mode
    if (activeQuiz === 'fill-in') {
        return (
            <div className="min-h-screen bg-gradient-to-b from-surface-muted/50 to-transparent">
                <div className="max-w-2xl mx-auto py-12 px-8 space-y-8">
                    {/* Header */}
                    <header className="flex items-center justify-between">
                        <button
                            onClick={() => setActiveQuiz(null)}
                            className="flex items-center gap-2 text-foreground/40 hover:text-foreground font-bold text-[10px] uppercase tracking-widest transition-all group"
                        >
                            <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                            Exit Quiz
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="px-3 py-1.5 bg-primary/10 rounded-lg border border-primary/20">
                                <span className="text-[10px] font-bold text-primary-dark uppercase tracking-widest">Reading Quiz</span>
                            </div>
                            <div className="px-3 py-1.5 bg-surface rounded-lg border border-border">
                                <span className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">Level 1</span>
                            </div>
                        </div>
                    </header>

                    {/* Progress */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-bold text-foreground/30 uppercase tracking-widest">
                            <span>Progress</span>
                            <span>1 / 5</span>
                        </div>
                        <div className="h-1.5 bg-surface-muted rounded-full overflow-hidden">
                            <div className="h-full w-1/5 bg-gradient-to-r from-primary to-primary-dark rounded-full transition-all" />
                        </div>
                    </div>

                    {/* Quiz Card */}
                    <div className="premium-card p-0 bg-white border-border overflow-hidden shadow-xl">
                        <div className="bg-gradient-to-r from-primary/5 via-transparent to-secondary/5 p-8 border-b border-border">
                            <div className="flex items-center justify-center gap-4">
                                <Target size={20} className="text-primary-dark" />
                                <span className="text-sm font-bold text-foreground/60">What is the reading of this kanji?</span>
                            </div>
                        </div>
                        <div className="p-8">
                            <ReviewCardDisplay
                                card={kanjiCard}
                                onRate={handleRate}
                            />
                        </div>
                    </div>

                    {/* Hint */}
                    <div className="text-center">
                        <p className="text-xs text-foreground/30 font-medium">
                            Type in hiragana and press Enter to submit
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Cloze Quiz Mode
    if (activeQuiz === 'cloze') {
        return (
            <div className="min-h-screen bg-gradient-to-b from-surface-muted/50 to-transparent">
                <div className="max-w-2xl mx-auto py-12 px-8 space-y-8">
                    {/* Header */}
                    <header className="flex items-center justify-between">
                        <button
                            onClick={() => setActiveQuiz(null)}
                            className="flex items-center gap-2 text-foreground/40 hover:text-foreground font-bold text-[10px] uppercase tracking-widest transition-all group"
                        >
                            <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                            Exit Quiz
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="px-3 py-1.5 bg-secondary/10 rounded-lg border border-secondary/20">
                                <span className="text-[10px] font-bold text-secondary-dark uppercase tracking-widest">Sentence Quiz</span>
                            </div>
                            <div className="px-3 py-1.5 bg-surface rounded-lg border border-border">
                                <span className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">Grammar</span>
                            </div>
                        </div>
                    </header>

                    {/* Progress */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-bold text-foreground/30 uppercase tracking-widest">
                            <span>Progress</span>
                            <span>1 / 5</span>
                        </div>
                        <div className="h-1.5 bg-surface-muted rounded-full overflow-hidden">
                            <div className="h-full w-1/5 bg-gradient-to-r from-secondary to-secondary-dark rounded-full transition-all" />
                        </div>
                    </div>

                    {/* Quiz Card */}
                    <div className="premium-card p-0 bg-white border-border overflow-hidden shadow-xl">
                        <div className="bg-gradient-to-r from-secondary/5 via-transparent to-primary/5 p-8 border-b border-border">
                            <div className="flex items-center justify-center gap-4">
                                <Brain size={20} className="text-secondary-dark" />
                                <span className="text-sm font-bold text-foreground/60">Complete the sentence with the correct particle</span>
                            </div>
                        </div>
                        <div className="p-8">
                            <ReviewCardDisplay
                                card={grammarCard}
                                onRate={handleRate}
                            />
                        </div>
                    </div>

                    {/* Hint */}
                    <div className="text-center">
                        <p className="text-xs text-foreground/30 font-medium">
                            Fill in the blank to complete the Japanese sentence
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Selection Screen
    return (
        <div className="min-h-screen">
            {/* Hero Section */}
            <div className="bg-gradient-to-b from-primary/5 via-surface to-transparent">
                <div className="max-w-5xl mx-auto py-24 px-8">
                    <header className="space-y-6 text-center mb-20">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-border shadow-sm">
                            <Zap size={14} className="text-accent" />
                            <span className="text-[10px] font-bold text-foreground/60 uppercase tracking-widest">Active Recall System</span>
                        </div>
                        <h1 className="text-7xl font-black tracking-tighter uppercase leading-none bg-gradient-to-r from-foreground via-foreground to-foreground/60 bg-clip-text">
                            Quiz Modes
                        </h1>
                        <p className="text-xl text-foreground/40 font-medium max-w-2xl mx-auto leading-relaxed">
                            Practice with scientifically-designed memory exercises. Each quiz type targets different aspects of language acquisition.
                        </p>
                    </header>

                    {/* Quiz Type Cards */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Reading Quiz Card */}
                        <div
                            onClick={() => setActiveQuiz('fill-in')}
                            className="group cursor-pointer"
                        >
                            <div className="premium-card p-0 bg-white border-border overflow-hidden transition-all hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1">
                                {/* Card Header */}
                                <div className="relative h-48 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent overflow-hidden">
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-24 h-24 bg-white rounded-3xl shadow-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <span className="text-5xl font-black text-primary-dark jp-text">日</span>
                                        </div>
                                    </div>
                                    <div className="absolute top-4 right-4">
                                        <div className="px-3 py-1.5 bg-white/80 backdrop-blur-sm rounded-lg border border-primary/20">
                                            <span className="text-[9px] font-bold text-primary-dark uppercase tracking-widest">Kanji & Vocab</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Card Content */}
                                <div className="p-8 space-y-6">
                                    <div className="space-y-2">
                                        <h3 className="text-2xl font-black uppercase tracking-tight text-foreground group-hover:text-primary-dark transition-colors">
                                            Reading Quiz
                                        </h3>
                                        <p className="text-sm text-foreground/50 font-medium leading-relaxed">
                                            Test your ability to recall readings for kanji and vocabulary items. Perfect for building phonetic memory.
                                        </p>
                                    </div>

                                    <ul className="space-y-3">
                                        <li className="flex items-center gap-3 text-sm">
                                            <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
                                                <ArrowRight size={12} className="text-primary-dark" />
                                            </div>
                                            <span className="text-foreground/60 font-medium">See character → Type reading</span>
                                        </li>
                                        <li className="flex items-center gap-3 text-sm">
                                            <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
                                                <ArrowRight size={12} className="text-primary-dark" />
                                            </div>
                                            <span className="text-foreground/60 font-medium">Accepts onyomi & kunyomi</span>
                                        </li>
                                        <li className="flex items-center gap-3 text-sm">
                                            <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
                                                <ArrowRight size={12} className="text-primary-dark" />
                                            </div>
                                            <span className="text-foreground/60 font-medium">Instant feedback on accuracy</span>
                                        </li>
                                    </ul>

                                    <button className="w-full py-4 bg-gradient-to-r from-primary to-primary-dark text-white font-bold uppercase tracking-widest text-sm rounded-2xl group-hover:shadow-lg group-hover:shadow-primary/30 transition-all">
                                        Start Reading Quiz
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Sentence Quiz Card */}
                        <div
                            onClick={() => setActiveQuiz('cloze')}
                            className="group cursor-pointer"
                        >
                            <div className="premium-card p-0 bg-white border-border overflow-hidden transition-all hover:shadow-2xl hover:shadow-secondary/10 hover:-translate-y-1">
                                {/* Card Header */}
                                <div className="relative h-48 bg-gradient-to-br from-secondary/10 via-secondary/5 to-transparent overflow-hidden">
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="px-6 py-4 bg-white rounded-2xl shadow-xl group-hover:scale-105 transition-transform">
                                            <span className="text-2xl font-bold text-foreground/80 jp-text">これ<span className="text-secondary-dark">______</span>本です</span>
                                        </div>
                                    </div>
                                    <div className="absolute top-4 right-4">
                                        <div className="px-3 py-1.5 bg-white/80 backdrop-blur-sm rounded-lg border border-secondary/20">
                                            <span className="text-[9px] font-bold text-secondary-dark uppercase tracking-widest">Grammar</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Card Content */}
                                <div className="p-8 space-y-6">
                                    <div className="space-y-2">
                                        <h3 className="text-2xl font-black uppercase tracking-tight text-foreground group-hover:text-secondary-dark transition-colors">
                                            Sentence Quiz
                                        </h3>
                                        <p className="text-sm text-foreground/50 font-medium leading-relaxed">
                                            Practice grammar points in context. Complete sentences by filling in missing particles and patterns.
                                        </p>
                                    </div>

                                    <ul className="space-y-3">
                                        <li className="flex items-center gap-3 text-sm">
                                            <div className="w-6 h-6 bg-secondary/10 rounded-full flex items-center justify-center">
                                                <ArrowRight size={12} className="text-secondary-dark" />
                                            </div>
                                            <span className="text-foreground/60 font-medium">Real sentence context</span>
                                        </li>
                                        <li className="flex items-center gap-3 text-sm">
                                            <div className="w-6 h-6 bg-secondary/10 rounded-full flex items-center justify-center">
                                                <ArrowRight size={12} className="text-secondary-dark" />
                                            </div>
                                            <span className="text-foreground/60 font-medium">Cloze deletion format</span>
                                        </li>
                                        <li className="flex items-center gap-3 text-sm">
                                            <div className="w-6 h-6 bg-secondary/10 rounded-full flex items-center justify-center">
                                                <ArrowRight size={12} className="text-secondary-dark" />
                                            </div>
                                            <span className="text-foreground/60 font-medium">Builds production skills</span>
                                        </li>
                                    </ul>

                                    <button className="w-full py-4 bg-gradient-to-r from-secondary to-secondary-dark text-white font-bold uppercase tracking-widest text-sm rounded-2xl group-hover:shadow-lg group-hover:shadow-secondary/30 transition-all">
                                        Start Sentence Quiz
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer Info */}
                    <div className="mt-20 text-center space-y-4">
                        <div className="inline-flex items-center gap-6 px-8 py-4 bg-white rounded-2xl border border-border shadow-sm">
                            <div className="flex items-center gap-2">
                                <Brain size={16} className="text-primary-dark" />
                                <span className="text-xs font-bold text-foreground/60">FSRS Algorithm</span>
                            </div>
                            <div className="w-px h-4 bg-border" />
                            <div className="flex items-center gap-2">
                                <RotateCcw size={16} className="text-secondary-dark" />
                                <span className="text-xs font-bold text-foreground/60">Spaced Repetition</span>
                            </div>
                            <div className="w-px h-4 bg-border" />
                            <div className="flex items-center gap-2">
                                <Sparkles size={16} className="text-accent" />
                                <span className="text-xs font-bold text-foreground/60">Active Recall</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
