
import { User, KnowledgeUnit, Deck, UserLearningState, Sentence, KUKanji, KUVocabulary, KURadical, KUGrammar } from './types';

export const MOCK_USER: User = {
    id: '00000000-0000-0000-0000-000000000001',
    email: 'learner@hanachan.app',
    display_name: 'Hana Learner',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Hana',
    created_at: new Date().toISOString()
};


const TERMS = [
    // Level 1 - N5 Basics
    { slug: 'vocabulary/猫', type: 'vocabulary', char: '猫', meaning: 'Cat', reading: 'ねこ', level: 1 },
    { slug: 'vocabulary/犬', type: 'vocabulary', char: '犬', meaning: 'Dog', reading: 'いぬ', level: 1 },
    { slug: 'vocabulary/食べ物', type: 'vocabulary', char: '食べ物', meaning: 'Food', reading: 'たべもの', level: 1 },
    { slug: 'vocabulary/食べる', type: 'vocabulary', char: '食べる', meaning: 'To eat', reading: 'たべる', level: 1 },
    { slug: 'vocabulary/学校', type: 'vocabulary', char: '学校', meaning: 'School', reading: 'がっこう', level: 1 },
    { slug: 'vocabulary/先生', type: 'vocabulary', char: '先生', meaning: 'Teacher', reading: 'せんせい', level: 1 },
    { slug: 'vocabulary/学生', type: 'vocabulary', char: '学生', meaning: 'Student', reading: 'がくせい', level: 1 },

    // Level 1 - Kanji
    { slug: 'kanji/日', type: 'kanji', char: '日', meaning: 'Day, Sun', reading: 'ニチ, ひ', level: 1 },
    { slug: 'kanji/月', type: 'kanji', char: '月', meaning: 'Month, Moon', reading: 'ゲツ, つき', level: 1 },
    { slug: 'kanji/木', type: 'kanji', char: '木', meaning: 'Tree', reading: 'モク, き', level: 1 },
    { slug: 'kanji/山', type: 'kanji', char: '山', meaning: 'Mountain', reading: 'サン, やま', level: 1 },
    { slug: 'kanji/川', type: 'kanji', char: '川', meaning: 'River', reading: 'セン, かわ', level: 1 },

    // Level 1 - Radicals
    { slug: 'radical/一', type: 'radical', char: '一', meaning: 'One', reading: '', level: 1 },
    { slug: 'radical/口', type: 'radical', char: '口', meaning: 'Mouth', reading: '', level: 1 },
    { slug: 'radical/人', type: 'radical', char: '人', meaning: 'Person', reading: '', level: 1 },

    // Level 2
    { slug: 'vocabulary/電車', type: 'vocabulary', char: '電車', meaning: 'Train', reading: 'でんしゃ', level: 2 },
    { slug: 'vocabulary/電話', type: 'vocabulary', char: '電話', meaning: 'Telephone', reading: 'でんわ', level: 2 },
    { slug: 'vocabulary/仕事', type: 'vocabulary', char: '仕事', meaning: 'Work', reading: 'しごと', level: 2 },
];

