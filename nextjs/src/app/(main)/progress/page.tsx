'use client';

import React, { useState, useEffect } from 'react';
import { TrendingUp, Activity, Loader2, Sparkles } from 'lucide-react';
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
            <div className="h-full flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                        <div className="absolute inset-0 bg-primary rounded-2xl blur-xl opacity-20 animate-pulse" />
                        <div className="relative w-12 h-12 bg-gradient-to-br from-[#F4ACB7] to-[#D88C9A] rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg">花</div>
                    </div>
                    <div className="flex gap-1.5">
                        {[0, 1, 2].map(i => (
                            <div key={i} className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
    const last7Days = stats.dailyReviews || [0, 0, 0, 0, 0, 0, 0];
    const maxReviews = Math.max(...last7Days, 1);
    const forecastArr = (Array.isArray(stats.forecast) ? stats.forecast : (stats.forecast?.daily || [])).slice(0, 7);
    const maxForecast = Math.max(...forecastArr.map((x: any) => x.count || 0), 1);

    return (
        <div className="max-w-4xl mx-auto space-y-4 font-sans text-foreground animate-page-entrance pb-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Review Activity */}
                <div className="bg-white border border-border rounded-3xl p-5 space-y-4 shadow-sm">
                    <div className="flex justify-between items-center">
                        <h3 className="text-sm font-black text-foreground uppercase tracking-tight">Review Activity</h3>
                        <div className="flex items-center gap-1.5">
                            <span className="text-[7px] font-black uppercase text-[#CBD5E0]">Less</span>
                            <div className="flex gap-0.5">
                                {['bg-[#FFF5F5]', 'bg-[#FFDADA]', 'bg-[#FFB5B5]', 'bg-[#FF7F7F]'].map((c, i) => (
                                    <div key={i} className={`w-2.5 h-2.5 ${c} rounded-sm`} />
                                ))}
                            </div>
                            <span className="text-[7px] font-black uppercase text-[#CBD5E0]">More</span>
                        </div>
                    </div>
                    <div className="flex justify-between items-end gap-1.5">
                        {last7Days.map((count: number, i: number) => {
                            const intensity = count > (maxReviews * 0.75) ? 3 : count > (maxReviews * 0.4) ? 2 : count > 0 ? 1 : 0;
                            const colors = ['bg-[#F7FAFC] border border-border/20', 'bg-[#FFF5F5]', 'bg-[#FFDADA]', 'bg-gradient-to-br from-[#FFB5B5] to-[#FF7F7F]'];
                            return (
                                <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                                    <span className="text-[8px] font-black text-[#3E4A61]">{days[i]}</span>
                                    <div className={`w-full aspect-square rounded-xl transition-all duration-300 ${colors[intensity]}`} />
                                    <span className="text-[8px] font-black text-[#A0AEC0]">{count}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Curriculum Status */}
                <div className="bg-white border border-border rounded-3xl p-5 space-y-4 shadow-sm">
                    <h3 className="text-sm font-black text-foreground uppercase tracking-tight">Curriculum Status</h3>
                    <div className="space-y-3">
                        {[
                            { label: 'Mastered', count: stats.totalBurned, color: '#F4ACB7', gradient: 'from-[#F4ACB7] to-[#D88C9A]' },
                            { label: 'In Review', count: stats.dueBreakdown?.review || 0, color: '#CDB4DB', gradient: 'from-[#CDB4DB] to-[#B09AC5]' },
                            { label: 'Learning', count: stats.dueBreakdown?.learning || 0, color: '#A2D2FF', gradient: 'from-[#A2D2FF] to-[#7BB8F0]' },
                            { label: 'Coverage', count: Math.round(stats.totalKUCoverage || 0), suffix: '%', color: '#3E4A61', gradient: 'from-[#3E4A61] to-[#4A5568]' }
                        ].map((item, i) => (
                            <div key={i} className="space-y-1">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-black text-[#3E4A61]">{item.label}</span>
                                    <span className="text-[10px] font-black text-[#3E4A61]">{item.count}{item.suffix || ''}</span>
                                </div>
                                <div className="h-1.5 bg-[#F7FAFC] rounded-full overflow-hidden border border-border/10">
                                    <div
                                        className={`h-full rounded-full transition-all duration-1000 bg-gradient-to-r ${item.gradient}`}
                                        style={{ width: `${item.suffix === '%' ? item.count : Math.min(100, (item.count / Math.max(stats.totalLearned || 1, 1)) * 100)}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Review Forecast */}
                <div className="bg-white border border-border rounded-3xl p-5 space-y-4 shadow-sm">
                    <h3 className="text-sm font-black text-foreground uppercase tracking-tight">Review Forecast</h3>
                    <div className="h-28 flex flex-col justify-between">
                        <div className="flex-1 flex items-end justify-between px-1 pb-2 gap-1">
                            {forecastArr.map((f: any, i: number) => {
                                const pct = ((f.count || 0) / maxForecast) * 100;
                                return (
                                    <div key={i} className="flex-1 flex justify-center group relative">
                                        <div className="w-2 bg-[#F7FAFC] rounded-full flex items-end overflow-hidden h-16 border border-border/10">
                                            <div
                                                className="w-full rounded-full transition-all duration-1000"
                                                style={{
                                                    height: `${Math.max(4, pct)}%`,
                                                    background: i === 0 ? 'linear-gradient(to top, #F4ACB7, #D88C9A)' : 'linear-gradient(to top, #A2D2FF55, #A2D2FF22)'
                                                }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="flex justify-between items-center px-1">
                            {forecastArr.map((f: any, i: number) => (
                                <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                                    <span className="text-[7px] font-black text-[#A0AEC0] uppercase">{i === 0 ? 'TODAY' : `D+${i}`}</span>
                                    <span className="text-[8px] font-black text-[#3E4A61]">{f.count || 0}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Domain Mastery */}
                <div className="relative rounded-3xl p-5 text-white space-y-4 flex flex-col shadow-xl overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#2D3748] to-[#1A202C] rounded-3xl" />
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#F4ACB7]/40 to-transparent" />
                    <div className="absolute -top-6 -right-6 w-24 h-24 bg-[#F4ACB7]/10 rounded-full blur-2xl" />

                    <div className="relative z-10 flex items-center gap-2">
                        <h3 className="text-sm font-black text-white/90 uppercase tracking-tight">Domain Mastery</h3>
                        <Sparkles size={12} className="text-[#F4ACB7]" />
                    </div>

                    <div className="grid grid-cols-2 gap-4 flex-1 items-center relative z-10">
                        {Object.entries(stats.typeMastery || {}).map(([type, percent]: [string, any]) => {
                            const typeColors: Record<string, string> = {
                                radical: '#A2D2FF', kanji: '#F4ACB7', vocabulary: '#CDB4DB', grammar: '#B7E4C7',
                            };
                            const color = typeColors[type] || '#F4ACB7';
                            return (
                                <div key={type} className="space-y-1.5">
                                    <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
                                        <span className="text-white/50">{type}</span>
                                        <span style={{ color }}>{percent}%</span>
                                    </div>
                                    <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
                                        <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${percent}%`, backgroundColor: color }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="pt-3 border-t border-white/8 flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-2">
                            <Activity size={13} className="text-[#F4ACB7]" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-white/30">Retention</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#48BB78] shadow-[0_0_6px_rgba(72,187,120,0.6)]" />
                            <span className="text-lg font-black text-[#F4ACB7]">{stats.retention}%</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
