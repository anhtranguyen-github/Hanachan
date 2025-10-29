
'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Flashcard from './Flashcard'
import SRSButtonGroup from './SRSButtonGroup'
import { ReviewRating } from '../types'
import { submitReviewAction } from '../actions'
import { toast } from 'sonner'
import { CheckCircle2, Trophy, Loader2, BookOpen } from 'lucide-react'

interface Card {
    user_id: string;
    ku_id: string;
    state: string;
    next_review: string;
    knowledge_units: {
        id: string;
        slug: string;
        type: string;
        search_key: string;
        search_reading?: string;
        ku_kanji?: any[];
        ku_vocabulary?: any[];
        ku_grammar?: any[];
        ku_radicals?: any[];
    };
}

interface ReviewSessionProps {
    initialCards: Card[];
}

export const ReviewSession: React.FC<ReviewSessionProps> = ({ initialCards }) => {
    const [queue, setQueue] = useState<Card[]>(initialCards);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [completedCount, setCompletedCount] = useState(0);

    const currentCard = queue[currentIndex];

    const handleRate = async (rating: ReviewRating) => {
        if (!currentCard || isSubmitting) return;

        setIsSubmitting(true);
        try {
            await submitReviewAction(currentCard.ku_id, rating);

            // Success animation or feedback
            setCompletedCount(prev => prev + 1);

            if (currentIndex < queue.length - 1) {
                setCurrentIndex(prev => prev + 1);
                setIsFlipped(false);
            } else {
                setCurrentIndex(prev => prev + 1); // Triggers completion screen
            }
        } catch (error) {
            toast.error('Failed to submit review. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    }

    if (queue.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center space-y-4">
                <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500">
                    <CheckCircle2 size={40} />
                </div>
                <h2 className="text-2xl font-bold">You're all caught up!</h2>
                <p className="text-zinc-400">No cards due for review. Take a break or explore new material.</p>
            </div>
        )
    }

    if (currentIndex >= queue.length) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center p-12 text-center space-y-8 max-w-md mx-auto"
            >
                <div className="relative">
                    <div className="absolute inset-0 blur-3xl bg-yellow-500/20 rounded-full animate-pulse" />
                    <Trophy size={100} className="text-yellow-500 relative" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                        Session Complete!
                    </h2>
                    <p className="text-zinc-400">You've successfully reviewed {completedCount} cards.</p>
                </div>
                <div className="w-full h-px bg-white/10" />
                <button
                    onClick={() => window.location.href = '/'}
                    className="px-8 py-4 bg-white text-black font-bold rounded-2xl hover:bg-zinc-200 transition-colors w-full"
                >
                    Back to Dashboard
                </button>
            </motion.div>
        )
    }

    return (
        <div className="flex flex-col items-center w-full max-w-4xl mx-auto space-y-12">
            {/* Progress Header */}
            <div className="w-full max-w-md px-4 flex items-center justify-between text-xs font-bold tracking-widest uppercase opacity-40">
                <div className="flex items-center gap-2">
                    <BookOpen size={14} />
                    <span>Learning Session</span>
                </div>
                <span>{currentIndex + 1} / {queue.length}</span>
            </div>

            {/* Flashcard Area */}
            <Flashcard
                ku={currentCard.knowledge_units}
                isFlipped={isFlipped}
                onFlip={() => !isSubmitting && setIsFlipped(!isFlipped)}
                front={
                    <div className="text-center">
                        <span className="text-white/30 text-xs mb-3 block tracking-[0.2em] uppercase font-bold">
                            {currentCard.knowledge_units.type}
                        </span>
                        <div className="text-8xl font-bold tracking-tight text-white drop-shadow-2xl">
                            {currentCard.knowledge_units.search_key}
                        </div>
                    </div>
                }
                back={
                    <div className="space-y-8 w-full">
                        {currentCard.knowledge_units.type === 'kanji' && currentCard.knowledge_units.ku_kanji?.[0] && (
                            <>
                                <div className="space-y-1">
                                    <div className="text-[10px] font-bold opacity-30 uppercase tracking-[0.2em]">Meaning</div>
                                    <div className="text-3xl font-bold text-white">
                                        {currentCard.knowledge_units.ku_kanji[0].meaning_data?.primary || 'Unknown'}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                                    <div>
                                        <div className="text-[10px] font-bold opacity-30 uppercase tracking-[0.2em] mb-1">Onyomi</div>
                                        <div className="text-lg font-medium text-indigo-400">
                                            {currentCard.knowledge_units.ku_kanji[0].reading_data?.on?.join(', ') || '-'}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-bold opacity-30 uppercase tracking-[0.2em] mb-1">Kunyomi</div>
                                        <div className="text-lg font-medium text-emerald-400">
                                            {currentCard.knowledge_units.ku_kanji[0].reading_data?.kun?.join(', ') || '-'}
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {currentCard.knowledge_units.type === 'vocabulary' && currentCard.knowledge_units.ku_vocabulary?.[0] && (
                            <>
                                <div className="space-y-1">
                                    <div className="text-[10px] font-bold opacity-30 uppercase tracking-[0.2em]">Pronunciation</div>
                                    <div className="text-4xl font-bold text-emerald-400">
                                        {currentCard.knowledge_units.ku_vocabulary[0].reading_primary}
                                    </div>
                                </div>
                                <div className="space-y-1 pt-4 border-t border-white/5">
                                    <div className="text-[10px] font-bold opacity-30 uppercase tracking-[0.2em]">Meaning</div>
                                    <div className="text-2xl font-bold text-white">
                                        {currentCard.knowledge_units.ku_vocabulary[0].meaning_data?.primary || 'Unknown'}
                                    </div>
                                </div>
                            </>
                        )}

                        {currentCard.knowledge_units.type === 'grammar' && currentCard.knowledge_units.ku_grammar?.[0] && (
                            <>
                                <div className="space-y-1">
                                    <div className="text-[10px] font-bold opacity-30 uppercase tracking-[0.2em]">Point</div>
                                    <div className="text-2xl font-bold text-white">
                                        {currentCard.knowledge_units.ku_grammar[0].title}
                                    </div>
                                </div>
                                <div className="space-y-1 pt-4 border-t border-white/5">
                                    <div className="text-[10px] font-bold opacity-30 uppercase tracking-[0.2em]">Usage</div>
                                    <div className="text-lg text-zinc-300">
                                        {currentCard.knowledge_units.ku_grammar[0].meaning_summary}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                }
            />

            {/* Controls */}
            <AnimatePresence mode="wait">
                {isFlipped ? (
                    <motion.div
                        key="buttons"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="w-full flex justify-center"
                    >
                        <SRSButtonGroup onRate={handleRate} disabled={isSubmitting} />
                    </motion.div>
                ) : (
                    <motion.div
                        key="tip"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-white/20 text-sm font-medium tracking-wide h-[84px] flex items-center"
                    >
                        Press Space or Tap Card to Flip
                    </motion.div>
                )}
            </AnimatePresence>

            {isSubmitting && (
                <div className="fixed inset-0 bg-black/20 flex items-center justify-center backdrop-blur-[2px] z-50">
                    <div className="bg-zinc-800 p-6 rounded-3xl shadow-2xl flex items-center gap-3">
                        <Loader2 className="animate-spin text-indigo-500" />
                        <span className="font-bold">Calculating FSRS...</span>
                    </div>
                </div>
            )}
        </div>
    )
}
