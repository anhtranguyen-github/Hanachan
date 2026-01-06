'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/ui/components/ui/button';
import { ArrowLeft, Volume2, Trophy, RotateCcw, Loader2, X, Check, Flame } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { fetchDueItems, fetchNewItems, submitReview } from '@/features/srs/service';
import { Rating, SRSState } from '@/features/srs/algorithm';
import { cn } from '@/lib/utils';
import { useUser } from '@/features/auth/AuthContext';
import Confetti from 'react-confetti'; // We'll need to install this or simulate it. 
// Simulating Confetti for now via tool call if I could, but let's stick to CSS/Mock for this turn or just omit if pkg missing.
// I will simulate a "Congratulations" view nicely without extra deps if possible.

export default function StudyPage() {
    const router = useRouter();
    const params = useParams<{ deckId: string }>();
    const { user } = useUser();

    // State
    const [queue, setQueue] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [sessionComplete, setSessionComplete] = useState(false);
    const [stats, setStats] = useState({ correct: 0, total: 0, xp: 0 });

    useEffect(() => {
        if (user) {
            loadSession();
        }
    }, [params?.deckId, user]);

    const loadSession = async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            let items: any[] = [];

            if (params?.deckId === 'review-all') {
                // Fetch ALL due items regardless of deck
                items = await fetchDueItems(user.id);
            } else {
                items = await fetchDueItems(user.id, params?.deckId);
                if (!items || items.length === 0) {
                    items = await fetchNewItems(user.id, params?.deckId, 10);
                }
            }

            setQueue(items || []);
        } catch (error) {
            console.error("Failed to load session", error);
        } finally {
            setIsLoading(false);
        }
    };

    const currentItem = queue[currentIndex];

    // Card Content Resolution
    const ku = currentItem?.knowledge_units;
    const frontText = ku?.character || ku?.slug?.split('/').pop();
    const type = ku?.type;

    let backMeaning = ku?.meaning;
    let backReading = "";

    if (ku?.ku_kanji?.[0]) {
        backMeaning = ku.ku_kanji[0].meaning_data?.meanings?.join(', ') || backMeaning;
        backReading = ku.ku_kanji[0].reading_data?.onyomi?.join(', ');
    } else if (ku?.ku_vocabulary?.[0]) {
        backMeaning = ku.ku_vocabulary[0].meaning_data?.meanings?.join(', ') || backMeaning;
        backReading = ku.ku_vocabulary[0].reading_primary;
        // Maybe join sentence?
    } else if (ku?.ku_radicals?.[0]) {
        backMeaning = ku.ku_radicals[0].name;
    }

    const handleFlip = () => {
        setIsFlipped(true);
    };

    const handleGrade = async (rating: Rating) => {
        if (!currentItem) return;

        // Optimistic stats
        const isCorrect = rating !== 'again';
        setStats(prev => ({
            correct: prev.correct + (isCorrect ? 1 : 0),
            total: prev.total + 1,
            xp: prev.xp + (rating === 'easy' ? 20 : rating === 'good' ? 15 : rating === 'hard' ? 10 : 0)
        }));

        // Submit logic
        try {
            const currentState: SRSState = {
                stage: currentItem.state,
                interval: 0,
                ease_factor: currentItem.stability || 2.5,
                streak: currentItem.srs_stage || 0
            };
            await submitReview(user.id, currentItem.ku_id, rating, currentState);
        } catch (e) {
            console.error("Review failed", e);
        }

        // Advance
        if (currentIndex < queue.length - 1) {
            setIsFlipped(false);
            // Small delay for flip animation reset? 
            // Better to transition: 
            setTimeout(() => {
                setCurrentIndex(prev => prev + 1);
            }, 150);
        } else {
            setSessionComplete(true);
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="animate-spin text-rose-500" size={48} />
                    <p className="text-slate-400 font-bold animate-pulse">Loading your deck...</p>
                </div>
            </div>
        );
    }

    if (sessionComplete) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-[32px] p-8 shadow-xl shadow-slate-200 text-center animate-in zoom-in-95 duration-500">
                    <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-500 mb-6 shadow-sm mx-auto">
                        <Trophy size={48} />
                    </div>
                    <h1 className="text-3xl font-black text-slate-800 mb-2">Session Complete!</h1>
                    <p className="text-slate-500 font-medium mb-8">Great job! You made progress.</p>

                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                            <div className="text-emerald-600 font-bold text-xs uppercase tracking-wider mb-1">Accuracy</div>
                            <div className="text-3xl font-black text-emerald-700">
                                {queue.length > 0 ? Math.round((stats.correct / stats.total) * 100) : 0}%
                            </div>
                        </div>
                        <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100">
                            <div className="text-rose-600 font-bold text-xs uppercase tracking-wider mb-1">XP Earned</div>
                            <div className="text-3xl font-black text-rose-700">+{stats.xp}</div>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <Button variant="outline" className="flex-1 h-14 rounded-xl font-bold border-slate-200 text-slate-500" onClick={() => router.push('/decks')}>
                            Done
                        </Button>
                        <Button className="flex-1 h-14 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800" onClick={() => { setSessionComplete(false); setCurrentIndex(0); setIsFlipped(false); setStats({ correct: 0, total: 0, xp: 0 }); loadSession(); }}>
                            <RotateCcw className="mr-2" size={18} /> Keep Going
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    if (!currentItem) {
        return (
            <div className="flex flex-col h-screen items-center justify-center space-y-4">
                <p className="text-slate-500 font-bold">No cards available for this session.</p>
                <Button onClick={() => router.back()}>Return to Decks</Button>
            </div>
        );
    }

    // Progress
    const progress = ((currentIndex) / queue.length) * 100;

    return (
        <div className="h-[calc(100vh-2rem)] flex flex-col items-center justify-between py-2 md:py-6 px-4 overflow-hidden max-w-5xl mx-auto">

            {/* Top Bar */}
            <div className="w-full flex items-center justify-between mb-4 h-12 shrink-0">
                <Button size="icon" variant="ghost" className="rounded-full hover:bg-slate-200" onClick={() => router.back()}>
                    <X className="text-slate-500" />
                </Button>

                {/* Progress Bar Container */}
                <div className="flex-1 mx-4 md:mx-8 h-3 bg-slate-200 rounded-full overflow-hidden relative">
                    <div
                        className="h-full bg-rose-500 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm text-sm font-bold text-slate-600">
                    <Flame className="text-orange-500 w-4 h-4 fill-orange-500" />
                    <span>{stats.xp} XP</span>
                </div>
            </div>

            {/* Main Interactive Area */}
            <div className="flex-1 w-full max-w-lg flex flex-col items-center justify-center perspective-1000 min-h-0 my-4">

                {/* 3D Flip Container */}
                <div
                    className={cn(
                        "relative w-full h-full max-h-[500px] aspect-[3/4] md:aspect-[4/3] transition-all duration-500 transform-style-3d cursor-pointer",
                        isFlipped ? "rotate-y-180" : ""
                    )}
                    onClick={!isFlipped ? handleFlip : undefined}
                >
                    {/* Front Face */}
                    <div className="absolute inset-0 w-full h-full backface-hidden bg-white rounded-[32px] shadow-xl shadow-slate-200 border border-slate-100 flex flex-col items-center justify-center p-8 group hover:scale-[1.01] transition-transform">
                        <div className="absolute top-6 left-6">
                            <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">
                                {type}
                            </span>
                        </div>

                        <div className="flex-1 flex items-center justify-center">
                            <h1 className="text-6xl md:text-8xl font-black text-slate-800 font-jp leading-tight">
                                {frontText}
                            </h1>
                        </div>

                        <p className="text-slate-300 font-bold text-xs uppercase tracking-widest mt-auto animate-pulse">
                            Tap to flip
                        </p>
                    </div>

                    {/* Back Face */}
                    <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 bg-slate-900 rounded-[32px] shadow-2xl shadow-slate-400 flex flex-col items-center justify-center p-8 text-white">
                        <div className="flex-1 flex flex-col items-center justify-center space-y-6">
                            {backReading && (
                                <div className="text-2xl md:text-3xl font-bold text-rose-300 font-jp text-center">
                                    {backReading}
                                </div>
                            )}
                            <hr className="w-12 border-slate-700 opacity-50" />
                            <div className="text-3xl md:text-4xl font-black text-white text-center capitalize leading-tight">
                                {backMeaning}
                            </div>
                        </div>

                        {/* Audio Button (Mock) */}
                        <button className="mt-auto w-12 h-12 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all text-white" onClick={(e) => { e.stopPropagation(); /* play audio */ }}>
                            <Volume2 size={20} />
                        </button>
                    </div>
                </div>

            </div>

            {/* Controls (Bottom Fixed) */}
            <div className="w-full max-w-lg h-24 shrink-0 flex items-end justify-center">
                {!isFlipped ? (
                    <Button
                        size="lg"
                        className="w-full h-16 rounded-2xl bg-slate-900 text-white font-bold text-lg shadow-lg shadow-slate-300 hover:bg-slate-800 hover:scale-[1.01] transition-all mb-2"
                        onClick={handleFlip}
                    >
                        Check Answer
                    </Button>
                ) : (
                    <div className="grid grid-cols-4 gap-3 w-full animate-in slide-in-from-bottom-2 duration-300">
                        <SRSButton
                            label="Again"
                            sub="1m"
                            color="bg-rose-100 text-rose-700 hover:bg-rose-200 border-rose-200"
                            onClick={() => handleGrade('again')}
                        />
                        <SRSButton
                            label="Hard"
                            sub="2d"
                            color="bg-orange-100 text-orange-700 hover:bg-orange-200 border-orange-200"
                            onClick={() => handleGrade('hard')}
                        />
                        <SRSButton
                            label="Good"
                            sub="4d"
                            color="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-emerald-200"
                            onClick={() => handleGrade('good')}
                        />
                        <SRSButton
                            label="Easy"
                            sub="7d"
                            color="bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200"
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
                "h-20 rounded-2xl border-b-[3px] flex flex-col items-center justify-center transition-all active:border-b-0 active:translate-y-[3px]",
                color
            )}
            onClick={onClick}
        >
            <span className="text-base font-black">{label}</span>
            <span className="text-[10px] font-bold opacity-60 uppercase">{sub}</span>
        </button>
    );
}
