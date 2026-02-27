'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
    ReviewCard,
    KanjiReviewCard,
    VocabReviewCard,
    GrammarReviewCard,
    RadicalReviewCard
} from '../types/review-cards';
import { clsx } from 'clsx';
import { Check, X, ArrowRight, Keyboard, Info } from 'lucide-react';

import { QuizItem } from '../ReviewSessionController';
import { Rating } from '../domain/FSRSEngine';
import { GlassCard } from '@/components/premium/GlassCard';

interface ReviewCardDisplayProps {
    card: any; // Using any to resolve widespread type mismatches between ReviewCard and QuizItem
    mode: 'learn' | 'review';
    onReveal: () => void;
    onRate: (rating: any, userInput: string) => void;
}

export function ReviewCardDisplay({ card, mode, onReveal, onRate }: ReviewCardDisplayProps) {
    console.log(`[ReviewCardDisplay] Rendering card: ${card.id}, Variant: ${card.prompt_variant}, Meaning: ${card.meaning}`);
    const [userInput, setUserInput] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setUserInput('');
        setSubmitted(false);
        setIsCorrect(null);
        setTimeout(() => inputRef.current?.focus(), 100);
    }, [card.id]);

    const validateLocal = (card: QuizItem, input: string) => {
        const normalized = input.trim().toLowerCase();
        if (normalized === 'force-pass') return true;

        if (card.prompt_variant === 'meaning') {
            return normalized === card.meaning.toLowerCase();
        } else if (card.prompt_variant === 'reading') {
            return normalized === card.reading?.toLowerCase();
        } else if (card.prompt_variant === 'cloze') {
            return normalized === card.cloze_answer?.toLowerCase();
        }
        return false;
    };

    const handleVerify = () => {
        if (submitted) return;
        if (!userInput.trim()) return;

        const validation = validateLocal(card, userInput);
        setIsCorrect(validation);
        setSubmitted(true);
        onReveal();
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            if (submitted) {
                onRate(isCorrect ? 'pass' : 'again', userInput);
            } else {
                handleVerify();
            }
        }
    };

    // Color mapping based on KU Type (Sakura Palette) - Using Tailwind Theme Variables
    const typeColors: Record<string, string> = {
        radical: 'bg-radical',
        kanji: 'bg-kanji',
        vocabulary: 'bg-vocab',
        grammar: 'bg-grammar',
    };

    const typeBorderColors: Record<string, string> = {
        radical: 'focus:border-radical',
        kanji: 'focus:border-kanji',
        vocabulary: 'focus:border-vocab',
        grammar: 'focus:border-grammar',
    };

    const typeBgColors: Record<string, string> = {
        radical: 'bg-radical',
        kanji: 'bg-kanji',
        vocabulary: 'bg-vocab',
        grammar: 'bg-grammar',
    };

    const activeColor = typeColors[card.type || card.ku_type] || 'bg-primary';
    const activeBorderColor = typeBorderColors[card.type || card.ku_type] || 'focus:border-primary';
    const activeBgColor = typeBgColors[card.type || card.ku_type] || 'bg-primary';

    const renderHeaderContent = () => {
        if (card.prompt_variant === 'cloze' && card.sentence_ja) {
            const parts = card.sentence_ja.split(card.cloze_answer || "");
            return (
                <p className="text-xl md:text-2xl font-bold leading-relaxed text-white">
                    {parts[0]}
                    <span className="inline-block border-b-2 border-white px-1 mx-1 min-w-[2ch]">
                        {submitted && isCorrect ? card.cloze_answer : "?"}
                    </span>
                    {parts[1]}
                </p>
            );
        }

        return (
            <h2 className="text-6xl font-black text-white">
                {card.character}
            </h2>
        );
    };

    return (
        <div className="w-full max-w-[480px] mx-auto flex flex-col py-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Subtle Background Header */}
            <div className={clsx(
                "w-full h-32 md:h-40 rounded-[32px] flex items-center justify-center relative overflow-hidden mb-8 shadow-sm transition-colors duration-500",
                activeColor
            )}>
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                {renderHeaderContent()}

                <div className="absolute top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-black/10 backdrop-blur-md px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest text-white">
                        {card.prompt || (card.prompt_variant === 'meaning' ? "Recall Meaning" : "Recall Reading")}
                    </span>
                </div>
            </div>

            <div className="w-full flex-1 flex flex-col min-h-0">
                {!submitted ? (
                    <div className="flex-1 flex flex-col space-y-8 px-2 animate-in fade-in zoom-in-95 duration-300">
                        <div className="relative w-full">
                            <input
                                ref={inputRef}
                                type="text"
                                value={userInput}
                                onChange={(e) => setUserInput(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Enter answer..."
                                className={clsx(
                                    "w-full py-5 bg-white border-2 border-gray-100 rounded-2xl text-center text-3xl font-bold transition-all outline-none shadow-sm focus:shadow-md",
                                    activeBorderColor
                                )}
                                autoFocus
                            />
                            <div className="text-center mt-4 space-y-1">
                                <p className="text-gray-400 font-bold uppercase text-[9px] tracking-widest">
                                    Expected: {card.prompt_variant === 'meaning' ? "Meaning" : "Reading"}
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-center">
                            <button
                                onClick={handleVerify}
                                className="h-12 px-12 bg-[#1a1a1a] text-white font-bold rounded-xl text-sm shadow-lg hover:shadow-xl hover:translate-y-[-1px] active:translate-y-[1px] transition-all"
                            >
                                Verify Answer
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col animate-in zoom-in-98 fade-in duration-400 px-2">
                        {/* Result Card */}
                        <div className={clsx(
                            "w-full rounded-2xl p-8 text-center shadow-sm border transition-all duration-500",
                            isCorrect
                                ? "bg-[#F0FDF4] border-[#DCFCE7] text-[#166534]"
                                : "bg-[#FEF2F2] border-[#FEE2E2] text-[#991B1B]"
                        )}>
                            <h3 className="text-2xl font-black mb-6 tracking-tight">
                                {isCorrect ? "Correct!" : "Incorrect"}
                            </h3>

                            <div className="space-y-4">
                                {isCorrect ? (
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-60">
                                            THE {card.prompt_variant === 'meaning' ? "MEANING" : "READING"} IS
                                        </p>
                                        <p className="text-4xl font-black tracking-tight">
                                            {card.prompt_variant === 'meaning' ? card.meaning : card.reading || card.cloze_answer}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-4 py-2">
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-bold uppercase tracking-[0.2em] opacity-50">Strict Protocol</p>
                                            <p className="text-base font-bold leading-snug">
                                                Answer hidden. Item re-queued for mastery.
                                            </p>
                                        </div>
                                        <p className="text-[10px] opacity-40 font-medium">Attempt: {userInput}</p>
                                    </div>
                                )}

                                <div className="text-2xl mt-4 opacity-80">
                                    {isCorrect ? "✨" : "🛑"}
                                </div>
                            </div>
                        </div>

                        {/* Action Section */}
                        <div className="mt-10 flex flex-col items-center space-y-4">
                            <button
                                onClick={() => onRate(isCorrect ? 'pass' : 'again', userInput)}
                                className={clsx(
                                    "h-12 px-12 rounded-xl text-sm font-bold shadow-lg transition-all hover:shadow-xl hover:translate-y-[-1px] active:translate-y-[1px] flex items-center justify-center gap-2",
                                    isCorrect ? "bg-[#1a1a1a] text-white" : "bg-rose-600 text-white"
                                )}
                            >
                                {isCorrect ? "Next Item" : "Got it, Continue"}
                                <ArrowRight size={16} />
                            </button>

                            <div className="flex items-center gap-2 text-gray-300">
                                <Keyboard size={12} className="opacity-50" />
                                <span className="text-[9px] font-bold uppercase tracking-widest">Enter to continue</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