export const MOCK_KNOWLEDGE_UNITS: KnowledgeUnit[] = TERMS.map(t => ({
    id: t.slug,
    slug: t.slug,
    type: t.type as any,
    level: t.level,
    character: t.char,
    meaning: t.meaning,
    search_key: t.char,
    mnemonics: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),

    ku_kanji: t.type === 'kanji' ? {
        ku_id: t.slug,
        video: null,
        meaning_data: { meanings: [t.meaning] },
        reading_data: { on: [t.reading.split(',')[0]], kun: [t.reading.split(',')[1]?.trim() || ''] }
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
MOCK_KNOWLEDGE_UNITS.push(
    {
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
    },
    {
        id: 'grammar/は',
        slug: 'grammar/は',
        type: 'grammar',
        level: 1,
        character: 'は',
        meaning: 'Topic Marker',
        search_key: 'は',
        mnemonics: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ku_grammar: {
            ku_id: 'grammar/は',
            structure: {},
            details: 'Marks the topic of the sentence.',
            cautions: 'Pronounced as "wa" not "ha".',
            meaning_summary: 'As for...'
        }
    }
);

export const MOCK_DECKS: Deck[] = [
    { id: 'deck-n5-kanji', owner_id: null, name: 'JLPT N5 Kanji', description: 'Basic kanji for Level 1', deck_type: 'system', level: 1, created_at: new Date().toISOString() },
    { id: 'deck-n5-vocab', owner_id: null, name: 'JLPT N5 Vocabulary', description: 'Essential beginner words', deck_type: 'system', level: 1, created_at: new Date().toISOString() },
    { id: 'deck-n5-grammar', owner_id: null, name: 'JLPT N5 Grammar', description: 'Core grammatical patterns', deck_type: 'system', level: 1, created_at: new Date().toISOString() },
    { id: 'deck-mined', owner_id: '00000000-0000-0000-0000-000000000001', name: 'My Mined Words', description: 'Personal word bank mined from Immersion.', deck_type: 'user', level: null, created_at: new Date().toISOString() }
];

export const MOCK_USER_STATES: UserLearningState[] = [
    {
        user_id: '00000000-0000-0000-0000-000000000001',
        ku_id: 'vocabulary/猫',
        state: 'review',
        stability: 3.0,
        difficulty: 2.0,
        last_review: new Date().toISOString(),
        next_review: new Date().toISOString(),
        lapses: 0,
        reps: 5,
        srs_stage: 3
    },
    {
        user_id: '00000000-0000-0000-0000-000000000001',
        ku_id: 'kanji/日',
        state: 'burned',
        stability: 100,
        difficulty: 1,
        last_review: new Date().toISOString(),
        next_review: new Date(Date.now() + 100000000).toISOString(),
        lapses: 0,
        reps: 10,
        srs_stage: 5
    },
    {
        user_id: '00000000-0000-0000-0000-000000000001',
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
    },
    {
        id: 's2',
        text_ja: '私は雨の日曜日の午後にドゥームメタルを聴くのが好きです。',
        text_en: 'I like listening to doom metal on rainy Sunday afternoons.',
        origin: 'chat',
        source_text: null,
        metadata: {},
        created_by: '00000000-0000-0000-0000-000000000001',
        created_at: new Date().toISOString()
    }
];

export const MOCK_YOUTUBE_VIDEOS: any[] = [
    {
        id: 'yt-1',
        video_id: '2g811Eo7K8U',
        title: 'Learn Japanese with Anime - Impression vs Image',
        channel: 'Japanese Mastery',
        duration: 300,
        created_by: '00000000-0000-0000-0000-000000000001',
        created_at: new Date().toISOString()
    },
    {
        id: 'yt-2',
        video_id: 'jP19v1Qo7fI',
        title: 'Daily Life in Tokyo - Walking through Shibuya',
        channel: 'Tokyo Walks',
        duration: 600,
        created_by: '00000000-0000-0000-0000-000000000001',
        created_at: new Date().toISOString()
    }
];

export const MOCK_CHATS: any[] = [
    {
        id: 'chat-1',
        user_id: '00000000-0000-0000-0000-000000000001',
        title: 'Learning about Image',
        mode: 'chat',
        updated_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        messages: [
            { role: 'user', content: 'What is the difference between イメージ and 印象?', timestamp: new Date().toISOString() },
            { role: 'assistant', content: 'In Japanese, "イメージ" is often used to mean "impression" or "mental image", while in English "image" usually refers to a physical picture.', timestamp: new Date().toISOString() }
        ]
    }
];

export const MOCK_ANALYSIS_RESULT = {
    raw_text: "私は雨の日曜日の午後にドゥームメタル को 聴くのが好きです。",
    translation: "I like listening to doom metal on rainy Sunday afternoons.",
    units: [
        { surface: "私", reading: "わたし", basic_form: "私", pos: "名詞", type: "vocabulary", is_in_ckb: true },
        { surface: "は", reading: "は", basic_form: "は", pos: "助詞", type: "particle", is_in_ckb: true },
        { surface: "雨", reading: "あめ", basic_form: "雨", pos: "名詞", type: "vocabulary", is_in_ckb: true },
        { surface: "の", reading: "の", basic_form: "の", pos: "助詞", type: "particle", is_in_ckb: true },
        { surface: "日曜日", reading: "にちようび", basic_form: "日曜日", pos: "名詞", type: "vocabulary", is_in_ckb: true },
        { surface: "の", reading: "の", basic_form: "の", pos: "助詞", type: "particle", is_in_ckb: true },
        { surface: "午後", reading: "ごご", basic_form: "午後", pos: "名詞", type: "vocabulary", is_in_ckb: true },
        { surface: "に", reading: "に", basic_form: "に", pos: "助詞", type: "particle", is_in_ckb: true },
        { surface: "ドゥームメタル", reading: "どぅーむめたる", basic_form: "ドゥームメタル", pos: "名詞", type: "vocabulary", is_in_ckb: false },
        { surface: "を", reading: "を", basic_form: "を", pos: "助詞", type: "particle", is_in_ckb: true },
        { surface: "聴く", reading: "きく", basic_form: "聴く", pos: "動詞", type: "vocabulary", is_in_ckb: true },
        { surface: "の", reading: "の", basic_form: "の", pos: "助詞", type: "particle", is_in_ckb: true },
        { surface: "が", reading: "が", basic_form: "が", pos: "助詞", type: "particle", is_in_ckb: true },
        { surface: "好き", reading: "すき", basic_form: "好き", pos: "名詞", type: "vocabulary", is_in_ckb: true },
        { surface: "です", reading: "です", basic_form: "です", pos: "助動詞", type: "particle", is_in_ckb: true }
    ],
    grammar_points: [
        { title: "N5: Topic Marker", selector: "は", meaning: "Topic marker", explanation: "Indicates the topic of the sentence. Pronounced 'wa'." },
        { title: "N5: Possessive", selector: "の", meaning: "Possessive particle", explanation: "Links nouns together to indicate possession or relationship." },
        { title: "N5: Temporal", selector: "に", meaning: "Time marker", explanation: "Indicates a specific point in time when something happens." },
        { title: "N5: Potential Goal", selector: "聴く", meaning: "To listen", explanation: "Dictionary form used with 'no ga suki' to say you like to listen." }
    ],
    coverage_stats: {
        total_units: 15,
        known_units: 14,
        percentage: 93.3
    },
    cloze_suggestion: {
        text: "私は雨の日曜日の午後にドゥームメタルを[聴く]のが好きです。",
        cloze_index: 0
    }
};
