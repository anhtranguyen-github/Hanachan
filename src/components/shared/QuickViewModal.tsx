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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6" data-testid="quick-view-modal">
            <div className="absolute inset-0 bg-[#3E4A61]/60 backdrop-blur-[8px]" onClick={onClose} />
            <div className="relative bg-white w-full max-w-xl rounded-[48px] shadow-3xl overflow-hidden animate-in zoom-in-95 duration-500 max-h-[90vh] flex flex-col">
                <div className="p-8 pb-0 flex justify-between items-start shrink-0">
                    <div className="flex gap-2">
                        <span className="px-4 py-1.5 bg-[#FFF5F5] text-[#FFB5B5] text-[9px] font-black uppercase tracking-widest rounded-xl border border-[#FFDADA]">
                            {data.ku_type || (isToken ? 'TOKEN' : 'GRAMMAR')}
                        </span>
                        {data.level && (
                            <span className="px-4 py-1.5 bg-[#F7FAFC] text-[#A0AEC0] text-[9px] font-black uppercase tracking-widest rounded-xl border border-[#EDF2F7]">LEV {data.level}</span>
                        )}
                    </div>
                    <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#F7FAFC] text-[#CBD5E0] hover:text-[#3E4A61] transition-all border border-[#EDF2F7]">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-10 space-y-8 overflow-y-auto custom-scrollbar flex-1 mb-2">
                    <div className="flex items-center gap-8">
                        <div className="w-32 h-32 bg-white border border-[#F0E0E0] rounded-[40px] flex items-center justify-center shadow-inner shrink-0 group">
                            <span className="text-7xl font-black text-[#FFB5B5] leading-none group-hover:scale-110 transition-transform" data-testid="quick-view-character">{data.title}</span>
                            <div className="absolute top-2 right-2">
                                {data.audio_items && <AudioPlayer items={data.audio_items} />}
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-0.5">
                                <p className="text-[8px] font-black text-[#CBD5E0] uppercase tracking-widest">Meaning</p>
                                <h3 className="text-3xl font-black text-[#3E4A61] tracking-tighter uppercase">{data.meaning}</h3>
                            </div>
                            {data.reading && (
                                <div className="space-y-0.5">
                                    <p className="text-[8px] font-black text-[#CBD5E0] uppercase tracking-widest">Reading</p>
                                    <p className="text-xl font-black text-[#3E4A61]/80">{data.reading}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {(data.explanation || data.reading_mnemonic) && (
                        <div className="p-6 bg-[#F7FAFC] border border-[#F0E0E0] rounded-[24px] text-xs font-bold text-[#3E4A61]/70 leading-relaxed italic space-y-4">
                            {data.explanation && (
                                <div>
                                    <div className="text-[7px] uppercase font-black mb-1 text-[#CBD5E0] tracking-widest not-italic">Meaning Strategy</div>
                                    <RichTextRenderer content={data.explanation} />
                                </div>
                            )}
                            {data.reading_mnemonic && (
                                <div className="pt-4 border-t border-[#EDF2F7]">
                                    <div className="text-[7px] uppercase font-black mb-1 text-[#FFB5B5] tracking-widest not-italic">Reading Strategy</div>
                                    <RichTextRenderer content={data.reading_mnemonic} />
                                </div>
                            )}
                        </div>
                    )}

                    {data.components && data.components.length > 0 && (
                        <div className="space-y-3">
                            <h4 className="text-[8px] font-black text-[#A0AEC0] uppercase tracking-widest">Structural Units</h4>
                            <div className="flex flex-wrap gap-2">
                                {data.components.map((c, i) => (
                                    <div key={i} className="bg-white border border-[#F0E0E0] px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm">
                                        <span className="font-bold text-[#FFB5B5] text-sm">{c.character}</span>
                                        <span className="text-[9px] text-[#A0AEC0] font-black uppercase tracking-tight">{c.meaning}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {data.examples && data.examples.length > 0 && (
                        <div className="space-y-4">
                            <h4 className="text-[8px] font-black text-[#A0AEC0] uppercase tracking-widest">Context Models</h4>
                            <div className="space-y-3">
                                {data.examples.map((ex, i) => (
                                    <div key={i} className="bg-[#F7FAFC] p-5 rounded-2xl border border-[#F0E0E0]">
                                        <div className="font-bold text-[#3E4A61] text-lg mb-1 leading-tight">{ex.ja}</div>
                                        <div className="text-xs text-[#A0AEC0] italic font-medium leading-tight">{ex.en}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-8 pt-0 flex gap-3 shrink-0">
                    <button onClick={onClose} className="flex-1 py-4 bg-[#F7FAFC] rounded-[20px] text-[10px] font-black uppercase text-[#A0AEC0] hover:text-[#3E4A61] transition-all">CLOSE</button>
                    {onAddToDeck && (
                        <button onClick={() => onAddToDeck(data)} className="flex-[2] py-4 bg-[#3E4A61] text-white rounded-[20px] text-[10px] font-black uppercase flex items-center justify-center gap-2 shadow-lg hover:bg-[#2D3748] transition-all">
                            {isToken ? 'SAVE UNIT' : 'MARK FOCUS'}
                        </button>
                    )}
                    {!onAddToDeck && (
                        <Link
                            href={`/content/${data.ku_type?.toLowerCase() === 'vocabulary' ? 'vocabulary' : data.ku_type?.toLowerCase() === 'radical' ? 'radicals' : data.ku_type?.toLowerCase() || 'kanji'}/${data.title}`}
                            className="flex-[2] py-4 bg-[#FFB5B5] text-white rounded-[20px] text-[10px] font-black uppercase flex items-center justify-center gap-2 shadow-lg transition-all"
                        >
                            OPEN FULL PAGE
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
};


