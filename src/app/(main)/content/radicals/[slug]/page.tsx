import React from 'react';
import { getLocalKU } from '@/features/knowledge/actions';
import Link from 'next/link';
import { RichTextRenderer } from '@/components/shared/RichTextRenderer';
import { ChevronLeft, Zap, Target, Layers, Info } from 'lucide-react';

export default async function RadicalDetailPage({ params }: { params: { slug: string } }) {
    const slug = decodeURIComponent(params.slug);
    const radical: any = await getLocalKU('radical', slug);

    if (!radical) return (
        <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="mn-card p-12 text-center">
                <h2 className="text-xl font-bold uppercase mb-4 text-foreground">Radical Not Found</h2>
                <Link href="/content?type=radical" className="mn-btn mn-btn-primary">BACK TO LIBRARY</Link>
            </div>
        </div>
    );

    return (
        <div className="max-w-5xl mx-auto py-12 px-8 space-y-12">
            <Link href="/content?type=radical" className="flex items-center gap-3 text-foreground/40 hover:text-primary-dark transition-all font-bold uppercase text-[10px] tracking-widest group">
                <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                Back to Radical Library
            </Link>

            {/* Premium Header Card */}
            <header className="premium-card p-12 bg-surface border-border flex flex-col md:flex-row items-center gap-12 relative overflow-hidden group">
                <div className="relative">
                    <div className="w-48 h-48 bg-primary/10 rounded-3xl flex items-center justify-center text-[100px] font-black text-foreground tracking-tighter border-b-4 border-primary/20 group-hover:scale-105 transition-transform duration-500 jp-text">
                        {radical.character || '？'}
                    </div>
                    <div className="absolute -top-3 -left-3 bg-foreground text-surface px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm">
                        LEVEL {radical.level}
                    </div>
                </div>

                <div className="flex-1 space-y-6 text-center md:text-left">
                    <div className="space-y-1">
                        <div className="text-[10px] font-bold text-primary-dark uppercase tracking-[0.3em] flex items-center gap-2 justify-center md:justify-start">
                            <Target size={14} />
                            Foundation Name
                        </div>
                        <h1 className="text-6xl font-black text-foreground tracking-tight uppercase leading-none">
                            {radical.meanings?.[0] || radical.meaning}
                        </h1>
                    </div>
                </div>
            </header>

            {/* Mnemonic Section */}
            <section className="premium-card p-12 bg-primary/5 border-primary/10 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-primary" />
                <div className="space-y-6">
                    <div className="flex items-center gap-3">
                        <Zap size={18} className="text-primary-dark" strokeWidth={3} />
                        <h2 className="text-[11px] font-bold text-foreground uppercase tracking-widest">Memory Hook</h2>
                    </div>
                    <div className="text-lg font-medium text-foreground/80 leading-relaxed pr-12">
                        <RichTextRenderer
                            content={radical.mnemonics?.meaning?.content || radical.mnemonics?.meaning || radical.mnemonics?.text || radical.ku_radicals?.mnemonic_story ||
                                "No mnemonic available for this foundational radical."}
                        />
                    </div>
                </div>
            </section>

            {/* Found In Kanji Section */}
            <section className="space-y-8">
                <div className="flex items-center gap-3">
                    <Layers size={18} className="text-primary-dark" />
                    <h2 className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">Integrated in Kanji</h2>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                    {radical.kanji?.map((k: any, i: number) => (
                        <Link
                            key={i}
                            href={`/content/kanji/${k.slug}`}
                            className="premium-card aspect-square flex flex-col items-center justify-center gap-1 bg-surface border-border hover:border-primary/40 transition-all active:scale-95 group"
                        >
                            <span className="text-4xl font-bold text-foreground group-hover:text-primary-dark transition-colors jp-text">{k.character}</span>
                            <span className="text-[8px] font-bold text-foreground/20 uppercase tracking-widest">{k.meaning}</span>
                        </Link>
                    ))}
                    {(radical.kanji || []).length === 0 && <div className="col-span-full py-12 mn-card !bg-surface-muted/30 border-dashed text-center text-foreground/20">No associated kanji links found yet.</div>}
                </div>
            </section>

            {/* Stats / Metadata */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="premium-card p-8 bg-surface border-border flex items-center justify-between group">
                    <div className="space-y-1">
                        <div className="text-[8px] font-bold text-foreground/20 uppercase tracking-widest">Mastery Level</div>
                        <div className="text-xl font-black text-foreground uppercase">NOT STARTED</div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-surface-muted flex items-center justify-center border border-border group-hover:border-primary/20 transition-colors">
                        <Info size={16} className="text-foreground/20" />
                    </div>
                </div>
                <div className="premium-card p-8 bg-surface border-border flex items-center justify-between group">
                    <div className="space-y-1">
                        <div className="text-[8px] font-bold text-foreground/20 uppercase tracking-widest">Next Phase</div>
                        <div className="text-xl font-black text-foreground uppercase">LEARNING I</div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/10">
                        <Zap size={16} className="text-primary-dark" />
                    </div>
                </div>
            </section>
        </div>
    );
}

