'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/ui/components/ui/button';
import { ArrowLeft, Volume2, Trophy, RotateCcw, Loader2, X, Flame, Zap, Layers, RefreshCcw, Star, Sparkles, BookOpen, Music } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { fetchDueItems, fetchNewItems, submitReview } from '@/features/srs/service';
import { Rating, SRSState } from '@/features/srs/algorithm';
import { cn } from '@/lib/utils';
import { useUser } from '@/features/auth/AuthContext';
import Confetti from 'react-confetti';

// --- Types ---

interface CardData {
    id: string;
    type: string;
    frontText: string;
    frontSub?: string;
    backMeaning: string;
    backReading?: string;
    backExtra?: string; // Sentence or extra context
    srsState: string;
    audio?: string;
    original: any;
}

// --- Main Page Component ---

export default function StudyPage() {
    const router = useRouter();
    const params = useParams<{ deckId: string }>();
    const { user } = useUser();

    // Window size for confetti
    const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

    useEffect(() => {
        setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    }, []);

    // State
    const [queue, setQueue] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [sessionComplete, setSessionComplete] = useState(false);
    const [stats, setStats] = useState({ correct: 0, total: 0, xp: 0 });
    const [flipCount, setFlipCount] = useState(0); // For forcing re-render of flip if needed

    useEffect(() => {
        if (user) loadSession();
    }, [params?.deckId, user]);

    const loadSession = async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            let items: any[] = [];
            if (params?.deckId === 'review-all') {
                items = await fetchDueItems(user.id);
            } else {
                items = await fetchDueItems(user.id, params?.deckId);
                // If fewer than 5 reviews, fetch new items to fill
                if (!items || items.length < 5) {
                    const newItems = await fetchNewItems(user.id, params?.deckId, 10 - (items?.length || 0));
                    items = [...(items || []), ...(newItems || [])];
                }
            }
            setQueue(items || []);
        } catch (error) {
            console.error("Failed to load session", error);
        } finally {
            setIsLoading(false);
        }
    };

    const currentItemRaw = queue[currentIndex];
    const cardData = currentItemRaw ? transformToCardData(currentItemRaw) : null;

    // --- Actions ---

    const handleFlip = () => {
        setIsFlipped(true);
    };

    const handleGrade = async (rating: Rating) => {
        if (!currentItemRaw) return;

        // Optimistic Stats Update
        const isCorrect = rating !== 'again';
        setStats(prev => ({
            correct: prev.correct + (isCorrect ? 1 : 0),
            total: prev.total + 1,
            xp: prev.xp + (rating === 'easy' ? 20 : rating === 'good' ? 15 : rating === 'hard' ? 10 : 0)
        }));

        // Submit to Backend
        try {
            const currentState: SRSState = {
                stage: currentItemRaw.state,
                interval: 0,
                ease_factor: currentItemRaw.stability || 2.5,
                streak: currentItemRaw.srs_stage || 0
            };
            await submitReview(user.id, currentItemRaw.ku_id, rating, currentState);
        } catch (e) {
            console.error("Review failed", e);
        }

        // Advance
        if (currentIndex < queue.length - 1) {
            setIsFlipped(false);
            setFlipCount(c => c + 1);
            setTimeout(() => {
                setCurrentIndex(prev => prev + 1);
            }, 150); // Match transition duration
        } else {
            setSessionComplete(true);
        }
    };

    // --- Logic Helpers ---

    function transformToCardData(item: any): CardData {
        const ku = item.knowledge_units;
        const type = ku?.type || 'unknown';

        let frontText = ku?.character || ku?.slug?.split('/').pop() || '???';
        let backMeaning = ku?.meaning || '???';
        let backReading = '';
        let backExtra = '';

        // Type Specific Extraction
        if (type === 'kanji' && ku?.ku_kanji?.[0]) {
            const data = ku.ku_kanji[0];
            backReading = data.reading_data?.onyomi?.join(', ') || '';
            const kun = data.reading_data?.kunyomi?.join(', ');
            if (kun) backReading += (backReading ? ' | ' : '') + kun;
            backMeaning = data.meaning_data?.meanings?.join(', ') || backMeaning;
        }
        else if (type === 'vocabulary' && ku?.ku_vocabulary?.[0]) {
            const data = ku.ku_vocabulary[0];
            backReading = data.reading_primary || '';
            backMeaning = data.meaning_data?.meanings?.join(', ') || backMeaning;
        }
        else if (type === 'radical' && ku?.ku_radicals?.[0]) {
            const data = ku.ku_radicals[0];
            backMeaning = data.name || backMeaning;
            backExtra = data.meaning_story || ''; // Radicals often need story context
        }
        else if (type === 'grammar' && ku?.ku_grammar?.[0]) {
            const data = ku.ku_grammar[0];
            backMeaning = data.meaning_summary || data.title || backMeaning;
            // For grammar, structure is useful
            backExtra = typeof data.structure_json === 'string' ? data.structure_json : 'Pattern usage';
        }

        return {
            id: item.ku_id,
            type,
            frontText,
            backMeaning,
            backReading,
            backExtra,
            srsState: item.state || 'new',
            original: item
        };
    }

    // --- Loading State ---
    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_120%,rgba(244,63,94,0.1),rgba(255,255,255,0)_50%)]"></div>
                <div className="flex flex-col items-center gap-6 z-10">
                    <div className="relative">
                        <div className="w-20 h-20 rounded-3xl bg-white shadow-xl flex items-center justify-center animate-bounce">
                            <Sparkles className="text-rose-500" size={32} />
                        </div>
                        <div className="absolute -bottom-2 w-20 h-4 bg-slate-200 rounded-full blur-md opacity-50 animate-pulse"></div>
                    </div>
                    <p className="text-slate-400 font-bold tracking-widest uppercase text-xs animate-pulse">Preparing Session...</p>
                </div>
            </div>
        );
    }

    // --- Completion State ---
    if (sessionComplete) {
        const accuracy = queue.length > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
                <Confetti width={windowSize.width} height={windowSize.height} recycle={false} numberOfPieces={500} />
                <div className="max-w-md w-full bg-white rounded-[40px] p-10 shadow-2xl shadow-slate-200 text-center animate-in zoom-in-95 duration-500 relative z-10 border border-slate-100">
                    <div className="w-24 h-24 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full flex items-center justify-center text-amber-500 mb-8 shadow-inner mx-auto ring-4 ring-white">
                        <Trophy size={48} className="drop-shadow-sm" />
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 mb-2 tracking-tight">Session Complete!</h1>
                    <p className="text-slate-500 font-medium mb-10">You're making excellent progress.</p>

                    <div className="grid grid-cols-2 gap-4 mb-10">
                        <div className="p-5 bg-emerald-50 rounded-3xl border border-emerald-100/50">
                            <div className="text-emerald-600/70 font-black text-[10px] uppercase tracking-widest mb-2">ACCURACY</div>
                            <div className="text-4xl font-black text-emerald-700">{accuracy}%</div>
                        </div>
                        <div className="p-5 bg-rose-50 rounded-3xl border border-rose-100/50">
                            <div className="text-rose-600/70 font-black text-[10px] uppercase tracking-widest mb-2">XP EARNED</div>
                            <div className="text-4xl font-black text-rose-700">+{stats.xp}</div>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <Button variant="outline" className="flex-1 h-16 rounded-2xl font-bold border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700" onClick={() => router.push('/decks')}>
                            Done
                        </Button>
                        <Button className="flex-1 h-16 rounded-2xl bg-slate-900 text-white font-bold hover:bg-slate-800 shadow-xl shadow-slate-200" onClick={() => { setSessionComplete(false); setCurrentIndex(0); setIsFlipped(false); setStats({ correct: 0, total: 0, xp: 0 }); loadSession(); }}>
                            <RotateCcw className="mr-2" size={18} /> Again
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    // --- Empty State ---
    if (!cardData) {
        return (
            <div className="flex flex-col h-screen items-center justify-center space-y-6 bg-slate-50">
                <div className="w-32 h-32 rounded-full bg-slate-100 flex items-center justify-center text-slate-300">
                    <BookOpen size={48} />
                </div>
                <p className="text-slate-500 font-bold text-lg">No cards available right now.</p>
                <Button onClick={() => router.back()} className="rounded-full px-8">Return to Decks</Button>
            </div>
        );
    }

    const progress = ((currentIndex) / queue.length) * 100;

    return (
        <div className="h-[100dvh] flex flex-col bg-slate-50 overflow-hidden relative">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-rose-100/40 rounded-full blur-[100px] -mr-64 -mt-64 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-100/40 rounded-full blur-[100px] -ml-64 -mb-64 pointer-events-none"></div>

            {/* Top Bar */}
            <div className="px-6 py-4 flex items-center justify-between shrink-0 relative z-20">
                <Button size="icon" variant="ghost" className="rounded-full hover:bg-white/50 text-slate-400 hover:text-slate-700 w-12 h-12" onClick={() => router.back()}>
                    <X size={24} />
                </Button>

                {/* Progress Bar */}
                <div className="flex-1 mx-6 md:mx-12 max-w-lg">
                    <div className="h-2 bg-slate-200/60 rounded-full overflow-hidden w-full backdrop-blur-sm">
                        <div
                            className="h-full bg-rose-500 rounded-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(244,63,94,0.5)]"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-md rounded-full border border-white/50 shadow-sm text-sm font-black text-rose-500">
                    <Flame className="w-4 h-4 fill-rose-500" />
                    <span>{stats.xp}</span>
                </div>
            </div>

            {/* Card Area */}
            <div className="flex-1 w-full max-w-2xl mx-auto flex flex-col items-center justify-center p-6 min-h-0 relative z-10 perspective-1000">
                <div
                    className={cn(
                        "relative w-full h-full max-h-[600px] aspect-[4/5] md:aspect-[3/4] transition-transform duration-500 transform-style-3d cursor-pointer select-none",
                        isFlipped ? "rotate-y-180" : ""
                    )}
                    onClick={!isFlipped ? handleFlip : undefined}
                >
                    {/* --- FRONT FACE --- */}
                    <div className="absolute inset-0 backface-hidden bg-white/80 backdrop-blur-xl rounded-[48px] shadow-2xl shadow-slate-200/50 border border-white flex flex-col items-center p-8 md:p-12 hover:scale-[1.02] transition-transform duration-300">
                        {/* Tags */}
                        <div className="w-full flex justify-between items-start">
                            <span className={cn(
                                "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border",
                                cardData.type === 'kanji' ? "bg-rose-50 text-rose-500 border-rose-100" :
                                    cardData.type === 'vocabulary' ? "bg-blue-50 text-blue-500 border-blue-100" :
                                        cardData.type === 'grammar' ? "bg-slate-100 text-slate-500 border-slate-200" :
                                            "bg-amber-50 text-amber-500 border-amber-100"
                            )}>
                                {cardData.type}
                            </span>
                            {/* SRS Stage Dot */}
                            <div className={cn("w-3 h-3 rounded-full shadow-inner",
                                cardData.srsState === 'new' ? "bg-blue-400" :
                                    cardData.srsState === 'learning' ? "bg-rose-500" :
                                        cardData.srsState === 'review' ? "bg-amber-400" : "bg-emerald-500"
                            )} />
                        </div>

                        {/* Center Content */}
                        <div className="flex-1 flex flex-col items-center justify-center gap-8">
                            <h1 className={cn(
                                "font-black text-slate-800 font-jp leading-none drop-shadow-sm text-center",
                                cardData.frontText.length > 5 ? "text-4xl" : cardData.frontText.length > 2 ? "text-7xl" : "text-9xl"
                            )}>
                                {cardData.frontText}
                            </h1>
                            {cardData.frontSub && (
                                <p className="text-2xl text-slate-400 font-bold font-jp">{cardData.frontSub}</p>
                            )}
                        </div>

                        {/* Instruction */}
                        <div className="mt-auto opacity-50 animate-pulse text-slate-400 text-xs font-bold uppercase tracking-widest">
                            Tap to reveal
                        </div>
                    </div>


                    {/* --- BACK FACE --- */}
                    <div className="absolute inset-0 backface-hidden rotate-y-180 bg-slate-900 rounded-[48px] shadow-3xl shadow-slate-900/40 text-white flex flex-col p-8 md:p-12 relative overflow-hidden">
                        {/* Bg Glow */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/20 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none"></div>

                        <div className="relative z-10 flex-1 flex flex-col">
                            {/* Top row */}
                            <div className="flex items-center justify-between mb-8 opacity-60">
                                <span className="text-[10px] font-black uppercase tracking-widest">ANSWER</span>
                                <Volume2 className="w-5 h-5" />
                            </div>

                            <div className="flex-1 flex flex-col justify-center items-center gap-8 text-center">
                                {cardData.backReading && (
                                    <div className="text-3xl md:text-4xl font-bold text-rose-300 font-jp leading-relaxed">
                                        {cardData.backReading}
                                    </div>
                                )}

                                <div className="w-16 h-1 bg-white/10 rounded-full mx-auto" />

                                <div className="text-4xl md:text-5xl font-black text-white leading-tight capitalize">
                                    {cardData.backMeaning}
                                </div>

                                {cardData.backExtra && (
                                    <div className="mt-4 p-4 rounded-2xl bg-white/5 border border-white/5 text-sm md:text-base text-slate-300 font-medium">
                                        {cardData.backExtra}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="w-full max-w-2xl mx-auto p-6 pb-8 md:pb-10 relative z-20">
                {!isFlipped ? (
                    <Button
                        size="lg"
                        className="w-full h-20 rounded-[28px] bg-slate-900 text-white shadow-xl shadow-slate-300 hover:bg-slate-800 hover:scale-[1.01] hover:shadow-2xl transition-all text-xl font-bold tracking-wide"
                        onClick={handleFlip}
                    >
                        Reveal Answer
                    </Button>
                ) : (
                    <div className="grid grid-cols-4 gap-3 md:gap-4 animate-in slide-in-from-bottom-4 duration-500">
                        <SRSButton
                            label="Again"
                            sub="1m"
                            color="bg-rose-100 text-rose-600 hover:bg-rose-200 hover:scale-105 border-rose-200"
                            onClick={() => handleGrade('again')}
                        />
                        <SRSButton
                            label="Hard"
                            sub="2d"
                            color="bg-orange-100 text-orange-600 hover:bg-orange-200 hover:scale-105 border-orange-200"
                            onClick={() => handleGrade('hard')}
                        />
                        <SRSButton
                            label="Good"
                            sub="4d"
                            color="bg-amber-100 text-amber-600 hover:bg-amber-200 hover:scale-105 border-amber-200"
                            onClick={() => handleGrade('good')}
                        />
                        <SRSButton
                            label="Easy"
                            sub="7d"
                            color="bg-emerald-100 text-emerald-600 hover:bg-emerald-200 hover:scale-105 border-emerald-200"
                            onClick={() => handleGrade('easy')}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

function SRSButton({ label, sub, color, onClick }: { label: string, sub: string, color: string, onClick: () => void }) {
    return (
        <button
            className={cn(
                "h-24 rounded-[24px] flex flex-col items-center justify-center transition-all shadow-sm border active:scale-95",
                color
            )}
            onClick={onClick}
        >
            <span className="text-lg font-black">{label}</span>
            <span className="text-[10px] font-bold opacity-70 uppercase tracking-widest">{sub}</span>
        </button>
    );
}
