
'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MockDB } from '@/lib/mock-db';
import { useUser } from '@/features/auth/AuthContext';
import {
    CheckCircle2,
    XCircle,
    Clock,
    ChevronRight,
    FlipHorizontal,
    Volume2,
    BrainCircuit,
    ChevronLeft,
    RotateCcw
} from 'lucide-react';
import { clsx } from 'clsx';

type SessionState = 'LOADING' | 'STUDY' | 'RESULT';

export default function StudySessionPage() {
    const { deckId } = useParams();
    const router = useRouter();
    const { user } = useUser();
    const [sessionState, setSessionState] = useState<SessionState>('LOADING');
    const [deck, setDeck] = useState<any>(null);
    const [queue, setQueue] = useState<any[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showAnswer, setShowAnswer] = useState(false);
    const [sessionStats, setSessionStats] = useState({ correct: 0, total: 0 });

    useEffect(() => {
        if (user && deckId) {
            async function initSession() {
                const decks = await MockDB.getUserDecks(user!.id);
                const currentDeck = decks.find(d => d.id === deckId);
                setDeck(currentDeck);

                // Fetch items for this specific deck that are due or new
                const deckItems = await MockDB.getDeckItems(deckId as string);
                const states = await Promise.all(deckItems.map(async (item) => {
                    const details = await MockDB.fetchItemDetails('', item.ku_id);
                    return details;
                }));

                // Filter for Study: Due today OR state is new
                // For this mock, let's just take all items in the deck to ensure a session starts
                setQueue(states.filter(Boolean));
                setSessionState('STUDY');
                setSessionStats({ correct: 0, total: states.length });
            }
            initSession();
        }
    }, [user, deckId]);

    const handleGrade = (grade: number) => {
        if (grade >= 3) setSessionStats(s => ({ ...s, correct: s.correct + 1 }));

        if (currentIndex < queue.length - 1) {
            setCurrentIndex(currentIndex + 1);
            setShowAnswer(false);
        } else {
            setSessionState('RESULT');
        }
    };

    if (sessionState === 'LOADING') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] animate-pulse">
                <BrainCircuit className="w-16 h-16 text-primary-dark/20 mb-4" />
                <p className="font-black text-primary-dark/40">Preparing Session...</p>
            </div>
        );
    }

    if (sessionState === 'RESULT') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8">
                <div className="w-32 h-32 relative">
                    <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
                    <div className="relative w-full h-full bg-primary rounded-clay border-4 border-primary-dark flex items-center justify-center shadow-clay">
                        <CheckCircle2 className="w-16 h-16 text-white" />
                    </div>
                </div>
                <div className="text-center">
                    <h1 className="text-4xl font-black text-primary-dark mb-2">Session Complete!</h1>
                    <p className="text-primary-dark/60 font-bold">
                        Excellent work. You've reviewed {sessionStats.total} items in <span className="text-primary">{deck?.name}</span>.
                    </p>
                </div>
                <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
                    <div className="clay-card p-4 text-center">
                        <div className="text-xs font-black uppercase text-primary-dark/50 mb-1">Retention</div>
                        <div className="text-3xl font-black text-primary-dark">
                            {sessionStats.total > 0 ? Math.round((sessionStats.correct / sessionStats.total) * 100) : 100}%
                        </div>
                    </div>
                    <div className="clay-card p-4 text-center">
                        <div className="text-xs font-black uppercase text-primary-dark/50 mb-1">XP Gained</div>
                        <div className="text-3xl font-black text-secondary">+150</div>
                    </div>
                </div>
                <button
                    onClick={() => router.push('/decks')}
                    className="clay-btn text-xl px-12 py-4"
                >
                    Back to Decks
                </button>
            </div>
        );
    }

    const currentCard = queue[currentIndex];
    if (!currentCard) return <div className="text-center py-20 font-bold">No items found in this deck. Try adding some!</div>;

    return (
        <div className="max-w-2xl mx-auto flex flex-col gap-8 h-full">
            {/* Header */}
            <header className="flex items-center justify-between">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 font-black text-primary-dark/40 hover:text-primary"
                >
                    <ChevronLeft className="w-5 h-5" />
                    Exit Session
                </button>
                <div className="flex flex-col items-end">
                    <span className="text-[10px] font-black uppercase text-primary-dark/40">Current Deck</span>
                    <span className="text-sm font-black text-primary">{deck?.name}</span>
                </div>
            </header>

            {/* Progress Bar */}
            <div className="flex items-center gap-4">
                <div className="flex-1 h-3 bg-primary-dark/10 rounded-full border-2 border-primary-dark overflow-hidden">
                    <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${((currentIndex + 1) / queue.length) * 100}%` }}
                    />
                </div>
                <span className="text-xs font-black text-primary-dark whitespace-nowrap">
                    {currentIndex + 1} / {queue.length}
                </span>
            </div>

            {/* Card Display */}
            <div className="flex-1 perspective-1000 my-4">
                <div className={clsx(
                    "w-full min-h-[450px] clay-card !rounded-[40px] p-10 flex flex-col items-center justify-center text-center transition-all duration-500 relative bg-white",
                    showAnswer && "border-primary"
                )}>
                    {!showAnswer ? (
                        <div className="flex flex-col items-center gap-10">
                            <div className="text-9xl font-black text-primary-dark drop-shadow-sm">
                                {currentCard.character}
                            </div>
                            <button
                                onClick={() => setShowAnswer(true)}
                                className="clay-btn mt-12 bg-white !text-primary-dark border-dashed px-10 py-4 text-lg hover:scale-105"
                            >
                                <FlipHorizontal className="w-5 h-5 text-primary" />
                                Show Answer
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-6 w-full h-full animate-in zoom-in-95 duration-300">
                            <div className="text-5xl font-black text-primary-dark opacity-20">{currentCard.character}</div>

                            <div className="flex flex-col items-center gap-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-3xl font-black text-primary">
                                        {currentCard.ku_vocabulary?.reading_primary ||
                                            currentCard.ku_kanji?.reading_data?.on?.[0] ||
                                            currentCard.character}
                                    </span>
                                    {currentCard.ku_vocabulary && (
                                        <Volume2 className="w-6 h-6 text-primary cursor-pointer hover:scale-110 transition-transform" />
                                    )}
                                </div>
                                <div className="text-4xl font-black text-primary-dark capitalize">
                                    {currentCard.meaning}
                                </div>
                            </div>

                            <div className="w-full h-0.5 bg-primary-dark/5 my-4" />

                            <div className="w-full text-left bg-background p-6 rounded-clay border-2 border-primary-dark border-dashed">
                                <h4 className="text-[10px] font-black uppercase text-primary mb-2 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    Mnemonic Aid
                                </h4>
                                <p className="text-primary-dark/80 font-bold leading-relaxed italic">
                                    The character <span className="text-primary">{currentCard.character}</span> looks like a {currentCard.meaning.toLowerCase()} if you squint hard enough.
                                </p>
                            </div>

                            {/* Grading Controls */}
                            <div className="mt-auto flex flex-col gap-4 w-full pt-8">
                                <div className="text-[10px] font-black uppercase text-primary-dark/20 text-center tracking-widest">How well did you know this?</div>
                                <div className="grid grid-cols-4 gap-3">
                                    {[
                                        { grade: 1, label: 'Again', color: 'bg-red-500', text: 'text-red-500', sub: '< 1m' },
                                        { grade: 2, label: 'Hard', color: 'bg-orange-500', text: 'text-orange-500', sub: '2.5d' },
                                        { grade: 3, label: 'Good', color: 'bg-green-500', text: 'text-green-500', sub: '4.8d' },
                                        { grade: 4, label: 'Easy', color: 'bg-blue-500', text: 'text-blue-500', sub: '9.2d' },
                                    ].map((g) => (
                                        <button
                                            key={g.grade}
                                            onClick={() => handleGrade(g.grade)}
                                            className={clsx(
                                                "clay-btn !bg-white !text-primary-dark border-2 border-primary-dark/10 flex flex-col gap-1 p-3 h-auto group",
                                                "hover:!border-primary transition-all active:scale-95",
                                                g.grade === 1 && "hover:!bg-red-50",
                                                g.grade === 2 && "hover:!bg-orange-50",
                                                g.grade === 3 && "hover:!bg-green-50",
                                                g.grade === 4 && "hover:!bg-blue-50"
                                            )}
                                        >
                                            <span className={clsx("text-xs font-black", g.text)}>{g.label}</span>
                                            <span className="text-[8px] font-bold opacity-30">{g.sub}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
