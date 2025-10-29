// SRS Glossary - Terminology and definitions for the Spaced Repetition System

export type GlossaryKey =
    | 'apprentice'
    | 'guru'
    | 'master'
    | 'enlightened'
    | 'burned'
    | 'lesson'
    | 'review'
    | 'level'
    | 'radical'
    | 'kanji'
    | 'vocabulary'
    | 'srs_stage';

export interface GlossaryEntry {
    term: string;
    definition: string;
    category: 'stage' | 'item' | 'action' | 'concept';
}

export const SRS_GLOSSARY: Record<GlossaryKey, GlossaryEntry> = {
    apprentice: {
        term: 'Apprentice',
        definition: 'The initial learning stage (stages 1-4) where items are reviewed frequently to build familiarity.',
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
        definition: 'The final mastery stage (stage 9) where items are considered permanently learned and no longer reviewed.',
        category: 'stage'
    },
    lesson: {
        term: 'Lesson',
        definition: 'An initial learning session where new items are introduced with mnemonics and examples.',
        category: 'action'
    },
    review: {
        term: 'Review',
        definition: 'A practice session where previously learned items are tested to reinforce memory.',
        category: 'action'
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
    }
};

// Helper function to get glossary entry
export function getGlossaryEntry(key: GlossaryKey): GlossaryEntry {
    return SRS_GLOSSARY[key];
}

// Helper function to get all entries by category
export function getGlossaryByCategory(category: GlossaryEntry['category']): GlossaryEntry[] {
    return Object.values(SRS_GLOSSARY).filter(entry => entry.category === category);
}
