'use client';

import React from 'react';
import { clsx } from 'clsx';
import { JLPT_COLORS } from '../types';

interface JLPTBadgeProps {
  level: number | null | undefined;
  size?: 'xs' | 'sm' | 'md';
  showLabel?: boolean;
  className?: string;
}

export function JLPTBadge({ level, size = 'sm', showLabel = false, className }: JLPTBadgeProps) {
  if (!level || !JLPT_COLORS[level]) return null;

  const colors = JLPT_COLORS[level];

  const sizeClasses = {
    xs: 'text-[8px] px-1.5 py-0.5',
    sm: 'text-[9px] px-2 py-0.5',
    md: 'text-[11px] px-2.5 py-1',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center font-black uppercase tracking-widest rounded-lg border',
        sizeClasses[size],
        className
      )}
      style={{
        backgroundColor: colors.bg,
        color: colors.text,
        borderColor: colors.border,
      }}
    >
      {colors.label}
      {showLabel && <span className="ml-1 font-normal normal-case tracking-normal opacity-70">
        {level === 5 ? 'Beginner' : level === 4 ? 'Elementary' : level === 3 ? 'Intermediate' : level === 2 ? 'Upper Int.' : 'Advanced'}
      </span>}
    </span>
  );
}

interface JLPTDistributionBarProps {
  distribution: Record<string, number>;
  className?: string;
  showLabels?: boolean;
}

export function JLPTDistributionBar({ distribution, className, showLabels = false }: JLPTDistributionBarProps) {
  const levels = [
    { key: 'N5', level: 5 },
    { key: 'N4', level: 4 },
    { key: 'N3', level: 3 },
    { key: 'N2', level: 2 },
    { key: 'N1', level: 1 },
  ].filter(({ key }) => (distribution[key] || 0) > 0);

  if (levels.length === 0) return null;

  const total = levels.reduce((sum, { key }) => sum + (distribution[key] || 0), 0);

  return (
    <div className={clsx('space-y-1', className)}>
      {/* Stacked bar */}
      <div className="flex h-2 rounded-full overflow-hidden gap-px">
        {levels.map(({ key, level }) => {
          const pct = distribution[key] || 0;
          const colors = JLPT_COLORS[level];
          return (
            <div
              key={key}
              className="h-full transition-all duration-500"
              style={{
                width: `${pct}%`,
                backgroundColor: colors.border,
              }}
              title={`${key}: ${pct}%`}
            />
          );
        })}
      </div>

      {/* Labels */}
      {showLabels && (
        <div className="flex flex-wrap gap-2">
          {levels.map(({ key, level }) => {
            const pct = distribution[key] || 0;
            const colors = JLPT_COLORS[level];
            return (
              <div key={key} className="flex items-center gap-1">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: colors.border }}
                />
                <span className="text-[9px] font-black uppercase tracking-wide" style={{ color: colors.text }}>
                  {key} {pct}%
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface JLPTChartProps {
  distribution: Record<string, number>;
  className?: string;
}

export function JLPTChart({ distribution, className }: JLPTChartProps) {
  const levels = [
    { key: 'N5', level: 5 },
    { key: 'N4', level: 4 },
    { key: 'N3', level: 3 },
    { key: 'N2', level: 2 },
    { key: 'N1', level: 1 },
    { key: 'unknown', level: 0 },
  ];

  const maxPct = Math.max(...levels.map(({ key }) => distribution[key] || 0), 1);

  return (
    <div className={clsx('space-y-2', className)}>
      {levels.map(({ key, level }) => {
        const pct = distribution[key] || 0;
        if (pct === 0) return null;

        const colors = level > 0 ? JLPT_COLORS[level] : {
          bg: '#F7FAFC', text: '#A0AEC0', border: '#CBD5E0', label: '?'
        };
        const barWidth = Math.round((pct / maxPct) * 100);

        return (
          <div key={key} className="flex items-center gap-3">
            <span
              className="text-[9px] font-black uppercase tracking-widest w-8 shrink-0"
              style={{ color: colors.text }}
            >
              {key === 'unknown' ? '?' : key}
            </span>
            <div className="flex-1 h-5 bg-[#F7FAFC] rounded-lg overflow-hidden border border-border/20">
              <div
                className="h-full rounded-lg transition-all duration-700 flex items-center justify-end pr-2"
                style={{
                  width: `${Math.max(barWidth, 8)}%`,
                  backgroundColor: colors.bg,
                  borderRight: `2px solid ${colors.border}`,
                }}
              >
                <span className="text-[8px] font-black" style={{ color: colors.text }}>
                  {pct}%
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
