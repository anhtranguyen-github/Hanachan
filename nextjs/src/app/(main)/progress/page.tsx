'use client';

import React, { useState, useEffect } from 'react';
import {
    TrendingUp,
    Clock,
    BarChart3,
    PieChart,
    Calendar,
    Activity,
    Loader2
} from 'lucide-react';
import { useUser } from '@/features/auth/AuthContext';
import { fetchUserDashboardStats } from '@/features/learning/service';

export default function ProgressPage() {
    const { user } = useUser();
    const [stats, setStats] = useState<any>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (user) {
            fetchUserDashboardStats(user.id).then(setStats);
        }
    }, [user]);

    if (!mounted || !stats) {
        return (
            <div className="h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-[#FFB5B5] animate-spin" />
            </div>
        );
    }

    const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
    const last7Days = stats.dailyReviews || [0, 0, 0, 0, 0, 0, 0];
    const maxReviews = Math.max(...last7Days, 1);

    return (
        <div className="max-w-5xl mx-auto space-y-sm font-sans text-foreground animate-in fade-in duration-1000">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-md">
                <div className="premium-card p-md space-y-md">
                    <div className="flex justify-between items-center">
                        <h3 className="text-card-title font-black text-foreground uppercase tracking-tight">Review Activity</h3>
                        <div className="flex items-center gap-2">
                            <span className="text-[7px] font-black uppercase text-[#CBD5E0]">Less</span>
                            <div className="flex gap-1">
                                <div className="w-3 h-3 bg-[#FFF5F5] rounded-sm"></div>
                                <div className="w-3 h-3 bg-[#FFDADA] rounded-sm"></div>
                                <div className="w-3 h-3 bg-[#FFB5B5] rounded-sm"></div>
                                <div className="w-3 h-3 bg-[#FF7F7F] rounded-sm"></div>
                            </div>
                            <span className="text-[7px] font-black uppercase text-[#CBD5E0]">More</span>
                        </div>
                    </div>

                    <div className="flex justify-between items-center gap-2 px-2">
                        {last7Days.map((count: number, i: number) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-3">
                                <span className="text-[9px] font-black text-[#3E4A61]">{days[i]}</span>
                                <div
                                    className={`w-full aspect-square rounded-[18px] transition-all duration-300 ${count > (maxReviews * 0.75) ? 'bg-[#FFB5B5]' :
                                        count > (maxReviews * 0.4) ? 'bg-[#FFDADA]' :
                                            count > 0 ? 'bg-[#FFF5F5]' : 'bg-[#F7FAFC]'
                                        }`}
                                ></div>
                                <span className="text-[9px] font-black text-[#3E4A61]">{count}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="premium-card p-md space-y-md">
                    <h3 className="text-card-title font-black text-foreground uppercase tracking-tight">Curriculum Status</h3>

                    <div className="space-y-5">
                        {[
                            { label: 'Mastered', count: stats.totalBurned, color: '#FFB5B5' },
                            { label: 'In Review', count: stats.dueBreakdown.review, color: '#FFDADA' },
                            { label: 'Learning', count: stats.dueBreakdown.learning, color: '#A2D2FF' },
                            { label: 'Overall Coverage', count: Math.round(stats.totalKUCoverage), suffix: '%', color: '#3E4A61' }
                        ].map((item, i) => (
                            <div key={i} className="space-y-2">
                                <div className="flex justify-between items-end">
                                    <span className="text-xs font-black text-[#3E4A61]">{item.label}</span>
                                    <span className="text-[10px] font-black text-[#3E4A61]">{item.count}{item.suffix || ''}</span>
                                </div>
                                <div className="h-1.5 bg-[#F7FAFC] rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all duration-1000"
                                        style={{
                                            width: `${item.suffix === '%' ? item.count : Math.min(100, (item.count / Math.max(stats.totalLearned, 1)) * 100)}%`,
                                            backgroundColor: item.color
                                        }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="premium-card p-md space-y-md">
                    <h3 className="text-card-title font-black text-foreground uppercase tracking-tight">Review Forecast</h3>

                    <div className="h-32 flex flex-col justify-between">
                        <div className="flex-1 flex items-end justify-between px-4 pb-4">
                            {(Array.isArray(stats.forecast) ? stats.forecast : (stats.forecast?.daily || [])).slice(0, 7).map((f: any, i: number) => {
                                const arr = (Array.isArray(stats.forecast) ? stats.forecast : (stats.forecast?.daily || [])).slice(0, 7);
                                const maxCount = Math.max(...arr.map((x: any) => x.count || 0), 1);
                                return (
                                    <div key={i} className="flex-1 flex justify-center">
                                        <div className="w-1.5 bg-[#F7FAFC] rounded-full flex items-end overflow-hidden h-20">
                                            <div className="w-full bg-[#FFB5B5] rounded-full" style={{ height: `${Math.min(100, ((f.count || 0) / maxCount) * 100)}%` }}></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="flex justify-between items-center px-2 text-center">
                            {(Array.isArray(stats.forecast) ? stats.forecast : (stats.forecast?.daily || [])).slice(0, 7).map((f: any, i: number) => (
                                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                    <span className="text-[7px] font-black text-[#A0AEC0] uppercase tracking-widest">{i === 0 ? 'TODAY' : `D+${i}`}</span>
                                    <span className="text-[9px] font-black text-[#3E4A61]">{f.count || 0}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="bg-foreground rounded-[var(--radius)] p-md text-white space-y-md flex flex-col shadow-xl">
                    <h3 className="text-card-title font-black text-white/90 uppercase tracking-tight">Domain Mastery</h3>

                    <div className="grid grid-cols-2 gap-6 flex-1 items-center">
                        {Object.entries(stats.typeMastery).map(([type, percent]: [string, any]) => (
                            <div key={type} className="space-y-3">
                                <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
                                    <span className="text-white/60">{type}</span>
                                    <span className="text-[#FFB5B5]">{percent}%</span>
                                </div>
                                <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-[#FFB5B5] transition-all duration-1000"
                                        style={{ width: `${percent}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Activity size={16} className="text-[#FFB5B5]" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-white/40">General Heath</span>
                        </div>
                        <span className="text-xl font-black text-[#FFB5B5]">{stats.retention}%</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
