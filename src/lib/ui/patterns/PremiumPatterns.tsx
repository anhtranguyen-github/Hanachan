import React from 'react';

/**
 * Minimal Patterns
 */

interface PatternProps {
    className?: string;
    opacity?: number;
    color?: string;
}

export const GridPattern: React.FC<PatternProps> = ({ className, opacity = 0.05, color = "black" }) => (
    <svg
        className={className}
        width="100%"
        height="100%"
        style={{ opacity }}
        xmlns="http://www.w3.org/2000/svg"
    >
        <defs>
            <pattern id="grid" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke={color} strokeWidth="0.5" />
            </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
    </svg>
);

export const DotsPattern: React.FC<PatternProps> = ({ className, opacity = 0.1, color = "black" }) => (
    <svg
        className={className}
        width="100%"
        height="100%"
        style={{ opacity }}
        xmlns="http://www.w3.org/2000/svg"
    >
        <defs>
            <pattern id="dots" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
                <circle cx="1" cy="1" r="0.5" fill={color} />
            </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dots)" />
    </svg>
);
