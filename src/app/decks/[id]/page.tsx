
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { ChevronLeft, GraduationCap, Search, Filter } from 'lucide-react';
import { SRSStatusBadge } from '@/lib/SRSStatusBadge';

async function getUnitsInLevel(level: number, userId: string) {
    const supabase = createClient();

    // In our schema, we should have a way to filter by level. 
    // Assuming knowledge_units has a 'level' or similar, or we join with a level table.
    // For now, let's fetch first 30 KUs as a mock for this level.
    const { data: units, error } = await supabase
        .from('knowledge_units')
        .select(`
            *,
            user_learning_states (*)
        `)
        .limit(30);

    if (error) return [];
    return units;
}

export default async function DeckDetailPage({ params }: { params: { id: string } }) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const level = parseInt(params.id);
    const units = await getUnitsInLevel(level, user.id);

    return (
        <div className="space-y-12 pb-20">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                    <Link href="/decks" className="flex items-center gap-2 text-xs font-bold text-zinc-500 hover:text-white transition-colors uppercase tracking-widest mb-4">
                        <ChevronLeft size={14} /> Back to Matrix
                    </Link>
                    <h1 className="text-4xl font-black tracking-tight uppercase">Level {level} Substrate</h1>
                    <p className="text-zinc-500 font-medium">Core tokens for this frequency tier.</p>
                </div>

                <div className="flex gap-4">
                    <Link
                        href="/study/review"
                        className="px-8 py-4 bg-sakura-accent-primary text-white font-bold rounded-2xl flex items-center gap-2 shadow-xl shadow-sakura-accent-primary/20 hover:scale-105 transition-transform"
                    >
                        <GraduationCap size={20} /> Start Review
                    </Link>
                </div>
            </header>

            {/* Filter/Search Bar */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                    <input
                        type="text"
                        placeholder="Search tokens in this level..."
                        className="w-full pl-12 pr-4 py-4 bg-zinc-900/50 border border-white/5 rounded-2xl focus:outline-none focus:border-white/20 transition-all font-medium"
                    />
                </div>
                <button className="px-6 py-4 bg-zinc-900/50 border border-white/5 rounded-2xl flex items-center gap-2 text-zinc-400 font-bold text-sm">
                    <Filter size={18} /> Filter
                </button>
            </div>

            {/* Units Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {units.map((unit) => {
                    const state = unit.user_learning_states?.[0]?.state;
                    return (
                        <Link
                            key={unit.id}
                            href={`/study/unit/${unit.slug}`}
                            className="group p-6 rounded-[32px] bg-zinc-900/40 border border-white/5 hover:border-white/20 transition-all flex flex-col items-center text-center space-y-4 hover:bg-zinc-800"
                        >
                            <div className="text-4xl font-bold group-hover:scale-110 transition-transform">
                                {unit.search_key}
                            </div>
                            <div className="space-y-1">
                                <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{unit.type}</div>
                                {state && (
                                    <div className="scale-[0.7] origin-center">
                                        <SRSStatusBadge state={state} />
                                    </div>
                                )}
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
