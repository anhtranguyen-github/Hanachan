'use client';

import { useState, useCallback, useEffect } from 'react';
import type {
    DynamicPracticeSentence,
    PracticeSessionData,
    AdaptiveFeedback,
    PronunciationAssessmentResult,
    PromptDifficulty,
} from '../types';


export interface UseSpeakingPracticeReturn {
    // Session state
    sessionId: string | null;
    sentences: DynamicPracticeSentence[];
    currentIndex: number;
    currentSentence: DynamicPracticeSentence | null;
    difficulty: PromptDifficulty;
    userLevel: number;
    isComplete: boolean;
    isLoading: boolean;
    error: string | null;

    // Adaptive feedback
    lastFeedback: AdaptiveFeedback | null;

    // Actions
    startSession: (targetDifficulty?: PromptDifficulty) => Promise<void>;
    nextSentence: () => void;
    recordAttempt: (score: number, word: string) => Promise<void>;
    endSession: () => void;

    // Progress
    progress: { completed: number; total: number };
}


export function useSpeakingPractice(): UseSpeakingPracticeReturn {
    // Session state
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [sentences, setSentences] = useState<DynamicPracticeSentence[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [difficulty, setDifficulty] = useState<PromptDifficulty>('N5');
    const [userLevel, setUserLevel] = useState(1);
    const [isComplete, setIsComplete] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Adaptive feedback
    const [lastFeedback, setLastFeedback] = useState<AdaptiveFeedback | null>(null);

    // Start a new practice session
    const startSession = useCallback(async (targetDifficulty?: PromptDifficulty) => {
        setIsLoading(true);
        setError(null);

        try {
            const params = new URLSearchParams();
            if (targetDifficulty) {
                params.append('target_difficulty', targetDifficulty);
            }

            const response = await fetch(`/api/v1/practice/session?${params}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    target_difficulty: targetDifficulty,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to create session');
            }

            const data: PracticeSessionData = await response.json();

            if (!data.success) {
                throw new Error(data.error || 'Failed to create session');
            }

            setSessionId(data.session_id || null);
            setSentences(data.sentences);
            setCurrentIndex(0);
            setDifficulty(data.difficulty);
            setUserLevel(data.user_level);
            setIsComplete(false);
            setLastFeedback(null);

        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
            console.error('Failed to start session:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Move to next sentence
    const nextSentence = useCallback(() => {
        if (currentIndex < sentences.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setLastFeedback(null);
        } else {
            setIsComplete(true);
        }
    }, [currentIndex, sentences.length]);

    // Record an attempt and get adaptive feedback
    const recordAttempt = useCallback(async (score: number, word: string) => {
        if (!sessionId) return;

        try {
            const currentSentence = sentences[currentIndex];
            if (!currentSentence) return;

            const response = await fetch(`/api/v1/practice/session/${sessionId}/record`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    session_id: sessionId,
                    sentence: currentSentence.japanese,
                    score: score,
                    word: word || currentSentence.source_word,
                }),
            });

            if (!response.ok) {
                // If API fails, calculate feedback locally
                const feedback = calculateLocalFeedback(score);
                setLastFeedback(feedback);
                return;
            }

            const data = await response.json();

            // Update state based on feedback
            if (data.feedback) {
                setLastFeedback(data.feedback);

                // If should repeat, stay on current sentence
                // If should advance, move to next
                if (!data.feedback.should_repeat) {
                    nextSentence();
                }
            } else {
                // No feedback, just move to next
                nextSentence();
            }

        } catch (err) {
            console.error('Failed to record attempt:', err);
            // Fallback: calculate feedback locally
            const feedback = calculateLocalFeedback(score);
            setLastFeedback(feedback);
        }
    }, [sessionId, currentIndex, sentences, nextSentence]);

    // End the session
    const endSession = useCallback(async () => {
        if (sessionId) {
            try {
                await fetch(`/api/v1/practice/session/${sessionId}`, {
                    method: 'DELETE',
                });
            } catch (err) {
                console.error('Failed to end session:', err);
            }
        }

        // Reset state
        setSessionId(null);
        setSentences([]);
        setCurrentIndex(0);
        setIsComplete(false);
        setLastFeedback(null);
    }, [sessionId]);

    // Computed values
    const currentSentence = sentences[currentIndex] || null;
    const progress = {
        completed: currentIndex,
        total: sentences.length,
    };

    return {
        sessionId,
        sentences,
        currentIndex,
        currentSentence,
        difficulty,
        userLevel,
        isComplete,
        isLoading,
        error,
        lastFeedback,
        startSession,
        nextSentence,
        recordAttempt,
        endSession,
        progress,
    };
}


// Local fallback for feedback calculation (when API unavailable)
function calculateLocalFeedback(score: number): AdaptiveFeedback {
    if (score < 50) {
        return {
            next_action: 'repeat',
            next_difficulty: 'N5',
            reason: 'Score too low, need more practice',
            should_repeat: true,
        };
    } else if (score < 60) {
        return {
            next_action: 'simpler',
            next_difficulty: 'N5',
            reason: 'Try a simpler sentence',
            should_repeat: true,
        };
    } else if (score < 70) {
        return {
            next_action: 'next',
            next_difficulty: 'N5',
            reason: 'Good progress, continue practicing',
            should_repeat: false,
        };
    } else if (score < 90) {
        return {
            next_action: 'advance',
            next_difficulty: 'N3',
            reason: 'Excellent! Ready for harder sentences',
            should_repeat: false,
        };
    } else {
        return {
            next_action: 'mastered',
            next_difficulty: 'N1',
            reason: 'Perfect! Moving to advanced practice',
            should_repeat: false,
        };
    }
}


// Hook for integrating pronunciation assessment with practice session
export function usePracticeWithAssessment() {
    const practice = useSpeakingPractice();
    const [assessmentResult, setAssessmentResult] = useState<PronunciationAssessmentResult | null>(null);
    const [isRecording, setIsRecording] = useState(false);

    // This would be connected to the actual pronunciation assessment hook
    // For now, it's a placeholder that shows the integration pattern

    const handleRecordComplete = useCallback(async (result: PronunciationAssessmentResult) => {
        setAssessmentResult(result);
        setIsRecording(false);

        // Record the attempt with the score
        if (practice.currentSentence) {
            await practice.recordAttempt(
                result.pronunciationScore,
                practice.currentSentence.source_word
            );
        }
    }, [practice]);

    return {
        ...practice,
        assessmentResult,
        isRecording,
        handleRecordComplete,
    };
}
