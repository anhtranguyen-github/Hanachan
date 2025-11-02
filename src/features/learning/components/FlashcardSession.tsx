'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ArrowLeft, RotateCcw, Volume2, Loader2, Sparkles, ChevronLeft, ChevronRight, Play } from 'lucide-react';
import Link from 'next/link';
import { formatJapanese, formatMnemonic } from '@/lib/japanese';

import { submitReviewAction } from '../actions';

import { type ContentType, type ItemState, stageToLearningState } from '@/types/srs';
import { CONTENT_TYPES, LEARNING_STATES } from '@/config/design.config';

// Rating constants matching backend
const RATING = {
    AGAIN: 1,
    HARD: 2,
    GOOD: 3,
    EASY: 4,
} as const;

type Rating = typeof RATING[keyof typeof RATING];

export interface FlashcardItem {
    id?: string;
    content_id: string;
    content_type: ContentType;
    item_state: ItemState;
    srs_stage?: number;
    content: any;
}

interface FlashcardSessionProps {
    deckId: string;
    deckName: string;
    items: FlashcardItem[];
    onComplete?: () => void;
    onClose?: () => void;
}

export function FlashcardSession({ deckId, deckName, items, onComplete, onClose }: FlashcardSessionProps) {
    const router = useRouter();
    const [localItems, setLocalItems] = useState<FlashcardItem[]>(items);

    const handleClose = useCallback(() => {
        if (onClose) onClose();
        else router.push(`/decks/${deckId}`);
    }, [onClose, router, deckId]);

    const handleComplete = useCallback(() => {
        if (onComplete) onComplete();
        else router.push(`/decks/${deckId}?completed=true`);
    }, [onComplete, router, deckId]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
    const [sessionStats, setSessionStats] = useState({ again: 0, hard: 0, good: 0, easy: 0 });

    const currentCard = localItems[currentIndex];
    const uniqueItemIds = useMemo(() => new Set(items.map(i => i.content_id)), [items]);
    const totalUnique = uniqueItemIds.size;
    const [cardStartTime, setCardStartTime] = useState<number>(Date.now());

    useEffect(() => {
        setCardStartTime(Date.now());
    }, [currentIndex]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (isSubmitting) return;

            if (!isFlipped) {
                if (e.code === 'Space' || e.code === 'Enter') {
                    e.preventDefault();
                    setIsFlipped(true);
                }
            } else {
                switch (e.key) {
                    case '1':
                        handleRating(RATING.AGAIN);
                        break;
                    case '2':
                        handleRating(RATING.HARD);
                        break;
                    case '3':
                        handleRating(RATING.GOOD);
                        break;
                    case '4':
                        handleRating(RATING.EASY);
                        break;
                }
            }

            // Navigation
            if (e.key === 'ArrowLeft' && currentIndex > 0) {
                setCurrentIndex(prev => prev - 1);
                setIsFlipped(false);
            }
            if (e.key === 'ArrowRight' && currentIndex < localItems.length - 1) {
                setCurrentIndex(prev => prev + 1);
                setIsFlipped(false);
            }
            if (e.key === 'Escape') {
                handleClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isFlipped, isSubmitting, currentIndex, localItems.length]);

    const handleFlip = () => {
        setIsFlipped(!isFlipped);
    };

    const playAudio = useCallback((text: string) => {
        if (!window.speechSynthesis) return;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'ja-JP';
        window.speechSynthesis.speak(utterance);
    }, []);

    const handleRating = async (rating: Rating) => {
        if (isSubmitting || !currentCard) return;

        const durationMs = Date.now() - cardStartTime;
        setIsSubmitting(true);
        try {
            // Call Server Action to record review
            await submitReviewAction({
                contentId: currentCard.content_id,
                contentType: currentCard.content_type,
                rating,
                durationMs
            });

            // Update stats
            const statKey = rating === 1 ? 'again' : rating === 2 ? 'hard' : rating === 3 ? 'good' : 'easy';
            setSessionStats(prev => ({ ...prev, [statKey]: prev[statKey as keyof typeof prev] + 1 }));

            if (rating === RATING.AGAIN) {
                // If AGAIN, re-queue the card later in the session
                const itemToRequeue = { ...currentCard };
                setLocalItems(prev => {
                    const newItems = [...prev];
                    // Insert at least 5 slots later, or at the end
                    const targetIndex = Math.min(currentIndex + 5, newItems.length);
                    newItems.splice(targetIndex, 0, itemToRequeue);
                    return newItems;
                });

                // Move to next card immediately
                setCurrentIndex(prev => prev + 1);
                setIsFlipped(false);
            } else {
                // Mark as completed
                setCompletedIds(prev => new Set(prev).add(currentCard.content_id));

                // Move to next card or finish
                if (currentIndex < localItems.length - 1) {
                    setCurrentIndex(prev => prev + 1);
                    setIsFlipped(false);
                } else if (completedIds.size + 1 >= totalUnique) {
                    // All unique cards done
                    handleComplete();
                }
            }
        } catch (error) {
            console.error('Failed to submit review:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!currentCard) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-sakura-bg-app">
                <div className="text-center">
                    <p className="text-sakura-text-muted font-bold">No cards to review!</p>
                    <button onClick={handleClose} className="mt-4 px-6 py-3 bg-sakura-text-primary text-white rounded-xl font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" aria-label="Back to Deck Detail">
                        Back to Deck
                    </button>
                </div>
            </div>
        );
    }

    const content = currentCard.content;
    const contentType = currentCard.content_type;

    // Extract display data based on content type
    const frontDisplay = getFrontDisplay(content, contentType);
    const backDisplay = getBackDisplay(content, contentType);

    const contentDesign = CONTENT_TYPES[contentType.toLowerCase() as keyof typeof CONTENT_TYPES] || CONTENT_TYPES.vocabulary;
    const currentState = currentCard.item_state || stageToLearningState(currentCard.srs_stage || 0);

    return (
        <div className="fixed inset-0 bg-sakura-bg-app z-[100] flex flex-col font-sans min-h-dvh touch-action-manipulation">
            {/* Header */}
            <header className="flex items-center justify-between px-6 py-4 border-b border-sakura-divider bg-white">
                <button onClick={handleClose} className="flex items-center gap-2 text-sakura-text-muted hover:text-sakura-text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg" aria-label={`Exit ${deckName} session`}>
                    <ArrowLeft size={20} aria-hidden="true" />
                    <span className="text-sm font-bold uppercase tracking-widest">{deckName}</span>
                </button>

                <div className="flex items-center gap-4">
                    <div className="text-xs text-sakura-text-muted font-bold tabular-nums">
                        {currentIndex + 1} / {localItems.length}
                    </div>
                    <div className="text-xs text-sakura-text-primary px-3 py-1 bg-sakura-bg-soft rounded-full font-black">
                        {completedIds.size} / {totalUnique} DONE
                    </div>
                </div>
            </header>

            <div className="h-1 bg-sakura-divider" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round((completedIds.size / totalUnique) * 100)} aria-label="Session progress">
                <div
                    className="h-full transition-all duration-300"
                    style={{
                        width: `${(completedIds.size / totalUnique) * 100}%`,
                        backgroundColor: contentDesign.inkColor
                    }}
                />
            </div>

            {/* Card Area */}
            <main className="flex-1 flex flex-col items-center justify-center p-6 gap-8 overflow-y-auto">
                <div
                    className={cn(
                        "w-full max-w-2xl rounded-[3rem] border-2 flex flex-col items-center p-12 transition-all shadow-lg shadow-sakura-cocoa/5",
                        isSubmitting && "opacity-50 pointer-events-none"
                    )}
                    style={{
                        backgroundColor: contentDesign.pastelBg,
                        borderColor: contentDesign.inkColor
                    }}
                >
                    {/* Character Display */}
                    <div className="flex flex-col items-center gap-4 mb-8">
                        <div
                            className="text-8xl md:text-9xl font-black text-center font-jp leading-none"
                            style={{ color: contentDesign.inkColor }}
                        >
                            {frontDisplay.character}
                        </div>

                        {/* Audio Button */}
                        <button
                            onClick={(e) => { e.stopPropagation(); playAudio(frontDisplay.character); }}
                            className="w-12 h-12 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            style={{
                                backgroundColor: contentDesign.inkColor,
                                color: 'white',
                                opacity: 0.8
                            }}
                            aria-label={`Play audio for ${frontDisplay.character}`}
                        >
                            <Play size={20} fill="currentColor" className="ml-1" aria-hidden="true" />
                        </button>

                        <div
                            className="text-2xl font-black"
                            style={{ color: contentDesign.inkColor }}
                        >
                            {isFlipped ? (backDisplay.reading || frontDisplay.subtitle) : "???"}
                        </div>
                    </div>

                    <div className="w-full h-px bg-sakura-divider mb-8" />

                    {/* Example/Meaning Block (Only shown when flipped or as placeholder) */}
                    <div className="w-full text-center space-y-6">
                        <div className="text-xs font-black uppercase tracking-widest text-sakura-text-muted">Example Usage</div>

                        <div className="bg-sakura-bg-soft/50 rounded-2xl p-6 relative overflow-hidden group">
                            {isFlipped && backDisplay.examples && backDisplay.examples.length > 0 ? (
                                <div className="space-y-2 animate-in fade-in duration-500">
                                    <div className="flex items-center justify-center gap-3">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); playAudio(backDisplay.examples![0].ja || backDisplay.examples![0].jp); }}
                                            className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-sakura-text-primary hover:scale-110 transition-transform"
                                            aria-label="Play example audio"
                                        >
                                            <Play size={12} fill="currentColor" className="ml-0.5" aria-hidden="true" />
                                        </button>
                                        <div
                                            className="text-2xl font-bold font-jp"
                                            dangerouslySetInnerHTML={{ __html: formatJapanese(backDisplay.examples[0].ja || backDisplay.examples[0].jp || backDisplay.examples[0].sentence_text || '') }}
                                        />

                                    </div>
                                    <div className="text-sakura-text-muted text-lg">{backDisplay.examples[0].reading}</div>
                                </div>
                            ) : (
                                <div className="py-4 text-sakura-text-muted/30 font-bold italic">
                                    {isFlipped ? "No example available" : "Flip card to see example…"}
                                </div>
                            )}
                        </div>

                        {isFlipped ? (
                            <div className="animate-in slide-in-from-bottom-2 duration-300">
                                <div
                                    className="text-3xl font-black text-sakura-text-primary italic mt-6"
                                    dangerouslySetInnerHTML={{ __html: formatMnemonic(backDisplay.meaning || '') }}
                                />
                                {backDisplay.mnemonic && (
                                    <div
                                        className="mt-4 p-4 bg-sakura-bg-soft rounded-2xl text-sm text-sakura-text-secondary text-left"
                                        dangerouslySetInnerHTML={{ __html: formatMnemonic(backDisplay.mnemonic) }}
                                    />
                                )}

                            </div>
                        ) : (
                            <button
                                onClick={handleFlip}
                                className="mt-4 px-8 py-3 bg-sakura-bg-soft text-sakura-text-primary rounded-full font-black uppercase tracking-widest text-xs hover:bg-sakura-divider transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            >
                                Show Answer
                            </button>
                        )}
                    </div>
                </div>

                {/* Ranking Buttons */}
                {isFlipped && (
                    <div className="w-full max-w-2xl flex flex-col items-center gap-4 animate-in slide-in-from-bottom-4 duration-500">
                        <div className="text-[10px] font-black uppercase tracking-widest text-sakura-text-muted">Select Difficulty</div>
                        <div className="grid grid-cols-4 gap-4 w-full">
                            <RatingButton
                                label="Again"
                                sublabel="<1m"
                                color="bg-red-50 text-red-600 border-2 border-red-200 hover:bg-red-100"
                                onClick={() => handleRating(RATING.AGAIN)}
                                shortcut="1"
                                disabled={isSubmitting}
                            />
                            <RatingButton
                                label="Hard"
                                sublabel="Pink"
                                color="bg-pink-50 text-pink-600 border-2 border-pink-200 hover:bg-pink-100"
                                onClick={() => handleRating(RATING.HARD)}
                                shortcut="2"
                                disabled={isSubmitting}
                            />
                            <RatingButton
                                label="Medium"
                                sublabel="Yellow"
                                color="bg-amber-50 text-amber-600 border-2 border-amber-200 hover:bg-amber-100"
                                onClick={() => handleRating(RATING.GOOD)}
                                shortcut="3"
                                disabled={isSubmitting}
                            />
                            <RatingButton
                                label="Easy"
                                sublabel="Green"
                                color="bg-green-50 text-green-600 border-2 border-green-200 hover:bg-green-100"
                                onClick={() => handleRating(RATING.EASY)}
                                shortcut="4"
                                disabled={isSubmitting}
                            />
                        </div>
                    </div>
                )}

                {/* Navigation Buttons (Match user image) */}
                <div className="w-full max-w-md flex items-center justify-center gap-4 py-4">
                    <button
                        onClick={() => { setCurrentIndex(prev => Math.max(0, prev - 1)); setIsFlipped(false); }}
                        disabled={currentIndex === 0}
                        className="flex-1 flex items-center justify-center gap-2 py-4 px-6 min-h-[44px] font-black uppercase tracking-widest rounded-3xl border transition-all disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        style={{
                            backgroundColor: `${contentDesign.inkColor}10`,
                            color: contentDesign.inkColor,
                            borderColor: `${contentDesign.inkColor}20`
                        }}
                        aria-label="Previous card"
                    >
                        <ChevronLeft size={20} aria-hidden="true" />
                        Previous
                    </button>
                    <button
                        onClick={() => {
                            if (!isFlipped) setIsFlipped(true);
                            else {
                                if (currentIndex < localItems.length - 1) {
                                    setCurrentIndex(prev => prev + 1);
                                    setIsFlipped(false);
                                }
                            }
                        }}
                        className="flex-1 flex items-center justify-center gap-2 py-4 px-6 min-h-[44px] font-black uppercase tracking-widest rounded-3xl border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        style={{
                            backgroundColor: contentDesign.inkColor,
                            color: 'white',
                            borderColor: contentDesign.inkColor
                        }}
                        aria-label={!isFlipped ? "Show answer" : "Next card"}
                    >
                        {!isFlipped ? "Show" : "Next"}
                        <ChevronRight size={20} aria-hidden="true" />
                    </button>
                </div>
            </main>
        </div>
    );
}

