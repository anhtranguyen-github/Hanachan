// SRS Glossary - Terminology and definitions for the Spaced Repetition System

export type GlossaryKey =
    | 'new'
    | 'learning'
    | 'review'
    | 'burned'
    | 'lesson'
    | 'review_action'
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
    new: {
        term: 'New',
        definition: 'Items that have not been started yet and are waiting in the lesson queue.',
        category: 'stage'
    },
    learning: {
        term: 'Learning',
        definition: 'Items recently introduced that are in the short-term memory loop.',
        category: 'stage'
    },
    review: {
        term: 'Review',
        definition: 'Items that have been moved to long-term memory and are scheduled for periodic reinforcement.',
        category: 'stage'
    },
    burned: {
        term: 'Burned',
        definition: 'Items that are considered permanently mastered and are no longer actively reviewed.',
        category: 'stage'
    },
    lesson: {
        term: 'Lesson',
        definition: 'An initial learning session where new items are introduced with mnemonics and examples.',
        category: 'action'
    },
    review_action: {
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
        definition: 'A mastery level representing how well an item is known, determining its review frequency.',
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
