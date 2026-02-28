'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
    ChevronRight,
    ChevronLeft,
    Clock,
    CheckCircle2,
    XCircle,
    BookOpen,
    Loader2,
    AlertCircle,
    Eye,
    EyeOff,
    SkipForward,
    Trophy,
    Target,
} from 'lucide-react';
import { clsx } from 'clsx';
import { getReadingSession, startReadingSession, submitAnswer, completeReadingSession } from '@/features/reading/actions';
import type { ReadingSession, ReadingExercise, ReadingQuestion, AnswerResult } from '@/features/reading/types';
import { TOPIC_LABELS, TOPIC_EMOJIS } from '@/features/reading/types';

type SessionPhase = 'loading' | 'intro' | 'reading' | 'questions' | 'exercise_result' | 'session_complete';

export default function ReadingSessionPage() {
    const router = useRouter();
    const params = useParams();
    const sessionId = params.id as string;

    const [session, setSession] = useState<ReadingSession | null>(null);
    const [phase, setPhase] = useState<SessionPhase>('loading');
    const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [answerResult, setAnswerResult] = useState<AnswerResult | null>(null);
    const [showTranslation, setShowTranslation] = useState(false);
    const [showFurigana, setShowFurigana] = useState(true);
    const [exerciseAnswers, setExerciseAnswers] = useState<AnswerResult[]>([]);
    const [sessionScore, setSessionScore] = useState<{ score: number; correct_answers: number; total_exercises: number } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    // Timer
    const startTimeRef = useRef<number>(Date.now());
    const questionStartTimeRef = useRef<number>(Date.now());
    const [elapsedSeconds, setElapsedSeconds] = useState(0);

    useEffect(() => {
        loadSession();
    }, [sessionId]);

    useEffect(() => {
        if (phase === 'reading' || phase === 'questions') {
            const interval = setInterval(() => {
                setElapsedSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000));
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [phase]);

    const loadSession = async () => {
        try {
            const data = await getReadingSession(sessionId);
            setSession(data);
            if (data.status === 'pending') {
                setPhase('intro');
            } else if (data.status === 'active') {
                // Find current exercise
                const activeIdx = data.exercises?.findIndex(e => e.status === 'active') ?? 0;
                setCurrentExerciseIndex(Math.max(0, activeIdx));
                startTimeRef.current = Date.now();
                setPhase('reading');
            } else if (data.status === 'completed') {
                setPhase('session_complete');
            }
        } catch (err: any) {
            setError(err.message || 'Failed to load session');
            setPhase('loading');
        }
    };

    const handleStartSession = async () => {
        try {
            await startReadingSession(sessionId);
            startTimeRef.current = Date.now();
            setPhase('reading');
        } catch (err: any) {
            setError(err.message || 'Failed to start session');
        }
    };

    const handleStartQuestions = () => {
        questionStartTimeRef.current = Date.now();
        setCurrentQuestionIndex(0);
        setSelectedAnswer(null);
        setAnswerResult(null);
        setExerciseAnswers([]);
        setPhase('questions');
    };

    const handleSelectAnswer = (answer: string) => {
        if (answerResult) return; // Already answered
        setSelectedAnswer(answer);
    };

    const handleSubmitAnswer = async () => {
        if (!selectedAnswer || !session?.exercises) return;

        const exercise = session.exercises[currentExerciseIndex];
        const timeSpent = Math.floor((Date.now() - questionStartTimeRef.current) / 1000);

        try {
            setSubmitting(true);
            const result = await submitAnswer(
                exercise.id,
                currentQuestionIndex,
                selectedAnswer,
                timeSpent
            );
            setAnswerResult(result);
            setExerciseAnswers(prev => [...prev, result]);
        } catch (err: any) {
            setError(err.message || 'Failed to submit answer');
        } finally {
            setSubmitting(false);
        }
    };

    const handleNextQuestion = () => {
        if (!session?.exercises) return;
        const exercise = session.exercises[currentExerciseIndex];
        const questions = exercise.questions;

        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
            setSelectedAnswer(null);
            setAnswerResult(null);
            questionStartTimeRef.current = Date.now();
        } else {
            // Exercise complete
            setPhase('exercise_result');
        }
    };

    const handleNextExercise = async () => {
        if (!session?.exercises) return;

        if (currentExerciseIndex < session.exercises.length - 1) {
            setCurrentExerciseIndex(prev => prev + 1);
            setCurrentQuestionIndex(0);
            setSelectedAnswer(null);
            setAnswerResult(null);
            setExerciseAnswers([]);
            setShowTranslation(false);
            setPhase('reading');
        } else {
            // Session complete
            try {
                const totalTime = Math.floor((Date.now() - startTimeRef.current) / 1000);
                const result = await completeReadingSession(sessionId, totalTime);
                setSessionScore(result);
                setPhase('session_complete');
            } catch (err: any) {
                setError(err.message || 'Failed to complete session');
            }
        }
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const currentExercise = session?.exercises?.[currentExerciseIndex];
    const currentQuestion = currentExercise?.questions?.[currentQuestionIndex];
    const totalExercises = session?.exercises?.length || 0;
    const totalQuestions = currentExercise?.questions?.length || 0;

    // ─── Loading ──────────────────────────────────────────────────────────────
    if (phase === 'loading') {
        return (
            <div className="h-full flex items-center justify-center">
                {error ? (
                    <div className="flex flex-col items-center gap-3 text-center">
                        <AlertCircle size={32} className="text-red-400" />
                        <p className="text-[#3E4A61] font-black">{error}</p>
                        <button onClick={() => router.push('/reading')} className="text-[#3A6EA5] text-sm font-black">
                            ← Back to Reading
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 size={32} className="animate-spin text-[#A2D2FF]" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#CBD5E0]">Loading session...</p>
                    </div>
                )}
            </div>
        );
    }

    // ─── Intro ────────────────────────────────────────────────────────────────
    if (phase === 'intro' && session) {
        return (
            <div className="max-w-2xl mx-auto space-y-4 animate-page-entrance">
                <div className="glass-card p-6 sm:p-8 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#A2D2FF]/40 to-transparent" />
                    <div className="w-16 h-16 bg-gradient-to-br from-[#A2D2FF] to-[#7BB8F0] rounded-2xl flex items-center justify-center text-white font-black text-3xl mx-auto mb-4 shadow-lg">
                        読
                    </div>
                    <h1 className="text-2xl font-black text-[#3E4A61] tracking-tighter mb-2">Reading Session</h1>
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#CBD5E0] mb-6">
                        AI-Generated • Personalized for your level
                    </p>

                    <div className="grid grid-cols-3 gap-3 mb-6">
                        {[
                            { label: 'Exercises', value: session.total_exercises, icon: BookOpen },
                            { label: 'Time Limit', value: `${session.config_snapshot?.time_limit_minutes || 15}m`, icon: Clock },
                            { label: 'Difficulty', value: session.config_snapshot?.difficulty_level || 'adaptive', icon: Target },
                        ].map((s) => (
                            <div key={s.label} className="p-3 bg-[#F7FAFC] rounded-2xl border border-border/20">
                                <s.icon size={16} className="mx-auto mb-1 text-[#A2D2FF]" />
                                <div className="text-base font-black text-[#3E4A61] capitalize">{s.value}</div>
                                <div className="text-[8px] font-black uppercase tracking-widest text-[#A0AEC0]">{s.label}</div>
                            </div>
                        ))}
                    </div>

                    {/* Exercise topics preview */}
                    {session.exercises && session.exercises.length > 0 && (
                        <div className="mb-6">
                            <p className="text-[9px] font-black uppercase tracking-widest text-[#CBD5E0] mb-2">Topics in this session</p>
                            <div className="flex flex-wrap gap-2 justify-center">
                                {session.exercises.map((ex, i) => (
                                    <span key={i} className="flex items-center gap-1 px-2 py-1 bg-[#A2D2FF]/10 border border-[#A2D2FF]/20 rounded-full text-[9px] font-black text-[#3A6EA5]">
                                        {TOPIC_EMOJIS[ex.topic] || '📖'} {TOPIC_LABELS[ex.topic] || ex.topic}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    <button
                        onClick={handleStartSession}
                        className="w-full py-3.5 bg-gradient-to-r from-[#A2D2FF] to-[#7BB8F0] text-white font-black rounded-2xl shadow-lg shadow-[#A2D2FF]/30 hover:shadow-[#A2D2FF]/50 hover:scale-[1.01] transition-all"
                    >
                        Begin Reading →
                    </button>
                </div>
            </div>
        );
    }

    // ─── Reading Phase ────────────────────────────────────────────────────────
    if (phase === 'reading' && currentExercise) {
        return (
            <div className="max-w-3xl mx-auto space-y-4 animate-page-entrance">
                {/* Progress Bar */}
                <div className="flex items-center gap-3">
                    <div className="flex-1 h-1.5 bg-[#F7FAFC] rounded-full overflow-hidden border border-border/10">
                        <div
                            className="h-full bg-gradient-to-r from-[#A2D2FF] to-[#7BB8F0] rounded-full transition-all duration-500"
                            style={{ width: `${((currentExerciseIndex) / totalExercises) * 100}%` }}
                        />
                    </div>
                    <span className="text-[9px] font-black text-[#A0AEC0] uppercase tracking-widest shrink-0">
                        {currentExerciseIndex + 1}/{totalExercises}
                    </span>
                    <div className="flex items-center gap-1 text-[#A0AEC0]">
                        <Clock size={10} />
                        <span className="text-[9px] font-black">{formatTime(elapsedSeconds)}</span>
                    </div>
                </div>

                {/* Exercise Card */}
                <div className="glass-card p-5 sm:p-7 relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#A2D2FF]/40 to-transparent" />

                    {/* Exercise Header */}
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-lg">{TOPIC_EMOJIS[currentExercise.topic] || '📖'}</span>
                                <span className="text-[9px] font-black uppercase tracking-widest text-[#A0AEC0]">
                                    {TOPIC_LABELS[currentExercise.topic] || currentExercise.topic}
                                </span>
                                {currentExercise.jlpt_level && (
                                    <span className="px-1.5 py-0.5 bg-[#A2D2FF]/10 border border-[#A2D2FF]/20 rounded-full text-[8px] font-black text-[#3A6EA5]">
                                        N{currentExercise.jlpt_level}
                                    </span>
                                )}
                            </div>
                            {currentExercise.passage_title && (
                                <h2 className="text-lg font-black text-[#3E4A61] tracking-tight">{currentExercise.passage_title}</h2>
                            )}
                        </div>
                        <div className="flex gap-2">
                            {currentExercise.passage_furigana && (
                                <button
                                    onClick={() => setShowFurigana(!showFurigana)}
                                    className="flex items-center gap-1 px-2 py-1 bg-[#F7FAFC] border border-border/20 rounded-xl text-[9px] font-black text-[#A0AEC0] hover:text-[#3A6EA5] transition-colors"
                                >
                                    {showFurigana ? <EyeOff size={10} /> : <Eye size={10} />}
                                    ふりがな
                                </button>
                            )}
                            {currentExercise.passage_en && (
                                <button
                                    onClick={() => setShowTranslation(!showTranslation)}
                                    className="flex items-center gap-1 px-2 py-1 bg-[#F7FAFC] border border-border/20 rounded-xl text-[9px] font-black text-[#A0AEC0] hover:text-[#3A6EA5] transition-colors"
                                >
                                    {showTranslation ? <EyeOff size={10} /> : <Eye size={10} />}
                                    EN
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Passage */}
                    <div className="p-4 bg-[#F7FAFC] rounded-2xl border border-border/20 mb-4">
                        {showFurigana && currentExercise.passage_furigana ? (
                            <div
                                className="text-lg leading-loose text-[#3E4A61] font-medium"
                                dangerouslySetInnerHTML={{ __html: currentExercise.passage_furigana }}
                            />
                        ) : (
                            <p className="text-lg leading-loose text-[#3E4A61] font-medium">
                                {currentExercise.passage_ja}
                            </p>
                        )}
                    </div>

                    {/* Translation */}
                    {showTranslation && currentExercise.passage_en && (
                        <div className="p-3 bg-[#A2D2FF]/5 border border-[#A2D2FF]/20 rounded-2xl mb-4">
                            <p className="text-[11px] text-[#3A6EA5] leading-relaxed italic">
                                {currentExercise.passage_en}
                            </p>
                        </div>
                    )}

                    {/* Word count */}
                    <div className="flex items-center justify-between text-[9px] text-[#CBD5E0] font-black uppercase tracking-widest">
                        <span>{currentExercise.word_count} characters</span>
                        <span>{currentExercise.questions.length} questions</span>
                    </div>
                </div>

                {/* Action */}
                <button
                    onClick={handleStartQuestions}
                    className="w-full py-3.5 bg-gradient-to-r from-[#A2D2FF] to-[#7BB8F0] text-white font-black rounded-2xl shadow-lg shadow-[#A2D2FF]/30 hover:shadow-[#A2D2FF]/50 hover:scale-[1.01] transition-all flex items-center justify-center gap-2"
                >
                    Answer Questions <ChevronRight size={16} />
                </button>
            </div>
        );
    }

    // ─── Questions Phase ──────────────────────────────────────────────────────
    if (phase === 'questions' && currentExercise && currentQuestion) {
        return (
            <div className="max-w-2xl mx-auto space-y-4 animate-page-entrance">
                {/* Progress */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setPhase('reading')}
                        className="text-[9px] font-black text-[#A0AEC0] hover:text-[#3A6EA5] uppercase tracking-widest transition-colors flex items-center gap-1"
                    >
                        <ChevronLeft size={10} /> Passage
                    </button>
                    <div className="flex-1 h-1.5 bg-[#F7FAFC] rounded-full overflow-hidden border border-border/10">
                        <div
                            className="h-full bg-gradient-to-r from-[#CDB4DB] to-[#B09AC5] rounded-full transition-all duration-500"
                            style={{ width: `${((currentQuestionIndex) / totalQuestions) * 100}%` }}
                        />
                    </div>
                    <span className="text-[9px] font-black text-[#A0AEC0] uppercase tracking-widest shrink-0">
                        Q{currentQuestionIndex + 1}/{totalQuestions}
                    </span>
                </div>

                {/* Question Card */}
                <div className="glass-card p-5 sm:p-7 relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#CDB4DB]/40 to-transparent" />

                    {/* Question type badge */}
                    <div className="flex items-center gap-2 mb-4">
                        <span className={clsx(
                            "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest",
                            currentQuestion.type === 'multiple_choice' && "bg-[#A2D2FF]/10 text-[#3A6EA5]",
                            currentQuestion.type === 'true_false' && "bg-[#B7E4C7]/20 text-[#48BB78]",
                            currentQuestion.type === 'fill_blank' && "bg-[#FFD6A5]/20 text-[#D4A017]",
                            currentQuestion.type === 'comprehension' && "bg-[#CDB4DB]/20 text-[#9B7EC8]",
                        )}>
                            {currentQuestion.type.replace('_', ' ')}
                        </span>
                    </div>

                    {/* Question text */}
                    <div className="mb-5">
                        <p className="text-lg font-black text-[#3E4A61] leading-relaxed mb-2">
                            {currentQuestion.question_ja}
                        </p>
                        <p className="text-[11px] text-[#A0AEC0] italic">
                            {currentQuestion.question_en}
                        </p>
                    </div>

                    {/* Options */}
                    {currentQuestion.options ? (
                        <div className="space-y-2 mb-4">
                            {currentQuestion.options.map((option, i) => {
                                const isSelected = selectedAnswer === option;
                                const isCorrect = answerResult && option === answerResult.correct_answer;
                                const isWrong = answerResult && isSelected && !answerResult.is_correct;

                                return (
                                    <button
                                        key={i}
                                        onClick={() => handleSelectAnswer(option)}
                                        disabled={!!answerResult}
                                        className={clsx(
                                            "w-full text-left p-3.5 rounded-2xl border-2 transition-all duration-200 text-sm font-black",
                                            !answerResult && !isSelected && "border-border/20 bg-[#F7FAFC] hover:border-[#A2D2FF]/40 hover:bg-[#A2D2FF]/5",
                                            !answerResult && isSelected && "border-[#A2D2FF] bg-[#A2D2FF]/10 text-[#3A6EA5]",
                                            isCorrect && "border-[#48BB78] bg-[#48BB78]/10 text-[#48BB78]",
                                            isWrong && "border-[#FF6B6B] bg-[#FF6B6B]/10 text-[#FF6B6B]",
                                        )}
                                    >
                                        <span className="flex items-center gap-2">
                                            <span className="w-5 h-5 rounded-full border-2 flex items-center justify-center text-[9px] shrink-0"
                                                style={{
                                                    borderColor: isCorrect ? '#48BB78' : isWrong ? '#FF6B6B' : isSelected ? '#A2D2FF' : '#CBD5E0',
                                                    backgroundColor: isCorrect ? '#48BB78' : isWrong ? '#FF6B6B' : isSelected ? '#A2D2FF' : 'transparent',
                                                    color: (isCorrect || isWrong || isSelected) ? 'white' : '#CBD5E0',
                                                }}
                                            >
                                                {String.fromCharCode(65 + i)}
                                            </span>
                                            {option}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    ) : (
                        // Text input for comprehension/fill_blank
                        <div className="mb-4">
                            <input
                                type="text"
                                value={selectedAnswer || ''}
                                onChange={(e) => !answerResult && setSelectedAnswer(e.target.value)}
                                placeholder="Type your answer..."
                                disabled={!!answerResult}
                                className="w-full p-3 border-2 border-border/20 rounded-2xl text-sm font-medium text-[#3E4A61] bg-[#F7FAFC] focus:outline-none focus:border-[#A2D2FF] transition-colors"
                            />
                        </div>
                    )}

                    {/* Answer Result */}
                    {answerResult && (
                        <div className={clsx(
                            "p-3 rounded-2xl border mb-4",
                            answerResult.is_correct ? "bg-[#48BB78]/10 border-[#48BB78]/30" : "bg-[#FF6B6B]/10 border-[#FF6B6B]/30"
                        )}>
                            <div className="flex items-center gap-2 mb-1">
                                {answerResult.is_correct ? (
                                    <CheckCircle2 size={14} className="text-[#48BB78]" />
                                ) : (
                                    <XCircle size={14} className="text-[#FF6B6B]" />
                                )}
                                <span className={clsx(
                                    "text-[10px] font-black uppercase tracking-widest",
                                    answerResult.is_correct ? "text-[#48BB78]" : "text-[#FF6B6B]"
                                )}>
                                    {answerResult.is_correct ? 'Correct!' : `Incorrect — ${answerResult.correct_answer}`}
                                </span>
                            </div>
                            {answerResult.explanation && (
                                <p className="text-[10px] text-[#3E4A61]/70 leading-relaxed">{answerResult.explanation}</p>
                            )}
                        </div>
                    )}

                    {/* Actions */}
                    {!answerResult ? (
                        <button
                            onClick={handleSubmitAnswer}
                            disabled={!selectedAnswer || submitting}
                            className="w-full py-3 bg-gradient-to-r from-[#CDB4DB] to-[#B09AC5] text-white font-black rounded-2xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01] transition-all flex items-center justify-center gap-2"
                        >
                            {submitting ? <Loader2 size={14} className="animate-spin" /> : null}
                            Submit Answer
                        </button>
                    ) : (
                        <button
                            onClick={handleNextQuestion}
                            className="w-full py-3 bg-gradient-to-r from-[#A2D2FF] to-[#7BB8F0] text-white font-black rounded-2xl shadow-lg hover:scale-[1.01] transition-all flex items-center justify-center gap-2"
                        >
                            {currentQuestionIndex < totalQuestions - 1 ? (
                                <>Next Question <ChevronRight size={14} /></>
                            ) : (
                                <>See Results <Trophy size={14} /></>
                            )}
                        </button>
                    )}
                </div>
            </div>
        );
    }

    // ─── Exercise Result ──────────────────────────────────────────────────────
    if (phase === 'exercise_result' && currentExercise) {
        const correct = exerciseAnswers.filter(a => a.is_correct).length;
        const total = exerciseAnswers.length;
        const score = Math.round((correct / Math.max(total, 1)) * 100);
        const isLast = currentExerciseIndex >= totalExercises - 1;

        return (
            <div className="max-w-2xl mx-auto space-y-4 animate-page-entrance">
                <div className="glass-card p-6 sm:p-8 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#A2D2FF]/40 to-transparent" />

                    <div className={clsx(
                        "w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white",
                        score >= 80 ? "bg-gradient-to-br from-[#48BB78] to-[#38A169]" :
                            score >= 60 ? "bg-gradient-to-br from-[#A2D2FF] to-[#7BB8F0]" :
                                "bg-gradient-to-br from-[#F4ACB7] to-[#D88C9A]"
                    )}>
                        {score >= 80 ? <Trophy size={28} /> : <Target size={28} />}
                    </div>

                    <h2 className="text-2xl font-black text-[#3E4A61] tracking-tighter mb-1">
                        Exercise {currentExerciseIndex + 1} Complete!
                    </h2>
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#CBD5E0] mb-5">
                        {TOPIC_EMOJIS[currentExercise.topic]} {TOPIC_LABELS[currentExercise.topic] || currentExercise.topic}
                    </p>

                    <div className="grid grid-cols-3 gap-3 mb-6">
                        <div className="p-3 bg-[#F7FAFC] rounded-2xl border border-border/20">
                            <div className="text-2xl font-black" style={{ color: score >= 80 ? '#48BB78' : score >= 60 ? '#A2D2FF' : '#F4ACB7' }}>
                                {score}%
                            </div>
                            <div className="text-[8px] font-black uppercase tracking-widest text-[#A0AEC0]">Score</div>
                        </div>
                        <div className="p-3 bg-[#F7FAFC] rounded-2xl border border-border/20">
                            <div className="text-2xl font-black text-[#48BB78]">{correct}</div>
                            <div className="text-[8px] font-black uppercase tracking-widest text-[#A0AEC0]">Correct</div>
                        </div>
                        <div className="p-3 bg-[#F7FAFC] rounded-2xl border border-border/20">
                            <div className="text-2xl font-black text-[#3E4A61]">{total}</div>
                            <div className="text-[8px] font-black uppercase tracking-widest text-[#A0AEC0]">Total</div>
                        </div>
                    </div>

                    <button
                        onClick={handleNextExercise}
                        className="w-full py-3.5 bg-gradient-to-r from-[#A2D2FF] to-[#7BB8F0] text-white font-black rounded-2xl shadow-lg hover:scale-[1.01] transition-all flex items-center justify-center gap-2"
                    >
                        {isLast ? (
                            <>Complete Session <Trophy size={16} /></>
                        ) : (
                            <>Next Exercise ({currentExerciseIndex + 2}/{totalExercises}) <ChevronRight size={16} /></>
                        )}
                    </button>
                </div>
            </div>
        );
    }

    // ─── Session Complete ─────────────────────────────────────────────────────
    if (phase === 'session_complete') {
        const score = sessionScore?.score ?? session?.score ?? 0;
        const correct = sessionScore?.correct_answers ?? session?.correct_answers ?? 0;
        const total = sessionScore?.total_exercises ?? session?.total_exercises ?? 0;

        return (
            <div className="max-w-2xl mx-auto space-y-4 animate-page-entrance">
                <div className="glass-card p-6 sm:p-8 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#FFD700]/40 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-b from-[#FFD700]/3 to-transparent pointer-events-none" />

                    <div className="w-20 h-20 bg-gradient-to-br from-[#FFD700] to-[#FFA500] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-[#FFD700]/30 relative z-10">
                        <Trophy size={36} className="text-white" />
                    </div>

                    <h2 className="text-3xl font-black text-[#3E4A61] tracking-tighter mb-1 relative z-10">Session Complete!</h2>
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#CBD5E0] mb-6 relative z-10">
                        Great reading practice!
                    </p>

                    <div className="grid grid-cols-3 gap-3 mb-6 relative z-10">
                        <div className="p-4 bg-[#F7FAFC] rounded-2xl border border-border/20">
                            <div className="text-3xl font-black" style={{ color: score >= 80 ? '#48BB78' : score >= 60 ? '#A2D2FF' : '#F4ACB7' }}>
                                {score}%
                            </div>
                            <div className="text-[8px] font-black uppercase tracking-widest text-[#A0AEC0]">Final Score</div>
                        </div>
                        <div className="p-4 bg-[#F7FAFC] rounded-2xl border border-border/20">
                            <div className="text-3xl font-black text-[#48BB78]">{correct}/{total}</div>
                            <div className="text-[8px] font-black uppercase tracking-widest text-[#A0AEC0]">Correct</div>
                        </div>
                        <div className="p-4 bg-[#F7FAFC] rounded-2xl border border-border/20">
                            <div className="text-3xl font-black text-[#3E4A61]">{formatTime(elapsedSeconds)}</div>
                            <div className="text-[8px] font-black uppercase tracking-widest text-[#A0AEC0]">Time</div>
                        </div>
                    </div>

                    <div className="flex gap-3 relative z-10">
                        <button
                            onClick={() => router.push('/reading')}
                            className="flex-1 py-3 border-2 border-[#A2D2FF]/30 text-[#3A6EA5] font-black rounded-2xl hover:bg-[#A2D2FF]/5 transition-all"
                        >
                            Back to Reading
                        </button>
                        <button
                            onClick={() => router.push('/reading/dashboard')}
                            className="flex-1 py-3 bg-gradient-to-r from-[#A2D2FF] to-[#7BB8F0] text-white font-black rounded-2xl shadow-lg hover:scale-[1.01] transition-all"
                        >
                            View Dashboard
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return null;
}