function RatingButton({
    label,
    sublabel,
    color,
    onClick,
    shortcut,
    disabled
}: {
    label: string;
    sublabel: string;
    color: string;
    onClick: () => void;
    shortcut: string;
    disabled?: boolean;
}) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            aria-label={`${label} difficulty rating`}
            className={cn(
                "py-3 min-h-[44px] rounded-2xl font-black uppercase tracking-wider transition-all active:scale-95 disabled:opacity-50 flex flex-col items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                color
            )}
        >
            <div className="text-xs">{label}</div>
            <div className="text-[9px] opacity-60 font-bold">{sublabel}</div>
            <div className="text-[8px] opacity-40 mt-1" aria-hidden="true">({shortcut})</div>
        </button>
    );
}

// Helper functions to extract display data
function getFrontDisplay(content: any, type: string) {
    const t = type.toLowerCase();
    if (t === 'radical') {
        return {
            character: content.character || content.name,
            subtitle: null,
        };
    }
    if (t === 'kanji') {
        return {
            character: content.character,
            subtitle: null,
        };
    }
    if (t === 'vocabulary') {
        return {
            character: content.character,
            subtitle: null,
        };
    }
    if (t === 'grammar') {
        return {
            character: content.title || content.slug,
            subtitle: content.meanings?.[0] || null,
        };
    }
    return { character: '?', subtitle: null };
}

