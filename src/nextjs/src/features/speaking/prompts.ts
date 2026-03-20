import type { SpeakingPrompt } from './types';

// ─── Speaking Practice Prompts ────────────────────────────────────────────────

export const SPEAKING_PROMPTS: SpeakingPrompt[] = [
    // Greetings - Beginner
    {
        id: 'greet-001',
        japanese: 'おはようございます',
        reading: 'ohayou gozaimasu',
        english: 'Good morning (formal)',
        difficulty: 'N5',
        category: 'greetings',
        tip: 'The "u" at the end of "gozaimasu" is often silent in natural speech.',
    },
    {
        id: 'greet-002',
        japanese: 'こんにちは',
        reading: 'konnichiwa',
        english: 'Hello / Good afternoon',
        difficulty: 'N5',
        category: 'greetings',
        tip: 'The "wa" here is written with the は character, not わ.',
    },
    {
        id: 'greet-003',
        japanese: 'こんばんは',
        reading: 'konbanwa',
        english: 'Good evening',
        difficulty: 'N5',
        category: 'greetings',
    },
    {
        id: 'greet-004',
        japanese: 'はじめまして、よろしくおねがいします',
        reading: 'hajimemashite, yoroshiku onegaishimasu',
        english: 'Nice to meet you, please treat me well',
        difficulty: 'N5',
        category: 'greetings',
        tip: 'This phrase is used when meeting someone for the first time.',
    },
    {
        id: 'greet-005',
        japanese: 'おげんきですか',
        reading: 'ogenki desu ka',
        english: 'How are you?',
        difficulty: 'N5',
        category: 'greetings',
    },

    // Numbers - Beginner
    {
        id: 'num-001',
        japanese: 'いち、に、さん、し、ご',
        reading: 'ichi, ni, san, shi, go',
        english: 'One, two, three, four, five',
        difficulty: 'N5',
        category: 'numbers',
    },
    {
        id: 'num-002',
        japanese: 'ろく、しち、はち、く、じゅう',
        reading: 'roku, shichi, hachi, ku, juu',
        english: 'Six, seven, eight, nine, ten',
        difficulty: 'N5',
        category: 'numbers',
    },
    {
        id: 'num-003',
        japanese: 'ひゃく、せん、まん',
        reading: 'hyaku, sen, man',
        english: 'Hundred, thousand, ten-thousand',
        difficulty: 'N3',
        category: 'numbers',
        tip: 'Japanese uses 万 (man = 10,000) as a counting unit, unlike English.',
    },

    // Daily Life - Beginner
    {
        id: 'daily-001',
        japanese: 'ありがとうございます',
        reading: 'arigatou gozaimasu',
        english: 'Thank you very much',
        difficulty: 'N5',
        category: 'daily-life',
    },
    {
        id: 'daily-002',
        japanese: 'すみません',
        reading: 'sumimasen',
        english: 'Excuse me / I\'m sorry',
        difficulty: 'N5',
        category: 'daily-life',
        tip: 'Used both to get attention and to apologize for minor things.',
    },
    {
        id: 'daily-003',
        japanese: 'わかりました',
        reading: 'wakarimashita',
        english: 'I understand / I got it',
        difficulty: 'N5',
        category: 'daily-life',
    },
    {
        id: 'daily-004',
        japanese: 'もう一度おねがいします',
        reading: 'mou ichido onegaishimasu',
        english: 'Please say that one more time',
        difficulty: 'N3',
        category: 'daily-life',
    },
    {
        id: 'daily-005',
        japanese: 'トイレはどこですか',
        reading: 'toire wa doko desu ka',
        english: 'Where is the bathroom?',
        difficulty: 'N5',
        category: 'daily-life',
    },

    // Food - Intermediate
    {
        id: 'food-001',
        japanese: 'いただきます',
        reading: 'itadakimasu',
        english: 'Let\'s eat (said before meals)',
        difficulty: 'N5',
        category: 'food',
        tip: 'This phrase expresses gratitude for the food and those who prepared it.',
    },
    {
        id: 'food-002',
        japanese: 'ごちそうさまでした',
        reading: 'gochisousama deshita',
        english: 'Thank you for the meal (said after eating)',
        difficulty: 'N3',
        category: 'food',
    },
    {
        id: 'food-003',
        japanese: 'このラーメンはとてもおいしいです',
        reading: 'kono raamen wa totemo oishii desu',
        english: 'This ramen is very delicious',
        difficulty: 'N3',
        category: 'food',
    },
    {
        id: 'food-004',
        japanese: 'おすすめは何ですか',
        reading: 'osusume wa nan desu ka',
        english: 'What do you recommend?',
        difficulty: 'N3',
        category: 'food',
    },

    // Travel - Intermediate
    {
        id: 'travel-001',
        japanese: '東京駅はどうやって行きますか',
        reading: 'toukyou eki wa douyatte ikimasu ka',
        english: 'How do I get to Tokyo Station?',
        difficulty: 'N3',
        category: 'travel',
    },
    {
        id: 'travel-002',
        japanese: 'この電車は新宿に止まりますか',
        reading: 'kono densha wa shinjuku ni tomarimasu ka',
        english: 'Does this train stop at Shinjuku?',
        difficulty: 'N3',
        category: 'travel',
    },
    {
        id: 'travel-003',
        japanese: 'チェックインをお願いします',
        reading: 'chekkuin wo onegaishimasu',
        english: 'I\'d like to check in, please',
        difficulty: 'N3',
        category: 'travel',
    },

    // Business - Advanced
    {
        id: 'biz-001',
        japanese: 'お世話になっております',
        reading: 'osewa ni natte orimasu',
        english: 'Thank you for your continued support (business greeting)',
        difficulty: 'N1',
        category: 'business',
        tip: 'This is a standard business greeting used in emails and phone calls.',
    },
    {
        id: 'biz-002',
        japanese: 'ご確認のほどよろしくお願いいたします',
        reading: 'gokakunin no hodo yoroshiku onegai itashimasu',
        english: 'I would appreciate your confirmation',
        difficulty: 'N1',
        category: 'business',
    },
    {
        id: 'biz-003',
        japanese: '会議の日程を調整させていただけますか',
        reading: 'kaigi no nittei wo chousei sasete itadakemasu ka',
        english: 'Could I reschedule the meeting?',
        difficulty: 'N1',
        category: 'business',
    },

    // Grammar - Intermediate
    {
        id: 'gram-001',
        japanese: '日本語を勉強しています',
        reading: 'nihongo wo benkyou shite imasu',
        english: 'I am studying Japanese',
        difficulty: 'N3',
        category: 'grammar',
        tip: 'The て-form + います expresses an ongoing action.',
    },
    {
        id: 'gram-002',
        japanese: '映画を見たことがあります',
        reading: 'eiga wo mita koto ga arimasu',
        english: 'I have seen a movie (before)',
        difficulty: 'N3',
        category: 'grammar',
        tip: 'た-form + ことがある expresses past experience.',
    },
    {
        id: 'gram-003',
        japanese: '雨が降れば、家にいます',
        reading: 'ame ga fureba, ie ni imasu',
        english: 'If it rains, I will stay home',
        difficulty: 'N1',
        category: 'grammar',
        tip: 'The ば-form expresses a conditional "if" statement.',
    },

    // Tongue Twisters - Advanced
    {
        id: 'twist-001',
        japanese: '生麦生米生卵',
        reading: 'namamugi namagome namatamago',
        english: 'Raw wheat, raw rice, raw egg',
        difficulty: 'N1',
        category: 'tongue-twisters',
        tip: 'A classic Japanese tongue twister. Focus on the "nama" prefix.',
    },
    {
        id: 'twist-002',
        japanese: '東京特許許可局',
        reading: 'toukyou tokkyo kyoka kyoku',
        english: 'Tokyo Patent Licensing Office',
        difficulty: 'N1',
        category: 'tongue-twisters',
        tip: 'Practice the "kyo" and "kyo" sounds carefully.',
    },
    {
        id: 'twist-003',
        japanese: 'バスガス爆発',
        reading: 'basu gasu bakuhatsu',
        english: 'Bus gas explosion',
        difficulty: 'N1',
        category: 'tongue-twisters',
        tip: 'Focus on the distinction between "ba" and "pa" sounds.',
    },
];

export const PROMPT_CATEGORIES = [
    { id: 'all', label: 'All', emoji: '🎯' },
    { id: 'greetings', label: 'Greetings', emoji: '👋' },
    { id: 'numbers', label: 'Numbers', emoji: '🔢' },
    { id: 'daily-life', label: 'Daily Life', emoji: '🌸' },
    { id: 'food', label: 'Food', emoji: '🍜' },
    { id: 'travel', label: 'Travel', emoji: '🚄' },
    { id: 'business', label: 'Business', emoji: '💼' },
    { id: 'grammar', label: 'Grammar', emoji: '📚' },
    { id: 'tongue-twisters', label: 'Tongue Twisters', emoji: '🌀' },
] as const;

export const DIFFICULTY_LABELS = {
    N5: { label: 'N5 (Beginner)', color: '#48BB78' },
    N3: { label: 'N3 (Intermediate)', color: '#4DABF7' },
    N1: { label: 'N1 (Advanced)', color: '#F4ACB7' },
} as const;
