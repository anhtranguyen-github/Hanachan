import React from 'react';
import { getLocalKU } from '@/features/knowledge/actions';
import Link from 'next/link';
import { RichTextRenderer } from '@/components/shared/RichTextRenderer';
import { AudioPlayer } from '@/components/shared/AudioPlayer';
import { ChevronLeft, Zap, Target, Layers, PlayCircle, Info, Languages, Sparkles, Volume2, Bookmark, Activity } from 'lucide-react';
import { clsx } from 'clsx';

export default async function VocabularyDetailPage({ params }: { params: { slug: string } }) {
    const slug = decodeURIComponent(params.slug);
    const vocab: any = await getLocalKU('vocabulary', slug);

    if (!vocab) return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-lg">
            <div className="mn-card p-2xl text-center max-w-md bg-surface border-border shadow-2xl">
                <Bookmark size={32} className="text-primary-dark mx-auto mb-md" />
                <h2 className="text-h2 font-black uppercase mb-sm text-foreground tracking-tight">Vocabulary Not Found</h2>
                <p className="text-body text-foreground/40 mb-xl font-medium">The linguistic pattern for this vocabulary unit is missing from the curriculum archives.</p>
                <Link href="/content?type=vocabulary" className="mn-btn mn-btn-primary w-full shadow-xl shadow-primary/20">BACK TO CURRICULUM</Link>
            </div>
        </div>
    );

    const kuVocab = vocab.ku_vocabulary || {};
    const pitch = kuVocab.pitch_accent_data || kuVocab.pitch;
    const pitchEntries = Array.isArray(pitch) ? pitch : (pitch ? [pitch] : []);

    const audioData = kuVocab.audio_data;
    let audioItems: any[] = [];
    if (Array.isArray(audioData)) {
        audioItems = audioData;
    } else if (audioData && typeof audioData === 'object') {
        audioItems = Object.values(audioData);
    }

    return (
        <div className="max-w-[1400px] mx-auto py-xl px-lg space-y-2xl animate-in fade-in slide-in-from-bottom-8 duration-1000">
            {/* Nav Header */}
            <div className="flex items-center justify-between">
                <Link href="/content?type=vocabulary" className="flex items-center gap-sm text-foreground/30 hover:text-foreground transition-all group px-lg py-md bg-surface-muted/30 border border-border/50 rounded-2xl">
                    <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="text-metadata font-black uppercase tracking-[0.2em]">VOCABULARY ARCHIVES</span>
                </Link>
                <div />
            </div>

            {/* Spectacular Hero Header - Normalized */}
            <header className="relative flex flex-col lg:flex-row items-center gap-xl p-xl bg-surface border border-border rounded-clay shadow-2xl shadow-primary/5 group overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[120px] -mr-32 -mt-32 pointer-events-none" />

                <div className="relative shrink-0">
                    <div className="absolute inset-0 bg-primary/20 blur-[100px] opacity-20 rounded-full" />
                    <div className="relative w-64 h-64 lg:w-kanji-hero lg:h-kanji-hero max-w-[450px] aspect-square bg-surface border-b-[8px] border-primary/10 rounded-clay flex items-center justify-center shadow-lg border border-border group-hover:scale-[1.01] transition-transform duration-700 overflow-hidden text-center px-lg">
                        <span className="text-7xl lg:text-[100px] font-black text-foreground jp-text leading-none">{vocab.character}</span>
                        <div className="absolute top-8 left-8 bg-foreground text-surface px-6 py-2 rounded-2xl text-metadata font-black uppercase tracking-widest shadow-lg">
                            L{vocab.level}
                        </div>
                    </div>
                </div>

                <div className="flex-1 space-y-lg text-center lg:text-left z-10 w-full overflow-hidden">
                    <div className="space-y-sm overflow-hidden">
                        <div className="flex items-center gap-sm justify-center lg:justify-start">
                            <Sparkles size={14} className="text-primary-dark" />
                            <span className="text-metadata font-black text-primary-dark uppercase tracking-[0.4em]">Phonetic Signature</span>
                        </div>
                        <h2 className="text-h2 font-black text-foreground/40 tracking-tighter jp-text truncate max-w-full">
                            {kuVocab.reading_primary}
                        </h2>
                        <h1 className="text-h1 font-black text-foreground tracking-tightest leading-tight uppercase truncate">
                            {vocab.meanings?.[0] || vocab.meaning}
                        </h1>
                        <div className="flex flex-wrap gap-sm justify-center lg:justify-start">
                            {vocab.meanings?.slice(1).map((m: string, i: number) => (
                                <span key={i} className="text-h3 font-black text-foreground/10 uppercase tracking-tighter italic truncate max-w-[200px]">{m}</span>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-sm justify-center lg:justify-start">
                        <div className="p-sm bg-surface rounded-2xl border-2 border-border shadow-xl hover:shadow-primary/10 transition-all flex items-center h-16 shrink-0 gap-4">
                            <AudioPlayer items={audioItems as any[]} showLabels />
                        </div>
                    </div>
                </div>
            </header>

            {/* Strategy Matrix */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-xl">

                {/* Meaning Anchor Strategy */}
                <div className="xl:col-span-6">
                    <section className="relative p-xl bg-primary/5 border border-primary/10 rounded-clay space-y-lg overflow-hidden group/m h-full flex flex-col">
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-primary/40 group-hover/m:bg-primary transition-colors duration-700" />
                        <div className="flex items-center gap-sm">
                            <Target size={18} className="text-primary-dark" />
                            <h2 className="text-h3 font-black text-foreground uppercase tracking-[0.4em]">Anchor Strategy</h2>
                        </div>
                        <div className="text-body font-medium text-foreground/80 leading-relaxed indent-lg overflow-hidden first-letter:text-6xl first-letter:font-black first-letter:text-primary-dark first-letter:float-left first-letter:mr-4 first-letter:mt-1 flex-1">
                            <RichTextRenderer content={kuVocab.meaning_data?.explanation || vocab.mnemonics?.meaning || "No anchor strategy currently indexed."} />
                        </div>
                    </section>
                </div>

                {/* Acoustic Strategy */}
                <div className="xl:col-span-6">
                    <section className="relative p-xl bg-surface border border-border rounded-clay space-y-lg overflow-hidden group/r h-full flex flex-col">
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-foreground/10 group-hover/r:bg-foreground transition-colors duration-700" />
                        <div className="flex items-center gap-sm">
                            <PlayCircle size={18} className="text-foreground/40" />
                            <h2 className="text-h3 font-black text-foreground/40 uppercase tracking-[0.4em]">Acoustic Recall</h2>
                        </div>
                        <div className="text-body font-medium text-foreground/60 leading-relaxed indent-lg overflow-hidden first-letter:text-6xl first-letter:font-black first-letter:text-foreground/30 first-letter:float-left first-letter:mr-4 first-letter:mt-1 flex-1">
                            <RichTextRenderer content={kuVocab.reading_data?.explanation || vocab.mnemonics?.reading || "No reading strategy currently indexed for this unit."} />
                        </div>
                    </section>
                </div>

                {/* Composition & Metadata Matrix */}
                <div className="xl:col-span-12 grid grid-cols-1 lg:grid-cols-12 gap-xl pt-lg">
                    {/* Integrated Components */}
                    <div className="lg:col-span-8 p-xl bg-surface border border-border rounded-clay shadow-xl group">
                        <div className="flex items-center justify-between border-b border-border/50 pb-lg mb-xl">
                            <div className="flex items-center gap-sm">
                                <div className="p-sm bg-primary/5 rounded-2xl">
                                    <Layers size={18} className="text-primary-dark" />
                                </div>
                                <div className="space-y-1">
                                    <h2 className="text-h3 font-black text-foreground uppercase tracking-[0.4em]">Integrated Nodes</h2>
                                    <p className="text-metadata font-bold text-foreground/20 uppercase tracking-widest italic">Semantic building blocks</p>
                                </div>
                            </div>
                            <div />
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-lg">
                            {vocab.kanji?.map((k: any, i: number) => (
                                <Link key={i} href={`/content/kanji/${k.character || k.slug}`} className="flex flex-col items-center justify-center gap-sm p-lg rounded-[2.5rem] bg-surface-muted/30 border border-border hover:border-primary/20 hover:scale-[1.02] transition-all group/node h-[120px]">
                                    <span className="text-4xl font-black text-foreground group-hover/node:text-primary-dark transition-colors jp-text">{k.character}</span>
                                    <span className="text-metadata font-black text-foreground/20 uppercase tracking-widest text-center truncate w-full px-2">{k.meaning}</span>
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Metadata Pane */}
                    <div className="lg:col-span-4 p-xl bg-surface border border-border rounded-clay space-y-xl flex flex-col h-full">
                        <div className="flex items-center gap-sm border-b border-border/50 pb-lg">
                            <Info size={16} className="text-foreground/40" />
                            <h2 className="text-metadata font-black text-foreground/40 uppercase tracking-[0.4em]">Classification</h2>
                        </div>

                        <div className="space-y-xl flex-1 flex flex-col justify-center">
                            <div className="space-y-sm">
                                <span className="text-metadata font-black text-foreground/20 uppercase tracking-[0.2em]">Grammar Type</span>
                                <div className="flex flex-wrap gap-sm">
                                    {(kuVocab.parts_of_speech || []).map((pos: string) => (
                                        <span key={pos} className="px-3 py-1 bg-surface-muted border border-border rounded-lg text-metadata font-black text-foreground/60 uppercase tracking-widest">{pos}</span>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-sm">
                                <span className="text-metadata font-black text-foreground/20 uppercase tracking-[0.2em]">Pitch Pattern</span>
                                <div className="space-y-sm">
                                    {pitchEntries.map((p: any, idx: number) => (
                                        <div key={idx} className="flex items-center gap-sm p-sm bg-primary/5 border border-primary/10 rounded-xl group/pitch overflow-hidden">
                                            <Activity size={12} className="text-primary-dark shrink-0" />
                                            <div className="flex flex-col truncate">
                                                <div className="text-metadata font-black text-primary-dark uppercase tracking-widest truncate">{p.type.toUpperCase()}</div>
                                                <div className="text-[10px] font-black text-foreground/20 uppercase tracking-widest italic truncate">{p.description || "Active Profile"}</div>
                                            </div>
                                        </div>
                                    ))}
                                    {pitchEntries.length === 0 && <span className="text-metadata font-black text-foreground/10 uppercase tracking-widest italic">No profile data indexed.</span>}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Immersive Usage Scenarios */}
            <section className="space-y-xl">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-xl px-lg pb-xl border-b-2 border-border/50">
                    <div className="space-y-sm">
                        <div className="flex items-center gap-sm">
                            <Languages size={18} className="text-primary-dark" />
                            <h2 className="text-h3 font-black text-foreground uppercase tracking-[0.6em]">Linguistic Scenarios</h2>
                        </div>
                        <p className="text-metadata font-bold text-foreground/20 uppercase tracking-widest italic">Samples of linguistic utilization from the database</p>
                    </div>
                </div>

                <div className="space-y-lg">
                    {(vocab.sentences || []).map((s: any, i: number) => (
                        <div key={i} className="relative p-xl bg-surface border border-border rounded-clay group hover:bg-surface-muted/30 transition-all duration-700 overflow-hidden shadow-xl hover:shadow-2xl hover:shadow-primary/5">
                            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary/10 group-hover:bg-primary transition-all duration-700" />
                            <div className="space-y-md pl-md relative z-10 w-full overflow-hidden">
                                <div className="text-h2 font-black text-foreground jp-text leading-relaxed tracking-tightest group-hover:text-primary-dark transition-colors duration-700 truncate min-h-[1.5em]">{s.ja}</div>
                                <div className="flex items-start gap-sm overflow-hidden">
                                    <Volume2 size={16} className="text-foreground/10 shrink-0 mt-1" />
                                    <div className="text-body font-bold text-foreground/40 italic truncate max-w-full">“{s.en}”</div>
                                </div>
                            </div>
                        </div>
                    ))}
                    {(vocab.sentences || []).length === 0 && (
                        <div className="p-2xl rounded-clay bg-surface-muted/10 border-2 border-dashed border-border flex flex-col items-center justify-center gap-lg opacity-40">
                            <Bookmark size={32} className="text-foreground/10" />
                            <p className="text-h3 font-black text-foreground/40 uppercase tracking-[0.5em]">No Simulation Data</p>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
