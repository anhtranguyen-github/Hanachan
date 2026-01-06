'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/ui/components/PageHeader';
import { PenTool, Trash2, ExternalLink, Bookmark, Search, Filter, BookOpen, Clock } from 'lucide-react';
import { fetchMinedSentencesAction } from '@/features/mining/actions';
import { Button } from '@/ui/components/ui/button';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

export default function SentenceMiningPage() {
    const [sentences, setSentences] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadMined();
    }, []);

    const loadMined = async () => {
        setLoading(true);
        try {
            const data = await fetchMinedSentencesAction();
            setSentences(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-20 animate-in fade-in duration-500">
            <PageHeader
                title="Sentence Mining"
                subtitle="Manage sentences you've mined from transcripts and analysis"
                icon={PenTool}
                iconColor="text-emerald-500"
            />

            {loading ? (
                <div className="text-center py-20 animate-pulse text-slate-400 font-bold uppercase tracking-widest">
                    Synchronizing collection...
                </div>
            ) : sentences.length === 0 ? (
                <div className="text-center py-24 bg-slate-50 rounded-[48px] border-2 border-dashed border-slate-200">
                    <PenTool className="w-16 h-16 text-slate-200 mx-auto mb-6" />
                    <h3 className="text-2xl font-black text-slate-600 uppercase tracking-tighter">Your collection is empty</h3>
                    <p className="text-slate-400 mt-2 font-medium">Mine sentences from YouTube videos or text analysis to see them here.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {sentences.map((s) => (
                        <div key={s.id} className="group p-10 rounded-[48px] bg-white border border-slate-100 shadow-xl shadow-slate-200/40 hover:border-emerald-200 transition-all duration-500 relative overflow-hidden">

                            <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-16 -mt-16 group-hover:bg-emerald-50 transition-colors"></div>

                            <div className="flex justify-between items-start relative z-10 mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="px-4 py-1.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest border border-slate-200">
                                        {s.source_type || 'Custom'}
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        <Clock size={12} />
                                        {formatDistanceToNow(new Date(s.created_at))} ago
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-6 relative z-10">
                                <p className="text-3xl md:text-4xl font-black text-slate-900 font-japanese leading-relaxed">
                                    {s.text_ja}
                                </p>
                                <div className="h-1 w-16 bg-emerald-100 rounded-full group-hover:w-full group-hover:bg-gradient-to-r from-emerald-400 to-teal-400 transition-all duration-1000"></div>
                                <p className="text-xl text-slate-500 font-bold leading-relaxed tracking-tight group-hover:text-slate-800 transition-colors">
                                    {s.text_en || 'No translation provided'}
                                </p>
                            </div>

                            {s.user_sentence_cards && s.user_sentence_cards.length > 0 && (
                                <div className="mt-10 pt-10 border-t border-slate-50 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {s.user_sentence_cards.map((card: any) => (
                                        <div key={card.id} className="p-6 rounded-3xl bg-emerald-50/50 border border-emerald-100 flex items-center justify-between group/card transition-all hover:bg-emerald-50">
                                            <div>
                                                <div className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Target Word</div>
                                                <div className="text-xl font-black text-emerald-900 font-japanese">{card.front}</div>
                                                <div className="text-sm font-bold text-emerald-600 mt-1 opacity-70">{card.back}</div>
                                            </div>
                                            <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center text-emerald-300 shadow-sm opacity-0 group-hover/card:opacity-100 transition-all">
                                                <BookOpen size={18} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
