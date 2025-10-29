import React from 'react';

/**
 * Unified Icon System
 * 
 * Clean, minimal, black strokes.
 */

interface IconProps extends React.SVGProps<SVGSVGElement> {
    size?: number;
    color?: string;
    strokeWidth?: number;
}

export const RadicalIcon: React.FC<IconProps> = ({ size = 24, color = "black", strokeWidth = 2, ...props }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
    >
        <path d="M12 3L4 9V21H20V9L12 3Z" />
        <path d="M12 8V16" />
        <path d="M8 12H16" />
    </svg>
);

export const KanjiIcon: React.FC<IconProps> = ({ size = 24, color = "black", strokeWidth = 2, ...props }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
    >
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M8 8H16" />
        <path d="M8 12H16" />
        <path d="M8 16H16" />
        <path d="M12 8V16" />
    </svg>
);

export const VocabularyIcon: React.FC<IconProps> = ({ size = 24, color = "black", strokeWidth = 2, ...props }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
    >
        <path d="M4 19.5V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v15.5a1.5 1.5 0 0 1-3 0V5" />
        <path d="M8 7h6" />
        <path d="M8 11h6" />
        <path d="M8 15h3" />
    </svg>
);

export const GrammarIcon: React.FC<IconProps> = ({ size = 24, color = "black", strokeWidth = 2, ...props }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
    >
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
        <path d="M3.27 6.96 12 12.01l8.73-5.05" />
        <path d="M12 22.08V12" />
    </svg>
);

export const LevelsIcon: React.FC<IconProps> = ({ size = 24, color = "black", strokeWidth = 2, ...props }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
    >
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
);

export const Logo: React.FC<IconProps> = ({ size = 24, color = "black", ...props }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        {...props}
    >
        <circle cx="50" cy="50" r="40" stroke={color} strokeWidth="8" />
        <circle cx="50" cy="50" r="15" fill={color} />
    </svg>
);
