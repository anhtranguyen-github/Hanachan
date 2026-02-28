'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@/features/auth/AuthContext';
import { addSentenceAction, fetchUserSentencesAction } from './actions';
import { Plus, Search, Loader2, Sparkles, BookOpen } from 'lucide-react';
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
        setLoading(true);
        try {
            if (!user) {
                // Example sentences for guests
                setSentences([
                    { id: 'ex1', japanese_raw: '猫が好きです。', english_raw: 'I like cats.', annotations: [] },
                    { id: 'ex2', japanese_raw: '天気がいいですね。', english_raw: 'The weather is nice, isn\'t it?', annotations: [] },
                    { id: 'ex3', japanese_raw: '日本語を勉強しています。', english_raw: 'I am studying Japanese.', annotations: [] },
                ]);
            } else {
                const result = await fetchUserSentencesAction();
                if (result.success && result.data) {
                    setSentences(result.data);
                }
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSentences();
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
        <div className="max-w-[1200px] mx-auto p-4 sm:p-8 space-y-8 animate-in fade-in duration-700">
            <header className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                        <BookOpen size={24} className="text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tighter">My Sentences</h1>
                        <p className="text-gray-500 font-medium">Create and manage your own raw examples.</p>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

                {/* Add Sentence Form */}
                <div className="lg:col-span-1 bg-white border border-gray-100 p-6 rounded-[32px] shadow-sm sticky top-8">
                    <h2 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
                        <Sparkles size={16} className="text-primary" />
                        Add New
                    </h2>

                    <form onSubmit={handleAdd} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] uppercase font-bold text-gray-400 tracking-widest px-2">Japanese</label>
                            <input
                                type="text"
                                value={japaneseInput}
                                onChange={e => setJapaneseInput(e.target.value)}
                                placeholder="綺麗な絵。"
                                className="w-full bg-gray-50/50 border-2 border-transparent focus:border-primary/30 rounded-2xl px-4 py-3 text-lg font-black outline-none transition-all jp-text"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] uppercase font-bold text-gray-400 tracking-widest px-2">English</label>
                            <input
                                type="text"
                                value={englishInput}
                                onChange={e => setEnglishInput(e.target.value)}
                                placeholder="A pretty painting."
                                className="w-full bg-gray-50/50 border-2 border-transparent focus:border-primary/30 rounded-2xl px-4 py-3 text-base font-bold outline-none transition-all"
                            />
                        </div>

                        {error && <p className="text-rose-500 text-xs font-bold px-2">{error}</p>}

                        <button
                            type={user ? "submit" : "button"}
                            onClick={!user ? () => openLoginModal() : undefined}
                            disabled={user ? (submitting || !japaneseInput.trim() || !englishInput.trim()) : false}
                            className="w-full mt-4 flex items-center justify-center gap-2 py-4 bg-gray-900 text-white rounded-2xl font-black shadow-lg disabled:opacity-50 disabled:scale-100 hover:scale-[1.02] active:scale-95 transition-all group"
                        >
                            {submitting ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} className="group-hover:rotate-90 transition-transform" />}
                            {user ? 'Save Sentence' : 'Sign In to Save'}
                        </button>
                    </form>
                </div>

                {/* Sentences List */}
                <div className="lg:col-span-2 space-y-4">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-24 gap-4 opacity-50">
                            <Loader2 className="animate-spin text-primary" size={32} />
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Loading your entries...</p>
                        </div>
                    ) : sentences.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed border-gray-100 rounded-[32px] bg-white/50">
                            <BookOpen size={48} className="text-gray-200 mb-4" />
                            <h3 className="text-xl font-black text-gray-400">No Sentences Yet</h3>
                            <p className="text-gray-400 font-medium text-sm mt-1">Start by adding your first Japanese example!</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {sentences.map((target) => (
                                <div key={target.id} className="bg-white p-5 sm:p-6 rounded-3xl border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 group">
                                    <div className="space-y-1.5">
                                        <p className="text-xl sm:text-2xl font-black text-gray-900">
                                            <AnnotatedSentence
                                                text={target.japanese_raw}
                                                annotations={target.annotations}
                                            />
                                        </p>
                                        <p className="text-sm sm:text-base font-medium text-gray-500">
                                            {target.english_raw}
                                        </p>
                                    </div>
                                    <div className="shrink-0 flex items-center gap-3">
                                        {/* Future space for tags or actions */}
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-300 px-3 py-1 bg-gray-50 rounded-lg">Raw</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
