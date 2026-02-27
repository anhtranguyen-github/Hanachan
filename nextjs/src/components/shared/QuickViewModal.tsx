'use client';

import Link from 'next/link';
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
    slug: string;
    raw?: any;
}

interface QuickViewModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: QuickViewData | null;
    onAddToDeck?: (data: QuickViewData) => void;
}

export const QuickViewModal: React.FC<QuickViewModalProps> = ({ isOpen, onClose, data, onAddToDeck }) => {
    if (!isOpen || !data) return null;

    const isToken = data.type === 'TOKEN';

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6" data-testid="quick-view-modal">
            <div className="absolute inset-0 bg-[#3E4A61]/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white w-full sm:max-w-lg rounded-t-[32px] sm:rounded-[32px] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-400 max-h-[85vh] flex flex-col">
                {/* Header */}
                <div className="px-5 pt-5 pb-0 flex justify-between items-center shrink-0">
                    <div className="flex gap-1.5">
                        <span className="px-3 py-1 bg-[#FFF5F5] text-[#FFB5B5] text-[8px] font-black uppercase tracking-widest rounded-lg border border-[#FFDADA]">
                            {data.ku_type || (isToken ? 'TOKEN' : 'GRAMMAR')}
                        </span>
                        {data.level && (
                            <span className="px-3 py-1 bg-[#F7FAFC] text-[#A0AEC0] text-[8px] font-black uppercase tracking-widest rounded-lg border border-[#EDF2F7]">L{data.level}</span>
                        )}
                    </div>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl bg-[#F7FAFC] text-[#CBD5E0] hover:text-[#3E4A61] transition-all border border-[#EDF2F7]">
                        <X size={16} />
                    </button>
                </div>

                <div className="p-5 space-y-5 overflow-y-auto custom-scrollbar flex-1">
                    {/* Character + info row */}
                    <div className="flex items-center gap-5">
                        <div className="relative w-20 h-20 bg-[#FFF5F5] border border-[#F0E0E0] rounded-3xl flex items-center justify-center shadow-inner shrink-0">
                            <span className="text-4xl font-black text-[#FFB5B5] leading-none jp-text" data-testid="quick-view-character">{data.title}</span>
                            {data.audio_items && data.audio_items.length > 0 && (
                                <div className="absolute -bottom-2 -right-2">
                                    <AudioPlayer items={data.audio_items} />
                                </div>
                            )}
                        </div>
                        <div className="space-y-2 min-w-0 flex-1">
                            <div>
                                <p className="text-[8px] font-black text-[#CBD5E0] uppercase tracking-widest mb-0.5">Meaning</p>
                                <h3 className="text-xl font-black text-[#3E4A61] tracking-tight leading-tight">{data.meaning}</h3>
                            </div>
                            {data.reading && (
                                <div>
                                    <p className="text-[8px] font-black text-[#CBD5E0] uppercase tracking-widest mb-0.5">Reading</p>
                                    <p className="text-base font-black text-[#3E4A61]/70 jp-text">{data.reading}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {(data.explanation || data.reading_mnemonic) && (
                        <div className="p-4 bg-[#F7FAFC] border border-[#F0E0E0] rounded-2xl text-xs font-medium text-[#3E4A61]/70 leading-relaxed space-y-3">
                            {data.explanation && (
                                <div>
                                    <div className="text-[7px] uppercase font-black mb-1 text-[#CBD5E0] tracking-widest">Meaning</div>
                                    <RichTextRenderer content={data.explanation} />
                                </div>
                            )}
                            {data.reading_mnemonic && (
                                <div className="pt-3 border-t border-[#EDF2F7]">
                                    <div className="text-[7px] uppercase font-black mb-1 text-[#FFB5B5] tracking-widest">Reading</div>
                                    <RichTextRenderer content={data.reading_mnemonic} />
                                </div>
                            )}
                        </div>
                    )}

                    {data.components && data.components.length > 0 && (
                        <div className="space-y-2">
                            <h4 className="text-[8px] font-black text-[#A0AEC0] uppercase tracking-widest">Components</h4>
                            <div className="flex flex-wrap gap-1.5">
                                {data.components.map((c, i) => (
                                    <div key={i} className="bg-white border border-[#F0E0E0] px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm">
                                        <span className="font-bold text-[#FFB5B5] text-sm jp-text">{c.character}</span>
                                        <span className="text-[8px] text-[#A0AEC0] font-black uppercase tracking-tight">{c.meaning}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {data.examples && data.examples.length > 0 && (
                        <div className="space-y-2">
                            <h4 className="text-[8px] font-black text-[#A0AEC0] uppercase tracking-widest">Examples</h4>
                            <div className="space-y-2">
                                {data.examples.slice(0, 3).map((ex, i) => (
                                    <div key={i} className="bg-[#F7FAFC] p-3.5 rounded-2xl border border-[#F0E0E0]">
                                        <div className="font-bold text-[#3E4A61] text-sm mb-1 leading-snug jp-text">{ex.ja}</div>
                                        <div className="text-xs text-[#A0AEC0] font-medium leading-snug">"{ex.en}"</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer actions */}
                <div className="px-5 pb-5 pt-3 flex gap-2.5 shrink-0 border-t border-[#F0E0E0]">
                    <button onClick={onClose} className="flex-1 py-3 bg-[#F7FAFC] rounded-2xl text-[9px] font-black uppercase text-[#A0AEC0] hover:text-[#3E4A61] transition-all border border-[#EDF2F7]">Close</button>
                    {onAddToDeck && (
                        <button onClick={() => onAddToDeck(data)} className="flex-[2] py-3 bg-[#3E4A61] text-white rounded-2xl text-[9px] font-black uppercase flex items-center justify-center gap-2 shadow-md hover:bg-[#2D3748] transition-all">
                            {isToken ? 'Save Unit' : 'Mark Focus'}
                        </button>
                    )}
                    {!onAddToDeck && (
                        <Link
                            href={`/content/${data.ku_type?.toLowerCase() === 'vocabulary' ? 'vocabulary' : data.ku_type?.toLowerCase() === 'radical' ? 'radicals' : data.ku_type?.toLowerCase() || 'kanji'}/${data.slug}`}
                            className="flex-[2] py-3 bg-primary text-white rounded-2xl text-[9px] font-black uppercase flex items-center justify-center gap-2 shadow-md transition-all hover:opacity-90"
                        >
                            Open Full Page
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
};


