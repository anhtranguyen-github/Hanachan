/**
 * Centralized Mock Data Source
 * Used to populate the UI after purging all backend services.
 */

export const MOCK_DECKS = [
    {
        id: 'deck-1',
        name: 'JLPT N3 Vocabulary',
        description: 'Core words for N3 level mastery.',
        card_count: 120,
        mastered_count: 45,
        due_count: 12,
        slug: 'jlpt-n3-vocab',
        category: 'vocabulary',
        settings: {}
    },
    {
        id: 'deck-2',
        name: 'Daily Kanji - Essential',
        description: 'Common Kanji used in everyday life.',
        card_count: 350,
        mastered_count: 180,
        due_count: 5,
        slug: 'daily-kanji',
        category: 'kanji',
        settings: {}
    },
    {
        id: 'deck-3',
        name: 'Genki I - Chapter 5',
        description: 'Vocabulary and grammar from Genki I chapter 5.',
        card_count: 45,
        mastered_count: 40,
        due_count: 0,
        slug: 'genki-1-ch-5',
        category: 'vocabulary',
        settings: {}
    }
];

export const MOCK_VOCAB = [
    { id: 'v1', character: '猫', surface: '猫', reading: 'ねこ', meaning: 'Cat', level: 'N5', slug: 'neko', srsState: 'mastered' },
    { id: 'v2', character: '食べる', surface: '食べる', reading: 'たべる', meaning: 'To Eat', level: 'N5', slug: 'taberu', srsState: 'learning' },
    { id: 'v3', character: '学校', surface: '学校', reading: 'がっこう', meaning: 'School', level: 'N5', slug: 'gakkou', srsState: 'new' },
    { id: 'v4', character: '静か', surface: '静か', reading: 'しずか', meaning: 'Quiet', level: 'N3', slug: 'shizuka', srsState: 'review' },
    { id: 'v5', character: '水', surface: '水', reading: 'みず', meaning: 'Water', level: 'N5', slug: 'mizu', srsState: 'burned' },
    { id: 'v6', character: '先生', surface: '先生', reading: 'せんせい', meaning: 'Teacher', level: 'N5', slug: 'sensei', srsState: 'locked' },
    { id: 'v7', character: '本', surface: '本', reading: 'ほん', meaning: 'Book', level: 'N5', slug: 'hon', srsState: 'mastered' },
    { id: 'v8', character: '車', surface: '車', reading: 'くるま', meaning: 'Car', level: 'N5', slug: 'kuruma', srsState: 'learning' },
    { id: 'v9', character: '時間', surface: '時間', reading: 'じかん', meaning: 'Time', level: 'N4', slug: 'jikan', srsState: 'review' },
    { id: 'v10', character: '友達', surface: '友達', reading: 'ともだち', meaning: 'Friend', level: 'N5', slug: 'tomodachi', srsState: 'new' },
];

export const MOCK_KANJI = [
    { id: 'k1', character: '学', strokes: 8, meaning: 'Study', level: 'N5', slug: 'gaku', srsState: 'mastered' },
    { id: 'k2', character: '日', strokes: 4, meaning: 'Day/Sun', level: 'N5', slug: 'nichi', srsState: 'burned' },
    { id: 'k3', character: '水', strokes: 4, meaning: 'Water', level: 'N5', slug: 'sui', srsState: 'new' },
    { id: 'k4', character: '火', strokes: 4, meaning: 'Fire', level: 'N5', slug: 'hi', srsState: 'learning' },
    { id: 'k5', character: '木', strokes: 4, meaning: 'Tree', level: 'N5', slug: 'ki', srsState: 'review' },
    { id: 'k6', character: '金', strokes: 8, meaning: 'Gold/Money', level: 'N5', slug: 'kin', srsState: 'locked' },
    { id: 'k7', character: '土', strokes: 3, meaning: 'Earth', level: 'N5', slug: 'tsuchi', srsState: 'mastered' },
    { id: 'k8', character: '人', strokes: 2, meaning: 'Person', level: 'N5', slug: 'hito', srsState: 'burned' },
    { id: 'k9', character: '大', strokes: 3, meaning: 'Big', level: 'N5', slug: 'oo', srsState: 'learning' },
    { id: 'k10', character: '小', strokes: 3, meaning: 'Small', level: 'N5', slug: 'chiisai', srsState: 'review' },
];

export const MOCK_GRAMMAR = [
    { id: 'g1', title: '〜は〜です', slug: 'wa-desu', meaning: 'A is B', level: 'N5', srsState: 'mastered' },
    { id: 'g2', title: '〜ている', slug: 'te-iru', meaning: 'Present Progressive', level: 'N4', srsState: 'learning' },
    { id: 'g3', title: '〜たい', slug: 'tai', meaning: 'Want to do', level: 'N5', srsState: 'new' },
    { id: 'g4', title: '〜てください', slug: 'te-kudasai', meaning: 'Please do', level: 'N5', srsState: 'review' },
    { id: 'g5', title: '〜なければならない', slug: 'nakereba-naranai', meaning: 'Must do', level: 'N4', srsState: 'locked' },
    { id: 'g6', title: '〜ことができる', slug: 'koto-ga-dekiru', meaning: 'Can do', level: 'N4', srsState: 'burned' },
    { id: 'g7', title: '〜と思う', slug: 'to-omou', meaning: 'I think that', level: 'N4', srsState: 'mastered' },
    { id: 'g8', title: '〜ようにする', slug: 'you-ni-suru', meaning: 'Try to do', level: 'N3', srsState: 'learning' },
];

export const MOCK_SRS_CARDS = [
    {
        id: 'card-1',
        front: '静か',
        back: 'しずか (Quiet)',
        type: 'vocabulary',
        interval: 4,
        ease_factor: 2.5
    },
    {
        id: 'card-2',
        front: '経済',
        back: 'けいざい (Economy)',
        type: 'vocabulary',
        interval: 10,
        ease_factor: 2.3
    }
];

export const MOCK_GLOBAL_STATS = {
    stats: {
        mastered: 1240,
        learning: 45,
        review: 15,
        due: 12,
        total: 2500,
        new: 100
    },
    activity: [
        { date: '2024-05-01', value: 20, learned: 5 },
        { date: '2024-05-02', value: 35, learned: 8 },
        { date: '2024-05-03', value: 15, learned: 3 },
        { date: '2024-05-04', value: 45, learned: 12 },
        { date: '2024-05-05', value: 10, learned: 2 },
        { date: '2024-05-06', value: 60, learned: 15 },
        { date: '2024-05-07', value: 25, learned: 6 }
    ],
    contentProgress: [
        { label: 'Radicals', current: 450, total: 500 },
        { label: 'Kanji', current: 650, total: 1000 },
        { label: 'Vocabulary', current: 1240, total: 5000 },
        { label: 'Grammar', current: 150, total: 400 }
    ],
    studyTimeToday: 45 * 60, // 45 minutes
    forecast: [
        { date: '2024-05-08', count: 25 },
        { date: '2024-05-09', count: 18 },
        { date: '2024-05-10', count: 32 }
    ],
    accuracy: 88,
    srsDistribution: {
        apprentice: 45,
        guru: 120,
        master: 350,
        enlightened: 650,
        burned: 1240
    },
    recentMasteredDecks: [
        { id: 'deck-3', name: 'Genki I - Chapter 5', progress: 100, masteredAt: '2024-05-05T10:00:00Z' },
        { id: 'deck-1', name: 'JLPT N3 Vocabulary', progress: 37, masteredAt: null }
    ]
};
