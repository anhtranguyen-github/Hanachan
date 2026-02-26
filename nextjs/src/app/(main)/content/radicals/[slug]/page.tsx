import React from 'react';
import { getLocalKU } from '@/features/knowledge/actions';
import Link from 'next/link';
import { RichTextRenderer } from '@/components/shared/RichTextRenderer';
import { ChevronLeft, Zap, Layers, Info, Target, Sparkles, BookOpen } from 'lucide-react';
import { clsx } from 'clsx';

export default async function RadicalDetailPage({ params }: { params: { slug: string } }) {
    const slug = decodeURIComponent(params.slug);
    const radical: any = await getLocalKU('radical', slug);

    if (!radical) return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-lg">
            <div className="mn-card p-2xl text-center max-w-md border border-border bg-surface">
                <Info size={32} className="text-primary-dark mx-auto mb-md" />
                <h2 className="text-h2 font-black uppercase mb-sm text-foreground tracking-tight">Radical Not Found</h2>
                <p className="text-body text-foreground/40 mb-xl">The data signature for this foundational radical could not be retrieved.</p>
                <Link href="/content?type=radical" className="mn-btn mn-btn-primary w-full">BACK TO ARCHIVES</Link>
            </div>
        </div>
    );

    const hasImage = !!radical.image_url;

    return (
        <div className="max-w-[1400px] mx-auto py-xl px-lg space-y-2xl animate-in fade-in slide-in-from-bottom-6 duration-1000">
            {/* Nav Header */}
            <div className="flex items-center justify-between">
                <Link href="/content?type=radical" className="flex items-center gap-sm text-foreground/30 hover:text-foreground transition-all group px-lg py-md bg-surface-muted/30 border border-border/50 rounded-2xl">
                    <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="text-metadata font-black uppercase tracking-[0.2em]">RADICAL ARCHIVES</span>
                </Link>
                <div className="flex items-center gap-sm">
                    <span className="text-metadata font-black text-foreground/20 uppercase tracking-widest">Entry ID:</span>
                    <code className="text-metadata font-bold text-primary-dark bg-primary/5 px-2 py-0.5 rounded-md border border-primary/10">{radical.id.slice(0, 8)}</code>
                </div>
            </div>

            {/* Immersive Hero Header */}
            <header className="relative p-xl bg-surface border border-border rounded-clay group overflow-hidden flex flex-col lg:flex-row items-center gap-xl shadow-2xl shadow-primary/5">
                <div className="relative shrink-0">
                    <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full opacity-30" />
                    <div className="relative w-64 h-64 bg-surface border-b-4 border-primary/10 rounded-clay flex items-center justify-center shadow-lg border border-border group-hover:scale-[1.02] transition-transform duration-700 overflow-hidden">
                        {hasImage ? (
                            <img src={radical.image_url} alt={radical.meaning} className="w-40 h-40 object-contain invert-[.05]" />
                        ) : (
                            <div className="text-8xl font-black text-foreground jp-text leading-none">{radical.character || '？'}</div>
                        )}
                        <div className="absolute top-6 left-6 bg-foreground text-surface px-4 py-1.5 rounded-xl text-metadata font-black uppercase tracking-widest shadow-lg">
                            L{radical.level}
                        </div>
                    </div>
                </div>

                <div className="flex-1 space-y-md text-center lg:text-left z-10 w-full">
                    <div className="space-y-sm">
                        <div className="flex items-center gap-sm justify-center lg:justify-start">
                            <Target size={14} className="text-primary-dark" />
                            <span className="text-metadata font-black text-primary-dark uppercase tracking-[0.4em]">FOUNDATION NAME</span>
                        </div>
                        <h1 className="text-h1 font-black text-foreground tracking-tight leading-tight uppercase truncate">
                            {radical.meanings?.[0] || radical.meaning}
                        </h1>
                    </div>

                    <div className="flex flex-wrap gap-sm justify-center lg:justify-start">
                        <div className="px-lg py-sm bg-surface-muted border border-border rounded-xl flex items-center gap-sm">
                            <Sparkles size={12} className="text-yellow-500" />
                            <span className="text-metadata font-black text-foreground uppercase tracking-widest">Mastery Efficiency: HIGH</span>
                        </div>
                        <div className="px-lg py-sm bg-surface-muted border border-border rounded-xl flex items-center gap-sm">
                            <Layers size={12} className="text-blue-500" />
                            <span className="text-metadata font-black text-foreground uppercase tracking-widest">{radical.kanji?.length || 0} Integrations</span>
                        </div>
                    </div>
                </div>
            </header>

            <div className="space-y-2xl">
                {/* Mnemonic Section */}
                <section className="relative p-xl bg-primary/5 border border-primary/10 rounded-clay space-y-lg overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-primary" />
                    <div className="flex items-center gap-sm">
                        <Zap size={18} className="text-primary-dark" strokeWidth={3} />
                        <h2 className="text-h3 font-black text-foreground uppercase tracking-[0.4em]">Memory Hook</h2>
                    </div>

                    <div className="text-h1-like-body font-medium text-foreground/70 leading-relaxed max-w-4xl">
                        <RichTextRenderer
                            content={radical.mnemonics?.meaning?.content || radical.mnemonics?.meaning || radical.mnemonics?.text || radical.ku_radicals?.mnemonic_story ||
                                "No mnemonic available for this foundational radical."}
                        />
                    </div>
                </section>

                {/* Kanji Integration Grid */}
                <section className="space-y-lg">
                    <div className="flex items-center justify-between border-b border-border/50 pb-md">
                        <div className="flex items-center gap-sm">
                            <BookOpen size={16} className="text-foreground/40" />
                            <h2 className="text-h3 font-black text-foreground uppercase tracking-[0.4em]">Integrations</h2>
                        </div>
                        <div className="text-metadata font-black text-foreground/40 bg-surface px-4 py-2 rounded-xl border border-border">
                            COUNT: {(radical.kanji || []).length}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-md">
                        {radical.kanji?.map((k: any, i: number) => (
                            <Link
                                key={i}
                                href={`/content/kanji/${k.slug}`}
                                className="premium-card aspect-square flex flex-col items-center justify-center p-sm bg-surface border-border hover:border-primary/40 transition-all group overflow-hidden h-[120px]"
                            >
                                <span className="text-3xl font-black text-foreground group-hover:text-primary-dark transition-all duration-500 jp-text">{k.character}</span>
                                <span className="text-metadata font-black text-foreground/20 uppercase tracking-widest mt-1 truncate w-full text-center px-2">{k.meaning}</span>
                            </Link>
                        ))}
                        {(radical.kanji || []).length === 0 && (
                            <div className="col-span-full py-xl rounded-clay bg-surface-muted/30 border-2 border-dashed border-border/50 flex flex-col items-center justify-center gap-sm">
                                <p className="text-metadata font-black text-foreground/10 uppercase tracking-[0.5em]">No cross-referenced kanji found</p>
                            </div>
                        )}
                    </div>
                </section>
            </div>

            {/* Mastery Widget System */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
                {['Current Status', 'Ref Slug', 'Phase'].map((label, i) => (
                    <div key={label} className="premium-card p-lg bg-surface border-border flex items-center justify-between h-[100px]">
                        <div className="space-y-1">
                            <div className="text-metadata font-black text-foreground/20 uppercase tracking-widest">{label}</div>
                            <div className="text-card-title font-black text-foreground uppercase tracking-tight truncate max-w-[150px]">
                                {i === 0 ? "NOT TACKLED" : i === 1 ? radical.slug.toUpperCase() : "FOUNDATION"}
                            </div>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-surface-muted flex items-center justify-center border border-border">
                            {i === 0 ? <Zap size={14} className="text-foreground/20" /> :
                                i === 1 ? <Layers size={14} className="text-foreground/20" /> :
                                    <Sparkles size={14} className="text-foreground/20" />}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
