
import { User, KnowledgeUnit, Deck, UserLearningState, Sentence, KUKanji, KUVocabulary, KURadical, KUGrammar } from './types';

export const MOCK_USER: User = {
    id: 'user-1',
    email: 'demo@hanachan.app',
    display_name: 'Hanachan Learner',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Hanachan',
    created_at: new Date().toISOString()
};

const TERMS = [
    // Level 1 - N5 Basics
    { slug: 'vocabulary/猫', type: 'vocabulary', char: '猫', meaning: 'Cat', reading: 'ねこ', level: 1 },
    { slug: 'vocabulary/犬', type: 'vocabulary', char: '犬', meaning: 'Dog', reading: 'いぬ', level: 1 },
    { slug: 'vocabulary/食べる', type: 'vocabulary', char: '食べる', meaning: 'To eat', reading: 'たべる', level: 1 },
    { slug: 'vocabulary/学校', type: 'vocabulary', char: '学校', meaning: 'School', reading: 'がっこう', level: 1 },
    { slug: 'vocabulary/先生', type: 'vocabulary', char: '先生', meaning: 'Teacher', reading: 'せんせい', level: 1 },

    // Level 1 - Kanji
    { slug: 'kanji/日', type: 'kanji', char: '日', meaning: 'Day, Sun', reading: 'ニチ, ひ', level: 1 },
    { slug: 'kanji/月', type: 'kanji', char: '月', meaning: 'Month, Moon', reading: 'ゲツ, つき', level: 1 },
    { slug: 'kanji/木', type: 'kanji', char: '木', meaning: 'Tree', reading: 'モク, き', level: 1 },

    // Level 1 - Radicals
    { slug: 'radical/一', type: 'radical', char: '一', meaning: 'Ground', reading: '', level: 1 },
    { slug: 'radical/口', type: 'radical', char: '口', meaning: 'Mouth', reading: '', level: 1 },

    // Level 2
    { slug: 'vocabulary/電車', type: 'vocabulary', char: '電車', meaning: 'Train', reading: 'でんしゃ', level: 2 },
    { slug: 'vocabulary/電話', type: 'vocabulary', char: '電話', meaning: 'Telephone', reading: 'でんわ', level: 2 },
];

export const MOCK_KNOWLEDGE_UNITS: KnowledgeUnit[] = TERMS.map(t => ({
    id: t.slug, // Using slug as ID for simplicity in mocks, usually UUID
    slug: t.slug,
    type: t.type as any,
    level: t.level,
    character: t.char,
    meaning: t.meaning,
    search_key: t.char,
    mnemonics: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),

    // Stubbing details based on type
    ku_kanji: t.type === 'kanji' ? {
        ku_id: t.slug,
        video: null,
        meaning_data: { meanings: [t.meaning] },
        reading_data: { on: [t.reading.split(',')[0]], kun: [t.reading.split(',')[1] || ''] }
    } : null,

    ku_vocabulary: t.type === 'vocabulary' ? {
        ku_id: t.slug,
        reading_primary: t.reading,
        audio: null,
        pitch: null,
        parts_of_speech: ['noun'],
        meaning_data: { meanings: [t.meaning] }
    } : null,

    ku_radicals: t.type === 'radical' ? {
        ku_id: t.slug,
        name: t.meaning
    } : null,

    ku_grammar: t.type === 'grammar' ? {
        ku_id: t.slug,
        structure: {},
        details: 'Grammar details here',
        cautions: null,
        meaning_summary: t.meaning
    } : null
}));

// Add some grammar manually as it's complex
MOCK_KNOWLEDGE_UNITS.push({
    id: 'grammar/のです',
    slug: 'grammar/のです',
    type: 'grammar',
    level: 1,
    character: 'のです',
    meaning: 'Explanation particle',
    search_key: 'のです',
    mnemonics: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ku_grammar: {
        ku_id: 'grammar/のです',
        structure: {},
        details: 'Used to explain reasons or clarify situations.',
        cautions: 'Spoken as んです often.',
        meaning_summary: 'It is the case that...'
    }
});

export const MOCK_DECKS: Deck[] = [
    { id: 'deck-n5', owner_id: null, name: 'JLPT N5 Core', description: 'Essential vocabulary for beginners', deck_type: 'system', level: 5, created_at: new Date().toISOString() },
    { id: 'deck-mined', owner_id: 'user-1', name: 'My Mined Words', description: 'Words from YouTube', deck_type: 'user', level: null, created_at: new Date().toISOString() }
];

export const MOCK_USER_STATES: UserLearningState[] = [
    {
        user_id: 'user-1',
        ku_id: 'vocabulary/猫',
        state: 'review',
        stability: 3.0,
        difficulty: 2.0,
        last_review: new Date().toISOString(),
        next_review: new Date().toISOString(), // Due now
        lapses: 0,
        reps: 5,
        srs_stage: 3
    },
    {
        user_id: 'user-1',
        ku_id: 'vocabulary/学校',
        state: 'learning',
        stability: 1.0,
        difficulty: 1.0,
        last_review: null,
        next_review: new Date().toISOString(),
        lapses: 0,
        reps: 1,
        srs_stage: 1
    }
];

export const MOCK_SENTENCES: Sentence[] = [
    {
        id: 's1',
        text_ja: '猫は魚が好きです。',
        text_en: 'Cats like fish.',
        origin: 'example',
        source_text: null,
        metadata: {},
        created_by: null,
        created_at: new Date().toISOString()
    }
];
