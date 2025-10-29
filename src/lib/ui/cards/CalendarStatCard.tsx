import React from 'react';
import { Flame, Check, X, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from './Card';

/**
 * CalendarStatCard (Type B)
 * 
 * Features: Large stat number + calendar row with streak icons + secondary stats
 * Used for: StudyStreakCard
 */

export interface CalendarDay {
    date: string;
    label: string; // e.g., "Mon", "Tue"
    status: 'missed' | 'partial' | 'complete' | 'today' | 'future';
    isToday?: boolean;
}

export interface CalendarStatCardProps {
    title: string;
    subtitle?: string;
    mainStat: string | number;
    mainStatLabel?: string;
    calendar: CalendarDay[];
    secondaryStats?: Array<{
        label: string;
        value: string | number;
        icon?: React.ReactNode;
    }>;
    onDayClick?: (day: CalendarDay) => void;
    className?: string;
    loading?: boolean;
}

const STATUS_ICONS: Record<CalendarDay['status'], React.ReactNode> = {
    missed: <X size={14} className="text-black" />,
    partial: <Minus size={14} className="text-black" />,
    complete: <Check size={14} className="text-black" />,
    today: <Flame size={14} className="text-black" />,
    future: <div className="w-1.5 h-1.5 border border-black" />,
};

const STATUS_BORDER: Record<CalendarDay['status'], string> = {
    missed: 'border-transparent',
    partial: 'border-black',
    complete: 'border-black bg-black',
    today: 'border-black ring-2 ring-black ring-offset-2',
    future: 'border-transparent opacity-10',
};

export function CalendarStatCard({
    title,
    subtitle,
    mainStat,
    mainStatLabel,
    calendar,
    secondaryStats,
    onDayClick,
    className,
    loading = false,
}: CalendarStatCardProps) {
    if (loading) {
        return (
            <Card className={cn('animate-pulse border-black', className)}>
                <div className="flex items-center justify-between mb-4">
                    <div className="h-5 w-24 bg-black/10" />
                    <div className="flex gap-2">
                        {[...Array(7)].map((_, i) => (
                            <div key={i} className="w-8 h-8 bg-black/5" />
                        ))}
                    </div>
                </div>
                <div className="h-12 w-16 bg-black/10" />
            </Card>
        );
    }

    return (
        <Card className={cn("border-black", className)}>
            {/* Header with Calendar */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="font-black text-black tracking-tight uppercase">{title}</h3>
                    {subtitle && (
                        <p className="text-[10px] font-black text-black mt-0.5 uppercase tracking-widest">{subtitle}</p>
                    )}
                </div>

                {/* Calendar Row */}
                <div className="flex items-center gap-1">
                    {calendar.map((day) => (
                        <button
                            key={day.date}
                            onClick={() => onDayClick?.(day)}
                            className={cn(
                                'flex flex-col items-center p-1 border transition-all h-10 w-8 justify-center',
                                STATUS_BORDER[day.status],
                                onDayClick && 'hover:bg-black hover:text-white group cursor-pointer',
                                day.isToday && 'border-black ring-1 ring-black ring-offset-1'
                            )}
                            title={day.date}
                        >
                            <span className="text-[8px] text-black font-black uppercase group-hover:text-white">
                                {day.label.slice(0, 1)}
                            </span>
                            <span className={cn(
                                "group-hover:text-white",
                                day.status === 'complete' && 'text-white'
                            )}>
                                {STATUS_ICONS[day.status]}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Stat */}
            <div className="flex items-baseline gap-2 mt-6">
                <span className="text-6xl font-black text-black tracking-tighter">
                    {mainStat}
                </span>
                {mainStatLabel && (
                    <span className="text-xl font-black text-black uppercase tracking-widest">{mainStatLabel}</span>
                )}
            </div>

            {/* Secondary Stats */}
            {secondaryStats && secondaryStats.length > 0 && (
                <div className="flex items-center gap-6 mt-8 pt-4 border-t border-black">
                    {secondaryStats.map((stat, index) => (
                        <div key={index} className="flex items-center gap-2">
                            {stat.icon && React.isValidElement(stat.icon) ? React.cloneElement(stat.icon as React.ReactElement<any>, { size: 14, color: 'black' }) : stat.icon}
                            <div>
                                <span className="text-[9px] font-black text-black block uppercase tracking-tighter">{stat.label}</span>
                                <span className="font-black text-black text-lg">{stat.value}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </Card>
    );
}

export default CalendarStatCard;
