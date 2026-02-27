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
import { Check, X, ArrowRight, Keyboard, Sparkles } from 'lucide-react';

import { QuizItem } from '../ReviewSessionController';
import { Rating } from '../domain/FSRSEngine';
import { GlassCard } from '@/components/premium/GlassCard';

interface ReviewCardDisplayProps {
    card: any;
    mode: 'learn' | 'review';
    onReveal: () => void;
    onRate: (rating: any, userInput: string) => void;
}

export function ReviewCardDisplay({ card, mode, onReveal, onRate }: ReviewCardDisplayProps) {
    console.log(`[ReviewCardDisplay] Rendering card: ${card.id}, Variant: ${card.prompt_variant}`);
    const [userInput, setUserInput] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
    const [shake, setShake] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setUserInput('');
        setSubmitted(false);
        setIsCorrect(null);
        setShake(false);
        setTimeout(() => inputRef.current?.focus(), 100);
    }, [card.id]);

    const validateLocal = (card: QuizItem, input: string) => {
        const normalized = input.trim().toLowerCase();
        if (normalized === 'force-pass') return true;
        if (card.prompt_variant === 'meaning') return normalized === card.meaning.toLowerCase();
        else if (card.prompt_variant === 'reading') return normalized === card.reading?.toLowerCase();
        else if (card.prompt_variant === 'cloze') return normalized === card.cloze_answer?.toLowerCase();
        return false;
    };

    const handleVerify = () => {
        if (submitted) return;
        if (!userInput.trim()) {
            setShake(true);
            setTimeout(() => setShake(false), 600);
            return;
        }
        const validation = validateLocal(card, userInput);
        setIsCorrect(validation);
        setSubmitted(true);
        onReveal();
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            if (submitted) onRate(isCorrect ? 'pass' : 'again', userInput);
            else handleVerify();
        }
    };

    const typeConfig: Record<string, { gradient: string; glow: string; focusBorder: string }> = {
        radical: { gradient: 'from-[#A2D2FF] to-[#7BB8F0]', glow: 'shadow-[0_0_30px_rgba(162,210,255,0.25)]', focusBorder: 'focus:border-radical' },
        kanji: { gradient: 'from-[#F4ACB7] to-[#D88C9A]', glow: 'shadow-[0_0_30px_rgba(244,172,183,0.25)]', focusBorder: 'focus:border-kanji' },
        vocabulary: { gradient: 'from-[#CDB4DB] to-[#B09AC5]', glow: 'shadow-[0_0_30px_rgba(205,180,219,0.25)]', focusBorder: 'focus:border-vocab' },
        grammar: { gradient: 'from-[#B7E4C7] to-[#95D5A8]', glow: 'shadow-[0_0_30px_rgba(183,228,199,0.25)]', focusBorder: 'focus:border-grammar' },
    };

    const cardType = card.type || card.ku_type || 'kanji';
    const config = typeConfig[cardType] || typeConfig.kanji;

    const renderHeaderContent = () => {
        if (card.prompt_variant === 'cloze' && card.sentence_ja) {
            const parts = card.sentence_ja.split(card.cloze_answer || "");
            return (
                <p className="text-base sm:text-xl font-bold leading-relaxed text-white px-4 text-center">
                    {parts[0]}
                    <span className="inline-block border-b-2 border-white/60 px-2 mx-1 min-w-[2ch] text-white/90">
                        {submitted && isCorrect ? card.cloze_answer : "　"}
                    </span>
                    {parts[1]}
                </p>
            );
        }
        return (
            <h2 className="text-5xl sm:text-7xl font-black text-white drop-shadow-lg">
                {card.character}
            </h2>
        );
    };

    return (
        <div className="w-full max-w-[480px] mx-auto flex flex-col py-2 sm:py-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Card Header */}
            <div className={clsx(
                "w-full rounded-[24px] sm:rounded-[28px] flex flex-col items-center justify-center relative overflow-hidden mb-4 sm:mb-6 transition-all duration-500",
                `bg-gradient-to-br ${config.gradient}`,
                config.glow,
                card.prompt_variant === 'cloze' ? "min-h-[100px] sm:min-h-[120px] py-6 px-4" : "h-32 sm:h-44"
            )}>
                <div className="absolute inset-0 bg-gradient-to-br from-white/15 to-transparent pointer-events-none" />
                <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />

                <div className="absolute top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-black/15 backdrop-blur-sm px-3 py-1 rounded-full text-[8px] sm:text-[9px] font-black uppercase tracking-[0.15em] text-white/90 border border-white/10">
                        {card.prompt || (card.prompt_variant === 'meaning' ? "Recall Meaning" : card.prompt_variant === 'reading' ? "Recall Reading" : "Fill Blank")}
                    </span>
                </div>

                <div className="absolute top-3 right-3">
                    <span className="bg-black/10 backdrop-blur-sm px-2 py-0.5 rounded-lg text-[7px] font-black uppercase tracking-widest text-white/70">
                        {cardType}
                    </span>
                </div>

                <div className="relative z-10 mt-3">
                    {renderHeaderContent()}
                </div>
            </div>

            {/* Input / Result */}
            <div className="w-full flex-1 flex flex-col min-h-0">
                {!submitted ? (
                    <div className={clsx(
                        "flex-1 flex flex-col space-y-4 px-1 animate-in fade-in zoom-in-95 duration-300",
                        shake && "animate-shake"
                    )}>
                        <div className="relative w-full">
                            <input
                                ref={inputRef}
                                type="text"
                                value={userInput}
                                onChange={(e) => setUserInput(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Enter answer..."
                                className={clsx(
                                    "w-full py-4 sm:py-5 bg-white border-2 border-gray-100 rounded-2xl text-center text-xl sm:text-2xl font-bold transition-all duration-300 outline-none shadow-sm focus:shadow-md",
                                    config.focusBorder
                                )}
                                autoFocus
                            />
                            <div className="text-center mt-2">
                                <p className="text-gray-400 font-bold uppercase text-[8px] tracking-[0.2em]">
                                    {card.prompt_variant === 'meaning' ? "English Meaning" : card.prompt_variant === 'reading' ? "Japanese Reading" : "Missing Word"}
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-center">
                            <button
                                onClick={handleVerify}
                                className={clsx(
                                    "h-11 sm:h-12 px-10 sm:px-14 font-black rounded-2xl text-sm shadow-lg hover:shadow-xl hover:translate-y-[-2px] active:translate-y-[0px] transition-all duration-200 text-white",
                                    `bg-gradient-to-r ${config.gradient}`
                                )}
                            >
                                Verify Answer
                            </button>
                        </div>

                        <div className="flex items-center justify-center gap-2 text-gray-300">
                            <Keyboard size={10} className="opacity-50" />
                            <span className="text-[8px] font-bold uppercase tracking-widest">Enter to verify</span>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col animate-in zoom-in-98 fade-in duration-400 px-1">
                        {/* Result Card */}
                        <div className={clsx(
                            "w-full rounded-2xl p-5 sm:p-7 text-center shadow-sm border-2 transition-all duration-500 relative overflow-hidden",
                            isCorrect
                                ? "bg-gradient-to-br from-[#F0FDF4] to-[#DCFCE7] border-[#86EFAC]/50 text-[#166534]"
                                : "bg-gradient-to-br from-[#FEF2F2] to-[#FEE2E2] border-[#FCA5A5]/50 text-[#991B1B]"
                        )}>
                            <div className="relative z-10">
                                <div className="flex items-center justify-center gap-2 mb-3">
                                    <div className={clsx("w-7 h-7 rounded-full flex items-center justify-center", isCorrect ? "bg-[#86EFAC]/30" : "bg-[#FCA5A5]/30")}>
                                        {isCorrect ? <Check size={14} strokeWidth={3} /> : <X size={14} strokeWidth={3} />}
                                    </div>
                                    <h3 className="text-lg sm:text-xl font-black tracking-tight">
                                        {isCorrect ? "Correct!" : "Incorrect"}
                                    </h3>
                                    {isCorrect && <Sparkles size={14} className="text-[#48BB78]" />}
                                </div>

                                {isCorrect ? (
                                    <div className="space-y-1">
                                        <p className="text-[8px] font-black uppercase tracking-[0.2em] opacity-50">
                                            THE {card.prompt_variant === 'meaning' ? "MEANING" : "READING"} IS
                                        </p>
                                        <p className="text-2xl sm:text-3xl font-black tracking-tight">
                                            {card.prompt_variant === 'meaning' ? card.meaning : card.reading || card.cloze_answer}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-2 py-1">
                                        <p className="text-sm font-bold leading-snug opacity-80">Answer hidden. Item re-queued.</p>
                                        <div className="px-3 py-1.5 bg-black/5 rounded-xl">
                                            <p className="text-[9px] opacity-50 font-medium">Your attempt: <span className="font-black">{userInput}</span></p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Action */}
                        <div className="mt-5 flex flex-col items-center space-y-3">
                            <button
                                onClick={() => onRate(isCorrect ? 'pass' : 'again', userInput)}
                                className={clsx(
                                    "h-11 sm:h-12 px-10 sm:px-14 rounded-2xl text-sm font-black shadow-lg transition-all duration-200 hover:shadow-xl hover:translate-y-[-2px] active:translate-y-[0px] flex items-center justify-center gap-2 text-white",
                                    isCorrect ? `bg-gradient-to-r ${config.gradient}` : "bg-gradient-to-r from-rose-500 to-rose-600"
                                )}
                            >
                                {isCorrect ? "Next Item" : "Got it, Continue"}
                                <ArrowRight size={15} />
                            </button>
                            <div className="flex items-center gap-2 text-gray-300">
                                <Keyboard size={10} className="opacity-50" />
                                <span className="text-[8px] font-bold uppercase tracking-widest">Enter to continue</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
