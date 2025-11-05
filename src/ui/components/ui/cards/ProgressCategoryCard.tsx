import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from './Card';
import { HelpTooltip } from './HelpTooltip';
import { SRS_GLOSSARY, GlossaryKey } from '@/config/srs-glossary';
import { RadicalIcon, KanjiIcon, VocabularyIcon } from '../icons/UnifiedIcons';
import { GridPattern } from '../patterns/PremiumPatterns';

/**
 * ProgressCategoryCard (Type E)
 * 
 * Features: Level selector + 3 category boxes + progress bar + unlock message
 * Used for: LevelProgressCard
 */

export interface CategoryProgress {
    id: string;
    label: string;
    icon?: React.ReactNode;
    current: number;
    total: number;
    color?: string;
    onClick?: () => void;
}

export interface ProgressCategoryCardProps {
    title: string;
    helpKey?: GlossaryKey;
    currentLevel: number;
    categories: CategoryProgress[];
    progressMessage: string;
    progressPercent: number;
    onLevelChange?: (level: number) => void;
    onCategoryClick?: (categoryId: string) => void;
    className?: string;
    loading?: boolean;
}

export function ProgressCategoryCard({
    title,
    helpKey,
    currentLevel,
    categories,
    progressMessage,
    progressPercent,
    onLevelChange,
    onCategoryClick,
    className,
    loading = false,
}: ProgressCategoryCardProps) {
    if (loading) {
        return (
            <Card className={cn('animate-pulse border-black', className)}>
                <div className="flex items-center justify-between mb-4">
                    <div className="h-5 w-28 bg-black/10" />
                    <div className="h-5 w-16 bg-black/10" />
                </div>
                <div className="grid grid-cols-3 gap-3 mb-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-24 bg-black/5" />
                    ))}
                </div>
                <div className="h-2 bg-black/10" />
            </Card>
        );
    }

    const getIcon = (cat: CategoryProgress) => {
        if (cat.icon) return cat.icon;
        switch (cat.id.toLowerCase()) {
            case 'radicals':
            case 'radical':
                return <RadicalIcon size={18} color="black" />;
            case 'kanji':
                return <KanjiIcon size={18} color="black" />;
            case 'vocabs':
            case 'vocab':
            case 'vocabulary':
                return <VocabularyIcon size={18} color="black" />;
            default:
                return null;
        }
    };

    return (
        <Card className={cn("relative overflow-hidden border-black", className)}>
            <div className="absolute inset-0 pointer-events-none opacity-[0.05]">
                <GridPattern />
            </div>

            {/* Header with Level Selector */}
            <div className="flex items-center justify-between mb-4 relative z-10">
                <div className="flex items-center gap-2">
                    <h3 className="font-black text-black tracking-tight uppercase">{title}</h3>
                    {helpKey && (
                        <HelpTooltip content={SRS_GLOSSARY[helpKey].definition} />
                    )}
                </div>

                <button
                    onClick={() => onLevelChange?.(currentLevel)}
                    className="flex items-center gap-1 text-sm font-black text-black hover:bg-black hover:text-white transition-all px-2 py-1 border border-black"
                >
                    LV {currentLevel}
                    <ChevronRight size={16} />
                </button>
            </div>

            {/* Subtitle */}
            <p className="text-[10px] font-black text-black mb-4 relative z-10 uppercase tracking-widest">
                Items <span className="underline">Guru&apos;d</span>{' '}
                <HelpTooltip content={SRS_GLOSSARY.guru.definition} />
                {' '}in level {currentLevel}.
            </p>

            {/* Category Boxes */}
            <div className="grid grid-cols-3 gap-3 mb-4 relative z-10">
                {categories.map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => onCategoryClick?.(cat.id)}
                        className={cn(
                            'p-3 border border-black text-left',
                            'hover:bg-black hover:text-white transition-all',
                            'group relative overflow-hidden bg-white'
                        )}
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-1 border border-black group-hover:bg-white group-hover:text-black">
                                {getIcon(cat)}
                            </div>
                            <span className="text-[9px] font-black uppercase tracking-widest text-inherit">
                                {cat.label}
                            </span>
                        </div>
                        <div className="text-xl font-black text-inherit">
                            {cat.current}<span className="opacity-20 mx-0.5">/</span>{cat.total}
                        </div>
                    </button>
                ))}
            </div>

            {/* Progress Message */}
            <div className="text-[11px] font-black text-black mb-3 relative z-10 uppercase tracking-tight">
                {progressMessage}
            </div>

            {/* Progress Bar */}
            <div className="h-4 bg-white border border-black overflow-hidden relative z-10 p-0.5">
                <div
                    className="h-full bg-black transition-all duration-1000 ease-out"
                    style={{ width: `${Math.min(100, progressPercent)}%` }}
                />
            </div>
        </Card>
    );
}

export default ProgressCategoryCard;

