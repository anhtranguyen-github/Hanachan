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
    card: QuizItem;
    mode: 'learn' | 'review';
    onReveal: () => void;
    onRate: (rating: Rating, userInput: string) => void;
}

export function ReviewCardDisplay({ card, mode, onReveal, onRate }: ReviewCardDisplayProps) {
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

    const activeColor = typeColors[card.type] || 'bg-primary';
    const activeBorderColor = typeBorderColors[card.type] || 'focus:border-primary';
    const activeBgColor = typeBgColors[card.type] || 'bg-primary';

    const renderHeaderContent = () => {
        if (card.prompt_variant === 'cloze' && card.sentence_ja) {
            const parts = card.sentence_ja.split(card.cloze_answer || "");
            return (
                <p className="text-3xl md:text-5xl font-black leading-relaxed text-white">
                    {parts[0]}
                    <span className="inline-block border-b-8 border-white px-2 min-w-[3ch] mx-2">
                        {submitted ? card.cloze_answer : "?"}
                    </span>
                    {parts[1]}
                </p>
            );
        }

        return (
            <h2 className="text-[120px] md:text-[160px] font-black leading-none text-white drop-shadow-2xl">
                {card.character}
            </h2>
        );
    };

    return (
        <div className="w-full max-w-2xl mx-auto flex flex-col pt-4 animate-in fade-in slide-in-from-bottom-8 duration-700">
            {/* Main Card Container - Matching Demo v2 Premium Look */}
            <div className="bg-white border-2 border-gray-300 rounded-[56px] shadow-sm flex flex-col overflow-hidden relative min-h-[600px]">

                {/* Colored Header Section */}
                <div className={clsx(
                    "p-16 text-center relative transition-colors duration-500",
                    activeColor
                )}>
                    {renderHeaderContent()}

                    {/* Prompt Header Badge */}
                    <div className="absolute top-6 left-1/2 -translate-x-1/2">
                        <span className="bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-white">
                            {card.prompt_variant === 'meaning' ? "Recall Meaning" :
                                card.prompt_variant === 'reading' ? "Recall Reading" :
                                    "Fill in the Context"}
                        </span>
                    </div>
                </div>

                <div className="flex-1 p-10 flex flex-col">
                    {!submitted ? (
                        <div className="flex-1 flex flex-col justify-center space-y-8 animate-in fade-in zoom-in-95 duration-300">
                            <div className="relative group max-w-md mx-auto w-full">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={userInput}
                                    onChange={(e) => setUserInput(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="た . . ."
                                    className={clsx(
                                        "w-full py-10 bg-gray-50 border-b-8 border-gray-200 rounded-t-[40px] text-center text-6xl font-black transition-all outline-none placeholder:opacity-20 text-foreground",
                                        activeBorderColor
                                    )}
                                    autoFocus
                                />
                                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-1.5 rounded-t-full opacity-0 group-focus-within:opacity-100 transition-opacity bg-current" style={{ backgroundColor: 'currentColor' }}>
                                    <div className={clsx("w-full h-full rounded-t-full", activeBgColor)}></div>
                                </div>
                                <div className="text-center mt-6">
                                    <p className="text-gray-400 font-black uppercase text-[10px] tracking-[0.4em] mt-4">
                                        Aspect: {card.prompt_variant === 'meaning' ? "English Meaning" : "Reading"}
                                    </p>
                                    <div
                                        className="w-[1px] h-[1px] opacity-[0.01] absolute pointer-events-none"
                                        data-testid="debug-answer"
                                        data-answer={
                                            card.prompt_variant === 'meaning' ? card.meaning :
                                                card.prompt_variant === 'reading' ? card.reading :
                                                    card.cloze_answer
                                        }
                                    />
                                </div>
                            </div>

                            <div className="flex justify-center pt-8">
                                <button
                                    onClick={handleVerify}
                                    className="px-16 py-6 bg-gray-900 text-white font-black rounded-[32px] text-xl shadow-xl hover:scale-105 active:scale-95 transition-all"
                                >
                                    Verify Answer
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col justify-between animate-in zoom-in-95 fade-in duration-500">
                            <div className="flex-1 flex flex-col items-center justify-center space-y-10">
                                <div className={clsx(
                                    "p-10 rounded-[48px] text-center w-full max-w-sm transition-all duration-500",
                                    isCorrect
                                        ? "bg-emerald-500 text-white shadow-2xl shadow-emerald-500/20"
                                        : "bg-white border-4 border-rose-500 text-rose-500 shadow-2xl shadow-rose-500/10"
                                )}>
                                    <h3 className="text-4xl font-black tracking-tighter mb-2">
                                        {isCorrect ? "Correct!" : "Incorrect"}
                                    </h3>

                                    <div className={clsx(
                                        "p-6 rounded-3xl space-y-1 mb-4",
                                        isCorrect ? "bg-white/10" : "bg-rose-50"
                                    )}>
                                        <p className={clsx(
                                            "text-[10px] font-black uppercase tracking-widest",
                                            isCorrect ? "text-white/60" : "text-rose-400"
                                        )}>
                                            {card.prompt_variant === 'meaning' ? "The Meaning is" : "The Reading is"}
                                        </p>
                                        <p className={clsx(
                                            "text-4xl font-black",
                                            isCorrect ? "text-white" : "text-rose-600"
                                        )}>
                                            {card.prompt_variant === 'meaning' ? card.meaning : card.reading || card.cloze_answer}
                                        </p>
                                        {!isCorrect && <p className="mt-2 text-rose-400/60 font-medium text-xs">You entered: {userInput}</p>}
                                    </div>

                                    <div className="text-4xl">{isCorrect ? "✨" : "🛑"}</div>
                                </div>

                                <div className="flex flex-col items-center gap-4 w-full max-w-sm">
                                    <button
                                        onClick={() => onRate(isCorrect ? 'pass' : 'again', userInput)}
                                        className={clsx(
                                            "group flex items-center justify-center gap-4 px-16 py-6 rounded-[32px] text-2xl font-black transition-all hover:scale-105 active:scale-95 shadow-xl w-full",
                                            isCorrect ? "bg-gray-900 text-white" : "bg-rose-500 text-white"
                                        )}
                                    >
                                        {isCorrect ? "Next Item" : "Got it, Continue"}
                                        <ArrowRight className="group-hover:translate-x-2 transition-transform" />
                                    </button>
                                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest flex items-center gap-2">
                                        <Keyboard size={14} /> Press Enter to Continue
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Card Footer Detail */}
                <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-center gap-12">
                    <span className="font-black text-foreground/20 uppercase text-[10px] tracking-widest">
                        Hanachan v2 Final
                    </span>
                    <span className="font-black text-foreground/20 uppercase text-[10px] tracking-widest">
                        {card.type.toUpperCase()}
                    </span>
                </div>
            </div>
        </div>
    );
}
