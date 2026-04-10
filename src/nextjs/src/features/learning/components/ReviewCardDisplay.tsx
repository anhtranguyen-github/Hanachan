'use client';

import React, { useState, useEffect, useRef } from 'react';
import { clsx } from 'clsx';
import { Check, X, ArrowRight, Keyboard, Sparkles, PencilLine, Loader2, BookOpen } from 'lucide-react';
import { QuizItem } from '../ReviewSessionController';
import { Rating } from '../core/FSRSEngine';
import { updateKUNoteAction } from '../actions';
import { useAuth } from '@/features/auth/AuthContext';

interface ReviewCardDisplayProps {
    card: any;
    mode: 'learn' | 'review';
    onReveal: () => void;
    onRate: (rating: any, userInput: string) => void;
}

// Type-based visual config
const TYPE_CONFIG: Record<string, {
    heroBg: string;
    accent: string;
    accentText: string;
    badgeBg: string;
    inputFocus: string;
    btnGrad: string;
    dot: string;
}> = {
    radical: {
        heroBg: 'bg-gradient-to-b from-[#EBF5FF] to-[#DBEEFF]',
        accent: 'bg-[#A2D2FF]',
        accentText: 'text-[#2A6FA8]',
        badgeBg: 'bg-[#A2D2FF]/20 text-[#2A6FA8]',
        inputFocus: 'focus:border-[#A2D2FF] focus:ring-[#A2D2FF]/20',
        btnGrad: 'from-[#5AACF0] to-[#3A8FD8]',
        dot: 'bg-[#A2D2FF]',
    },
    kanji: {
        heroBg: 'bg-gradient-to-b from-[#FFF0F3] to-[#FFE4EA]',
        accent: 'bg-[#F4ACB7]',
        accentText: 'text-[#B5375A]',
        badgeBg: 'bg-[#F4ACB7]/20 text-[#B5375A]',
        inputFocus: 'focus:border-[#F4ACB7] focus:ring-[#F4ACB7]/20',
        btnGrad: 'from-[#E87597] to-[#C95070]',
        dot: 'bg-[#F4ACB7]',
    },
    vocabulary: {
        heroBg: 'bg-gradient-to-b from-[#F5F0FF] to-[#EDE6FF]',
        accent: 'bg-[#CDB4DB]',
        accentText: 'text-[#7A4DAA]',
        badgeBg: 'bg-[#CDB4DB]/20 text-[#7A4DAA]',
        inputFocus: 'focus:border-[#CDB4DB] focus:ring-[#CDB4DB]/20',
        btnGrad: 'from-[#B490D0] to-[#9265B8]',
        dot: 'bg-[#CDB4DB]',
    },
    grammar: {
        heroBg: 'bg-gradient-to-b from-[#F0FFF6] to-[#E0FFED]',
        accent: 'bg-[#B7E4C7]',
        accentText: 'text-[#2D7A4D]',
        badgeBg: 'bg-[#B7E4C7]/20 text-[#2D7A4D]',
        inputFocus: 'focus:border-[#B7E4C7] focus:ring-[#B7E4C7]/20',
        btnGrad: 'from-[#6DC98A] to-[#4AA868]',
        dot: 'bg-[#B7E4C7]',
    },
};

function PromptLabel({ variant }: { variant: string }) {
    const map: Record<string, string> = {
        meaning: 'Recall Meaning',
        reading: 'Recall Reading',
        cloze: 'Fill in the Blank',
    };
    return (
        <span className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">
            {map[variant] ?? variant}
        </span>
    );
}

