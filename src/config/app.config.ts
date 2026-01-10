import {
    MessageCircle,
    Wrench,
    Zap,
    Library,
    BookOpen,
    CalendarDays,
    Settings,
    User,
    LucideIcon,
    Search,
    Repeat,
    Languages,
    Brain,
    FileText
} from 'lucide-react';

/**
 * UNIFIED APP CONFIGURATION
 * Centralizes all themes, navigation, and component settings.
 */

// 1. THEME CONFIGURATION
export const THEME = {
    palette: {
        sakura: {
            background: '27 82% 96%',       /* #FDF2E9 - Creamy Peach */
            foreground: '26 30% 22%',        /* #4A3728 - Deep Cocoa Brown */
            card: '27 82% 99%',               /* Very Light Cream Tint */
            primary: '346 82% 65%',          /* Sakura Pink */
            secondary: '27 40% 92%',         /* #F5EAE0 - Warmer Secondary */
            muted: '18 25% 90%',             /* #F0E5E0 - Soft Tan */
            accent: '189 57% 81%',           /* #B2E3EB - Sky Aqua Accent */
            border: '26 20% 85%',            /* #E5DCD4 - Soft Cocoa Border */
            ring: '346 82% 85%',
        },
        brand: {
            sakuraPink: '#F9B7C7',
            skyBlue: '#B2E3EB',
            leafGreen: '#ECFAF2',
            bananaYellow: '#FFF2CC',
            lavender: '#F2EBFB',
            toriiRed: '#F2A1A1',
            inkGray: '#4A3728',
        },
        neutral: {
            white: '#FFFFFF',
            cream: '#FDF2E9',
            ink: '#4A3728',
            night: '#261F1A',
        },
        // Semantic Palettes inspired by stickers
        earth: {
            primary: '46 96% 90%',           /* Banana Yellow Tint */
            foreground: '46 60% 30%',
        },
        knowledge: {
            primary: '189 57% 92%',          /* Sky Aqua Tint */
            foreground: '189 40% 30%',
        },
        growth: {
            primary: '149 40% 92%',          /* Matcha Green Tint */
            foreground: '149 25% 30%',
        },
        focus: {
            primary: '266 40% 92%',          /* Lavender Tint */
            foreground: '266 25% 35%',
        },
        sunset: {
            primary: '46 96% 81%',           /* Banana Yellow */
            foreground: '46 70% 30%',
        },
        ocean: {
            primary: '189 57% 81%',          /* Sky Aqua */
            foreground: '189 50% 30%',
        },
        forest: {
            primary: '149 40% 83%',          /* Matcha Green */
            foreground: '149 30% 30%',
        },
        crimson: {
            primary: '0 75% 88%',            /* Soft Crimson */
            foreground: '0 50% 35%',
        },
        lavender: {
            primary: '266 40% 84%',          /* Lavender */
            foreground: '266 30% 35%',
        },
        categories: {
            kanji: '46 96% 90%',
            grammar: '189 57% 92%',
            vocab: '266 40% 92%',
            reading: '0 0% 100%',
        }
    },
    typography: {
        fonts: {
            sans: 'var(--font-nunito)',
            display: 'var(--font-fredoka)',
            jp: 'var(--font-m-plus-rounded)',
        }
    },
    layout: {
        sidebarWidth: '280px',
        sidebarCollapsedWidth: '80px',
        headerHeight: '72px',
    },
    radius: {
        default: '1rem',
        large: '2rem',
        xl: '3rem',
    }
};

// 2. NAVIGATION CONFIGURATION
export interface NavSection {
    id: string;
    label: string;
    href: string;
    icon: LucideIcon;
    matchPaths: (string | RegExp)[];
}

export const NAV_CONFIG: NavSection[] = [
    { id: 'chat', label: 'LLM Chat', href: '/chat', icon: MessageCircle, matchPaths: ['/chat'] },
    { id: 'study-plan', label: 'Learn', href: '/study-plan', icon: CalendarDays, matchPaths: ['/study-plan', '/study-plan/lesson', '/srs/lesson'] },
    { id: 'review', label: 'Review', href: '/study-plan/study', icon: Repeat, matchPaths: ['/study-plan/study', '/study-plan/review', '/srs/review'] },
    { id: 'kanji', label: 'Kanji', href: '/kanji', icon: Languages, matchPaths: ['/kanji', '/knowledge-base/kanji'] },
    { id: 'vocabulary', label: 'Vocabulary', href: '/vocabulary', icon: Brain, matchPaths: ['/vocabulary'] },
    { id: 'grammar', label: 'Grammar', href: '/grammar', icon: FileText, matchPaths: ['/grammar', '/knowledge-base/grammar'] },
];

export const UTILITY_NAV: NavSection[] = [
    { id: 'settings', label: 'Settings', href: '/settings', icon: Settings, matchPaths: ['/settings'] },
    { id: 'profile', label: 'Profile', href: '/profile', icon: User, matchPaths: ['/profile', '/dashboard'] },
];

// 3. COMPONENT CONFIGURATIONS
export const SIDEBAR_THEMES: Record<string, { bg: string, text: string, border: string }> = {
    chat: { bg: 'bg-focus', text: 'text-focus-foreground', border: 'border-border' },
    activity: { bg: 'bg-forest', text: 'text-forest-foreground', border: 'border-border' },
    'study-plan': { bg: 'bg-primary', text: 'text-primary-foreground', border: 'border-primary' },
    tools: { bg: 'bg-sunset', text: 'text-sunset-foreground', border: 'border-border' },
    library: { bg: 'bg-knowledge', text: 'text-knowledge-foreground', border: 'border-border' },
    search: { bg: 'bg-ocean', text: 'text-ocean-foreground', border: 'border-border' },
    default: { bg: 'bg-secondary', text: 'text-foreground', border: 'border-border' }
};

