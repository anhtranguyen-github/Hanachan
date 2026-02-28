import React from 'react';
import { getLocalKU } from '@/features/knowledge/actions';
import Link from 'next/link';
import { RichTextRenderer } from '@/components/shared/RichTextRenderer';
import { ChevronLeft, Zap, Layers, Info, Target, Sparkles, BookOpen } from 'lucide-react';
import { KUInlineChat } from '@/features/chat/components/KUInlineChat';

export const dynamic = "force-dynamic";


export default async function RadicalDetailPage({ params }: { params: { slug: string } }) {
    const slug = decodeURIComponent(params.slug);
    const radical: any = await getLocalKU('radical', slug);

    if (!radical) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
            <div className="bg-white border border-border rounded-3xl p-8 text-center max-w-sm w-full shadow-sm">
                <Info size={28} className="text-primary mx-auto mb-4" />
                <h2 className="text-lg font-black uppercase mb-2 text-foreground">Radical Not Found</h2>
                <p className="text-sm text-foreground/40 mb-6">This radical could not be retrieved.</p>
                <Link href="/content?type=radical" className="block w-full py-3 bg-primary text-white rounded-2xl text-xs font-black uppercase tracking-widest text-center hover:opacity-90 transition-opacity">
                    Back to Radicals
                </Link>
            </div>
        </div>
    );

    const hasImage = !!radical.image_url;
    const meanings = radical.meanings || [radical.meaning];

    return (
        <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-700 pb-8">
            {/* Breadcrumb */}
            <Link href="/content?type=radical" className="inline-flex items-center gap-2 text-foreground/40 hover:text-foreground transition-colors group text-sm">
                <ChevronLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
                <span className="font-bold uppercase tracking-widest text-[10px]">Radicals</span>
            </Link>

            {/* Hero */}
            <header className="bg-white border border-border rounded-3xl overflow-hidden shadow-sm">
                <div className="flex flex-col sm:flex-row items-stretch">
                    {/* Character block */}
                    <div className="relative flex items-center justify-center bg-gradient-to-br from-[#A2D2FF]/10 to-[#A2D2FF]/5 border-b sm:border-b-0 sm:border-r border-border p-8 sm:p-10 shrink-0 sm:w-48 lg:w-56">
                        <div className="absolute top-3 left-3">
                            <span className="px-2 py-1 bg-foreground text-white rounded-lg text-[9px] font-black uppercase tracking-widest">L{radical.level}</span>
                        </div>
                        <div className="flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24">
                            {hasImage ? (
                                <img src={radical.image_url} alt={radical.meaning} className="w-full h-full object-contain" />
                            ) : (
                                <span className="text-6xl sm:text-7xl font-black text-[#3A6EA5] jp-text leading-none select-none">
                                    {radical.character || '？'}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Info block */}
                    <div className="flex-1 p-6 sm:p-8 space-y-4">
                        <div>
                            <p className="text-[9px] font-black text-[#3A6EA5] uppercase tracking-[0.3em] mb-1">Foundation Name</p>
                            <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight leading-tight">
                                {meanings[0]}
                            </h1>
                            {meanings.length > 1 && (
                                <p className="text-sm text-foreground/30 font-bold mt-1 truncate">
                                    {meanings.slice(1).join(' · ')}
                                </p>
                            )}
                        </div>

                        <div className="flex flex-wrap gap-2 pt-2 border-t border-border/30">
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#A2D2FF]/10 border border-[#A2D2FF]/20 rounded-xl">
                                <Sparkles size={10} className="text-[#3A6EA5]" />
                                <span className="text-[9px] font-black text-[#3A6EA5] uppercase tracking-widest">Foundation</span>
                            </div>
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-muted border border-border rounded-xl">
                                <Layers size={10} className="text-foreground/40" />
                                <span className="text-[9px] font-black text-foreground/50 uppercase tracking-widest">{radical.kanji?.length || 0} Kanji</span>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Mnemonic */}
            <div className="bg-white border border-border rounded-3xl p-6 space-y-3 shadow-sm">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-[#A2D2FF]/15 rounded-xl flex items-center justify-center">
                        <Zap size={14} className="text-[#3A6EA5]" />
                    </div>
                    <h2 className="text-sm font-black text-foreground uppercase tracking-widest">Memory Hook</h2>
                </div>
                <div className="text-sm text-foreground/70 leading-relaxed">
                    <RichTextRenderer
                        content={radical.mnemonics?.meaning?.content || radical.mnemonics?.meaning || radical.mnemonics?.text || radical.ku_radicals?.mnemonic_story || "No mnemonic available for this radical."}
                    />
                </div>
            </div>

            {/* Kanji that use this radical */}
            {(radical.kanji || []).length > 0 && (
                <section className="bg-white border border-border rounded-3xl p-6 space-y-4 shadow-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-surface-muted rounded-xl flex items-center justify-center">
                            <BookOpen size={14} className="text-foreground/40" />
                        </div>
                        <h2 className="text-sm font-black text-foreground uppercase tracking-widest">Kanji Using This Radical</h2>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-9 gap-2">
                        {(radical.kanji || []).map((k: any, i: number) => (
                            <Link
                                key={i}
                                href={`/content/kanji/${k.slug}`}
                                className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-surface-muted/40 border border-border hover:border-primary/30 hover:bg-primary/5 transition-all group aspect-square"
                            >
                                <span className="text-2xl font-black text-foreground group-hover:text-primary-dark transition-colors jp-text leading-none">{k.character}</span>
                                <span className="text-[8px] font-black text-foreground/30 uppercase tracking-wide text-center truncate w-full px-1">{k.meaning}</span>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {/* Chat Agent */}
            <KUInlineChat
                kuId={radical.id}
                kuType="radical"
                character={radical.character || '?'}
                meaning={radical.meaning}
            />
        </div>
    );
}
