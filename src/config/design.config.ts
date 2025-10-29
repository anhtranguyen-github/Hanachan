import {
    Sparkles,
    Languages,
    BookOpen,
    FileText,
    LucideIcon
} from 'lucide-react';

/**
 * SAKURA SYSTEM V4: MONOCHROMATIC DENSITY SYSTEM (NON-INTERACTIVE ICONS REMOVED)
 * 
 * 1. Content Hue (Identity): 
 *    Radical (Blue), Kanji (Pink), Vocab (Purple), Grammar (Red).
 * 2. Visual Treatment (State Density):
 *    - New: Thin border + 10% Pastel BG.
 *    - Learning: Border + 30% Pastel BG.
 *    - Review: Solid Color BG + White Text. (High Focus)
 *    - Relearning: Thick Border + Transparent BG. (Structural Warning)
 *    - Burned: Neutral Gray.
 */

export const BRAND_COLORS = {
    sakuraInk: '#1C1C1C',
    sakuraCocoa: '#4A3728',
    sakuraRose: '#5D2E37',
    sakuraDivider: '#F5E9ED',
    sakuraBgApp: '#FFFAFB',
    sakuraGray: '#64748b',
};

export type ContentType = 'radical' | 'kanji' | 'vocabulary' | 'grammar';

export interface ContentTypeDesign {
    id: ContentType;
    label: string;
    inkColor: string;
    pastelBg: string;
    inkColorDark: string;
    icon: LucideIcon;
}

export const CONTENT_TYPES: Record<ContentType, ContentTypeDesign> = {
    radical: {
        id: 'radical',
        label: 'Radical',
        inkColor: '#3B82F6', // Blue
        pastelBg: '#EFF6FF',
        inkColorDark: '#1D4ED8',
        icon: Sparkles,
    },
    kanji: {
        id: 'kanji',
        label: 'Kanji',
        inkColor: '#EC4899', // Pink
        pastelBg: '#FDF2F8',
        inkColorDark: '#BE185D',
        icon: Languages,
    },
    vocabulary: {
        id: 'vocabulary',
        label: 'Vocabulary',
        inkColor: '#8B5CF6', // Purple
        pastelBg: '#F5F3FF',
        inkColorDark: '#6D28D9',
        icon: BookOpen,
    },
    grammar: {
        id: 'grammar',
        label: 'Grammar',
        inkColor: '#EF4444', // Red
        pastelBg: '#FEF2F2',
        inkColorDark: '#B91C1C',
        icon: FileText,
    }
};

export type LearningStatus = 'new' | 'learning' | 'review' | 'relearning' | 'burned';

export interface LearningStateDesign {
    id: LearningStatus;
    label: string;
}

export const LEARNING_STATES: Record<LearningStatus, LearningStateDesign> = {
    new: {
        id: 'new',
        label: 'New',
    },
    learning: {
        id: 'learning',
        label: 'Learning',
    },
    review: {
        id: 'review',
        label: 'Review',
    },
    relearning: {
        id: 'relearning',
        label: 'Relearning',
    },
    burned: {
        id: 'burned',
        label: 'Burned',
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
    focusRing: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    touchTarget: 'min-h-[44px] min-w-[44px]',
};