export const SIDEBAR_SETTINGS = {
    pollInterval: 5000,
    dedupingInterval: 10000,
};

// 4. UTILITIES
export function resolveActiveSectionId(pathname: string | null): string | null {
    if (!pathname) return null;
    const allNav = [...NAV_CONFIG, ...UTILITY_NAV];
    for (const section of allNav) {
        for (const pattern of section.matchPaths) {
            if (typeof pattern === 'string') {
                if (pathname.startsWith(pattern)) return section.id;
            } else if (pattern.test(pathname)) {
                return section.id;
            }
        }
    }
    return null;
}

// 5. SRS GLOSSARY
export type GlossaryKey =
    | 'apprentice'
    | 'guru'
    | 'master'
    | 'enlightened'
    | 'burned'
    | 'lesson'
    | 'review'
    | 'lessons'
    | 'reviews'
    | 'ghost_reviews'
    | 'critical_items'
    | 'level'
    | 'radical'
    | 'kanji'
    | 'vocabulary'
    | 'srs_stage'
    | 'level_up'
    | 'jlpt'
    | 'spread'
    | 'accuracy'
    | 'forecast';

export interface GlossaryEntry {
    term: string;
    definition: string;
    category: 'stage' | 'item' | 'action' | 'concept' | 'metric';
}

export const SRS_GLOSSARY: Record<GlossaryKey, GlossaryEntry> = {
    apprentice: {
        term: 'Apprentice',
        definition: 'Items you\'re still learning. Review frequently (4h → 8h → 1d → 2d).',
        category: 'stage'
    },
    guru: {
        term: 'Guru',
        definition: 'An intermediate mastery stage (stages 5-6) where items are reviewed less frequently as understanding solidifies.',
        category: 'stage'
    },
    master: {
        term: 'Master',
        definition: 'An advanced mastery stage (stage 7) where items are well-known and reviewed infrequently.',
        category: 'stage'
    },
    enlightened: {
        term: 'Enlightened',
        definition: 'A near-perfect mastery stage (stage 8) where items are deeply ingrained and rarely reviewed.',
        category: 'stage'
    },
    burned: {
        term: 'Burned',
        definition: 'The final mastery stage (stage 9) where items are considered permanently learned and no longer reviewed. 🔥',
        category: 'stage'
    },
    lesson: {
        term: 'Lesson',
        definition: 'An initial learning session where new items are introduced with mnemonics and examples.',
        category: 'action'
    },
    lessons: {
        term: 'Lessons',
        definition: 'New items to learn. Complete lessons to add items to your review queue.',
        category: 'action'
    },
    review: {
        term: 'Review',
        definition: 'A practice session where previously learned items are tested to reinforce memory.',
        category: 'action'
    },
    reviews: {
        term: 'Reviews',
        definition: 'Practice items you\'ve already learned to strengthen memory using spaced repetition.',
        category: 'action'
    },
    ghost_reviews: {
        term: 'Ghost Reviews',
        definition: 'Extra reviews for items you\'ve failed 3+ times in a row. Helps reinforce difficult items.',
        category: 'action'
    },
    critical_items: {
        term: 'Critical Items',
        definition: 'Overdue items that need urgent attention (2+ days late).',
        category: 'metric'
    },
    level: {
        term: 'Level',
        definition: 'A collection of radicals, kanji, and vocabulary organized by difficulty and prerequisite knowledge.',
        category: 'concept'
    },
    radical: {
        term: 'Radical',
        definition: 'A fundamental building block of kanji characters, used to construct and remember kanji meanings.',
        category: 'item'
    },
    kanji: {
        term: 'Kanji',
        definition: 'Chinese characters used in Japanese writing, each with specific meanings and readings.',
        category: 'item'
    },
    vocabulary: {
        term: 'Vocabulary',
        definition: 'Japanese words composed of kanji and kana, representing complete concepts or ideas.',
        category: 'item'
    },
    srs_stage: {
        term: 'SRS Stage',
        definition: 'A numbered level (1-9) representing how well an item is known, determining review frequency.',
        category: 'concept'
    },
    level_up: {
        term: 'Level Up',
        definition: 'Unlock new content by Guru-ing 90% of current level\'s Kanji.',
        category: 'action'
    },
    jlpt: {
        term: 'JLPT',
        definition: 'Japanese-Language Proficiency Test. Levels: N5 (easiest) to N1 (hardest).',
        category: 'concept'
    },
    spread: {
        term: 'Spread',
        definition: 'Distribution of your items across SRS stages. Shows how many items at each level.',
        category: 'metric'
    },
    accuracy: {
        term: 'Accuracy',
        definition: 'Percentage of reviews answered correctly. Higher is better!',
        category: 'metric'
    },
    forecast: {
        term: 'Forecast',
        definition: 'Predicted number of reviews coming up. Helps you plan your study sessions.',
        category: 'metric'
    }
};

export function getGlossaryEntry(key: GlossaryKey): GlossaryEntry {
    return SRS_GLOSSARY[key];
}

export function getGlossaryByCategory(category: GlossaryEntry['category']): GlossaryEntry[] {
    return Object.values(SRS_GLOSSARY).filter(entry => entry.category === category);
}
