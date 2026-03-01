'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@/features/auth/AuthContext';
import { addSentenceAction, fetchUserSentencesAction } from './actions';
import { Plus, Search, Loader2, Sparkles, BookOpen, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';
import Link from 'next/link';
import { AnnotatedSentence } from '@/components/shared/AnnotatedSentence';

export default function SentencesPage() {
    const { user, openLoginModal } = useUser();
    const [japaneseInput, setJapaneseInput] = useState('');
    const [englishInput, setEnglishInput] = useState('');
    const [sentences, setSentences] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadSentences = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const result = await fetchUserSentencesAction();
            if (result.success && result.data) {
                setSentences(result.data);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSentences();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!japaneseInput.trim() || !englishInput.trim()) return;

        setSubmitting(true);
        setError(null);

        const result = await addSentenceAction(japaneseInput, englishInput);

        if (result.success && result.data) {
            setSentences(prev => [result.data, ...prev]);
            setJapaneseInput('');
            setEnglishInput('');
        } else {
            setError(result.error);
        }

        setSubmitting(false);
    };

    return (
        <main className="max-w-[1400px] mx-auto space-y-4 animate-page-entrance">
            {/* Header */}
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 py-2 px-1">
                <div className="flex items-center gap-4">
                    <div className="relative shrink-0">
                        <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-xl animate-pulse-slow" />
                        <div className="relative w-12 h-12 bg-gradient-to-br from-primary to-[#CDB4DB] rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg border-2 border-white/50 rotate-2">
                            <BookOpen size={24} />
                        </div>
                    </div>
                    <div className="flex flex-col justify-center py-1">
                        <h1 className="text-xl sm:text-2xl font-black text-[#3E4A61] tracking-tight leading-tight">
                            Sentence <span className="text-primary-dark">Mining</span>
                        </h1>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#A0AEC0] mt-1 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-primary/40 rounded-full" />
                            <span>{sentences.length} Sentences Collected</span>
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="px-4 py-2 bg-white/60 backdrop-blur-md border border-primary/10 rounded-2xl shadow-sm text-[10px] font-black text-[#3E4A61] uppercase tracking-widest flex items-center gap-2">
                        <Sparkles size={14} className="text-primary" />
                        Custom Discovery
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8 items-start">
                {/* Add Sentence Form */}
                <div className="xl:col-span-1 bg-white border border-border rounded-3xl p-6 sm:p-8 shadow-sm lg:sticky lg:top-8 relative overflow-hidden group">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/20 via-primary to-primary/20" />

                    <h2 className="text-sm font-black uppercase tracking-widest text-[#3E4A61] mb-6 flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Sparkles size={14} className="text-primary-dark" />
                        </div>
                        Mine New
                    </h2>

                    <form onSubmit={handleAdd} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase font-black text-foreground/40 tracking-widest px-1">Japanese Text</label>
                            <textarea
                                value={japaneseInput}
                                onChange={e => setJapaneseInput(e.target.value)}
                                placeholder="例：綺麗な絵ですね。"
                                rows={2}
                                className="w-full bg-[#F7FAFC] border border-border focus:border-primary/50 rounded-2xl p-4 text-base sm:text-lg font-black outline-none transition-all jp-text resize-none shadow-inner"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] uppercase font-black text-foreground/40 tracking-widest px-1">English Translation (Optional)</label>
                            <textarea
                                value={englishInput}
                                onChange={e => setEnglishInput(e.target.value)}
                                placeholder="Ex: That's a beautiful painting, isn't it?"
                                rows={2}
                                className="w-full bg-[#F7FAFC] border border-border focus:border-primary/50 rounded-2xl p-4 text-sm sm:text-base font-bold outline-none transition-all resize-none shadow-inner"
                            />
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-xl text-xs font-bold border border-red-100">
                                <AlertCircle size={14} /> {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={submitting || !japaneseInput.trim()}
                            className="w-full mt-2 flex items-center justify-center gap-2 py-4 bg-[#3E4A61] text-white rounded-2xl text-sm font-black uppercase tracking-widest shadow-lg disabled:opacity-50 disabled:scale-100 hover:scale-[1.02] active:scale-95 transition-all group"
                        >
                            {submitting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} className="group-hover:rotate-90 transition-transform" />}
                            Save Sentence
                        </button>
                    </form>
                </div>

                {/* Sentences List */}
                <div className="xl:col-span-2 space-y-4">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-32 gap-4">
                            <Loader2 className="animate-spin text-primary" size={32} />
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/30">Loading your collection...</p>
                        </div>
                    ) : sentences.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed border-border rounded-3xl bg-surface-muted/30">
                            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-border mb-4">
                                <BookOpen size={24} className="text-foreground/20" />
                            </div>
                            <h3 className="text-lg font-black text-foreground/40">No Sentences Yet</h3>
                            <p className="text-foreground/30 font-bold text-sm mt-1">Start by typing your first Japanese example on the left.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 2xl:grid-cols-2 gap-4">
                            {sentences.map((target) => (
                                <div key={target.id} className="bg-white p-5 sm:p-6 rounded-3xl border border-border flex flex-col justify-between gap-4 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/30 group relative overflow-hidden">
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary/10 to-primary/5 group-hover:from-primary/40 group-hover:to-primary/20 transition-colors" />
                                    <div className="space-y-3 relative z-10 pl-2">
                                        <p className="text-xl sm:text-2xl font-black text-[#3E4A61] leading-relaxed break-words">
                                            <AnnotatedSentence
                                                text={target.japanese_raw}
                                                annotations={target.annotations}
                                            />
                                        </p>
                                        {(target.english_raw || target.text_en) && (
                                            <p className="text-sm font-bold text-foreground/50 border-t border-border/40 pt-3">
                                                {target.english_raw || target.text_en}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 mt-auto pt-2 pl-2">
                                        <span className="text-[9px] font-black uppercase tracking-widest text-foreground/30 px-2.5 py-1 bg-surface-muted rounded-lg border border-border/50">Manual</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
