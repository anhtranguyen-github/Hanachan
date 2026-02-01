'use client';

import React from 'react';
import {
    TrendingUp,
    Clock,
    BarChart3,
    PieChart,
    Calendar,
    Activity
} from 'lucide-react';

export default function Academy() {
    return (
        <div className="max-w-5xl mx-auto space-y-8 py-4 font-sans text-[#3E4A61]">
            <div className="relative flex items-center justify-center py-2">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[#F0E0E0]"></div>
                </div>
                <div className="relative bg-[#FFFDFD] px-4 text-center">
                    <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#3E4A61]">Learning Analytics</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white border-2 border-[#F0E0E0] rounded-[40px] p-8 shadow-sm space-y-8">
                    <div className="flex justify-between items-center">
                        <div className="space-y-0.5">
                            <h3 className="text-lg font-black text-[#3E4A61] uppercase tracking-tight">Review Activity</h3>
                            <p className="text-[8px] font-black text-[#A0AEC0] uppercase tracking-widest">Last 7 Days</p>
                        </div>
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
                        {[
                            { day: 'M', count: 20 },
                            { day: 'T', count: 30 },
                            { day: 'W', count: 20 },
                            { day: 'T', count: 30 },
                            { day: 'F', count: 5 },
                            { day: 'S', count: 18 },
                            { day: 'S', count: 17 }
                        ].map((item, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-3">
                                <span className="text-[9px] font-black text-[#3E4A61]">{item.day}</span>
                                <div
                                    className={`w-full aspect-square rounded-[18px] transition-all duration-300 ${item.count > 25 ? 'bg-[#FFB5B5]' :
                                        item.count > 15 ? 'bg-[#FFDADA]' :
                                            item.count > 4 ? 'bg-[#FFF5F5]' : 'bg-[#F7FAFC]'
                                        }`}
                                ></div>
                                <span className="text-[9px] font-black text-[#3E4A61]">{item.count}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white border-2 border-[#F0E0E0] rounded-[40px] p-8 shadow-sm space-y-6">
                    <div className="space-y-0.5">
                        <h3 className="text-lg font-black text-[#3E4A61] uppercase tracking-tight">Items by State</h3>
                        <p className="text-[8px] font-black text-[#A0AEC0] uppercase tracking-widest">Learning Progress Distribution</p>
                    </div>

                    <div className="space-y-5">
                        {[
                            { label: 'Burned', count: 0, percent: 0, color: '#FFB5B5' },
                            { label: 'In Review', count: 22, percent: 30, color: '#FFB5B5' },
                            { label: 'Learning', count: 11, percent: 15, color: '#87CEEB' },
                            { label: 'New', count: 18, percent: 24, color: '#EDF2F7' }
                        ].map((item, i) => (
                            <div key={i} className="space-y-2">
                                <div className="flex justify-between items-end">
                                    <span className="text-xs font-black text-[#3E4A61]">{item.label}</span>
                                    <span className="text-[10px] font-black text-[#3E4A61]">{item.count} ({item.percent}%)</span>
                                </div>
                                <div className="h-1.5 bg-[#F7FAFC] rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all duration-1000"
                                        style={{ width: `${item.percent}%`, backgroundColor: item.color }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white border-2 border-[#F0E0E0] rounded-[40px] p-8 shadow-sm space-y-8">
                    <div className="space-y-0.5">
                        <h3 className="text-lg font-black text-[#3E4A61] uppercase tracking-tight">Review Forecast</h3>
                        <p className="text-[8px] font-black text-[#A0AEC0] uppercase tracking-widest">Next 7 Days</p>
                    </div>

                    <div className="h-32 flex flex-col justify-between">
                        <div className="flex-1 flex items-end justify-between px-4 pb-4">
                            {[36, 27, 26, 7, 7, 12, 25].map((h, i) => (
                                <div key={i} className="flex-1 flex justify-center">
                                    <div className="w-1.5 bg-[#F7FAFC] rounded-full flex items-end overflow-hidden h-20">
                                        <div className="w-full bg-[#FFB5B5] rounded-full" style={{ height: `${(h / 40) * 100}%` }}></div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-between items-center px-2">
                            {[
                                { label: 'TODAY', v: 36 },
                                { label: 'TMRW', v: 27 },
                                { label: 'WED', v: 26 },
                                { label: 'THU', v: 7 },
                                { label: 'FRI', v: 7 },
                                { label: 'SAT', v: 12 },
                                { label: 'SUN', v: 25 }
                            ].map((day, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                    <span className="text-[7px] font-black text-[#A0AEC0] uppercase tracking-widest">{day.label}</span>
                                    <span className="text-[9px] font-black text-[#3E4A61]">{day.v}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="bg-white border-2 border-[#F0E0E0] rounded-[40px] p-8 shadow-sm space-y-8 flex flex-col">
                    <div className="space-y-0.5">
                        <h3 className="text-lg font-black text-[#3E4A61] uppercase tracking-tight">Accuracy Trend</h3>
                        <p className="text-[8px] font-black text-[#A0AEC0] uppercase tracking-widest">Weekly Performance</p>
                    </div>

                    <div className="flex-1 relative flex items-center justify-center pt-4 pb-2">
                        <svg className="w-full h-28 overflow-visible" viewBox="0 0 700 200">
                            {/* Grid Lines */}
                            <line x1="0" y1="0" x2="700" y2="0" stroke="#F0E0E0" strokeWidth="1" strokeDasharray="4 4" />
                            <line x1="0" y1="50" x2="700" y2="50" stroke="#F0E0E0" strokeWidth="1" strokeDasharray="4 4" />
                            <line x1="0" y1="100" x2="700" y2="100" stroke="#F0E0E0" strokeWidth="1" strokeDasharray="4 4" />
                            <line x1="0" y1="150" x2="700" y2="150" stroke="#F0E0E0" strokeWidth="1" strokeDasharray="4 4" />
                            <line x1="0" y1="200" x2="700" y2="200" stroke="#F0E0E0" strokeWidth="1" strokeDasharray="4 4" />

                            {/* Y-Axis Labels */}
                            <text x="-45" y="5" className="text-[14px] font-black fill-[#CBD5E0]">100%</text>
                            <text x="-45" y="105" className="text-[14px] font-black fill-[#CBD5E0]">75%</text>
                            <text x="-45" y="205" className="text-[14px] font-black fill-[#CBD5E0]">50%</text>

                            {/* Trend Line */}
                            <path
                                d="M 0 60 C 50 60, 100 55, 150 58 C 200 62, 250 85, 300 80 C 350 75, 400 35, 450 40 C 500 45, 550 38, 600 35 C 650 32, 700 70, 700 70"
                                fill="none"
                                stroke="#A07D8D"
                                strokeWidth="5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </div>

                    <div className="flex justify-between items-center px-4 pt-2">
                        {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map((day, i) => (
                            <span key={i} className="text-[8px] font-black text-[#3E4A61] uppercase tracking-widest">{day}</span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
