import React from 'react';
import { BRAND_COLORS, CONTENT_TYPES, LEARNING_STATES } from '@/config/design.config';
import { Book, Info, Plus } from 'lucide-react';

interface DictionaryPanelProps {
    token?: any;
    entry?: any;
    onClose?: () => void;
}

function renderMeaning(meaning: any) {
    if (typeof meaning === 'string') return meaning;
    if (meaning.gloss) return meaning.gloss;
    return JSON.stringify(meaning);
}

export function DictionaryPanel({ token, entry }: DictionaryPanelProps) {
    if (!token && !entry) {
        return (
            <div className="p-10 text-sakura-cocoa/70 text-[10px] font-black uppercase tracking-widest text-center border border-sakura-divider rounded-[2rem] bg-white h-full flex flex-col items-center justify-center gap-4">
                <div className="w-12 h-12 bg-sakura-bg-soft rounded-2xl flex items-center justify-center border border-sakura-divider">
                    <Book className="text-sakura-cocoa/40" size={24} />
                </div>
                Select a word to see definition
            </div>
        );
    }

    // Handle analyzer token format
    if (token) {
        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="bg-white/90 border border-sakura-divider rounded-[2rem] p-8">
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                        <div className="flex flex-wrap items-baseline gap-3">
                            <h3 className="text-3xl font-black text-sakura-ink tracking-tighter uppercase leading-none">
                                {token.lemma || token.surface}
                            </h3>
                            <span className="text-sm font-bold text-sakura-cocoa/60">{token.reading}</span>
                        </div>

                        <button className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-purple-700 active:scale-95 transition-all">
                            <Plus size={14} /> Add to Deck
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-8">
                        <div className="p-3 bg-sakura-divider/20 border border-sakura-divider/40 rounded-xl">
                            <div className="text-[8px] font-black uppercase tracking-widest text-sakura-cocoa/60 mb-1">Part of Speech</div>
                            <div className="text-xs font-bold text-sakura-ink uppercase">{token.pos}</div>
                        </div>
                        {token.conjugation && token.conjugation.length > 0 && (
                            <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl">
                                <div className="text-[8px] font-black uppercase tracking-widest text-blue-400 mb-1">Conjugation</div>
                                <div className="text-xs font-bold text-blue-700 uppercase">{token.conjugation[0]}</div>
                            </div>
                        )}
                    </div>

                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-sakura-cocoa/70 uppercase tracking-widest flex items-center gap-2">
                            <Info size={14} /> Glossary Deep-Dive
                        </label>
                        <div className="space-y-4">
                            {token.dictionary?.meanings && token.dictionary.meanings.length > 0 ? (
                                <ul className="space-y-4">
                                    {token.dictionary.meanings.map((meaning, i) => (
                                        <li key={i} className="text-sm text-sakura-ink font-medium leading-relaxed bg-white p-4 rounded-2xl border border-sakura-divider/40 relative group overflow-hidden">
                                            {/* Subtle semantic indicator */}
                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-sakura-cocoa/10" />
                                            {renderMeaning(meaning)}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-xs text-sakura-cocoa/60 italic bg-white p-6 rounded-2xl border border-dashed border-sakura-divider">No detailed definition found for this token.</p>
                            )}
                        </div>
                    </div>

                    {token.dictionary?.source && (
                        <div className="mt-8 pt-4 border-t border-sakura-divider text-[8px] font-black uppercase tracking-widest text-sakura-cocoa/40 text-right">
                            Linked Index: {token.dictionary.source}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Handle direct dictionary entry format
    if (entry) {
        return (
            <div className="bg-white/90 border border-sakura-divider rounded-[2rem] p-8">
                <div className="flex items-baseline gap-3 mb-6">
                    <h3 className="text-2xl font-black text-sakura-ink uppercase tracking-tighter leading-none">{entry.expression}</h3>
                    <span className="text-sm font-bold text-sakura-cocoa/40">{entry.reading}</span>
                </div>

                <ul className="space-y-4">
                    {entry.meanings.map((m, i) => (
                        <li key={i} className="text-sm text-sakura-ink font-medium leading-relaxed bg-white p-4 rounded-2xl border border-sakura-divider/40">
                            {renderMeaning(m)}
                        </li>
                    ))}
                </ul>

                <div className="mt-8 pt-4 border-t border-sakura-divider flex justify-end">
                    {entry.source && <span className="text-[8px] font-black uppercase tracking-widest text-sakura-cocoa/20">{entry.source}</span>}
                </div>
            </div>
        );
    }
    return null;
}
