import React from 'react';
import { getLocalKU } from '@/features/knowledge/actions';
import Link from 'next/link';
import { RichTextRenderer } from '@/components/shared/RichTextRenderer';
import { AudioPlayer } from '@/components/shared/AudioPlayer';
import { ChevronLeft, Zap, Target, Layers, PlayCircle, Info, Languages, Sparkles, Volume2, Bookmark, Activity } from 'lucide-react';
import { KUInlineChat } from '@/features/chat/components/KUInlineChat';

export const dynamic = "force-dynamic";


export default async function VocabularyDetailPage({ params }: { params: { slug: string } }) {
    const slug = decodeURIComponent(params.slug);
    const vocab: any = await getLocalKU('vocabulary', slug);

    if (!vocab) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
            <div className="bg-white border border-border rounded-3xl p-8 text-center max-w-sm w-full shadow-sm">
                <Bookmark size={28} className="text-primary mx-auto mb-4" />
                <h2 className="text-lg font-black uppercase mb-2 text-foreground">Vocabulary Not Found</h2>
                <p className="text-sm text-foreground/40 mb-6">This vocabulary unit could not be retrieved.</p>
                <Link href="/content?type=vocabulary" className="block w-full py-3 bg-primary text-white rounded-2xl text-xs font-black uppercase tracking-widest text-center hover:opacity-90 transition-opacity">
                    Back to Vocabulary
                </Link>
            </div>
        </div>
    );

    const kuVocab = vocab.ku_vocabulary || {};
    const pitch = kuVocab.pitch_accent_data || kuVocab.pitch;
    const pitchEntries = Array.isArray(pitch) ? pitch : (pitch ? [pitch] : []);

    const audioData = kuVocab.audio_data;
    let audioItems: any[] = [];
    if (Array.isArray(audioData)) audioItems = audioData;
    else if (audioData && typeof audioData === 'object') audioItems = Object.values(audioData);

    const meanings = vocab.meanings || [vocab.meaning];
    const reading = kuVocab.reading_primary || vocab.readings?.[0] || '';

    return (
        <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-700 pb-8">
            {/* Breadcrumb */}
            <Link href="/content?type=vocabulary" className="inline-flex items-center gap-2 text-foreground/40 hover:text-foreground transition-colors group text-sm">
                <ChevronLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
                <span className="font-bold uppercase tracking-widest text-[10px]">Vocabulary</span>
            </Link>

            {/* Hero */}
            <header className="bg-white border border-border rounded-3xl overflow-hidden shadow-sm">
                <div className="flex flex-col sm:flex-row items-stretch">
                    {/* Character block */}
                    <div className="relative flex items-center justify-center bg-gradient-to-br from-[#CDB4DB]/10 to-[#CDB4DB]/5 border-b sm:border-b-0 sm:border-r border-border p-8 sm:p-10 shrink-0 sm:w-48 lg:w-56">
                        <div className="absolute top-3 left-3">
                            <span className="px-2 py-1 bg-foreground text-white rounded-lg text-[9px] font-black uppercase tracking-widest">L{vocab.level}</span>
                        </div>
                        {vocab.jlpt && (
                            <div className="absolute top-3 right-3">
                                <span className="px-2 py-1 bg-[#CDB4DB]/20 text-[#9B7DB5] rounded-lg text-[9px] font-black uppercase tracking-widest border border-[#CDB4DB]/30">N{vocab.jlpt}</span>
                            </div>
                        )}
                        <span className="text-5xl sm:text-6xl font-black text-foreground jp-text leading-none select-none text-center">
                            {vocab.character}
                        </span>
                    </div>

                    {/* Info block */}
                    <div className="flex-1 p-6 sm:p-8 space-y-4">
                        <div>
                            {reading && (
                                <p className="text-base sm:text-lg font-black text-foreground/40 jp-text mb-1">{reading}</p>
                            )}
                            <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight leading-tight">
                                {meanings[0]}
                            </h1>
                            {meanings.length > 1 && (
                                <p className="text-sm text-foreground/30 font-bold mt-1 truncate">
                                    {meanings.slice(1).join(' · ')}
                                </p>
                            )}
                        </div>

                        {/* Audio + metadata */}
                        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-border/30">
                            {audioItems.length > 0 && (
                                <div className="flex items-center bg-surface-muted border border-border rounded-2xl px-3 py-2">
                                    <AudioPlayer items={audioItems as any[]} showLabels />
                                </div>
                            )}
                            {(kuVocab.parts_of_speech || []).map((pos: string) => (
                                <span key={pos} className="px-2.5 py-1 bg-surface-muted border border-border rounded-xl text-[9px] font-black text-foreground/50 uppercase tracking-widest">{pos}</span>
                            ))}
                            {pitchEntries.length > 0 && (
                                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-primary/8 border border-primary/15 rounded-xl">
                                    <Activity size={10} className="text-primary-dark" />
                                    <span className="text-[9px] font-black text-primary-dark uppercase tracking-widest">{pitchEntries[0]?.type || 'Pitch'}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Mnemonics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-white border border-border rounded-3xl p-6 space-y-3 shadow-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-primary/10 rounded-xl flex items-center justify-center">
                            <Target size={14} className="text-primary-dark" />
                        </div>
                        <h2 className="text-sm font-black text-foreground uppercase tracking-widest">Meaning Mnemonic</h2>
                    </div>
                    <div className="text-sm text-foreground/70 leading-relaxed">
                        <RichTextRenderer content={kuVocab.meaning_data?.explanation || vocab.mnemonics?.meaning || "No mnemonic available."} />
                    </div>
                </div>

                <div className="bg-white border border-border rounded-3xl p-6 space-y-3 shadow-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-surface-muted rounded-xl flex items-center justify-center">
                            <PlayCircle size={14} className="text-foreground/40" />
                        </div>
                        <h2 className="text-sm font-black text-foreground/50 uppercase tracking-widest">Reading Mnemonic</h2>
                    </div>
                    <div className="text-sm text-foreground/60 leading-relaxed">
                        <RichTextRenderer content={kuVocab.reading_data?.explanation || vocab.mnemonics?.reading || "No reading mnemonic available."} />
                    </div>
                </div>
            </div>

            {/* Kanji components */}
            {(vocab.kanji || []).length > 0 && (
                <section className="bg-white border border-border rounded-3xl p-6 space-y-4 shadow-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-primary/10 rounded-xl flex items-center justify-center">
                            <Layers size={14} className="text-primary-dark" />
                        </div>
                        <h2 className="text-sm font-black text-foreground uppercase tracking-widest">Component Kanji</h2>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 gap-2">
                        {(vocab.kanji || []).map((k: any, i: number) => (
                            <Link
                                key={i}
                                href={`/content/kanji/${k.character || k.slug}`}
                                className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-surface-muted/40 border border-border hover:border-primary/30 hover:bg-primary/5 transition-all group aspect-square"
                            >
                                <span className="text-2xl font-black text-foreground group-hover:text-primary-dark transition-colors jp-text leading-none">{k.character}</span>
                                <span className="text-[8px] font-black text-foreground/30 uppercase tracking-wide text-center truncate w-full px-1">{k.meaning}</span>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {/* Example sentences */}
            {(vocab.sentences || []).length > 0 && (
                <section className="bg-white border border-border rounded-3xl p-6 space-y-4 shadow-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-surface-muted rounded-xl flex items-center justify-center">
                            <Languages size={14} className="text-foreground/40" />
                        </div>
                        <h2 className="text-sm font-black text-foreground uppercase tracking-widest">Example Sentences</h2>
                    </div>
                    <div className="space-y-3">
                        {(vocab.sentences || []).map((s: any, i: number) => (
                            <div key={i} className="relative p-4 bg-surface-muted/30 border border-border rounded-2xl group hover:border-primary/20 transition-all overflow-hidden">
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/20 group-hover:bg-primary transition-colors rounded-l-2xl" />
                                <div className="pl-3 space-y-1.5">
                                    <p className="text-base font-black text-foreground jp-text leading-relaxed">{s.ja}</p>
                                    <p className="text-sm text-foreground/40 font-medium leading-snug">"{s.en}"</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Chat Agent */}
            <KUInlineChat
                kuId={vocab.id}
                kuType="vocabulary"
                character={vocab.character || vocab.slug}
                meaning={vocab.meaning}
                extraContext={reading ? `Reading: ${reading}` : undefined}
            />
        </div>
    );
}
