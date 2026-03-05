from typing import TypedDict


class ReadingConfig(TypedDict):
    exercises_per_session: int
    time_limit_minutes: int
    difficulty_level: str  # 'N5' | 'N4' | 'N3' | 'N2' | 'N1' | 'adaptive'
    jlpt_target: int | None
    vocab_weight: int
    grammar_weight: int
    kanji_weight: int
    include_furigana: bool
    include_translation: bool
    passage_length: str  # 'short' | 'medium' | 'long'
    topic_preferences: list[str]

class ReadingQuestion(TypedDict, total=False):
    index: int
    type: str  # 'multiple_choice' | 'true_false' | 'fill_blank' | 'comprehension'
    question_ja: str
    question_en: str
    options: list[str] | None
    correct_answer: str
    explanation: str

class ReadingExercise(TypedDict):
    passage_ja: str
    passage_furigana: str | None
    passage_en: str
    passage_title: str
    difficulty_level: str
    jlpt_level: int | None
    topic: str
    word_count: int
    featured_vocab_ids: list[str]
    featured_grammar_ids: list[str]
    featured_kanji_ids: list[str]
    questions: list[ReadingQuestion]