export function ReviewCardDisplay({ card, mode, onReveal, onRate }: ReviewCardDisplayProps) {
    const [userInput, setUserInput] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
    const [shake, setShake] = useState(false);

    const { user } = useAuth();
    const [localNotes, setLocalNotes] = useState(card.notes || '');
    const [isEditingNote, setIsEditingNote] = useState(false);
    const [noteInput, setNoteInput] = useState('');
    const [isSavingNote, setIsSavingNote] = useState(false);

    const inputRef = useRef<HTMLInputElement>(null);
    const noteInputRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        setUserInput('');
        setSubmitted(false);
        setIsCorrect(null);
        setShake(false);
        setLocalNotes(card.notes || '');
        setIsEditingNote(false);
        setTimeout(() => inputRef.current?.focus(), 80);
    }, [card.id, card.notes]);

    const validate = (c: QuizItem, input: string) => {
        const n = input.trim().toLowerCase();
        if (n === 'force-pass') return true;
        
        if (c.prompt_variant === 'meaning') {
            return c.meanings.some(m => m.toLowerCase() === n);
        }
        if (c.prompt_variant === 'reading') {
            return c.readings?.some(r => r.toLowerCase() === n) || false;
        }
        return false;
    };

    const handleVerify = () => {
        if (submitted) return;
        if (!userInput.trim()) {
            setShake(true);
            setTimeout(() => setShake(false), 600);
            return;
        }
        const ok = validate(card, userInput);
        setIsCorrect(ok);
        setSubmitted(true);
        onReveal();
    };

    const handleKey = (e: React.KeyboardEvent) => {
        if (isEditingNote && document.activeElement === noteInputRef.current) return;
        if (e.key === 'Enter') {
            if (submitted) onRate(isCorrect, userInput);
            else handleVerify();
        }
    };

    const handleSaveNote = async () => {
        if (!noteInput.trim() || !user) { setIsEditingNote(false); return; }
        setIsSavingNote(true);
        const res = await updateKUNoteAction(user.id, card.assignment_id, noteInput);
        if (res.success) { setLocalNotes(res.data); setNoteInput(''); setIsEditingNote(false); }
        setIsSavingNote(false);
    };

    const cardType = card.type || 'kanji';
    const cfg = TYPE_CONFIG[cardType] || TYPE_CONFIG.kanji;

    // Hero content
    const heroContent = (
        <div className="flex flex-col items-center gap-1 text-center">
            {/* Main character */}
            <h2 className="text-[4.5rem] sm:text-[6rem] font-black text-gray-900 jp-text leading-none tracking-tight">
                {card.character}
            </h2>
            {/* Reading shown below character after submission */}
            {submitted && card.reading && card.prompt_variant === 'meaning' && (
                <p className="text-lg sm:text-xl font-bold text-gray-500 jp-text animate-in fade-in duration-300">
                    {card.reading}
                </p>
            )}
        </div>
    );

    return (
        <div
            className="w-full flex-1 flex flex-col animate-in fade-in duration-400"
            onKeyDown={handleKey}
        >
            {/* ── HERO ── */}
            <div className={clsx(
                'w-full flex flex-col items-center justify-center relative transition-colors duration-500',
                'pt-6 pb-5 sm:pt-8 sm:pb-7 min-h-[32vh] sm:min-h-[35vh]',
                cfg.heroBg,
            )}>
                {/* Top row: prompt label left, type badge right */}
                <div className="absolute top-3 left-4 right-4 flex items-start justify-between">
                    <PromptLabel variant={card.prompt_variant} />
                    <span className={clsx('px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest', cfg.badgeBg)}>
                        {cardType}
                    </span>
                </div>

                {/* Central content */}
                <div className="relative z-10 flex items-center justify-center w-full px-6 mt-4">
                    {heroContent}
                </div>

                {/* Accent line at bottom */}
                <div className={clsx('absolute bottom-0 left-0 right-0 h-0.5', cfg.accent)} />
            </div>

            {/* ── CONTENT + INPUT ZONE ── */}
            <div className="w-full bg-white flex flex-col flex-1 min-h-0">
                <div className="w-full max-w-lg mx-auto px-4 sm:px-6 flex flex-col gap-0 pt-5 pb-6 sm:pt-6 sm:pb-8 h-full">

                    {!submitted ? (
                        /* ── INPUT STATE ── */
                        <div className={clsx('flex flex-col gap-4', shake && 'animate-[shake_0.5s_ease-in-out]')}>
                            {/* Sublabel */}
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 text-center">
                                {card.prompt_variant === 'meaning' ? 'Type the English meaning'
                                    : 'Type the Japanese reading'}
                            </p>

                            {/* Input */}
                            <input
                                ref={inputRef}
                                type="text"
                                value={userInput}
                                onChange={e => setUserInput(e.target.value)}
                                placeholder="Answer..."
                                className={clsx(
                                    'w-full py-4 sm:py-5 bg-gray-50 border-2 border-gray-100 rounded-2xl text-center text-xl sm:text-2xl font-bold outline-none transition-all shadow-sm focus:shadow-md focus:bg-white focus:ring-4',
                                    cfg.inputFocus
                                )}
                                autoComplete="off"
                                autoFocus
                            />

                            {/* CTA */}
                            <button
                                onClick={handleVerify}
                                className={clsx(
                                    'w-full py-4 rounded-2xl font-black text-sm sm:text-base text-white shadow-md hover:shadow-lg hover:scale-[1.015] active:scale-[0.98] transition-all duration-200',
                                    `bg-gradient-to-r ${cfg.btnGrad}`
                                )}
                            >
                                Check Answer
                            </button>

                            <div className="flex items-center justify-center gap-1.5 text-gray-300">
                                <Keyboard size={11} />
                                <span className="text-[9px] font-bold uppercase tracking-widest">Enter to check</span>
                            </div>
                        </div>
                    ) : (
                        /* ── RESULT STATE ── */
                        <div className="flex flex-col gap-3 animate-in slide-in-from-bottom-2 fade-in duration-300 flex-1 min-h-0">

                            {/* Result pill */}
                            <div className={clsx(
                                'w-full rounded-2xl px-5 py-3 flex items-center justify-between border',
                                isCorrect
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                    : 'bg-rose-50 border-rose-200 text-rose-700'
                            )}>
                                <div className="flex items-center gap-2.5">
                                    <div className={clsx(
                                        'w-7 h-7 rounded-full flex items-center justify-center shrink-0',
                                        isCorrect ? 'bg-emerald-100' : 'bg-rose-100'
                                    )}>
                                        {isCorrect
                                            ? <Check size={15} strokeWidth={3} />
                                            : <X size={15} strokeWidth={3} />
                                        }
                                    </div>
                                    <div>
                                        <p className="text-sm font-black tracking-tight">
                                            {isCorrect ? 'Correct!' : 'Not quite'}
                                        </p>
                                        {!isCorrect && (
                                            <p className="text-[10px] font-medium opacity-70">
                                                Your answer: <span className="font-bold">{userInput}</span>
                                            </p>
                                        )}
                                    </div>
                                </div>
                                {isCorrect && <Sparkles size={15} className="opacity-60" />}
                            </div>

                            {/* Answer reveal */}
                            <div className="bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3 space-y-0.5">
                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">
                                    {card.prompt_variant === 'meaning' ? 'Meanings' : 'Readings'}
                                </p>
                                <p className="text-2xl sm:text-3xl font-black text-gray-900 jp-text leading-tight">
                                    {card.prompt_variant === 'meaning' ? card.meanings.join(', ')
                                        : card.readings?.join(', ')}
                                </p>
                            </div>

                            {card.mnemonic && (
                                <div className="flex gap-2 bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3">
                                    <BookOpen size={14} className="text-amber-400 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-[9px] font-black uppercase tracking-widest text-amber-400 mb-0.5">Mnemonic</p>
                                        <p className="text-sm text-amber-800 leading-relaxed">{card.mnemonic}</p>
                                    </div>
                                </div>
                            )}

                            {/* CTA */}
                            <button
                                onClick={() => onRate(isCorrect, userInput)}
                                className={clsx(
                                    'w-full py-4 rounded-2xl font-black text-sm sm:text-base text-white shadow-md hover:shadow-lg hover:scale-[1.015] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 mt-1',
                                    isCorrect
                                        ? `bg-gradient-to-r ${cfg.btnGrad}`
                                        : 'bg-gradient-to-r from-rose-500 to-rose-600'
                                )}
                            >
                                {isCorrect ? 'Next Item' : 'Got It, Continue'}
                                <ArrowRight size={16} />
                            </button>
                            <div className="flex items-center justify-center gap-1.5 text-gray-300">
                                <Keyboard size={11} />
                                <span className="text-[9px] font-bold uppercase tracking-widest">Enter to continue</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

