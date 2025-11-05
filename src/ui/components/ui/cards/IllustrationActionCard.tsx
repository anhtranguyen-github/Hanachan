import React from 'react';
import Link from 'next/link';
import { ChevronRight, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from './Card';
import { HelpTooltip } from './HelpTooltip';
import { SRS_GLOSSARY, GlossaryKey } from '@/config/srs-glossary';
import { GridPattern } from '../patterns/PremiumPatterns';

/**
 * IllustrationActionCard (Type A)
 * 
 * Features: Illustration + badge count + subtitle + primary/secondary actions
 * Used for: LessonsCard, ReviewsCard, NextGoalCard
 */

export interface IllustrationActionCardProps {
    title: string;
    subtitle?: string;
    badge?: number | string;
    badgeColor?: string;
    illustration?: React.ReactNode;
    illustrationBg?: string;
    helpKey?: GlossaryKey;
    primaryAction?: {
        label: string;
        href?: string;
        onClick?: () => void;
        icon?: LucideIcon;
    };
    secondaryAction?: {
        label: string;
        href?: string;
        onClick?: () => void;
        icon?: LucideIcon;
    };
    alert?: {
        icon?: React.ReactNode;
        text: string;
        helpKey?: GlossaryKey;
    };
    className?: string;
    loading?: boolean;
}

export function IllustrationActionCard({
    title,
    subtitle,
    badge,
    badgeColor = 'bg-white border-black text-black',
    illustration,
    illustrationBg = 'bg-white border-black',
    helpKey,
    primaryAction,
    secondaryAction,
    alert,
    className,
    loading = false,
}: IllustrationActionCardProps) {
    if (loading) {
        return (
            <Card className={cn('animate-pulse border-black', className)}>
                <div className="flex items-start gap-4">
                    <div className={cn('w-16 h-16 border-black', illustrationBg)} />
                    <div className="flex-1 space-y-3">
                        <div className="h-5 w-24 bg-black/10" />
                        <div className="h-4 w-40 bg-black/5" />
                        <div className="h-10 w-32 bg-black" />
                    </div>
                </div>
            </Card>
        );
    }

    const PrimaryButton = primaryAction?.href ? Link : 'button';
    const SecondaryButton = secondaryAction?.href ? Link : 'button';

    return (
        <Card className={cn("overflow-hidden border-black", className)}>
            <div className="flex items-start gap-6 relative">
                {/* Illustration area with grid pattern */}
                {illustration && (
                    <div className={cn(
                        'w-20 h-20 border border-black flex items-center justify-center flex-shrink-0 relative overflow-hidden',
                        illustrationBg
                    )}>
                        <div className="absolute inset-0 opacity-[0.05]">
                            <GridPattern />
                        </div>
                        <div className="relative z-10">
                            {illustration}
                        </div>
                    </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0 py-1">
                    {/* Title Row */}
                    <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="text-xl font-black text-black tracking-tight uppercase">
                            {title}
                        </h3>
                        {helpKey && (
                            <HelpTooltip content={SRS_GLOSSARY[helpKey].definition} />
                        )}
                        {badge !== undefined && (
                            <span className={cn(
                                'px-3 py-0.5 border border-black text-[10px] font-black uppercase tracking-widest',
                                badgeColor
                            )}>
                                {badge}
                            </span>
                        )}
                    </div>

                    {/* Subtitle */}
                    {subtitle && (
                        <p className="text-[11px] font-black text-black mt-1 uppercase tracking-tight">{subtitle}</p>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-3 mt-6">
                        {primaryAction && (
                            <PrimaryButton
                                href={primaryAction.href || '#'}
                                onClick={primaryAction.onClick}
                                className="inline-flex items-center gap-3 px-6 py-3 bg-black text-white font-black uppercase tracking-[0.2em] text-[10px] border border-black active:scale-95 transition-all"
                            >
                                {primaryAction.label}
                                {primaryAction.icon ? (
                                    <primaryAction.icon size={14} strokeWidth={3} color="white" />
                                ) : (
                                    <ChevronRight size={14} strokeWidth={3} color="white" />
                                )}
                            </PrimaryButton>
                        )}
                        {secondaryAction && (
                            <SecondaryButton
                                href={secondaryAction.href || '#'}
                                onClick={secondaryAction.onClick}
                                className="inline-flex items-center gap-2 px-5 py-3 bg-white text-black font-black uppercase tracking-widest text-[9px] border border-black active:scale-95 transition-all"
                            >
                                {secondaryAction.icon && <secondaryAction.icon size={12} strokeWidth={3} color="black" />}
                                {secondaryAction.label}
                            </SecondaryButton>
                        )}
                    </div>
                </div>
            </div>

            {/* Alert Row */}
            {alert && (
                <div className="flex items-center gap-3 mt-6 pt-6 border-t border-black text-[10px] font-black uppercase tracking-widest text-black">
                    <div className="w-8 h-8 border border-black flex items-center justify-center">
                        {alert.icon || <ChevronRight size={14} color="black" />}
                    </div>
                    <span>{alert.text}</span>
                    {alert.helpKey && (
                        <HelpTooltip content={SRS_GLOSSARY[alert.helpKey].definition} />
                    )}
                </div>
            )}
        </Card>
    );
}

export default IllustrationActionCard;
