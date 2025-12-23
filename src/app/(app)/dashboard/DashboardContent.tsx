
'use client';

import React from 'react';
import { HanaButton } from '@/ui/components/hana/Button';
import { HanaCard } from '@/ui/components/hana/Card';
import {
    Zap,
    TrendingUp,
    BookOpen,
    Clock,
    ArrowRight,
    MessageCircle,
    PlayCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardContentProps {
    user: any;
    stats: {
        totalLearned: number;
        burnedCount: number;
        dueCount: number;
    };
}

export const DashboardContent: React.FC<DashboardContentProps> = ({ user, stats }) => {
    return (
        <div className="max-w-7xl mx-auto space-y-12 pb-24">
            {/* Elegant Hero Section */}
            <header className="relative p-8 md:p-12 rounded-[40px] bg-white border-2 border-sakura-divider overflow-hidden group">
                {/* Decorative Sakura Petal Blurs */}
                <div className="absolute top-[-10%] right-[-5%] w-64 h-64 bg-sakura-pink/10 blur-[80px] rounded-full group-hover:bg-sakura-pink/20 transition-colors duration-1000" />

                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex-1 space-y-6 text-center md:text-left">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sakura-pink/10 text-sakura-pink text-xs font-black uppercase tracking-widest border border-sakura-pink/20">
                            <Zap size={14} className="fill-current" />
                            Level Up Journey
                        </div>

                        <h1 className="text-4xl md:text-6xl font-black text-sakura-ink leading-tight">
                            Okaeri, <br />
                            <span className="text-sakura-pink">{user.user_metadata?.display_name || 'Scholar'}</span>
                        </h1>

                        <p className="max-w-md text-sakura-cocoa/60 font-bold text-lg md:text-xl">
                            You have <span className="text-sakura-ink underline decoration-sakura-pink decoration-4 underline-offset-4">{stats.dueCount} cards</span> waiting.
                            Ready for your daily session?
                        </p>

                        <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                            <HanaButton size="lg" className="w-full sm:w-auto" onClick={() => window.location.href = '/study/review'}>
                                Start Review session <ArrowRight className="ml-2" size={20} />
                            </HanaButton>
                            <HanaButton variant="secondary" size="lg" className="w-full sm:w-auto" onClick={() => window.location.href = '/chat'}>
                                <MessageCircle className="mr-2" size={20} /> Neural Chat
                            </HanaButton>
                        </div>
                    </div>

                    {/* Visual Asset (Empty state for now, but ready for image) */}
                    <div className="w-full md:w-[400px] h-[300px] bg-sakura-divider/20 rounded-[32px] border-4 border-white/50 animate-float flex items-center justify-center p-8">
                        <div className="text-center space-y-2 opacity-40">
                            <SakuraIllustration />
                            <p className="font-black uppercase text-xs tracking-tighter">Your progress is blooming</p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Premium Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard
                    label="Active Items"
                    value={stats.totalLearned}
                    icon={BookOpen}
                    color="text-indigo-500"
                    bg="bg-indigo-50"
                />
                <StatCard
                    label="Burned Forever"
                    value={stats.burnedCount}
                    icon={TrendingUp}
                    color="text-emerald-500"
                    bg="bg-emerald-50"
                />
                <StatCard
                    label="Due for Review"
                    value={stats.dueCount}
                    icon={Clock}
                    color="text-sakura-pink"
                    bg="bg-sakura-pink/10"
                />
            </div>

            {/* Knowledge Piles / Recent Modules */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <h2 className="text-2xl font-black text-sakura-ink flex items-center gap-3 uppercase tracking-tight">
                        <PlayCircle className="text-sakura-pink" /> Knowledge Piles
                    </h2>
                    <div className="grid gap-4">
                        {['Daily Vocabulary', 'N4 Grammar Essentials', 'Kanji Core 100'].map((title, i) => (
                            <HanaCard key={i} variant="clay" className="hover:scale-[1.02] cursor-pointer group" padding="sm">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-2xl bg-sakura-divider flex items-center justify-center text-sakura-cocoa group-hover:bg-sakura-pink group-hover:text-white transition-colors">
                                            <BookOpen size={24} />
                                        </div>
                                        <div>
                                            <h3 className="font-black text-lg">{title}</h3>
                                            <p className="text-sm font-bold text-sakura-cocoa/40 uppercase">Module • 24 ITEMS</p>
                                        </div>
                                    </div>
                                    <HanaButton variant="ghost" size="icon">
                                        <ArrowRight size={20} />
                                    </HanaButton>
                                </div>
                            </HanaCard>
                        ))}
                    </div>
                </div>

                <div className="space-y-6">
                    <h2 className="text-2xl font-black text-sakura-ink flex items-center gap-3 uppercase tracking-tight">
                        <Clock className="text-sakura-cocoa" /> Momentum
                    </h2>
                    <HanaCard variant="flat" className="h-[340px] border-dashed border-2 flex flex-col items-center justify-center text-center space-y-4 opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all">
                        <div className="w-20 h-20 rounded-full bg-sakura-divider flex items-center justify-center text-sakura-cocoa">
                            <TrendingUp size={32} />
                        </div>
                        <div className="space-y-1">
                            <p className="font-black text-lg uppercase">Daily Flow</p>
                            <p className="text-sm font-bold text-sakura-cocoa/50">Your learning activity heatmap <br /> will appear here.</p>
                        </div>
                    </HanaCard>
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ label, value, icon: Icon, color, bg }: any) => (
    <HanaCard variant="clay" padding="lg" className="flex flex-col gap-4 group">
        <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:rotate-6", bg, color)}>
            <Icon size={28} />
        </div>
        <div>
            <div className="text-5xl font-black tracking-tighter text-sakura-ink">{value}</div>
            <div className="text-xs font-black uppercase tracking-widest text-sakura-cocoa/40">{label}</div>
        </div>
    </HanaCard>
);

const SakuraIllustration = () => (
    <svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" fill="#F9B7C7" fillOpacity="0.2" />
        <path d="M12 16L12 8M8 12L16 12" stroke="#F9B7C7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);
