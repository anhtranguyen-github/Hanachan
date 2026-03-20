import {
    Sparkles,
    Languages,
    BookOpen,
    FileText,
    LucideIcon
} from 'lucide-react';

/**
 * SAKURA SYSTEM V5: VIBRANT DENSITY & SEMANTIC DARKS
 * 
 * 1. Semantic Darks: Instead of generic Cocoa, each category uses its own Deep shade for icons/accents.
 * 2. Vibrant Solids: Core learning items use 100% saturation backgrounds to avoid "pale" UI.
 * 3. Ink Persistence: Primary text remains Sakura Ink (#1C1C1C) for maximum legibility.
 */

export const BRAND_COLORS = {
    sakuraInk: '#1C1C1C',      // Deepest text
    sakuraDivider: '#F1F5F9',  // Slate 100
    sakuraBgApp: '#F8FAFC',    // Slate 50 base
    sakuraGray: '#64748b',
};

export type ContentType = 'radical' | 'kanji' | 'vocabulary' | 'grammar';

export interface ContentTypeDesign {
    id: ContentType;
    label: string;
    inkColor: string;       // Primary saturated color
    pastelBg: string;      // Background tint
    deepColor: string;     // Replacement for generic Cocoa (Accents)
    vibrantSolid: string;  // High-density color for buttons/active states
    icon: LucideIcon;
}

export const CONTENT_TYPES: Record<ContentType, ContentTypeDesign> = {
    radical: {
        id: 'radical',
        label: 'Radical',
        inkColor: '#0EA5E9',       // Sky 500
        pastelBg: '#F0F9FF',      // Sky 50
        deepColor: '#075985',     // Sky 800 (Accent)
        vibrantSolid: '#0284C7',  // Sky 600
        icon: Sparkles,
    },
    kanji: {
        id: 'kanji',
        label: 'Kanji',
        inkColor: '#F43F5E',       // Rose 500
        pastelBg: '#FFF1F2',      // Rose 50
        deepColor: '#9F1239',     // Rose 800 (Accent)
        vibrantSolid: '#E11D48',  // Rose 600
        icon: Languages,
    },
    vocabulary: {
        id: 'vocabulary',
        label: 'Vocabulary',
        inkColor: '#8B5CF6',       // Violet 500
        pastelBg: '#F5F3FF',      // Violet 50
        deepColor: '#5B21B6',     // Violet 800 (Accent)
        vibrantSolid: '#7C3AED',  // Violet 600
        icon: BookOpen,
    },
    grammar: {
        id: 'grammar',
        label: 'Grammar',
        inkColor: '#F59E0B',       // Amber 500
        pastelBg: '#FFFBEB',      // Amber 50
        deepColor: '#92400E',     // Amber 800 (Accent)
        vibrantSolid: '#D97706',  // Amber 600
        icon: FileText,
    }
};

export type LearningStatus = 'new' | 'learning' | 'review' | 'relearning' | 'burned';

export interface LearningStateDesign {
    id: LearningStatus;
    label: string;
    color: string;
    description: string;
}

export const LEARNING_STATES: Record<LearningStatus, LearningStateDesign> = {
    new: {
        id: 'new',
        label: 'New',
        color: '#64748B', // Slate
        description: 'Just discovered'
    },
    learning: {
        id: 'learning',
        label: 'Learning',
        color: '#3B82F6', // Blue
        description: 'Active practice'
    },
    review: {
        id: 'review',
        label: 'Review',
        color: '#8B5CF6', // Violet
        description: 'Needs verification'
    },
    relearning: {
        id: 'relearning',
        label: 'Relearning',
        color: '#F43F5E', // Rose
        description: 'Forgotten item'
    },
    burned: {
        id: 'burned',
        label: 'Burned',
        color: '#10B981', // Emerald
        description: 'Mastered permanently'
    }
};

export function getContentTypeDesign(type: string): ContentTypeDesign {
    const normalizedType = type?.toLowerCase() as ContentType;
    return CONTENT_TYPES[normalizedType] || CONTENT_TYPES.vocabulary;
}

export const DESIGN_SYSTEM_CLASSES = {
    noShadow: 'shadow-none',
    rounded: 'rounded-2xl',
    roundedFull: 'rounded-full',
    focusRing: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
    touchTarget: 'min-h-[44px] min-w-[44px]',
    vibrantBorder: 'border-2',
    glassEffect: 'backdrop-blur-none bg-white', // Consistent with NO-GLASS rule
};
