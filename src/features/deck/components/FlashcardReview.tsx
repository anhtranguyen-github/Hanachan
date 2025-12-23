
'use client';

import React, { useState } from 'react';
import { HanaButton } from '@/ui/components/hana/Button';
import { HanaCard } from '@/ui/components/hana/Card';
import { FlashcardEntity } from '../types';
import { cn } from '@/lib/utils';
import { Sparkles, ArrowRight, Brain, Zap, Home } from 'lucide-react';

interface FlashcardReviewProps {
    cards: FlashcardEntity[];
    onReview: (cardId: string, rating: 1 | 2 | 3 | 4) => void;
    onComplete: () => void;
}

export const FlashcardReview: React.FC<FlashcardReviewProps> = ({ cards, onReview, onComplete }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showAnswer, setShowAnswer] = useState(false);
    const [isFinished, setIsFinished] = useState(false);

    const currentCard = cards[currentIndex];

    const handleRating = (rating: 1 | 2 | 3 | 4) => {
        onReview(currentCard.id, rating);
        if (currentIndex < cards.length - 1) {
            setShowAnswer(false);
            setCurrentIndex(prev => prev + 1);
        } else {
            setIsFinished(true);
        }
    };

    if (cards.length === 0) return <EmptySession onComplete={onComplete} />;

    if (isFinished) return <SuccessSession onComplete={onComplete} stats={{ count: cards.length }} />;

    return (
        <div className="max-w-3xl mx-auto min-h-[80dvh] flex flex-col justify-center p-6 space-y-12">
            {/* Progress Header */}
            <div className="space-y-4">
                <div className="flex justify-between items-end px-2">
                    <div className="font-black text-sakura-ink uppercase tracking-tighter text-sm">
                        Synchronizing Memory
                    </div>
                    <div className="text-xs font-black text-sakura-cocoa/40 uppercase">
                        {currentIndex + 1} / {cards.length}
                    </div>
                </div>
                <div className="h-4 bg-sakura-divider rounded-full overflow-hidden border-2 border-white shadow-inner">
                    <div
                        className="h-full bg-sakura-pink transition-all duration-500 ease-out"
                        style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
                    />
                </div>
            </div>

            {/* Flashcard Area */}
            <div className="perspective-1000 min-h-[400px]">
                <HanaCard
                    variant="clay"
                    padding="none"
                    className={cn(
                        "w-full h-full min-h-[400px] flex flex-col items-center justify-center p-12 text-center transition-all duration-500 shadow-2xl relative",
                        showAnswer ? "rotate-y-0" : ""
                    )}
                >
                    {/* Content */}
                    <div className="space-y-8 animate-fadeIn">
                        <div className="space-y-2">
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-sakura-cocoa/30">Target Structure</span>
                            <div className="text-6xl md:text-8xl font-black text-sakura-ink tracking-tighter">
                                {currentCard.front}
                            </div>
                        </div>

                        {showAnswer && (
                            <div className="space-y-4 pt-8 border-t-2 border-sakura-divider/50 animate-messageAppear">
                                <div className="text-2xl md:text-3xl font-bold text-sakura-cocoa">
                                    {currentCard.back}
                                </div>
                                {currentCard.target_slug && (
                                    <div className="inline-block px-4 py-1.5 bg-sakura-pink/10 text-sakura-pink rounded-full text-xs font-black uppercase">
                                        Dictionary: {currentCard.target_slug}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {!showAnswer && (
                        <div className="absolute inset-x-0 bottom-12 flex justify-center">
                            <HanaButton size="lg" onClick={() => setShowAnswer(true)} className="px-12 group">
                                Reveal <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                            </HanaButton>
                        </div>
                    )}
                </HanaCard>
            </div>

            {/* Controller - Only show when answer is revealed */}
            <div className={cn(
                "grid grid-cols-2 md:grid-cols-4 gap-4 transition-all duration-300",
                showAnswer ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
            )}>
                <RatingButton rating={1} label="Again" color="bg-torii-red" onClick={() => handleRating(1)} />
                <RatingButton rating={2} label="Hard" color="bg-orange-400" onClick={() => handleRating(2)} />
                <RatingButton rating={3} label="Good" color="bg-emerald-500" onClick={() => handleRating(3)} />
                <RatingButton rating={4} label="Easy" color="bg-indigo-500" onClick={() => handleRating(4)} />
            </div>
        </div>
    );
};

const RatingButton = ({ rating, label, color, onClick }: any) => (
    <button
        onClick={onClick}
        className="group flex flex-col items-center gap-2 p-4 rounded-3xl bg-white border-2 border-sakura-divider hover:border-sakura-ink transition-all active:scale-95"
    >
        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-white text-lg font-black shadow-lg shadow-black/5 group-hover:scale-110 transition-transform", color)}>
            {rating}
        </div>
        <span className="text-[10px] font-black uppercase tracking-widest text-sakura-cocoa/60">{label}</span>
    </button>
);

const EmptySession = ({ onComplete }: any) => (
    <div className="max-w-md mx-auto py-20 text-center space-y-8 animate-fadeIn">
        <div className="w-24 h-24 bg-white rounded-[2.5rem] border-2 border-sakura-divider flex items-center justify-center mx-auto shadow-xl">
            <Brain size={40} className="text-sakura-cocoa/20" />
        </div>
        <div className="space-y-4">
            <h2 className="text-3xl font-black text-sakura-ink uppercase tracking-tight">Zero Reviews</h2>
            <p className="text-sakura-cocoa/60 font-bold">Your memory is perfectly synchronized. <br /> Check back later!</p>
        </div>
        <HanaButton size="lg" onClick={onComplete}>Return to Dashboard</HanaButton>
    </div>
);

const SuccessSession = ({ onComplete, stats }: any) => (
    <div className="max-w-md mx-auto py-20 text-center space-y-10 animate-fadeIn">
        <div className="relative">
            <div className="w-32 h-32 bg-white rounded-[3rem] border-2 border-sakura-pink flex items-center justify-center mx-auto shadow-2xl animate-float">
                <Zap size={56} className="text-sakura-pink fill-current" />
            </div>
            {/* Tiny Petals */}
            <div className="absolute -top-4 -right-4 w-12 h-12 animate-pulse bg-sakura-divider rounded-full blur-xl" />
        </div>

        <div className="space-y-4">
            <h2 className="text-4xl font-black text-sakura-ink uppercase tracking-tight">Session Complete!</h2>
            <p className="text-sakura-cocoa/60 font-bold text-lg">
                High-fidelity synchronization finished. <br />
                <span className="text-sakura-ink underline decoration-sakura-pink">{stats.count} cards</span> strengthened.
            </p>
        </div>

        <div className="flex flex-col gap-3">
            <HanaButton size="lg" onClick={onComplete} className="w-full">
                Dashboard <Home className="ml-2" size={18} />
            </HanaButton>
            <HanaButton variant="ghost" className="w-full" onClick={() => window.location.href = '/chat'}>
                Open Conversation Module
            </HanaButton>
        </div>
    </div>
);
