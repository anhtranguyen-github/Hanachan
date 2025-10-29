
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { BookOpen, Languages, ScrollText, PlayCircle, History, Zap, ChevronRight } from 'lucide-react';
import { SRSStatusBadge } from '@/lib/SRSStatusBadge';

async function getKUDetail(slug: string, userId: string) {
    const supabase = createClient();

    // Fetch base KU and its specific data
    const { data: ku, error } = await supabase
        .from('knowledge_units')
        .select(`
            *,
            ku_kanji (*),
            ku_vocabulary (*),
            ku_grammar (*),
            user_learning_states (*)
        `)
        .eq('slug', slug)
        .eq('user_learning_states.user_id', userId)
        .single();

    if (error || !ku) return null;
    return ku;
}

export default async function UnitDetailPage({ params }: { params: { slug: string } }) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const ku = await getKUDetail(params.slug, user.id);
    if (!ku) notFound();

    const learningState = ku.user_learning_states?.[0];

    return (
        <div className="max-w-4xl mx-auto space-y-12 pb-20">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pt-12">
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <span className="px-3 py-1 rounded-full bg-zinc-800 text-[10px] font-black uppercase tracking-widest text-zinc-400 border border-white/5">
                            {ku.type}
                        </span>
                        {learningState && (
                            <div className="scale-90 origin-left">
                                <SRSStatusBadge state={learningState.state} />
                            </div>
                        )}
                    </div>
                    <h1 className="text-7xl font-black tracking-tighter text-white">
                        {ku.search_key}
                    </h1>
                </div>

                <div className="flex gap-4">
                    <button className="px-6 py-3 rounded-2xl bg-sakura-accent-primary text-white font-bold text-sm shadow-xl shadow-sakura-accent-primary/20 hover:scale-105 transition-transform">
                        Add to Review
                    </button>
                </div>
            </header>

            {/* Content Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <main className="md:col-span-2 space-y-12">
                    {/* Primary Data */}
                    <section className="p-8 rounded-[40px] bg-zinc-900/40 border border-white/5 space-y-6">
                        {ku.type === 'kanji' && ku.ku_kanji?.[0] && (
                            <div className="space-y-8">
                                <div>
                                    <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Meaning</h3>
                                    <p className="text-3xl font-bold text-white leading-tight">
                                        {ku.ku_kanji[0].meaning_data?.primary || 'N/A'}
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 gap-8">
                                    <div>
                                        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Onyomi</h3>
                                        <div className="text-xl font-medium text-indigo-400">{ku.ku_kanji[0].reading_data?.on?.join(', ') || '-'}</div>
                                    </div>
                                    <div>
                                        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Kunyomi</h3>
                                        <div className="text-xl font-medium text-emerald-400">{ku.ku_kanji[0].reading_data?.kun?.join(', ') || '-'}</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {ku.type === 'vocabulary' && ku.ku_vocabulary?.[0] && (
                            <div className="space-y-8">
                                <div>
                                    <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Pronunciation</h3>
                                    <p className="text-4xl font-bold text-emerald-400 tracking-tight">
                                        {ku.ku_vocabulary[0].reading_primary}
                                    </p>
                                </div>
                                <div>
                                    <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Meaning</h3>
                                    <p className="text-2xl font-bold text-white leading-relaxed">
                                        {ku.ku_vocabulary[0].meaning_data?.primary}
                                    </p>
                                </div>
                            </div>
                        )}
                    </section>

                    {/* Navigation / Next unit */}
                    <div className="p-6 rounded-3xl bg-indigo-600/10 border border-indigo-600/20 flex items-center justify-between group cursor-pointer">
                        <div className="flex items-center gap-4">
                            <Zap className="text-indigo-500" />
                            <div>
                                <div className="font-bold">Next Recommended Unit</div>
                                <div className="text-xs text-zinc-500">Based on your learning path</div>
                            </div>
                        </div>
                        <ChevronRight className="group-hover:translate-x-2 transition-transform" />
                    </div>
                </main>

                <aside className="space-y-6">
                    {/* SRS Info Panel */}
                    <div className="p-8 rounded-[32px] bg-zinc-900 border border-white/5 space-y-6">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                            <History size={16} /> SRS Data
                        </h3>
                        {learningState ? (
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-zinc-400">Stability</span>
                                    <span className="font-bold">{learningState.stability.toFixed(1)} days</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-zinc-400">Difficulty</span>
                                    <span className="font-bold">{learningState.difficulty.toFixed(1)}/10</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-zinc-400">Next Review</span>
                                    <span className="font-bold text-indigo-400">
                                        {new Date(learningState.next_review).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm italic text-zinc-600">You haven't started learning this unit yet.</p>
                        )}
                    </div>
                </aside>
            </div>
        </div>
    );
}
