'use client';

import { useState, useCallback, useMemo } from 'react';
import {
    Mic, MicOff, ChevronRight, ChevronLeft, RotateCcw,
    Volume2, Sparkles, Target, TrendingUp, BookOpen,
    CheckCircle2, XCircle, AlertCircle, Info, Shuffle,
    Filter, Play, Square
} from 'lucide-react';
import { clsx } from 'clsx';
import { usePronunciationAssessment } from '@/features/speaking/hooks/usePronunciationAssessment';
import {
    SPEAKING_PROMPTS,
    PROMPT_CATEGORIES,
    DIFFICULTY_LABELS,
} from '@/features/speaking/prompts';
import {
    getScoreColor,
    getScoreLabel,
    getScoreLevel,
    type SpeakingPrompt,
    type PronunciationAssessmentResult,
    type PromptCategory,
    type PromptDifficulty,
} from '@/features/speaking/types';

// ─── Score Ring Component ─────────────────────────────────────────────────────

function ScoreRing({ score, size = 80 }: { score: number; size?: number }) {
    const radius = (size - 8) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (score / 100) * circumference;
    const color = getScoreColor(score);

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="-rotate-90">
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="#F7FAFC"
                    strokeWidth={6}
                />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={color}
                    strokeWidth={6}
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    className="transition-all duration-1000"
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-black" style={{ color }}>{score}</span>
                <span className="text-[7px] font-black uppercase tracking-widest text-foreground/30">score</span>
            </div>
        </div>
    );
}

// ─── Word Score Badge ─────────────────────────────────────────────────────────

function WordBadge({ word, score, errorType }: {
    word: string;
    score: number;
    errorType: string;
}) {
    const color = getScoreColor(score);
    const isError = errorType !== 'None';

    return (
        <span
            className="inline-flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl border transition-all duration-300 hover:scale-105"
            style={{
                borderColor: `${color}40`,
                backgroundColor: `${color}10`,
            }}
            title={isError ? `Error: ${errorType}` : `Score: ${score}`}
        >
            <span className="text-sm font-bold text-[#3E4A61]">{word}</span>
            <span className="text-[8px] font-black" style={{ color }}>{score}</span>
        </span>
    );
}

// ─── Score Breakdown Card ─────────────────────────────────────────────────────