function getBackDisplay(content: any, type: string) {
    const t = type.toLowerCase();
    if (t === 'radical') {
        return {
            meaning: content.meaning,
            reading: null,
            mnemonic: content.mnemonic,
            examples: null,
        };
    }
    if (t === 'kanji') {
        const meanings = content.meanings?.primary || [content.meanings?.primary];
        const readings = [
            ...(content.readings?.onyomi || []),
            ...(content.readings?.kunyomi || []),
        ].filter(Boolean);
        return {
            meaning: Array.isArray(meanings) ? meanings.join(', ') : (meanings || 'Unknown'),
            reading: readings.join('、'),
            mnemonic: content.meanings?.mnemonic,
            examples: null,
        };
    }
    if (t === 'vocabulary') {
        const meanings = content.meanings?.primary || [];
        return {
            meaning: Array.isArray(meanings) ? meanings.join(', ') : (meanings || 'Unknown'),
            reading: content.readings?.primary,
            mnemonic: content.meanings?.explanation,
            examples: content.context_sentences || [],
        };
    }
    if (t === 'grammar') {
        return {
            meaning: content.meanings?.join(', ') || content.title,
            reading: null,
            mnemonic: content.about?.text || content.details?.text,
            examples: content.examples || [],
        };
    }
    return { meaning: '?', reading: null, mnemonic: null, examples: null };
}
