import React from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from './Card';
import { HelpTooltip, GlossaryKey, SRS_GLOSSARY } from './HelpTooltip';

/**
 * ActionListCard (Type G)
 * 
 * Features: Title + description + action buttons + list items + empty state
 * Used for: RecentMistakesCard
 */

export interface ActionListItem {
    id: string;
    primary: string | React.ReactNode;
    secondary?: string;
    meta?: string | React.ReactNode;
    onClick?: () => void;
}

export interface ActionButton {
    label: string;
    icon?: React.ReactNode;
    onClick?: () => void;
    href?: string;
}

export interface ActionListCardProps {
    title: string;
    helpKey?: GlossaryKey;
    description?: string;
    icon?: React.ReactNode;
    actions?: ActionButton[];
    items: ActionListItem[];
    emptyState?: {
        message: string;
        illustration?: React.ReactNode;
    };
    maxItems?: number;
    onViewAll?: () => void;
    className?: string;
    loading?: boolean;
}

export function ActionListCard({
    title,
    helpKey,
    description,
    icon,
    actions,
    items,
    emptyState,
    maxItems = 5,
    onViewAll,
    className,
    loading = false,
}: ActionListCardProps) {
    if (loading) {
        return (
            <Card className={cn('animate-pulse border-black', className)}>
                <div className="flex items-center gap-2 mb-2">
                    <div className="h-5 w-5 bg-black/10" />
                    <div className="h-5 w-28 bg-black/10" />
                </div>
                <div className="h-4 w-48 bg-black/5 mb-4" />
                <div className="grid grid-cols-2 gap-2">
                    <div className="h-10 bg-black/10" />
                    <div className="h-10 bg-black/10" />
                </div>
            </Card>
        );
    }

    const displayItems = items.slice(0, maxItems);
    const hasMoreItems = items.length > maxItems;

    return (
        <Card className={cn("border-black", className)}>
            {/* Header */}
            <div className="flex items-center gap-2 mb-2">
                {icon && React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { size: 18, color: 'black' }) : icon}
                <h3 className="font-black text-black tracking-tight uppercase text-sm">{title}</h3>
                {helpKey && (
                    <HelpTooltip content={SRS_GLOSSARY[helpKey]} />
                )}
            </div>

            {description && (
                <p className="text-[10px] font-black text-black mb-4 uppercase tracking-widest leading-relaxed">{description}</p>
            )}

            {/* Action Buttons */}
            {actions && actions.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                    {actions.map((action, index) => (
                        <button
                            key={index}
                            onClick={action.onClick}
                            className="flex-1 flex items-center justify-between px-4 py-3 bg-white border border-black text-[10px] font-black text-black uppercase tracking-widest hover:bg-black hover:text-white transition-all group"
                        >
                            <span className="flex items-center gap-2">
                                {action.icon}
                                {action.label}
                            </span>
                            <ChevronRight size={14} className="text-inherit" />
                        </button>
                    ))}
                </div>
            )}

            {/* Items List or Empty State */}
            {items.length === 0 ? (
                <div className="py-8 border border-black border-dashed text-center">
                    {emptyState?.illustration && (
                        <div className="mb-3 grayscale">{emptyState.illustration}</div>
                    )}
                    <p className="text-[10px] font-black text-black uppercase tracking-[0.2em]">
                        {emptyState?.message || 'No active alerts'}
                    </p>
                </div>
            ) : (
                <div className="space-y-2">
                    {displayItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={item.onClick}
                            className={cn(
                                'w-full flex items-center justify-between p-3 border border-black text-left',
                                'bg-white hover:bg-black hover:text-white transition-all group',
                                item.onClick && 'cursor-pointer'
                            )}
                        >
                            <div className="flex-1 min-w-0">
                                <div className="font-black text-black truncate uppercase tracking-tight group-hover:text-white">
                                    {item.primary}
                                </div>
                                {item.secondary && (
                                    <div className="text-[9px] font-black text-black mt-1 uppercase tracking-tighter opacity-60 group-hover:text-white">
                                        {item.secondary}
                                    </div>
                                )}
                            </div>
                            {item.meta && (
                                <div className="text-[9px] font-black text-black ml-3 uppercase tracking-widest opacity-40 group-hover:text-white">
                                    {item.meta}
                                </div>
                            )}
                        </button>
                    ))}

                    {/* View All */}
                    {(hasMoreItems || onViewAll) && (
                        <button
                            onClick={onViewAll}
                            className="w-full flex items-center justify-center gap-2 mt-4 p-3 bg-black text-white text-[10px] font-black uppercase tracking-[0.3em] hover:bg-white hover:text-black border border-black transition-all"
                        >
                            View All ({items.length})
                            <ChevronRight size={14} />
                        </button>
                    )}
                </div>
            )}
        </Card>
    );
}

export default ActionListCard;