function ScoreBreakdown({ result }: { result: PronunciationAssessmentResult }) {
    const metrics = [
        { label: 'Pronunciation', value: result.pronunciationScore, icon: '🎯' },
        { label: 'Accuracy', value: result.accuracyScore, icon: '✓' },
        { label: 'Fluency', value: result.fluencyScore, icon: '〜' },
        { label: 'Completeness', value: result.completenessScore, icon: '◎' },
        ...(result.prosodyScore !== undefined
            ? [{ label: 'Prosody', value: result.prosodyScore, icon: '♪' }]
            : []),
    ];

    return (
        <div className="space-y-3">
            {/* Overall Score */}
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-[#FFF5F7] to-white border border-primary/15">
                <ScoreRing score={result.pronunciationScore} size={72} />
                <div className="flex-1">
                    <div className="text-xl font-black text-[#3E4A61]">
                        {getScoreLabel(result.pronunciationScore)}
                    </div>
                    <div className="text-[9px] font-black uppercase tracking-widest text-foreground/30 mt-0.5">
                        Overall Pronunciation Score
                    </div>
                    {result.recognizedText && (
                        <div className="mt-2 text-xs text-foreground/50 font-medium">
                            Heard: <span className="text-[#3E4A61] font-bold">{result.recognizedText}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Metric Bars */}
            <div className="grid grid-cols-2 gap-2">
                {metrics.map((m) => {
                    const color = getScoreColor(m.value);
                    return (
                        <div key={m.label} className="p-3 rounded-xl bg-[#F7FAFC] border border-border/30">
                            <div className="flex justify-between items-center mb-1.5">
                                <span className="text-[9px] font-black uppercase tracking-widest text-foreground/40">
                                    {m.icon} {m.label}
                                </span>
                                <span className="text-[11px] font-black" style={{ color }}>{m.value}</span>
                            </div>
                            <div className="h-1.5 bg-white rounded-full overflow-hidden border border-border/20">
                                <div
                                    className="h-full rounded-full transition-all duration-1000"
                                    style={{ width: `${m.value}%`, backgroundColor: color }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Word-level breakdown */}
            {result.words.length > 0 && (
                <div className="p-3 rounded-xl bg-[#F7FAFC] border border-border/30">
                    <p className="text-[9px] font-black uppercase tracking-widest text-foreground/30 mb-2">
                        Word Analysis
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {result.words.map((w, i) => (
                            <WordBadge
                                key={i}
                                word={w.word}
                                score={w.accuracyScore}
                                errorType={w.errorType}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Prompt Card ──────────────────────────────────────────────────────────────

function PromptCard({
    prompt,
    isActive,
    onClick,
}: {
    prompt: SpeakingPrompt;
    isActive: boolean;
    onClick: () => void;
}) {
    const diff = DIFFICULTY_LABELS[prompt.difficulty];

    return (
        <button
            onClick={onClick}
            className={clsx(
                'w-full text-left p-3 rounded-2xl border transition-all duration-200 group',
                isActive
                    ? 'bg-primary/8 border-primary/25 shadow-sm'
                    : 'bg-white border-border/40 hover:border-primary/20 hover:bg-[#FFF5F7]'
            )}
        >
            <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                    <p className={clsx(
                        'text-sm font-bold truncate',
                        isActive ? 'text-primary' : 'text-[#3E4A61]'
                    )}>
                        {prompt.japanese}
                    </p>
                    <p className="text-[9px] text-foreground/40 font-medium truncate mt-0.5">
                        {prompt.english}
                    </p>
                </div>
                <span
                    className="shrink-0 text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-lg"
                    style={{
                        color: diff.color,
                        backgroundColor: `${diff.color}15`,
                    }}
                >
                    {prompt.difficulty.slice(0, 3)}
                </span>
            </div>
        </button>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SpeakingPracticePage() {
    const [selectedPrompt, setSelectedPrompt] = useState<SpeakingPrompt>(SPEAKING_PROMPTS[0]);
    const [activeCategory, setActiveCategory] = useState<string>('all');
    const [activeDifficulty, setActiveDifficulty] = useState<string>('all');
    const [showFilters, setShowFilters] = useState(false);
    const [sessionHistory, setSessionHistory] = useState<Array<{
        prompt: SpeakingPrompt;
        result: PronunciationAssessmentResult;
    }>>([]);
    const [activeTab, setActiveTab] = useState<'practice' | 'history'>('practice');

    const {
        status,
        result,
        error,
        startAssessment,
        stopAssessment,
        reset,
        isRecording,
    } = usePronunciationAssessment();

    // Filter prompts
    const filteredPrompts = useMemo(() => {
        return SPEAKING_PROMPTS.filter(p => {
            const catMatch = activeCategory === 'all' || p.category === activeCategory;
            const diffMatch = activeDifficulty === 'all' || p.difficulty === activeDifficulty;
            return catMatch && diffMatch;
        });
    }, [activeCategory, activeDifficulty]);

    const handleSelectPrompt = useCallback((prompt: SpeakingPrompt) => {
        setSelectedPrompt(prompt);
        reset();
    }, [reset]);

    const handleRandomPrompt = useCallback(() => {
        const pool = filteredPrompts.filter(p => p.id !== selectedPrompt.id);
        if (pool.length === 0) return;
        const random = pool[Math.floor(Math.random() * pool.length)];
        handleSelectPrompt(random);
    }, [filteredPrompts, selectedPrompt.id, handleSelectPrompt]);

    const handleStartRecording = useCallback(async () => {
        await startAssessment(selectedPrompt.japanese);
    }, [startAssessment, selectedPrompt.japanese]);

    const handleStopRecording = useCallback(() => {
        stopAssessment();
    }, [stopAssessment]);

    // Save to history when result arrives
    const prevResultRef = useState<PronunciationAssessmentResult | null>(null);
    if (result && result !== prevResultRef[0]) {
        prevResultRef[0] = result;
        setSessionHistory(prev => {
            const entry = { prompt: selectedPrompt, result };
            // Avoid duplicates
            if (prev.length > 0 && prev[0].result === result) return prev;
            return [entry, ...prev].slice(0, 20);
        });
    }

    const avgScore = sessionHistory.length > 0
        ? Math.round(sessionHistory.reduce((sum, h) => sum + h.result.pronunciationScore, 0) / sessionHistory.length)
        : null;

    const diff = DIFFICULTY_LABELS[selectedPrompt.difficulty];

    return (
        <div className="flex h-full bg-[#FFFDFD] overflow-hidden rounded-[32px] border border-[#F0E0E0] shadow-sm">

            {/* ── Left Panel: Prompt List ── */}
            <aside className="w-72 border-r border-[#F0E0E0] flex flex-col shrink-0 bg-white/50 backdrop-blur-sm">
                {/* Header */}
                <div className="p-4 border-b border-[#F0E0E0] space-y-3 shrink-0">
                    <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#CBD5E0]">
                            Phrases
                        </span>
                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={handleRandomPrompt}
                                className="p-1.5 hover:bg-[#F7FAFC] rounded-lg transition-colors text-foreground/30 hover:text-primary"
                                title="Random phrase"
                            >
                                <Shuffle size={13} />
                            </button>
                            <button
                                onClick={() => setShowFilters(v => !v)}
                                className={clsx(
                                    'p-1.5 rounded-lg transition-colors',
                                    showFilters
                                        ? 'bg-primary/10 text-primary'
                                        : 'hover:bg-[#F7FAFC] text-foreground/30 hover:text-primary'
                                )}
                                title="Filter"
                            >
                                <Filter size={13} />
                            </button>
                        </div>
                    </div>

                    {/* Filters */}
                    {showFilters && (
                        <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                            {/* Category filter */}
                            <div>
                                <p className="text-[8px] font-black uppercase tracking-widest text-foreground/25 mb-1.5">Category</p>
                                <div className="flex flex-wrap gap-1">
                                    {PROMPT_CATEGORIES.map(cat => (
                                        <button
                                            key={cat.id}
                                            onClick={() => setActiveCategory(cat.id)}
                                            className={clsx(
                                                'px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all',
                                                activeCategory === cat.id
                                                    ? 'bg-primary text-white'
                                                    : 'bg-[#F7FAFC] text-foreground/40 hover:bg-primary/10 hover:text-primary'
                                            )}
                                        >
                                            {cat.emoji} {cat.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            {/* Difficulty filter */}
                            <div>
                                <p className="text-[8px] font-black uppercase tracking-widest text-foreground/25 mb-1.5">Difficulty</p>
                                <div className="flex gap-1">
                                    {(['all', 'beginner', 'intermediate', 'advanced'] as const).map(d => (
                                        <button
                                            key={d}
                                            onClick={() => setActiveDifficulty(d)}
                                            className={clsx(
                                                'px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all',
                                                activeDifficulty === d
                                                    ? 'bg-primary text-white'
                                                    : 'bg-[#F7FAFC] text-foreground/40 hover:bg-primary/10 hover:text-primary'
                                            )}
                                        >
                                            {d === 'all' ? 'All' : d.slice(0, 3)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Count */}
                    <p className="text-[8px] font-black uppercase tracking-widest text-foreground/20">
                        {filteredPrompts.length} phrase{filteredPrompts.length !== 1 ? 's' : ''}
                    </p>
                </div>

                {/* Prompt List */}
                <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                    {filteredPrompts.map(prompt => (
                        <PromptCard
                            key={prompt.id}
                            prompt={prompt}
                            isActive={selectedPrompt.id === prompt.id}
                            onClick={() => handleSelectPrompt(prompt)}
                        />
                    ))}
                </div>
            </aside>

            {/* ── Main Practice Area ── */}
            <main className="flex-1 flex flex-col min-w-0 bg-white">
                {/* Header */}
                <header className="h-14 border-b border-border flex items-center justify-between px-5 shrink-0 bg-surface/80 backdrop-blur-md">
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                        <h2 className="text-sm font-black text-foreground tracking-tighter uppercase">
                            Speaking Practice
                        </h2>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Tab switcher */}
                        <div className="flex bg-[#F7FAFC] p-0.5 rounded-xl border border-border/20">
                            {(['practice', 'history'] as const).map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={clsx(
                                        'px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all duration-200',
                                        activeTab === tab
                                            ? 'bg-white text-primary shadow-sm'
                                            : 'text-foreground/30 hover:text-foreground/60'
                                    )}
                                >
                                    {tab === 'practice' ? '🎤 Practice' : `📊 History${sessionHistory.length > 0 ? ` (${sessionHistory.length})` : ''}`}
                                </button>
                            ))}
                        </div>
                        {avgScore !== null && (
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FFF5F7] border border-primary/20 rounded-xl">
                                <TrendingUp size={10} className="text-primary" />
                                <span className="text-[9px] font-black text-primary uppercase tracking-widest">
                                    Avg {avgScore}
                                </span>
                            </div>
                        )}
                    </div>
                </header>

                {/* Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {activeTab === 'practice' ? (
                        <div className="p-6 space-y-6 max-w-2xl mx-auto">

                            {/* Prompt Display */}
                            <div className="glass-card p-6 space-y-4 relative overflow-hidden">
                                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

                                {/* Difficulty + Category badges */}
                                <div className="flex items-center gap-2">
                                    <span
                                        className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg"
                                        style={{
                                            color: diff.color,
                                            backgroundColor: `${diff.color}15`,
                                        }}
                                    >
                                        {diff.label}
                                    </span>
                                    <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg bg-[#F7FAFC] text-foreground/30">
                                        {selectedPrompt.category.replace('-', ' ')}
                                    </span>
                                </div>

                                {/* Japanese text */}
                                <div className="text-center py-4">
                                    <p className="text-4xl font-black text-[#3E4A61] leading-relaxed tracking-wide">
                                        {selectedPrompt.japanese}
                                    </p>
                                    <p className="text-sm text-foreground/40 font-medium mt-2">
                                        {selectedPrompt.reading}
                                    </p>
                                    <p className="text-xs text-foreground/30 font-medium mt-1">
                                        {selectedPrompt.english}
                                    </p>
                                </div>

                                {/* Tip */}
                                {selectedPrompt.tip && (
                                    <div className="flex items-start gap-2 p-3 rounded-xl bg-[#FFF5F7] border border-primary/10">
                                        <Info size={12} className="text-primary shrink-0 mt-0.5" />
                                        <p className="text-[10px] text-foreground/50 font-medium leading-relaxed">
                                            {selectedPrompt.tip}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Recording Controls */}
                            <div className="flex flex-col items-center gap-4">
                                {/* Status indicator */}
                                <div className={clsx(
                                    'text-[9px] font-black uppercase tracking-widest transition-all duration-300',
                                    isRecording ? 'text-red-400' : 'text-foreground/25'
                                )}>
                                    {status === 'idle' && 'Ready to record'}
                                    {status === 'recording' && '● Recording... Speak now'}
                                    {status === 'processing' && 'Processing...'}
                                    {status === 'done' && 'Assessment complete'}
                                    {status === 'error' && 'Error occurred'}
                                </div>

                                {/* Main record button */}
                                <div className="relative">
                                    {isRecording && (
                                        <div className="absolute inset-0 rounded-full bg-red-400/20 animate-ping scale-150" />
                                    )}
                                    <button
                                        onClick={isRecording ? handleStopRecording : handleStartRecording}
                                        disabled={status === 'processing'}
                                        className={clsx(
                                            'relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg active:scale-95',
                                            isRecording
                                                ? 'bg-red-400 hover:bg-red-500 shadow-red-200'
                                                : status === 'processing'
                                                    ? 'bg-[#F7FAFC] cursor-not-allowed'
                                                    : 'bg-gradient-to-br from-[#F4ACB7] to-[#D88C9A] hover:opacity-90 shadow-primary/30'
                                        )}
                                    >
                                        {status === 'processing' ? (
                                            <div className="w-6 h-6 border-2 border-foreground/20 border-t-primary rounded-full animate-spin" />
                                        ) : isRecording ? (
                                            <Square size={24} className="text-white" fill="white" />
                                        ) : (
                                            <Mic size={28} className="text-white" />
                                        )}
                                    </button>
                                </div>

                                {/* Action buttons */}
                                <div className="flex items-center gap-3">
                                    {result && (
                                        <button
                                            onClick={reset}
                                            className="flex items-center gap-1.5 px-4 py-2 bg-[#F7FAFC] border border-border/40 rounded-xl text-[9px] font-black uppercase tracking-widest text-foreground/40 hover:text-foreground/70 hover:border-border transition-all"
                                        >
                                            <RotateCcw size={11} />
                                            Try Again
                                        </button>
                                    )}
                                    <button
                                        onClick={handleRandomPrompt}
                                        className="flex items-center gap-1.5 px-4 py-2 bg-[#F7FAFC] border border-border/40 rounded-xl text-[9px] font-black uppercase tracking-widest text-foreground/40 hover:text-foreground/70 hover:border-border transition-all"
                                    >
                                        <Shuffle size={11} />
                                        Next Phrase
                                    </button>
                                </div>
                            </div>

                            {/* Error display */}
                            {error && (
                                <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-50 border border-red-100">
                                    <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-red-400 mb-1">
                                            Error
                                        </p>
                                        <p className="text-xs text-red-400/80 font-medium">{error}</p>
                                        {error.includes('key not configured') && (
                                            <p className="text-[9px] text-red-300 mt-1">
                                                Add AZURE_SPEECH_KEY and AZURE_SPEECH_REGION to your .env file.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Assessment Result */}
                            {result && status === 'done' && (
                                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <ScoreBreakdown result={result} />
                                </div>
                            )}
                        </div>
                    ) : (
                        /* History Tab */
                        <div className="p-6 space-y-4 max-w-2xl mx-auto">
                            {sessionHistory.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 text-center">
                                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#F4ACB7] to-[#D88C9A] flex items-center justify-center text-white font-black text-2xl shadow-lg mb-4">
                                        🎤
                                    </div>
                                    <h3 className="text-base font-black text-[#3E4A61] mb-2">No attempts yet</h3>
                                    <p className="text-sm text-foreground/40 font-medium max-w-xs leading-relaxed">
                                        Practice some phrases and your results will appear here.
                                    </p>
                                </div>
                            ) : (
                                <>
                                    {/* Summary stats */}
                                    <div className="grid grid-cols-3 gap-3">
                                        {[
                                            { label: 'Attempts', value: sessionHistory.length, color: '#4DABF7' },
                                            { label: 'Avg Score', value: avgScore ?? 0, color: getScoreColor(avgScore ?? 0) },
                                            {
                                                label: 'Best Score',
                                                value: Math.max(...sessionHistory.map(h => h.result.pronunciationScore)),
                                                color: '#48BB78'
                                            },
                                        ].map(s => (
                                            <div key={s.label} className="glass-card p-3 text-center">
                                                <div className="text-xl font-black" style={{ color: s.color }}>{s.value}</div>
                                                <div className="text-[8px] font-black uppercase tracking-widest text-foreground/30 mt-0.5">{s.label}</div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* History list */}
                                    <div className="space-y-3">
                                        {sessionHistory.map((entry, i) => {
                                            const color = getScoreColor(entry.result.pronunciationScore);
                                            return (
                                                <div key={i} className="glass-card p-4 flex items-center gap-4">
                                                    <ScoreRing score={entry.result.pronunciationScore} size={56} />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-bold text-[#3E4A61] truncate">
                                                            {entry.prompt.japanese}
                                                        </p>
                                                        <p className="text-[9px] text-foreground/40 font-medium truncate mt-0.5">
                                                            {entry.prompt.english}
                                                        </p>
                                                        <div className="flex items-center gap-3 mt-1.5">
                                                            {[
                                                                { label: 'Acc', value: entry.result.accuracyScore },
                                                                { label: 'Flu', value: entry.result.fluencyScore },
                                                                { label: 'Com', value: entry.result.completenessScore },
                                                            ].map(m => (
                                                                <span key={m.label} className="text-[8px] font-black text-foreground/30">
                                                                    {m.label}: <span style={{ color: getScoreColor(m.value) }}>{m.value}</span>
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div className="shrink-0 text-right">
                                                        <span
                                                            className="text-[8px] font-black uppercase tracking-widest"
                                                            style={{ color }}
                                                        >
                                                            {getScoreLabel(entry.result.pronunciationScore)}
                                                        </span>
                                                        {entry.result.recognizedText && (
                                                            <p className="text-[8px] text-foreground/25 mt-0.5 max-w-[100px] truncate">
                                                                "{entry.result.recognizedText}"
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
