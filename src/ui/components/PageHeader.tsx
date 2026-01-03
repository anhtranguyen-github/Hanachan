
import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Button } from './ui/button'; // Adjust import based on your Button location
import { cn } from '@/lib/utils'; // Adjust based on your utils location

interface PageHeaderProps {
    title: string;
    subtitle?: string;
    icon?: LucideIcon;
    iconColor?: string; // Tailwind text color class, e.g., "text-blue-600"
    badge?: string;     // Optional BETA/NEW badge text
    badgeColor?: string; // Tailwind bg/text class for badge
    action?: React.ReactNode; // Optional right-side action button
}

export function PageHeader({
    title,
    subtitle,
    icon: Icon,
    iconColor = "text-slate-800",
    badge,
    badgeColor = "bg-rose-100 text-rose-600",
    action
}: PageHeaderProps) {
    return (
        <div className="flex items-center justify-between mb-8">
            <div>
                {badge && (
                    <div className="flex items-center gap-2 mb-2">
                        {Icon && <Icon className={cn("w-5 h-5", iconColor)} />}
                        <span className={cn("px-1.5 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider", badgeColor)}>
                            {badge}
                        </span>
                    </div>
                )}
                {!badge && Icon && (
                    <div className="flex items-center gap-3 mb-1">
                        <Icon className={cn("w-6 h-6", iconColor)} />
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">{title}</h1>
                    </div>
                )}
                {!badge && !Icon && (
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">{title}</h1>
                )}

                {badge && (
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">{title}</h1>
                )}

                {subtitle && (
                    <p className="text-slate-500 font-medium mt-1">{subtitle}</p>
                )}
            </div>

            {action && (
                <div className="flex gap-2">
                    {action}
                </div>
            )}
        </div>
    );
}
