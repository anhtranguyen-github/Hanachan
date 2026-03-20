
import React from 'react';
import { cn } from '@/lib/utils';
import { SRSStageSchema } from '@/lib/validation';
import { z } from 'zod';

type SRSStage = z.infer<typeof SRSStageSchema>;

interface SRSProgressIconProps {
    stage: SRSStage;
    className?: string;
}

const stageConfig: Record<SRSStage, { label: string, color: string, ring: string }> = {
    'new': { label: 'NEW', color: 'bg-slate-500', ring: 'ring-slate-500/20' },
    'learning': { label: 'APP', color: 'bg-pink-500', ring: 'ring-pink-500/20' }, // Apprentice
    'review': { label: 'GURU', color: 'bg-indigo-500', ring: 'ring-indigo-500/20' }, // Guru/Review
    'burned': { label: 'BURN', color: 'bg-amber-500', ring: 'ring-amber-500/20' },
};

export const SRSProgressIcon: React.FC<SRSProgressIconProps> = ({ stage, className }) => {
    const config = stageConfig[stage] || stageConfig.new;

    return (
        <div className={cn(
            "flex items-center justify-center rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wider text-white ring-4",
            config.color,
            config.ring,
            className
        )}>
            {config.label}
        </div>
    );
};
