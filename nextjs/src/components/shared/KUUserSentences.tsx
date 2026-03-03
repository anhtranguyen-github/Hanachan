'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@/features/auth/AuthContext';
import { supabase } from '@/lib/supabase';
import { BookOpen, Plus, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { AnnotatedSentence } from './AnnotatedSentence';

import { addSentenceAction } from '@/app/(main)/sentences/actions';

interface KUUserSentencesProps {
    kuId: string;
    kuType: string;
    character: string;
}

export function KUUserSentences({ kuId, kuType, character }: KUUserSentencesProps) {
    const { user } = useUser();
    const [sentences, setSentences] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);

    const [jaInput, setJaInput] = useState('');
    const [enInput, setEnInput] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadSentences = async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const { data } = await supabase
                .from('ku_to_sentence')
                .select('sentence:sentences(*)')
                .eq('item_id', kuId);

            if (data) {
                setSentences(data.map((d: any) => d.sentence));
            }
        } catch (err) {
            console.error('Failed to load user sentences', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadSentences();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, kuId]);

    const handleSave = async () => {
        if (!user || !jaInput.trim()) return;
        setIsSaving(true);
        setError(null);

        try {
            const result = await addSentenceAction(jaInput, enInput);
            if (!result.success || !result.data) throw new Error(result.error || 'Failed to add sentence.');

            // Link it
            const { error: linkError } = await supabase.from('ku_to_sentence').insert({
                ku_id: kuId,
                sentence_id: result.data.id,
                is_primary: false
            });
            if (linkError) throw linkError;

            setSentences(prev => [result.data, ...prev]);
            setJaInput('');
            setEnInput('');
            setIsAdding(false);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSaving(false);
        }
    };

    if (!user) return null;

    return (
        <section className="bg-white border border-border rounded-3xl p-6 space-y-4 shadow-sm relative overflow-hidden group">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-surface-muted rounded-xl flex items-center justify-center">
                        <Sparkles size={14} className="text-foreground/40" />
                    </div>
                    <div>
                        <h2 className="text-sm font-black text-foreground uppercase tracking-widest">My Sentences</h2>
                        <p className="text-[10px] text-foreground/40 font-bold">Your mined examples</p>
                    </div>
                </div>
                {!isAdding && (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-muted hover:bg-surface-muted/80 text-[10px] font-black uppercase tracking-widest text-foreground/50 hover:text-foreground rounded-xl transition-colors"
                    >
                        <Plus size={12} /> Add
                    </button>
                )}
            </div>

            {isAdding && (
                <div className="p-4 bg-surface-muted/30 border border-border rounded-2xl space-y-3">
                    <input
                        type="text"
                        value={jaInput}
                        onChange={e => setJaInput(e.target.value)}
                        placeholder={`Japanese sentence containing ${character}...`}
                        className="w-full p-3 bg-white border border-border rounded-xl outline-none focus:border-primary jp-text text-sm transition-colors"
                        autoFocus
                    />
                    <input
                        type="text"
                        value={enInput}
                        onChange={e => setEnInput(e.target.value)}
                        placeholder="English translation (optional)"
                        className="w-full p-3 bg-white border border-border rounded-xl outline-none focus:border-primary text-sm font-medium transition-colors"
                    />

                    {error && (
                        <div className="flex items-center gap-1.5 p-2 bg-red-50 text-red-600 rounded-lg text-xs font-bold">
                            <AlertCircle size={12} /> {error}
                        </div>
                    )}

                    <div className="flex justify-end gap-2 pt-1">
                        <button
                            onClick={() => setIsAdding(false)}
                            disabled={isSaving}
                            className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-foreground/40 hover:text-foreground transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving || !jaInput.trim()}
                            className="flex items-center gap-1.5 px-4 py-2 bg-foreground text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50"
                        >
                            {isSaving ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                            Save
                        </button>
                    </div>
                </div>
            )}

            {isLoading ? (
                <div className="animate-pulse space-y-2">
                    <div className="h-12 bg-surface-muted/50 rounded-2xl w-full" />
                </div>
            ) : sentences.length > 0 ? (
                <div className="space-y-3">
                    {sentences.map(s => (
                        <div key={s.id} className="p-4 bg-surface-muted/30 border border-border/60 hover:border-primary/20 hover:bg-primary/5 rounded-2xl transition-all">
                            <p className="text-base font-black text-foreground jp-text mb-1.5">
                                {s.annotations ? <AnnotatedSentence text={s.japanese_raw} annotations={s.annotations} /> : s.japanese_raw || s.text_ja}
                            </p>
                            {(s.english_raw || s.text_en) && (
                                <p className="text-xs font-bold text-foreground/40">{s.english_raw || s.text_en}</p>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                !isAdding && (
                    <div className="py-6 text-center">
                        <p className="text-[10px] font-bold text-foreground/30 uppercase tracking-widest">No custom sentences</p>
                    </div>
                )
            )}
        </section>
    );
}

