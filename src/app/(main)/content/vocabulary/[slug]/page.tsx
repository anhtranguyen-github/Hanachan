import React from 'react';
import { getLocalKU } from '@/features/knowledge/actions';
import Link from 'next/link';
import { RichTextRenderer } from '@/components/shared/RichTextRenderer';
import { AudioPlayer } from '@/components/shared/AudioPlayer';
import { ChevronLeft, Zap, Target, Layers, PlayCircle, Info, Languages } from 'lucide-react';

export default async function VocabularyDetailPage({ params }: { params: { slug: string } }) {
    const slug = params.slug;
    const vocab: any = await getLocalKU('vocabulary', slug);

    if (!vocab) return (
        <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="mn-card p-12 text-center">
                <h2 className="text-xl font-bold uppercase mb-4 text-foreground">Vocabulary Not Found</h2>
                <Link href="/content?type=vocabulary" className="mn-btn mn-btn-primary">BACK TO LIBRARY</Link>
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
        <div className="max-w-5xl mx-auto py-12 px-8 space-y-12">
            <Link href="/content?type=vocabulary" className="flex items-center gap-3 text-foreground/40 hover:text-primary-dark transition-all font-bold uppercase text-[10px] tracking-widest group">
                <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                Back to Vocabulary Library
            </Link>

            {/* Premium Header Card */}
            <header className="premium-card p-12 bg-surface border-border flex flex-col md:flex-row items-center gap-12 relative overflow-hidden group">
                <div className="relative">
                    <div className="w-48 h-48 bg-primary/10 rounded-3xl flex items-center justify-center text-6xl font-black text-foreground tracking-tighter border-b-4 border-primary/20 group-hover:scale-105 transition-transform duration-500 jp-text text-center px-4 leading-tight">
                        {vocab.character}
                    </div>
                    <div className="absolute -top-3 -left-3 bg-foreground text-surface px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm">
                        LEVEL {vocab.level}
                    </div>
                </div>

                <div className="flex-1 space-y-6 text-center md:text-left">
                    <div className="space-y-2">
                        <div className="text-3xl font-bold text-primary-dark tracking-wide jp-text">{kuVocab.reading_primary}</div>
                        <h1 className="text-6xl font-black text-foreground tracking-tight uppercase leading-none">
                            {vocab.meanings?.[0] || vocab.meaning}
                        </h1>
                    </div>

                    <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                        {vocab.meanings?.slice(1).map((m: string, i: number) => (
                            <span key={i} className="px-3 py-1 bg-surface-muted rounded-lg text-sm font-bold text-foreground/40">
                                {m}
                            </span>
                        ))}
                    </div>

                    <div className="flex items-center gap-6 justify-center md:justify-start pt-2">
                        <AudioPlayer items={audioItems as any[]} showLabels />
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Meaning Explanation */}
                <section className="premium-card p-10 bg-surface border-border space-y-6">
                    <div className="flex items-center gap-3">
                        <Target size={18} className="text-primary-dark" />
                        <h2 className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">Meaning Strategy</h2>
                    </div>
                    <div className="text-lg font-medium text-foreground/70 leading-relaxed">
                        <RichTextRenderer content={kuVocab.meaning_data?.explanation || vocab.mnemonics?.meaning || "No meaning mnemonic found."} />
                    </div>
                </section>

                {/* Reading Explanation */}
                <section className="premium-card p-10 bg-primary/5 border-primary/10 space-y-6">
                    <div className="flex items-center gap-3">
                        <PlayCircle size={18} className="text-primary-dark" />
                        <h2 className="text-[10px] font-bold text-foreground/60 uppercase tracking-widest">Reading Strategy</h2>
                    </div>
                    <div className="text-lg font-medium text-foreground/80 leading-relaxed">
                        <RichTextRenderer content={kuVocab.reading_data?.explanation || vocab.mnemonics?.reading || "No reading mnemonic available."} />
                    </div>
                </section>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Kanji Composition */}
                <section className="premium-card p-10 md:col-span-2 bg-surface border-border space-y-8">
                    <div className="flex items-center gap-3">
                        <Layers size={18} className="text-primary-dark" />
                        <h2 className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">Structural Components</h2>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {vocab.kanji?.map((k: any, i: number) => (
                            <Link key={i} href={`/content/kanji/${k.character || k.slug}`} className="flex flex-col items-center gap-2 p-6 rounded-xl bg-surface-muted/50 border border-border hover:border-primary/40 transition-all group">
                                <span className="text-4xl font-bold text-foreground jp-text group-hover:scale-105 transition-transform">{k.character}</span>
                                <span className="text-[9px] font-bold text-foreground/30 uppercase tracking-widest text-center leading-tight">{k.meaning}</span>
                            </Link>
                        ))}
                    </div>
                </section>

                {/* Metadata */}
                <section className="premium-card p-10 bg-surface border-border space-y-8">
                    <div className="flex items-center gap-3">
                        <Info size={18} className="text-foreground/40" />
                        <h2 className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">Attributes</h2>
                    </div>
                    <div className="space-y-6">
                        <div className="space-y-1">
                            <span className="text-[8px] font-bold text-foreground/20 uppercase tracking-widest">Grammar Class</span>
                            <div className="text-sm font-bold text-foreground">{(kuVocab.parts_of_speech || []).join(', ') || 'N/A'}</div>
                        </div>
                        <div className="space-y-2">
                            <span className="text-[8px] font-bold text-foreground/20 uppercase tracking-widest">Accent Pattern</span>
                            <div className="flex flex-wrap gap-2">
                                {pitchEntries.map((p: any, idx: number) => (
                                    <span key={idx} className="bg-surface-muted text-foreground/60 px-3 py-1 rounded-lg border border-border text-[9px] font-bold">
                                        PATTERN: {p.type}
                                    </span>
                                ))}
                                {pitchEntries.length === 0 && <span className="text-xs text-foreground/20">No data</span>}
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            {/* Context Sentences */}
            <section className="space-y-8">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Languages size={18} className="text-primary-dark" />
                        <h2 className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">Usage Context</h2>
                    </div>
                    <div className="px-4 py-1.5 rounded-lg bg-surface border border-border text-[9px] font-bold text-foreground/30 uppercase tracking-widest">
                        {(vocab.sentences || []).length} SAMPLES
                    </div>
                </div>

                <div className="space-y-4">
                    {(vocab.sentences || []).map((s: any, i: number) => (
                        <div key={i} className="premium-card p-10 bg-surface border-border group hover:bg-surface-muted/30 transition-all overflow-hidden relative">
                            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary/20 group-hover:bg-primary transition-colors" />
                            <div className="space-y-4 pl-4">
                                <div className="text-3xl font-bold text-foreground jp-text leading-relaxed tracking-tight group-hover:text-primary-dark transition-colors">{s.text_ja}</div>
                                <div className="text-lg text-foreground/40 font-medium">“{s.text_en}”</div>
                            </div>
                        </div>
                    ))}
                    {(vocab.sentences || []).length === 0 && <div className="premium-card p-12 text-center text-foreground/20 border-dashed">No sample sentences currently available.</div>}
                </div>
            </section>
        </div>
    );
}

