
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Layers, ChevronRight, BookOpen, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

async function getDeckStats() {
    // In a real app, this would be computed or fetched from a summary table
    // For now, let's just show the 60 levels structure
    return Array.from({ length: 12 }, (_, i) => ({
        id: i + 1,
        title: `Level ${i + 1}`,
        tokens: 50 + i * 10,
        type: i < 4 ? 'N5' : i < 8 ? 'N4' : 'N3',
        completed: Math.floor(Math.random() * 100) > 70
    }));
}

export default async function DecksPage() {
    const decks = await getDeckStats();

    return (
        <div className="space-y-12 pb-20">
            <header className="space-y-4">
                <h1 className="text-4xl font-black tracking-tight uppercase">Knowledge Matrix</h1>
                <p className="text-zinc-500 font-medium">Choose a level and master the substrate of Japanese.</p>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {decks.map((deck) => (
                    <Link
                        key={deck.id}
                        href={`/decks/${deck.id}`}
                        className="group relative p-8 rounded-[40px] bg-zinc-900/40 border border-white/5 hover:border-white/20 transition-all overflow-hidden"
                    >
                        {/* Type Badge */}
                        <div className={cn(
                            "absolute top-6 right-8 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase",
                            deck.type === 'N5' ? 'bg-emerald-500/10 text-emerald-500' :
                                deck.type === 'N4' ? 'bg-blue-500/10 text-blue-500' : 'bg-purple-500/10 text-purple-500'
                        )}>
                            {deck.type}
                        </div>

                        <div className="space-y-6">
                            <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                                <Layers size={28} />
                            </div>

                            <div>
                                <h3 className="text-2xl font-bold mb-1">{deck.title}</h3>
                                <div className="flex items-center gap-2 text-xs font-bold text-zinc-500 uppercase tracking-widest">
                                    <BookOpen size={14} /> {deck.tokens} Tokens
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                <div className="flex items-center gap-2">
                                    {deck.completed ? (
                                        <span className="text-emerald-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                                            <Zap size={10} fill="currentColor" /> Mastered
                                        </span>
                                    ) : (
                                        <span className="text-zinc-600 text-[10px] font-black uppercase tracking-widest">Pending Sync</span>
                                    )}
                                </div>
                                <ChevronRight className="text-zinc-700 group-hover:text-white transition-colors" />
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
