
import { createClient } from '@/services/supabase/server';
import { getDueCards } from '@/features/learning/repository';
import { TrendingUp, BookOpen, Zap, MessageCircle, PlayCircle, Clock, Languages, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { SRSStatusBadge } from '@/ui/components/shared/SRSStatusBadge';
import { SakuraButton } from '@/ui/components/sakura/SakuraButton';

async function getAggregatedStats(userId: string) {
    const supabase = createClient();

    // Get total cards, learned cards, etc.
    const { count: totalLearned } = await supabase
        .from('user_learning_states')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

    const { count: burnedCount } = await supabase
        .from('user_learning_states')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('state', 'Burned');

    const dueCards = await getDueCards(userId, 100);

    return {
        totalLearned: totalLearned || 0,
        burnedCount: burnedCount || 0,
        dueCount: dueCards.length
    };
}

export default async function DashboardPage() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    const stats = await getAggregatedStats(user.id);

    return (
        <div className="space-y-12">
            {/* Hero Section */}
            <header className="relative py-12 px-8 rounded-[40px] bg-gradient-to-br from-zinc-900 to-black border border-white/5 overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-1/2 h-full bg-sakura-accent-primary/10 blur-[120px] -z-10 animate-pulse" />
                <div className="relative z-10 space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sakura-accent-primary/20 text-sakura-accent-primary text-xs font-bold uppercase tracking-widest">
                        <Zap size={14} /> Welcome Back, {user.user_metadata?.display_name || 'Scholar'}
                    </div>
                    <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-white to-white/40 bg-clip-text text-transparent">
                        Your Learning <br /> Journey
                    </h1>
                    <p className="max-w-md text-zinc-400 font-medium">
                        You have <span className="text-white font-bold">{stats.dueCount} cards</span> waiting for you.
                        Keep the momentum going!
                    </p>
                    <div className="pt-6 flex flex-wrap gap-4">
                        <SakuraButton
                            variant="primary"
                            size="lg"
                            className="shadow-2xl shadow-white/5"
                            onClick={() => window.location.href = '/study/review'}
                        >
                            Start Daily Sync <ArrowRight className="ml-2" size={18} />
                        </SakuraButton>
                        <SakuraButton
                            variant="secondary"
                            size="lg"
                            onClick={() => window.location.href = '/chat'}
                        >
                            Open Neural Chat
                        </SakuraButton>
                    </div>
                </div>
            </header>

            {/* Stats Grid */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: 'Total Learned', value: stats.totalLearned, icon: BookOpen, color: 'text-indigo-500' },
                    { label: 'Mastered (Burned)', value: stats.burnedCount, icon: TrendingUp, color: 'text-emerald-500' },
                    { label: 'Due for Review', value: stats.dueCount, icon: Clock, color: 'text-rose-500' },
                ].map((stat, i) => (
                    <div key={i} className="p-8 rounded-[32px] bg-zinc-900/50 border border-white/5 backdrop-blur-xl group hover:border-white/20 transition-all">
                        <stat.icon className={stat.color + " mb-4"} size={32} />
                        <div className="text-4xl font-black mb-1">{stat.value}</div>
                        <div className="text-sm font-bold text-zinc-500 uppercase tracking-widest">{stat.label}</div>
                    </div>
                ))}
            </section>

            {/* Quick Actions / Modules */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold flex items-center gap-3">
                        <PlayCircle className="text-sakura-accent-primary" /> Recent Lessons
                    </h2>
                    <div className="space-y-4">
                        {/* Mock data for now */}
                        {[1, 2, 3].map((_, i) => (
                            <div key={i} className="flex items-center justify-between p-6 rounded-3xl bg-zinc-900/30 border border-white/5 hover:bg-zinc-800/50 transition-colors cursor-pointer group">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 group-hover:scale-110 transition-transform">
                                        <Languages size={24} />
                                    </div>
                                    <div>
                                        <div className="font-bold">N5 Essential Verbs</div>
                                        <div className="text-xs text-zinc-500 font-medium">Vocabulary • 20 Cards</div>
                                    </div>
                                </div>
                                <div className="text-xs font-bold text-zinc-600 group-hover:text-white transition-colors">Continue</div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-6">
                    <h2 className="text-2xl font-bold flex items-center gap-3">
                        <MessageCircle className="text-blue-500" /> Activity Log
                    </h2>
                    <div className="p-8 rounded-[40px] bg-zinc-900/20 border border-dashed border-white/10 flex flex-col items-center justify-center text-center space-y-4 grayscale opacity-50">
                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                            <Clock size={32} />
                        </div>
                        <p className="text-sm font-medium">Activity history will appear here <br /> as you study.</p>
                    </div>
                </div>
            </section>
        </div>
    );
}
