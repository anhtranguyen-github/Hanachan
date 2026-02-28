'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Settings,
    Save,
    RotateCcw,
    ChevronLeft,
    Loader2,
    CheckCircle2,
    AlertCircle,
    Info,
} from 'lucide-react';
import { clsx } from 'clsx';
import { getReadingConfig, updateReadingConfig } from '@/features/reading/actions';
import type { ReadingConfig, DifficultyLevel, PassageLength } from '@/features/reading/types';
import {
    DIFFICULTY_LABELS,
    DIFFICULTY_COLORS,
    ALL_TOPICS,
    TOPIC_LABELS,
    TOPIC_EMOJIS,
} from '@/features/reading/types';

const DEFAULT_CONFIG: ReadingConfig = {
    exercises_per_session: 5,
    time_limit_minutes: 15,
    difficulty_level: 'adaptive',
    jlpt_target: null,
    vocab_weight: 40,
    grammar_weight: 30,
    kanji_weight: 30,
    include_furigana: true,
    include_translation: false,
    passage_length: 'medium',
    topic_preferences: ['daily_life', 'culture', 'nature'],
    auto_generate: true,
};

export default function ReadingSettingsPage() {
    const router = useRouter();
    const [config, setConfig] = useState<ReadingConfig>(DEFAULT_CONFIG);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        try {
            const data = await getReadingConfig();
            setConfig({ ...DEFAULT_CONFIG, ...data });
        } catch (err) {
            console.error('Failed to load config:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        // Validate weights
        const total = config.vocab_weight + config.grammar_weight + config.kanji_weight;
        if (total !== 100) {
            setError(`Content weights must sum to 100 (currently ${total})`);
            return;
        }

        try {
            setSaving(true);
            setError(null);
            await updateReadingConfig(config);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err: any) {
            setError(err.message || 'Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const handleReset = () => {
        setConfig(DEFAULT_CONFIG);
        setError(null);
    };

    const toggleTopic = (topic: string) => {
        setConfig(prev => {
            const prefs = prev.topic_preferences || [];
            if (prefs.includes(topic)) {
                return { ...prev, topic_preferences: prefs.filter(t => t !== topic) };
            } else {
                return { ...prev, topic_preferences: [...prefs, topic] };
            }
        });
    };

    const weightsTotal = config.vocab_weight + config.grammar_weight + config.kanji_weight;

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center">
                <Loader2 size={24} className="animate-spin text-[#A2D2FF]" />
            </div>
        );
    }

    return (
        <main className="max-w-3xl mx-auto space-y-4 animate-page-entrance">
            {/* Header */}
            <header className="flex items-center gap-3 pb-2">
                <button
                    onClick={() => router.push('/reading')}
                    className="flex items-center gap-1 text-[9px] font-black text-[#A0AEC0] hover:text-[#3A6EA5] uppercase tracking-widest transition-colors"
                >
                    <ChevronLeft size={12} /> Reading
                </button>
                <div className="flex-1">
                    <h1 className="text-xl font-black text-[#3E4A61] tracking-tighter">Reading Settings</h1>
                    <p className="text-[8px] font-black uppercase tracking-widest text-[#CBD5E0]">Configure your reading practice</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleReset}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white/80 border border-border/30 rounded-2xl text-[9px] font-black text-[#A0AEC0] hover:text-[#3E4A61] transition-all"
                    >
                        <RotateCcw size={10} /> Reset
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-[#A2D2FF] to-[#7BB8F0] text-white rounded-2xl text-[9px] font-black shadow-sm hover:shadow-md transition-all disabled:opacity-60"
                    >
                        {saving ? <Loader2 size={10} className="animate-spin" /> : saved ? <CheckCircle2 size={10} /> : <Save size={10} />}
                        {saved ? 'Saved!' : 'Save'}
                    </button>
                </div>
            </header>

            {/* Error */}
            {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-sm">
                    <AlertCircle size={14} />
                    <span className="text-[11px] font-black">{error}</span>
                </div>
            )}

            {/* Session Settings */}
            <div className="glass-card p-5 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#A2D2FF]/40 to-transparent" />
                <h2 className="text-sm font-black text-[#3E4A61] uppercase tracking-widest mb-4">Session Settings</h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Exercises per session */}
                    <div>
                        <label className="block text-[9px] font-black uppercase tracking-widest text-[#A0AEC0] mb-2">
                            Exercises per Session
                        </label>
                        <div className="flex items-center gap-3">
                            <input
                                type="range"
                                min={1}
                                max={20}
                                value={config.exercises_per_session}
                                onChange={(e) => setConfig(prev => ({ ...prev, exercises_per_session: Number(e.target.value) }))}
                                className="flex-1 accent-[#A2D2FF]"
                            />
                            <span className="w-8 text-center text-sm font-black text-[#3E4A61]">{config.exercises_per_session}</span>
                        </div>
                        <div className="flex justify-between text-[8px] text-[#CBD5E0] mt-1">
                            <span>1</span><span>20</span>
                        </div>
                    </div>

                    {/* Time limit */}
                    <div>
                        <label className="block text-[9px] font-black uppercase tracking-widest text-[#A0AEC0] mb-2">
                            Time Limit (minutes)
                        </label>
                        <div className="flex items-center gap-3">
                            <input
                                type="range"
                                min={1}
                                max={60}
                                value={config.time_limit_minutes}
                                onChange={(e) => setConfig(prev => ({ ...prev, time_limit_minutes: Number(e.target.value) }))}
                                className="flex-1 accent-[#A2D2FF]"
                            />
                            <span className="w-8 text-center text-sm font-black text-[#3E4A61]">{config.time_limit_minutes}m</span>
                        </div>
                        <div className="flex justify-between text-[8px] text-[#CBD5E0] mt-1">
                            <span>1m</span><span>60m</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Difficulty & Level */}
            <div className="glass-card p-5 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#CDB4DB]/40 to-transparent" />
                <h2 className="text-sm font-black text-[#3E4A61] uppercase tracking-widest mb-4">Difficulty & Level</h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Difficulty */}
                    <div>
                        <label className="block text-[9px] font-black uppercase tracking-widest text-[#A0AEC0] mb-2">
                            Difficulty Level
                        </label>
                        <div className="grid grid-cols-1 gap-1.5">
                            {(Object.keys(DIFFICULTY_LABELS) as DifficultyLevel[]).map((level) => (
                                <button
                                    key={level}
                                    onClick={() => setConfig(prev => ({ ...prev, difficulty_level: level }))}
                                    className={clsx(
                                        "flex items-center gap-2 p-2.5 rounded-xl border-2 text-left transition-all",
                                        config.difficulty_level === level
                                            ? "border-current"
                                            : "border-border/20 hover:border-border/40"
                                    )}
                                    style={config.difficulty_level === level ? {
                                        borderColor: DIFFICULTY_COLORS[level],
                                        backgroundColor: `${DIFFICULTY_COLORS[level]}15`,
                                    } : {}}
                                >
                                    <div
                                        className="w-2 h-2 rounded-full shrink-0"
                                        style={{ backgroundColor: DIFFICULTY_COLORS[level] }}
                                    />
                                    <span className="text-[10px] font-black text-[#3E4A61]">{DIFFICULTY_LABELS[level]}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* JLPT Target */}
                    <div>
                        <label className="block text-[9px] font-black uppercase tracking-widest text-[#A0AEC0] mb-2">
                            JLPT Target Level
                        </label>
                        <div className="grid grid-cols-3 gap-1.5">
                            <button
                                onClick={() => setConfig(prev => ({ ...prev, jlpt_target: null }))}
                                className={clsx(
                                    "p-2.5 rounded-xl border-2 text-center transition-all text-[10px] font-black",
                                    config.jlpt_target === null
                                        ? "border-[#A2D2FF] bg-[#A2D2FF]/10 text-[#3A6EA5]"
                                        : "border-border/20 text-[#A0AEC0] hover:border-border/40"
                                )}
                            >
                                Auto
                            </button>
                            {[5, 4, 3, 2, 1].map((n) => (
                                <button
                                    key={n}
                                    onClick={() => setConfig(prev => ({ ...prev, jlpt_target: n }))}
                                    className={clsx(
                                        "p-2.5 rounded-xl border-2 text-center transition-all text-[10px] font-black",
                                        config.jlpt_target === n
                                            ? "border-[#CDB4DB] bg-[#CDB4DB]/10 text-[#9B7EC8]"
                                            : "border-border/20 text-[#A0AEC0] hover:border-border/40"
                                    )}
                                >
                                    N{n}
                                </button>
                            ))}
                        </div>

                        {/* Passage Length */}
                        <label className="block text-[9px] font-black uppercase tracking-widest text-[#A0AEC0] mb-2 mt-4">
                            Passage Length
                        </label>
                        <div className="grid grid-cols-3 gap-1.5">
                            {(['short', 'medium', 'long'] as PassageLength[]).map((len) => (
                                <button
                                    key={len}
                                    onClick={() => setConfig(prev => ({ ...prev, passage_length: len }))}
                                    className={clsx(
                                        "p-2.5 rounded-xl border-2 text-center transition-all text-[10px] font-black capitalize",
                                        config.passage_length === len
                                            ? "border-[#FFD6A5] bg-[#FFD6A5]/20 text-[#D4A017]"
                                            : "border-border/20 text-[#A0AEC0] hover:border-border/40"
                                    )}
                                >
                                    {len}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Distribution */}
            <div className="glass-card p-5 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#FFD6A5]/40 to-transparent" />
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-black text-[#3E4A61] uppercase tracking-widest">Content Distribution</h2>
                    <div className={clsx(
                        "text-[9px] font-black px-2 py-0.5 rounded-full",
                        weightsTotal === 100 ? "bg-[#48BB78]/10 text-[#48BB78]" : "bg-red-100 text-red-500"
                    )}>
                        {weightsTotal}/100
                    </div>
                </div>

                <div className="space-y-4">
                    {[
                        { key: 'vocab_weight' as const, label: 'Vocabulary', color: '#CDB4DB', desc: 'Words and expressions' },
                        { key: 'grammar_weight' as const, label: 'Grammar', color: '#B7E4C7', desc: 'Grammar patterns' },
                        { key: 'kanji_weight' as const, label: 'Kanji', color: '#F4ACB7', desc: 'Chinese characters' },
                    ].map((item) => (
                        <div key={item.key}>
                            <div className="flex justify-between items-center mb-1.5">
                                <div>
                                    <span className="text-[10px] font-black text-[#3E4A61] uppercase tracking-wide">{item.label}</span>
                                    <span className="text-[9px] text-[#A0AEC0] ml-2">{item.desc}</span>
                                </div>
                                <span className="text-sm font-black" style={{ color: item.color }}>{config[item.key]}%</span>
                            </div>
                            <input
                                type="range"
                                min={0}
                                max={100}
                                value={config[item.key]}
                                onChange={(e) => setConfig(prev => ({ ...prev, [item.key]: Number(e.target.value) }))}
                                className="w-full"
                                style={{ accentColor: item.color }}
                            />
                        </div>
                    ))}
                </div>

                {weightsTotal !== 100 && (
                    <div className="flex items-center gap-2 mt-3 p-2 bg-amber-50 border border-amber-200 rounded-xl">
                        <Info size={12} className="text-amber-500 shrink-0" />
                        <span className="text-[9px] text-amber-600 font-black">Weights must sum to 100. Currently: {weightsTotal}</span>
                    </div>
                )}
            </div>

            {/* Display Options */}
            <div className="glass-card p-5 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#B7E4C7]/40 to-transparent" />
                <h2 className="text-sm font-black text-[#3E4A61] uppercase tracking-widest mb-4">Display Options</h2>

                <div className="space-y-3">
                    {[
                        { key: 'include_furigana' as const, label: 'Show Furigana', desc: 'Display reading aids above kanji' },
                        { key: 'include_translation' as const, label: 'Show Translation', desc: 'Display English translation' },
                        { key: 'auto_generate' as const, label: 'Auto-Generate Sessions', desc: 'Automatically create sessions based on your progress' },
                    ].map((opt) => (
                        <div key={opt.key} className="flex items-center justify-between p-3 bg-[#F7FAFC] rounded-2xl border border-border/20">
                            <div>
                                <div className="text-[10px] font-black text-[#3E4A61] uppercase tracking-wide">{opt.label}</div>
                                <div className="text-[9px] text-[#A0AEC0]">{opt.desc}</div>
                            </div>
                            <button
                                onClick={() => setConfig(prev => ({ ...prev, [opt.key]: !prev[opt.key] }))}
                                className={clsx(
                                    "w-10 h-5 rounded-full transition-all duration-300 relative",
                                    config[opt.key] ? "bg-[#A2D2FF]" : "bg-[#E2E8F0]"
                                )}
                            >
                                <div className={clsx(
                                    "absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-300",
                                    config[opt.key] ? "left-5" : "left-0.5"
                                )} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Topic Preferences */}
            <div className="glass-card p-5 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#F4ACB7]/40 to-transparent" />
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-black text-[#3E4A61] uppercase tracking-widest">Topic Preferences</h2>
                    <span className="text-[9px] font-black text-[#A0AEC0]">
                        {config.topic_preferences?.length || 0} selected
                    </span>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {ALL_TOPICS.map((topic) => {
                        const isSelected = config.topic_preferences?.includes(topic);
                        return (
                            <button
                                key={topic}
                                onClick={() => toggleTopic(topic)}
                                className={clsx(
                                    "p-2.5 rounded-2xl border-2 text-center transition-all",
                                    isSelected
                                        ? "border-[#A2D2FF] bg-[#A2D2FF]/10"
                                        : "border-border/20 hover:border-border/40 opacity-60"
                                )}
                            >
                                <div className="text-lg mb-0.5">{TOPIC_EMOJIS[topic]}</div>
                                <div className="text-[8px] font-black text-[#3E4A61] uppercase tracking-wide leading-tight">
                                    {TOPIC_LABELS[topic]}
                                </div>
                            </button>
                        );
                    })}
                </div>

                {(!config.topic_preferences || config.topic_preferences.length === 0) && (
                    <div className="flex items-center gap-2 mt-3 p-2 bg-amber-50 border border-amber-200 rounded-xl">
                        <Info size={12} className="text-amber-500 shrink-0" />
                        <span className="text-[9px] text-amber-600 font-black">Select at least one topic for reading sessions</span>
                    </div>
                )}
            </div>

            {/* Save Button */}
            <div className="flex gap-3 pb-4">
                <button
                    onClick={() => router.push('/reading')}
                    className="flex-1 py-3 border-2 border-border/30 text-[#A0AEC0] font-black rounded-2xl hover:border-[#A2D2FF]/30 hover:text-[#3A6EA5] transition-all"
                >
                    Cancel
                </button>
                <button
                    onClick={handleSave}
                    disabled={saving || weightsTotal !== 100}
                    className="flex-1 py-3 bg-gradient-to-r from-[#A2D2FF] to-[#7BB8F0] text-white font-black rounded-2xl shadow-lg hover:scale-[1.01] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <CheckCircle2 size={14} /> : <Save size={14} />}
                    {saved ? 'Settings Saved!' : 'Save Settings'}
                </button>
            </div>
        </main>
    );
}
