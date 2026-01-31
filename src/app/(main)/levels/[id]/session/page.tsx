'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useUser } from '@/features/auth/AuthContext';
import {
    startReviewSessionAction,
    submitReviewAnswerAction
} from '@/features/learning/review-actions';
import { ReviewCardDisplay } from '@/features/learning/components/ReviewCardDisplay';
import { ReviewSession, ReviewCard } from '@/features/learning/types/review-cards';
import { Loader2, CheckCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function LevelReviewSessionPage() {
    const { user } = useUser();
    const router = useRouter();
    const params = useParams();
    const levelId = params.id as string;

    const [session, setSession] = useState<ReviewSession | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showAnswer, setShowAnswer] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [completed, setCompleted] = useState(false);

    // Stats for the current session
    const [stats, setStats] = useState({
        scanned: 0,
        correct: 0,
        incorrect: 0
    });

    // Start session on mount
    useEffect(() => {
        if (user && levelId) {
            initSession();
        }
    }, [user, levelId]);

    async function initSession() {
        if (!user) return;

        try {
            const result = await startReviewSessionAction(user.id, {
                levelId: levelId,
                maxCards: 20
            });

            if (result.success && result.data) {
                if (result.data.cards.length === 0) {
                    setCompleted(true);
                } else {
                    setSession(result.data);
                }
            } else {
                setError(result.error || 'Failed to start session');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    const currentCard = session?.cards[session.current_index];

    const handleRate = async (rating: 'again' | 'good', userInput?: string) => {
        if (!user || !currentCard || submitting) return;

        setSubmitting(true);

        try {
            await submitReviewAnswerAction(user.id, currentCard, {
                ku_id: currentCard.ku_id,
                rating,
                user_input: userInput
            });

            // Update stats
            setStats(prev => ({
                ...prev,
                scanned: prev.scanned + 1,
                correct: rating !== 'again' ? prev.correct + 1 : prev.correct,
                incorrect: rating === 'again' ? prev.incorrect + 1 : prev.incorrect
            }));

            // Move to next card
            const nextIndex = (session?.current_index ?? 0) + 1;

            if (nextIndex >= (session?.cards.length ?? 0)) {
                setCompleted(true);
            } else {
                setSession(prev => prev ? {
                    ...prev,
                    current_index: nextIndex
                } : null);
                setShowAnswer(false);
            }
        } catch (err) {
            console.error('Error submitting answer:', err);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-black border-t-transparent animate-spin"></div>
                    <p className="text-xs font-bold uppercase tracking-widest">Loading Level Core...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center p-4">
                <div className="mn-card p-12 max-w-md w-full text-center border-2">
                    <h2 className="text-xl font-bold uppercase mb-4">Level Error</h2>
                    <p className="text-gray-600 mb-8 italic">{error}</p>
                    <button
                        onClick={() => router.push('/levels')}
                        className="mn-btn mn-btn-primary w-full py-4 text-xl"
                    >
                        ABORT SESSION
                    </button>
                </div>
            </div>
        );
    }

    if (completed) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center p-4">
                <div className="mn-card p-12 max-w-lg w-full text-center border-2">
                    <div className="text-6xl font-black border-4 border-black p-4 inline-block mb-8">OK</div>

                    <h1 className="text-4xl font-bold uppercase tracking-tighter mb-2">Level Optimized</h1>
                    <p className="text-gray-500 font-bold uppercase text-[10px] tracking-widest mb-12">Session data successfully committed</p>

                    <div className="grid grid-cols-3 gap-1 mb-12 border border-black p-1">
                        <div className="p-4 border border-black bg-white">
                            <div className="text-2xl font-black text-primary-dark">{stats.scanned}</div>
                            <div className="text-[10px] uppercase font-bold text-gray-400">Total</div>
                        </div>
                        <div className="p-4 border border-black bg-black text-white">
                            <div className="text-2xl font-black text-white">{stats.correct}</div>
                            <div className="text-[10px] uppercase font-bold text-gray-400">Correct</div>
                        </div>
                        <div className="p-4 border border-black bg-white">
                            <div className="text-2xl font-black text-primary-dark">{stats.incorrect}</div>
                            <div className="text-[10px] uppercase font-bold text-gray-400">Again</div>
                        </div>
                    </div>

                    <button
                        onClick={() => {
                            router.push('/review');
                            router.refresh();
                        }}
                        className="mn-btn mn-btn-primary py-4 w-full text-xl"
                    >
                        RETURN TO HUB
                    </button>
                </div>
            </div>
        );
    }

    if (!currentCard) return null;

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header / Progress */}
                <div className="flex justify-between items-center mb-8">
                    <button
                        onClick={() => {
                            router.push('/levels');
                            router.refresh();
                        }}
                        className="text-gray-400 font-bold hover:text-primary-dark transition"
                    >
                        Exit Level
                    </button>
                    <div className="text-primary-dark font-black">
                        {session?.current_index! + 1} <span className="text-gray-300">/</span> {session?.cards.length}
                    </div>
                </div>

                {/* Card Display */}
                <ReviewCardDisplay
                    card={currentCard}
                    mode="review"
                    onReveal={() => { }}
                    onRate={handleRate}
                />
            </div>
        </div>
    );
}
