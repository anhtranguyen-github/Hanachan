"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import { CircleDot, Lock, GraduationCap, RefreshCw, Trophy, LucideIcon } from 'lucide-react';

import { LEARNING_STATES, type LearningStatus } from '@/config/design.config';

export type FilterStatus = LearningStatus | 'all';

interface FilterBarProps {
    activeStatus: FilterStatus | 'all';
    onStatusChange: (status: FilterStatus | 'all') => void;
    className?: string;
}

export function FilterBar({ activeStatus, onStatusChange, className }: FilterBarProps) {
    const filters = [
        { id: 'all', label: 'All Nodes' },
        { id: 'new', label: 'New' },
        { id: 'learning', label: 'Learning' },
        { id: 'review', label: 'Review' },
        { id: 'relearning', label: 'Relearning' },
        { id: 'burned', label: 'Burned' }
    ];

    const getTreatment = (id: string) => {
        switch (id) {
            case 'all':
                return { bg: '#F0F9FF', border: '#BAE6FD', text: '#0369A1', width: '2px' };
            case 'new':
                return { bg: '#F8FAFC', border: 'transparent', text: '#94A3B8', width: '0px' };
            case 'learning':
                return { bg: '#F5F5F4', border: '#D6D3D1', text: '#78716C', width: '2px' };
            case 'review':
                return { bg: '#A89D91', border: 'transparent', text: '#FFFFFF', width: '0px' };
            case 'relearning':
                return { bg: '#FFFFFF', border: '#A89D91', text: '#78716C', width: '4px' };
            case 'burned':
                return { bg: '#B1BBC9', border: 'transparent', text: '#FFFFFF', width: '0px' };
            default:
                return { bg: '#F8FAFC', border: '#E2E8F0', text: '#64748B', width: '2px' };
        }
    };

    return (
        <div className={cn("flex flex-wrap items-center gap-2", className)}>
            {filters.map((filter) => {
                const isActive = activeStatus === filter.id;
                const tr = getTreatment(filter.id);

                return (
                    <button
                        key={filter.id}
                        onClick={() => onStatusChange(filter.id as FilterStatus)}
                        className={cn(
                            "px-5 py-2.5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                            isActive ? "opacity-100 scale-105" : "opacity-40 hover:opacity-100"
                        )}
                        style={{
                            backgroundColor: tr.bg,
                            border: tr.width !== '0px' ? `${tr.width} solid ${tr.border}` : 'none',
                            color: tr.text,
                        }}
                    >
                        {filter.label}
                    </button>
                );
            })}
        </div>
    );
}
