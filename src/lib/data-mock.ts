
/**
 * Hanachan V2 - Central Mock Data Provider
 * Used to fill business gaps and ensure the UI is always "WOW" and functional.
 */


export const MOCK_TRANSCRIPT = [
    { start: 0, text: "こんにちは、皆さん。今回も新しい日本語を勉強しましょう！" },
    { start: 3.5, text: "今回は、日常会話でよく使う表現を紹介します。" },
    { start: 7.2, text: "例えば、「イメージ」という言葉は、英語のImageとは少し使い方が違います。" },
    { start: 12.5, text: "日本人は「印象」という意味で使うことが多いですね。" },
    { start: 16.8, text: "皆さんは、日本の文化に対してどんなイメージを持っていますか？" },
    { start: 21.0, text: "アニメや食べ物、それとも侍のイメージでしょうか？" },
    { start: 25.4, text: "ぜひコメント欄で教えてくださいね！" },
    { start: 29.1, text: "では、本編に入りましょう。" }
];

export const MOCK_VIDEOS = [
    {
        id: 'mock-1',
        video_id: 'sample-vid-1',
        title: 'Learn Japanese with Anime - Impression vs Image',
        channel_title: 'Japanese Mastery',
        thumbnail_url: 'https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=500&auto=format&fit=crop',
        status: 'NEW'
    },
    {
        id: 'mock-2',
        video_id: 'sample-vid-2',
        title: 'Top 10 Grammar Mistakes Beginners Make',
        channel_title: 'Sensei Online',
        thumbnail_url: 'https://images.unsplash.com/photo-1490730141103-6cac27aaab94?q=80&w=500&auto=format&fit=crop',
        status: 'STUDYING'
    }
];

// MOCK_STUDY_ITEMS has been migrated to src/lib/mock-db/seeds.ts


export const MOCK_ANALYSIS_RESULT = {
    raw_text: "私は雨の日曜日の午後にドゥームメタルを聴くのが好きです。",
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
        { title: "Subject Marker", selector: "は", meaning: "Topic marker", explanation: "Indicates the topic of the sentence." },
        { title: "Possessive", selector: "の", meaning: "Possessive particle", explanation: "Links nouns together." },
        { title: "Temporal", selector: "に", meaning: "Time marker", explanation: "Indicates a specific point in time." }
    ],
    coverage_stats: {
        total_units: 15,
        known_units: 14,
        percentage: 93.3
    },
    cloze_suggestion: {
        text: "私は雨の日曜日の午後にドゥームメタルを[聴く]のが好きです。",
        target: "聴く"
    }
};
