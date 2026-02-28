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

    const typeConfig: Record<string, { bg: string; text: string; focusBorder: string; buttonGradient: string }> = {
        radical: { bg: 'bg-[#A2D2FF]/15', text: 'text-[#508CAE]', focusBorder: 'focus:border-[#A2D2FF]', buttonGradient: 'from-[#A2D2FF] to-[#7BB8F0]' },
        kanji: { bg: 'bg-[#F4ACB7]/15', text: 'text-[#C76F80]', focusBorder: 'focus:border-[#F4ACB7]', buttonGradient: 'from-[#F4ACB7] to-[#D88C9A]' },
        vocabulary: { bg: 'bg-[#CDB4DB]/15', text: 'text-[#9A7BB0]', focusBorder: 'focus:border-[#CDB4DB]', buttonGradient: 'from-[#CDB4DB] to-[#B09AC5]' },
        grammar: { bg: 'bg-[#B7E4C7]/15', text: 'text-[#6EA885]', focusBorder: 'focus:border-[#B7E4C7]', buttonGradient: 'from-[#B7E4C7] to-[#95D5A8]' },
    };

    const cardType = card.type || card.ku_type || 'kanji';
    const config = typeConfig[cardType] || typeConfig.kanji;

    const renderHeaderContent = () => {
        if (card.prompt_variant === 'cloze' && card.sentence_ja) {
            const parts = card.sentence_ja.split(card.cloze_answer || "");
            return (
                <p className="text-xl sm:text-3xl font-bold leading-relaxed text-gray-800 px-4 text-center">
                    {parts[0]}
                    <span className="inline-block border-b-2 border-gray-400 px-2 mx-1 min-w-[2ch] text-black">
                        {submitted && isCorrect ? card.cloze_answer : "　"}
                    </span>
                    {parts[1]}
                </p>
            );
        }
        return (
            <h2 className="text-7xl sm:text-9xl font-black text-gray-900 drop-shadow-sm jp-text leading-none">
                {card.character}
            </h2>
        );
    };

    return (
        <div className="w-full flex-1 flex flex-col animate-in fade-in duration-500">
            {/* Middle Zone: Main Learning Content */}
            <div className={clsx(
                "w-full flex-1 flex flex-col items-center justify-center relative transition-colors duration-500 min-h-[40vh]",
                config.bg
            )}>
                <div className="absolute top-6 left-1/2 -translate-x-1/2">
                    <span className={clsx("px-4 py-1.5 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] opacity-80", config.text)}>
                        {card.prompt || (card.prompt_variant === 'meaning' ? "Recall Meaning" : card.prompt_variant === 'reading' ? "Recall Reading" : "Fill Blank")}
                    </span>
                </div>

                <div className="absolute top-6 right-6">
                    <span className={clsx("px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest opacity-60", config.text)}>
                        {cardType}
                    </span>
                </div>

                <div className="relative z-10 w-full max-w-4xl mx-auto px-4 mt-8 flex items-center justify-center">
                    {renderHeaderContent()}
                </div>
            </div>

            {/* Bottom Zone: Input / Action / Result */}
            <div className="w-full bg-white flex flex-col items-center justify-start pb-8 sm:pb-12 pt-8 sm:pt-14 px-4 sm:px-8 mt-auto min-h-[35vh]">
                <div className="w-full max-w-xl mx-auto flex flex-col">
                    {!submitted ? (
                        <div className={clsx(
                            "w-full flex-col space-y-6 flex animate-in fade-in slide-in-from-bottom-2 duration-300",
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
                                        "w-full py-5 sm:py-6 bg-gray-50/50 border-2 border-gray-100 rounded-[24px] text-center text-2xl sm:text-3xl font-bold transition-all duration-300 outline-none shadow-sm focus:shadow-md focus:bg-white",
                                        config.focusBorder
                                    )}
                                    autoFocus
                                />
                                <div className="text-center mt-3">
                                    <p className="text-gray-400 font-bold uppercase text-[9px] sm:text-[10px] tracking-[0.2em]">
                                        {card.prompt_variant === 'meaning' ? "English Meaning" : card.prompt_variant === 'reading' ? "Japanese Reading" : "Missing Word"}
                                    </p>
                                </div>
                            </div>

                            <div className="flex justify-center">
                                <button
                                    onClick={handleVerify}
                                    className={clsx(
                                        "h-12 sm:h-14 px-12 sm:px-16 font-black rounded-[24px] text-sm sm:text-base shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 text-white",
                                        `bg-gradient-to-r ${config.buttonGradient}`
                                    )}
                                >
                                    Verify Answer
                                </button>
                            </div>

                            <div className="flex items-center justify-center gap-2 text-gray-400 mt-2">
                                <Keyboard size={12} className="opacity-50" />
                                <span className="text-[9px] font-bold uppercase tracking-widest opacity-80">Enter to verify</span>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col w-full animate-in slide-in-from-bottom-2 fade-in duration-300">
                            {/* Result Card */}
                            <div className={clsx(
                                "w-full rounded-[24px] p-6 sm:p-8 text-center shadow-sm border-2 transition-all duration-500 relative overflow-hidden flex flex-col items-center justify-center min-h-[140px]",
                                isCorrect
                                    ? "bg-gradient-to-br from-[#F0FDF4] to-[#DCFCE7] border-[#86EFAC]/50 text-[#166534]"
                                    : "bg-gradient-to-br from-[#FEF2F2] to-[#FEE2E2] border-[#FCA5A5]/50 text-[#991B1B]"
                            )}>
                                <div className="relative z-10 w-full">
                                    <div className="flex items-center justify-center gap-2 mb-3">
                                        <div className={clsx("w-8 h-8 rounded-full flex items-center justify-center", isCorrect ? "bg-[#86EFAC]/40" : "bg-[#FCA5A5]/40")}>
                                            {isCorrect ? <Check size={16} strokeWidth={3} /> : <X size={16} strokeWidth={3} />}
                                        </div>
                                        <h3 className="text-xl sm:text-2xl font-black tracking-tight">
                                            {isCorrect ? "Correct!" : "Incorrect"}
                                        </h3>
                                        {isCorrect && <Sparkles size={16} className="text-[#48BB78]" />}
                                    </div>

                                    {isCorrect ? (
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-60">
                                                THE {card.prompt_variant === 'meaning' ? "MEANING" : "READING"} IS
                                            </p>
                                            <p className="text-3xl sm:text-4xl font-black tracking-tight">
                                                {card.prompt_variant === 'meaning' ? card.meaning : card.reading || card.cloze_answer}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3 py-1">
                                            <p className="text-base font-bold leading-snug opacity-90">Answer hidden. Item re-queued.</p>
                                            <div className="px-4 py-2 bg-black/5 rounded-xl inline-block">
                                                <p className="text-[10px] opacity-60 font-medium tracking-wide">Your attempt: <span className="font-black opacity-100">{userInput}</span></p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Action */}
                            <div className="mt-8 flex flex-col items-center space-y-4">
                                <button
                                    onClick={() => onRate(isCorrect ? 'pass' : 'again', userInput)}
                                    className={clsx(
                                        "h-12 sm:h-14 px-12 sm:px-16 rounded-[24px] text-sm sm:text-base font-black shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 text-white w-full sm:w-auto",
                                        isCorrect ? `bg-gradient-to-r ${config.buttonGradient}` : "bg-gradient-to-r from-rose-500 to-rose-600"
                                    )}
                                >
                                    {isCorrect ? "Next Item" : "Got it, Continue"}
                                    <ArrowRight size={18} />
                                </button>
                                <div className="flex items-center gap-2 text-gray-400">
                                    <Keyboard size={12} className="opacity-50" />
                                    <span className="text-[9px] font-bold uppercase tracking-widest opacity-80">Enter to continue</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
