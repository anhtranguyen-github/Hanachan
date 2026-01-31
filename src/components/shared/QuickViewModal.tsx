'use client';

import React from 'react';
import { X } from 'lucide-react';
import { RichTextRenderer } from './RichTextRenderer';
import { AudioPlayer } from './AudioPlayer';

export type QuickViewType = 'TOKEN' | 'GRAMMAR';

export interface QuickViewData {
    type: QuickViewType;
    title: string;
    subtitle?: string;
    meaning: string;
    meanings?: string[];
    reading?: string;
    explanation?: string;
    reading_mnemonic?: string;
    examples?: { ja: string; en: string }[];
    level?: string;
    ku_type?: string;
    audio_items?: any[];
    components?: { character: string; meaning: string; slug: string }[];
    raw?: any;
}

interface QuickViewModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: QuickViewData | null;
    onAddToLevel?: (data: QuickViewData) => void;
}

export const QuickViewModal: React.FC<QuickViewModalProps> = ({ isOpen, onClose, data, onAddToLevel }) => {
    if (!isOpen || !data) return null;

    const isToken = data.type === 'TOKEN';

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm overflow-y-auto" data-testid="quick-view-modal">
            <div className="bg-surface border border-border max-w-lg w-full p-8 rounded-[var(--radius)] relative flex flex-col gap-6 my-auto shadow-2xl">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-xl border border-border text-foreground/20 hover:text-foreground hover:border-foreground/20 transition-all z-10"
                >
                    <X className="w-4 h-4" />
                </button>

                <header className="border-b border-border/60 pb-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xs font-bold uppercase tracking-widest text-foreground/40">
                            {isToken ? 'Quick Analysis' : 'Concept Note'}
                        </h2>
                        {data.level && (
                            <span className="text-[9px] uppercase font-bold bg-primary/20 text-foreground px-3 py-1 rounded-lg">
                                LEVEL {data.level}
                            </span>
                        )}
                    </div>
                </header>

                <div className="flex flex-col gap-6 max-h-[70vh] overflow-y-auto pr-2 scrollbar-hide">
                    {/* Character Insight Card */}
                    <div className="rounded-2xl border border-border p-8 text-center bg-surface-muted/30 relative overflow-hidden group">
                        <div className="absolute top-4 right-4 z-10">
                            {data.audio_items && <AudioPlayer items={data.audio_items} />}
                        </div>
                        {data.reading && (
                            <div className="text-sm font-bold text-foreground/40 mb-1 tracking-tight">
                                {data.reading}
                            </div>
                        )}
                        <div className="text-6xl font-black text-foreground italic tracking-tighter jp-text" data-testid="quick-view-character">
                            {data.title}
                        </div>
                        <div className="text-xl font-bold italic mt-4 text-primary-dark">
                            {data.meaning}
                        </div>

                        {data.meanings && data.meanings.length > 1 && (
                            <div className="text-[11px] font-medium text-foreground/40 mt-2 uppercase tracking-wide">
                                {data.meanings.slice(1).join(' • ')}
                            </div>
                        )}
                    </div>

                    {/* Mnemonics */}
                    {(data.explanation || data.reading_mnemonic) && (
                        <div className="space-y-4">
                            {data.explanation && (
                                <div className="p-5 rounded-2xl bg-surface border border-border">
                                    <div className="text-[9px] uppercase font-bold mb-2 text-foreground/20 tracking-widest">Meaning Strategy</div>
                                    <div className="text-sm text-foreground/70 font-medium leading-relaxed italic">
                                        <RichTextRenderer content={data.explanation} />
                                    </div>
                                </div>
                            )}

                            {data.reading_mnemonic && (
                                <div className="p-5 rounded-2xl bg-primary/5 border border-primary/10">
                                    <div className="text-[9px] uppercase font-bold mb-2 text-primary-dark tracking-widest">Reading Strategy</div>
                                    <div className="text-sm text-foreground/80 font-medium leading-relaxed italic">
                                        <RichTextRenderer content={data.reading_mnemonic} />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Structural Breakdown */}
                    {data.components && data.components.length > 0 && (
                        <div className="space-y-3">
                            <div className="text-[9px] uppercase font-bold text-foreground/20 tracking-widest pl-1">Structural Units</div>
                            <div className="flex flex-wrap gap-2">
                                {data.components.map((c, i) => (
                                    <div key={i} className="bg-surface border border-border px-4 py-2 rounded-xl flex items-center gap-2">
                                        <span className="font-bold text-foreground text-sm">{c.character}</span>
                                        <span className="text-[10px] text-foreground/40 font-bold uppercase tracking-tight">{c.meaning}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Context Samples */}
                    {data.examples && data.examples.length > 0 && (
                        <div className="space-y-4">
                            <div className="text-[9px] uppercase font-bold text-foreground/20 tracking-widest pl-1">Context Models</div>
                            <div className="space-y-3">
                                {data.examples.map((ex, i) => (
                                    <div key={i} className="bg-surface-muted/30 p-5 rounded-2xl border border-border">
                                        <div className="font-bold text-foreground text-lg mb-1 leading-tight">{ex.ja}</div>
                                        <div className="text-sm text-foreground/40 italic font-medium leading-tight">{ex.en}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <footer className="flex gap-3 pt-6 border-t border-border/60">
                    {onAddToLevel && (
                        <button
                            onClick={() => onAddToLevel(data)}
                            className="flex-[2] mn-btn mn-btn-primary !py-4"
                        >
                            {isToken ? 'SAVE UNIT' : 'MARK FOCUS'}
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className="flex-1 rounded-xl bg-surface border border-border text-[10px] font-bold text-foreground/40 uppercase tracking-widest hover:text-foreground hover:bg-surface-muted/30 transition-all"
                    >
                        DISMISS
                    </button>
                </footer>
            </div>
        </div>
    );
};


