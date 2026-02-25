import React from 'react';
import { getGrammarBySlug, GrammarData } from '@/lib/grammar-loader';
import Link from 'next/link';
import { ChevronLeft, BookOpen, Lightbulb, Info, Target, PlayCircle, Layers, ExternalLink, Volume2, AlertTriangle } from 'lucide-react';
import { clsx } from 'clsx';

export default async function GrammarDetailPage({ params }: { params: { slug: string } }) {
    const slug = decodeURIComponent(params.slug);
    const grammar: GrammarData | null = getGrammarBySlug(slug);

    if (!grammar) return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-surface-muted rounded-full flex items-center justify-center border border-border">
                <Info size={32} className="text-foreground/20" />
            </div>
            <h1 className="text-2xl font-black text-foreground uppercase tracking-tighter">Grammar Not Found</h1>
            <p className="text-foreground/40 text-sm">Could not find: {slug}</p>
            <Link href="/content?type=grammar" className="mn-btn mn-btn-primary">Return to Library</Link>
        </div>
    );

    const jlptLevel = 6 - Math.ceil((grammar.level || 1) / 10);

    return (
        <div className="max-w-6xl mx-auto py-12 px-8">
            {/* Breadcrumbs */}
            <div className="mb-12">
                <Link
                    href="/content?type=grammar"
                    className="flex items-center gap-2 text-foreground/40 hover:text-primary-dark font-bold text-[10px] uppercase tracking-widest transition-all group"
                >
                    <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    Back to Library
                </Link>
            </div>

            {/* Header section */}
            <header className="flex flex-col md:flex-row items-start md:items-end justify-between gap-8 mb-16">
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="px-3 py-1 rounded-lg bg-primary/20 text-foreground text-[10px] font-bold uppercase tracking-widest border border-primary/20">
                            Grammar Point
                        </div>
                        <div className="px-3 py-1 rounded-lg bg-surface-muted text-foreground/40 text-[10px] font-bold uppercase tracking-widest border border-border">
                            JLPT N{jlptLevel} • LEVEL {grammar.level}
                        </div>
                        {grammar.details.register && grammar.details.register !== '一般' && (
                            <div className="px-3 py-1 rounded-lg bg-secondary/20 text-secondary text-[10px] font-bold uppercase tracking-widest border border-secondary/20">
                                {grammar.details.register}
                            </div>
                        )}
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-6xl font-black text-foreground tracking-tight leading-none jp-text">
                            {grammar.title}
                        </h1>
                        {grammar.title_with_furigana && grammar.title_with_furigana !== grammar.title && (
                            <p className="text-xl font-bold text-foreground/40 jp-text">
                                {grammar.title_with_furigana}
                            </p>
                        )}
                    </div>
                    {/* Meanings Pills */}
                    <div className="flex flex-wrap gap-2 pt-2">
                        {grammar.meanings.map((m, i) => (
                            <div key={i} className="px-4 py-2 rounded-xl bg-primary/10 border border-primary/10 text-base font-bold text-foreground tracking-tight">
                                {m}
                            </div>
                        ))}
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="lg:col-span-2 space-y-12">
                    {/* About / Description */}
                    <section className="space-y-6">
                        <div className="flex items-center gap-3">
                            <Target size={18} className="text-primary-dark" />
                            <h2 className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">Explanation</h2>
                        </div>
                        <div className="premium-card p-10 bg-surface border-border">
                            <div className="text-lg leading-relaxed text-foreground/80 tracking-tight font-medium whitespace-pre-line">
                                {grammar.about.text || grammar.about.description || "No description provided."}
                            </div>
                        </div>
                    </section>

                    {/* Examples Section */}
                    {grammar.examples && grammar.examples.length > 0 && (
                        <section className="space-y-6">
                            <div className="flex items-center gap-3">
                                <PlayCircle size={18} className="text-secondary" />
                                <h2 className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">
                                    Example Sentences ({grammar.examples.length})
                                </h2>
                            </div>
                            <div className="space-y-4">
                                {grammar.examples.slice(0, 8).map((ex, i) => (
                                    <div key={i} className="premium-card p-8 bg-surface border-border group hover:bg-surface-muted/30 transition-all relative overflow-hidden">
                                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary/20 group-hover:bg-primary transition-colors" />
                                        <div className="space-y-4 pl-4">
                                            {/* Sentence with highlighted grammar point */}
                                            <div className="text-2xl font-bold text-foreground jp-text leading-relaxed">
                                                {ex.sentence_structure && ex.sentence_structure.length > 0 ? (
                                                    ex.sentence_structure.map((part, idx) => (
                                                        <span
                                                            key={idx}
                                                            className={clsx(
                                                                part.type === 'grammar_point' && "text-primary-dark bg-primary/10 px-1 rounded"
                                                            )}
                                                        >
                                                            {part.content}
                                                        </span>
                                                    ))
                                                ) : (
                                                    ex.sentence_text
                                                )}
                                            </div>
                                            <div className="text-base text-foreground/50 font-medium">
                                                {ex.translation}
                                            </div>
                                            {ex.audio_url && (
                                                <a
                                                    href={ex.audio_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-2 text-[10px] font-bold text-primary-dark uppercase tracking-widest hover:underline"
                                                >
                                                    <Volume2 size={14} />
                                                    Play Audio
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Cautions Section */}
                    {grammar.cautions && grammar.cautions.length > 0 && (
                        <section className="space-y-6">
                            <div className="flex items-center gap-3">
                                <AlertTriangle size={18} className="text-accent" />
                                <h2 className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">Important Notes</h2>
                            </div>
                            <div className="premium-card p-8 bg-accent/5 border-accent/20">
                                <ul className="space-y-4">
                                    {grammar.cautions.map((c, i) => (
                                        <li key={i} className="flex gap-3 text-sm font-medium text-foreground/80 leading-relaxed">
                                            <span className="text-accent font-bold shrink-0">⚠</span>
                                            <span>{c.text}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </section>
                    )}
                </div>

                <aside className="space-y-12">
                    {/* Structure/Patterns */}
                    {grammar.structure && (grammar.structure.patterns?.length > 0 || grammar.structure.variants) && (
                        <section className="space-y-6">
                            <div className="flex items-center gap-3">
                                <Layers size={18} className="text-primary-dark" />
                                <h2 className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">Construction</h2>
                            </div>
                            <div className="premium-card p-8 bg-surface border-border space-y-6">
                                {grammar.structure.variants?.standard && (
                                    <div className="space-y-2">
                                        <div className="text-[8px] uppercase font-bold text-foreground/20 tracking-widest">Standard</div>
                                        <div className="text-base font-bold text-foreground border-l-2 border-primary/40 pl-4 jp-text">
                                            {grammar.structure.variants.standard}
                                        </div>
                                    </div>
                                )}
                                {grammar.structure.variants?.polite && (
                                    <div className="space-y-2">
                                        <div className="text-[8px] uppercase font-bold text-foreground/20 tracking-widest">Polite</div>
                                        <div className="text-base font-bold text-foreground border-l-2 border-secondary/40 pl-4 jp-text">
                                            {grammar.structure.variants.polite}
                                        </div>
                                    </div>
                                )}
                                {!grammar.structure.variants?.standard && grammar.structure.patterns && (
                                    <div className="space-y-3">
                                        {grammar.structure.patterns.map((p, i) => (
                                            <div key={i} className="text-sm font-bold text-foreground border-b border-border pb-2 last:border-0 jp-text">{p}</div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </section>
                    )}

                    {/* Details */}
                    {(grammar.details.part_of_speech || grammar.details.word_type) && (
                        <section className="space-y-6">
                            <div className="flex items-center gap-3">
                                <Info size={18} className="text-foreground/40" />
                                <h2 className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">Details</h2>
                            </div>
                            <div className="premium-card p-6 bg-surface-muted/30 border-border space-y-3">
                                {grammar.details.part_of_speech && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-foreground/40 font-medium">Part of Speech</span>
                                        <span className="font-bold text-foreground">{grammar.details.part_of_speech}</span>
                                    </div>
                                )}
                                {grammar.details.word_type && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-foreground/40 font-medium">Type</span>
                                        <span className="font-bold text-foreground">{grammar.details.word_type}</span>
                                    </div>
                                )}
                                {grammar.details.register && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-foreground/40 font-medium">Register</span>
                                        <span className="font-bold text-foreground">{grammar.details.register}</span>
                                    </div>
                                )}
                            </div>
                        </section>
                    )}

                    {/* Related Grammar */}
                    {grammar.related && grammar.related.length > 0 && (
                        <section className="space-y-6">
                            <div className="flex items-center gap-3">
                                <BookOpen size={18} className="text-secondary" />
                                <h2 className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">Related Grammar ({grammar.related.length})</h2>
                            </div>
                            <div className="space-y-3">
                                {grammar.related.slice(0, 6).map((rel, i) => (
                                    <Link
                                        key={i}
                                        href={`/content/grammar/${encodeURIComponent(rel.slug)}`}
                                        className="block p-5 premium-card bg-surface border-border hover:border-primary/20 transition-all group"
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="space-y-1">
                                                <div className="font-bold text-foreground group-hover:text-primary-dark transition-colors tracking-tight jp-text">
                                                    {rel.title}
                                                </div>
                                                <div className="text-xs text-foreground/40 font-medium">
                                                    {rel.meaning}
                                                </div>
                                            </div>
                                            <div className="text-[10px] font-bold text-foreground/20 shrink-0">
                                                N{6 - parseInt(rel.level) || rel.level}
                                            </div>
                                        </div>
                                        {rel.comparison_text && (
                                            <div className="mt-3 pt-3 border-t border-border text-xs text-foreground/50 leading-relaxed line-clamp-3">
                                                {rel.comparison_text.substring(0, 200)}...
                                            </div>
                                        )}
                                    </Link>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Resources */}
                    {grammar.resources && (grammar.resources.online?.length > 0 || grammar.resources.offline?.length > 0) && (
                        <section className="space-y-6">
                            <div className="flex items-center gap-3">
                                <ExternalLink size={18} className="text-foreground/40" />
                                <h2 className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">Resources</h2>
                            </div>
                            <div className="premium-card p-6 bg-surface border-border space-y-4">
                                {grammar.resources.online?.map((r, i) => (
                                    <a
                                        key={i}
                                        href={r.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-between text-sm hover:text-primary-dark transition-colors"
                                    >
                                        <span className="font-medium text-foreground/70 truncate pr-2">{r.title}</span>
                                        <span className="text-[9px] font-bold text-foreground/30 uppercase shrink-0">{r.source}</span>
                                    </a>
                                ))}
                                {grammar.resources.offline?.map((r, i) => (
                                    <div key={i} className="text-sm text-foreground/50">
                                        📚 {r.book} - {r.page}
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </aside>
            </div>
        </div>
    );
}
