'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@/features/auth/AuthContext';
import { supabase } from '@/lib/supabase';
import { Edit3, Check, Loader2, BookOpen, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { srsRepository } from '@/features/learning/srsRepository';

interface KUUserNotesProps {
    kuId: string;
    kuType: string;
}

export function KUUserNotes({ kuId, kuType }: KUUserNotesProps) {
    const { user } = useUser();
    const [notes, setNotes] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!user) {
            setIsLoading(false);
            return;
        }

        const fetchNotes = async () => {
            setIsLoading(true);
            try {
                const { data } = await supabase
                    .from('user_fsrs_states')
                    .select('notes')
                    .eq('user_id', user.id)
                    .eq('item_id', kuId)
                    .limit(1)
                    .maybeSingle();
                if (data?.notes) {
                    setNotes(data.notes);
                }
            } catch (err) {
                console.error('Failed to load notes', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchNotes();
    }, [user, kuId]);

    const handleSave = async () => {
        if (!user) return;
        setIsSaving(true);
        setError(null);

        try {
            // First we fetch to see if state exists, because updateKUNote appends instead of overwrite if exist but wait:
            // updateKUNote in srsRepository APPENDS! We just want to overwrite? Let's write a custom overwrite logic here
            // since we have the full text area!

            // Safest way: just update the notes column for the primary facet
            const { error: updateError } = await supabase
                .from('user_fsrs_states')
                .update({ notes: notes })
                .eq('user_id', user.id)
                .eq('item_id', kuId)
                .eq('facet', 'primary');

            if (updateError) throw updateError;

            setIsEditing(false);
        } catch (err: unknown) {
            console.error('Failed to save notes', err);
            setError((err instanceof Error ? err.message : String(err)) || 'Failed to save notes.');
        } finally {
            setIsSaving(false);
        }
    };

    if (!user) return null;

    if (isLoading) {
        return (
            <div className="bg-white border border-border rounded-3xl p-6 shadow-sm animate-pulse flex gap-3">
                <div className="w-8 h-8 rounded-xl bg-surface-muted" />
                <div className="flex-1 space-y-2 py-1">
                    <div className="h-3 bg-surface-muted rounded w-1/4" />
                    <div className="h-2 bg-surface-muted/50 rounded w-full" />
                </div>
            </div>
        );
    }

    return (
        <section className="bg-white border border-border rounded-3xl p-6 space-y-4 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent" />

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center">
                        <BookOpen size={14} className="text-primary-dark" />
                    </div>
                    <div>
                        <h2 className="text-sm font-black text-foreground uppercase tracking-widest">My Notes</h2>
                        <p className="text-[10px] text-foreground/40 font-bold">Personal study notes</p>
                    </div>
                </div>

                {!isEditing && (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="p-2 text-foreground/40 hover:text-primary hover:bg-primary/5 rounded-xl transition-colors"
                    >
                        <Edit3 size={16} />
                    </button>
                )}
            </div>

            {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-xl text-xs font-bold">
                    <AlertCircle size={14} />
                    {error}
                </div>
            )}

            {isEditing ? (
                <div className="space-y-3">
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Write your personal mnemonics, context, or insights here..."
                        className="w-full min-h-[120px] p-4 bg-[#F7FAFC] border border-border rounded-2xl resize-y outline-none focus:border-primary/50 text-sm font-medium transition-colors"
                        autoFocus
                    />
                    <div className="flex justify-end gap-2">
                        <button
                            onClick={() => setIsEditing(false)}
                            disabled={isSaving}
                            className="px-4 py-2 text-xs font-black uppercase tracking-widest text-foreground/50 hover:text-foreground transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50"
                        >
                            {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                            Save
                        </button>
                    </div>
                </div>
            ) : (
                <div
                    onClick={() => !notes && setIsEditing(true)}
                    className={clsx(
                        "text-sm leading-relaxed p-4 rounded-2xl transition-all",
                        notes
                            ? "text-foreground/80 bg-surface-muted/30 border border-transparent"
                            : "text-foreground/30 bg-gray-50/50 border border-dashed border-border hover:border-primary/30 hover:bg-primary/5 cursor-pointer text-center py-8"
                    )}
                >
                    {notes ? (
                        <div className="whitespace-pre-wrap">{notes}</div>
                    ) : (
                        <span className="font-bold underline decoration-border underline-offset-4 pointer-events-none">Click to add personal notes</span>
                    )}
                </div>
            )}
        </section>
    );
}
