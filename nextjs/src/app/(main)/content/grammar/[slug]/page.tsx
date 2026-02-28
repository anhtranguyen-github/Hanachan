import React from 'react';
import { getLocalKU } from '@/features/knowledge/actions';
import Link from 'next/link';
import { RichTextRenderer } from '@/components/shared/RichTextRenderer';
import { ChevronLeft, Zap, Target, Layers, Info, BookOpen, ExternalLink, Globe, Sparkles, Activity, Bookmark, Flame } from 'lucide-react';
import { KUInlineChat } from '@/features/chat/components/KUInlineChat';
import sanitizeHtml from 'sanitize-html';

export const dynamic = "force-dynamic";

const SANITIZE_CONFIG = {
    allowedTags: ['ruby', 'rt', 'rp', 'mark', 'span', 'br', 'p', 'strong', 'em', 'b', 'i'],
    allowedAttributes: {
        '*': ['class']
    }
};

export default async function GrammarDetailPage({ params }: { params: { slug: string } }) {
    const slug = decodeURIComponent(params.slug);
    const grammar: any = await getLocalKU('grammar', slug);

    if (!grammar) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
            <div className="bg-white border border-border rounded-3xl p-8 text-center max-w-sm w-full shadow-sm">
                <Flame size={28} className="text-primary mx-auto mb-4" />
                <h2 className="text-lg font-black uppercase mb-2 text-foreground">Grammar Not Found</h2>
                <p className="text-sm text-foreground/40 mb-6">This grammar point could not be retrieved.</p>
                <Link href="/content?type=grammar" className="block w-full py-3 bg-primary text-white rounded-2xl text-xs font-black uppercase tracking-widest text-center hover:opacity-90 transition-opacity">
                    Back to Grammar
                </Link>
            </div>
        </div>
    );

    const details = grammar.ku_grammar || {};
    const structure = grammar.structure || {};
    const resources = grammar.resources || { online: [], offline: [] };
    const related = grammar.related_grammar || [];

    return (
        <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-700 pb-8">
            {/* Breadcrumb */}
            <Link href="/content?type=grammar" className="inline-flex items-center gap-2 text-foreground/40 hover:text-foreground transition-colors group text-sm">
                <ChevronLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
                <span className="font-bold uppercase tracking-widest text-[10px]">Grammar</span>
            </Link>

            {/* Hero */}
            <header className="bg-white border border-border rounded-3xl overflow-hidden shadow-sm">
                <div className="flex flex-col sm:flex-row items-stretch">
                    {/* Character/form block */}
                    <div className="relative flex items-center justify-center bg-gradient-to-br from-[#B7E4C7]/15 to-[#B7E4C7]/5 border-b sm:border-b-0 sm:border-r border-border p-6 sm:p-8 shrink-0 sm:w-48 lg:w-56">
                        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                            <span className="px-2 py-1 bg-foreground text-white rounded-lg text-[9px] font-black uppercase tracking-widest">L{grammar.level}</span>
                            {grammar.jlpt && (
                                <span className="px-2 py-1 bg-[#B7E4C7]/30 text-[#5A9E72] rounded-lg text-[9px] font-black uppercase tracking-widest border border-[#B7E4C7]/40">N{grammar.jlpt}</span>
                            )}
                        </div>
                        <span className="text-3xl sm:text-4xl font-black text-[#5A9E72] jp-text leading-tight text-center select-none max-w-[140px] break-words">
                            {grammar.character || grammar.meaning}
                        </span>
                    </div>

                    {/* Info block */}
                    <div className="flex-1 p-6 sm:p-8 space-y-4">
                        <div>
                            <p className="text-[9px] font-black text-[#5A9E72] uppercase tracking-[0.3em] mb-1">Grammar Point</p>
                            <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight leading-tight">
                                {grammar.meaning}
                            </h1>
                        </div>

                        {/* Structure preview */}
                        {structure.variants && Object.values(structure.variants).filter(Boolean).length > 0 && (
                            <div className="pt-2 border-t border-border/30">
                                <p className="text-[9px] font-black text-foreground/30 uppercase tracking-widest mb-2">Structure</p>
                                <div className="flex flex-wrap gap-2">
                                    {Object.entries(structure.variants).filter(([, v]) => v).slice(0, 2).map(([name, code]: [string, any]) => (
                                        <div key={name} className="px-3 py-1.5 bg-[#B7E4C7]/10 border border-[#B7E4C7]/20 rounded-xl">
                                            <span className="text-xs font-black text-[#5A9E72] jp-text" dangerouslySetInnerHTML={{ __html: sanitizeHtml(typeof code === 'string' ? code : JSON.stringify(code), SANITIZE_CONFIG) }} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Main content: explanation + sidebar */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Left: explanation + examples */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Explanation */}
                    <div className="bg-white border border-border rounded-3xl p-6 space-y-3 shadow-sm">
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-[#B7E4C7]/20 rounded-xl flex items-center justify-center">
                                <Zap size={14} className="text-[#5A9E72]" />
                            </div>
                            <h2 className="text-sm font-black text-foreground uppercase tracking-widest">Explanation</h2>
                        </div>
                        <div className="text-sm text-foreground/70 leading-relaxed">
                            <RichTextRenderer content={details.explanation || grammar.mnemonics?.meaning || "No explanation available."} />
                        </div>
                    </div>

                    {/* Example sentences */}
                    {(grammar.sentences || []).length > 0 && (
                        <div className="bg-white border border-border rounded-3xl p-6 space-y-4 shadow-sm">
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 bg-surface-muted rounded-xl flex items-center justify-center">
                                    <Globe size={14} className="text-foreground/40" />
                                </div>
                                <h2 className="text-sm font-black text-foreground uppercase tracking-widest">Example Sentences</h2>
                            </div>
                            <div className="space-y-3">
                                {(grammar.sentences || []).slice(0, 8).map((s: any, i: number) => (
                                    <div key={i} className="relative p-4 bg-surface-muted/30 border border-border rounded-2xl group hover:border-[#B7E4C7]/40 transition-all overflow-hidden">
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#B7E4C7]/40 group-hover:bg-[#B7E4C7] transition-colors rounded-l-2xl" />
                                        <div className="pl-3 space-y-1.5">
                                            <p
                                                className="text-base font-black text-foreground jp-text leading-relaxed"
                                                dangerouslySetInnerHTML={{ __html: sanitizeHtml(s.ja, SANITIZE_CONFIG) }}
                                            />
                                            <p className="text-sm text-foreground/40 font-medium leading-snug">"{s.en}"</p>
                                        </div>
                                        <span className="absolute top-3 right-3 text-[9px] font-black text-foreground/10">#{i + 1}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right: structure + related + resources */}
                <div className="space-y-4">
                    {/* Full structure */}
                    {structure.variants && Object.entries(structure.variants).filter(([, v]) => v).length > 0 && (
                        <div className="bg-white border border-border rounded-3xl p-5 space-y-3 shadow-sm">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 bg-[#B7E4C7]/15 rounded-lg flex items-center justify-center">
                                    <Layers size={12} className="text-[#5A9E72]" />
                                </div>
                                <h2 className="text-xs font-black text-foreground/50 uppercase tracking-widest">Structure</h2>
                            </div>
                            <div className="space-y-2">
                                {Object.entries(structure.variants).filter(([, v]) => v).map(([name, code]: [string, any]) => {
                                    const displayMap = typeof code === 'object' ? code : { [name]: code };
                                    return Object.entries(displayMap).map(([subName, html]: [string, any]) => (
                                        <div key={subName} className="space-y-1">
                                            <span className="text-[8px] font-black uppercase tracking-widest text-foreground/20">{subName}</span>
                                            <div
                                                className="p-2.5 bg-surface-muted/40 rounded-xl border border-border text-xs font-black text-foreground/60 jp-text leading-relaxed"
                                                dangerouslySetInnerHTML={{ __html: sanitizeHtml(html, SANITIZE_CONFIG) }}
                                            />
                                        </div>
                                    ));
                                })}
                            </div>
                        </div>
                    )}

                    {/* Related grammar */}
                    {related.length > 0 && (
                        <div className="bg-white border border-border rounded-3xl p-5 space-y-3 shadow-sm">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 bg-surface-muted rounded-lg flex items-center justify-center">
                                    <BookOpen size={12} className="text-foreground/30" />
                                </div>
                                <h2 className="text-xs font-black text-foreground/50 uppercase tracking-widest">Related</h2>
                            </div>
                            <div className="space-y-1.5">
                                {related.slice(0, 5).map((relObj: any, i: number) => {
                                    const rel = relObj.related;
                                    return (
                                        <Link
                                            key={i}
                                            href={`/content/grammar/${rel.slug}`}
                                            className="flex items-center gap-2.5 p-3 rounded-2xl bg-surface-muted/30 border border-transparent hover:border-[#B7E4C7]/30 hover:bg-[#B7E4C7]/5 transition-all group"
                                        >
                                            <span className="text-sm font-black text-foreground/60 group-hover:text-[#5A9E72] transition-colors jp-text truncate flex-1">{rel.character || rel.meaning}</span>
                                            <ChevronLeft size={11} className="text-foreground/10 rotate-180 group-hover:text-[#5A9E72] shrink-0 transition-colors" />
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* External resources */}
                    {(resources.online || []).length > 0 && (
                        <div className="bg-white border border-border rounded-3xl p-5 space-y-3 shadow-sm">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 bg-surface-muted rounded-lg flex items-center justify-center">
                                    <ExternalLink size={12} className="text-foreground/30" />
                                </div>
                                <h2 className="text-xs font-black text-foreground/50 uppercase tracking-widest">Resources</h2>
                            </div>
                            <div className="space-y-1.5">
                                {(resources.online || []).slice(0, 3).map((link: any, i: number) => (
                                    <a
                                        key={i}
                                        href={link.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex items-center justify-between p-3 rounded-2xl border border-border hover:border-[#B7E4C7]/30 transition-all group"
                                    >
                                        <span className="text-xs font-black text-foreground/40 group-hover:text-[#5A9E72] transition-colors uppercase tracking-wide truncate">{link.label || 'Resource'}</span>
                                        <ChevronLeft size={11} className="text-foreground/10 rotate-180 group-hover:text-[#5A9E72] shrink-0 transition-colors" />
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Chat Agent */}
            <KUInlineChat
                kuId={grammar.id}
                kuType="grammar"
                character={grammar.character || grammar.meaning}
                meaning={grammar.meaning}
                extraContext={grammar.jlpt ? `JLPT N${grammar.jlpt}` : undefined}
            />
        </div>
    );
}
