"""
Reading Creator Agent — Generates personalized Japanese reading exercises
based on user's current learning status (vocabulary, grammar, kanji mastered).

Flow:
  analyze_user_status -> select_content -> generate_passage -> create_questions -> validate -> END
"""

from __future__ import annotations

import json
import logging
import random
from typing import Any, Dict, List, Optional, TypedDict

from langchain_core.messages import HumanMessage, SystemMessage
from ..core.llm import make_llm
from ..core.database import execute_query

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Types
# ---------------------------------------------------------------------------


class ReadingConfig(TypedDict):
    exercises_per_session: int
    time_limit_minutes: int
    difficulty_level: (
        str  # 'N5' | 'N4' | 'N3' | 'N2' | 'N1' | 'adaptive'
    )
    jlpt_target: Optional[int]
    vocab_weight: int
    grammar_weight: int
    kanji_weight: int
    include_furigana: bool
    include_translation: bool
    passage_length: str  # 'short' | 'medium' | 'long'
    topic_preferences: List[str]


class ReadingQuestion(TypedDict):
    index: int
    type: str  # 'multiple_choice' | 'true_false' | 'fill_blank' | 'comprehension'
    question_ja: str
    question_en: str
    options: Optional[List[str]]
    correct_answer: str
    explanation: str


class ReadingExercise(TypedDict):
    passage_ja: str
    passage_furigana: Optional[str]
    passage_en: str
    passage_title: str
    difficulty_level: str
    jlpt_level: Optional[int]
    topic: str
    word_count: int
    featured_vocab_ids: List[str]
    featured_grammar_ids: List[str]
    featured_kanji_ids: List[str]
    questions: List[ReadingQuestion]


# ---------------------------------------------------------------------------
# User Learning Status Analyzer
# ---------------------------------------------------------------------------


def get_user_learning_context(user_id: str, config: ReadingConfig) -> Dict[str, Any]:
    """
    Fetch user's current learning status to inform content generation.
    Returns vocabulary, grammar, and kanji the user has learned.
    """
    try:
        # Get mastered vocabulary
        vocab_rows = execute_query(
            """
            SELECT ku.id, ku.character, ku.meaning, ku.jlpt, ku.level,
                   vd.reading, uls.state, uls.reps
            FROM public.user_learning_states uls
            JOIN public.knowledge_units ku ON ku.id = uls.ku_id
            LEFT JOIN public.vocabulary_details vd ON vd.ku_id = ku.id
            WHERE uls.user_id = %s
              AND ku.type = 'vocabulary'
              AND uls.facet = 'meaning'
              AND uls.state IN ('review', 'burned')
            ORDER BY uls.reps DESC
            LIMIT 100
            """,
            (user_id,),
        )

        # Get mastered grammar
        grammar_rows = execute_query(
            """
            SELECT ku.id, ku.character, ku.meaning, ku.jlpt, ku.level,
                   gd.structure, uls.state, uls.reps
            FROM public.user_learning_states uls
            JOIN public.knowledge_units ku ON ku.id = uls.ku_id
            LEFT JOIN public.grammar_details gd ON gd.ku_id = ku.id
            WHERE uls.user_id = %s
              AND ku.type = 'grammar'
              AND uls.facet = 'meaning'
              AND uls.state IN ('review', 'burned')
            ORDER BY uls.reps DESC
            LIMIT 50
            """,
            (user_id,),
        )

        # Get mastered kanji
        kanji_rows = execute_query(
            """
            SELECT ku.id, ku.character, ku.meaning, ku.jlpt, ku.level,
                   uls.state, uls.reps
            FROM public.user_learning_states uls
            JOIN public.knowledge_units ku ON ku.id = uls.ku_id
            WHERE uls.user_id = %s
              AND ku.type = 'kanji'
              AND uls.facet = 'meaning'
              AND uls.state IN ('review', 'burned')
            ORDER BY uls.reps DESC
            LIMIT 80
            """,
            (user_id,),
        )

        # Get user level
        user_row = execute_query(
            "SELECT level FROM public.users WHERE id = %s",
            (user_id,),
        )
        user_level = user_row[0]["level"] if user_row else 1

        return {
            "user_level": user_level,
            "vocab": vocab_rows or [],
            "grammar": grammar_rows or [],
            "kanji": kanji_rows or [],
            "vocab_count": len(vocab_rows or []),
            "grammar_count": len(grammar_rows or []),
            "kanji_count": len(kanji_rows or []),
        }
    except Exception as e:
        logger.error(f"Failed to get user learning context: {e}")
        return {
            "user_level": 1,
            "vocab": [],
            "grammar": [],
            "kanji": [],
            "vocab_count": 0,
            "grammar_count": 0,
            "kanji_count": 0,
        }


# ---------------------------------------------------------------------------
# Content Selector
# ---------------------------------------------------------------------------


def select_featured_content(
    context: Dict[str, Any], config: ReadingConfig
) -> Dict[str, Any]:
    """
    Select which vocabulary, grammar, and kanji to feature in the passage
    based on weights and user's learning status.
    """
    vocab_list = context["vocab"]
    grammar_list = context["grammar"]
    kanji_list = context["kanji"]

    # Determine how many items to feature based on passage length
    length_map = {"short": 5, "medium": 10, "long": 15}
    total_items = length_map.get(config.get("passage_length", "medium"), 10)

    # Calculate counts based on weights
    total_weight = (
        config.get("vocab_weight", 40)
        + config.get("grammar_weight", 30)
        + config.get("kanji_weight", 30)
    )
    vocab_count = max(
        1, round(total_items * config.get("vocab_weight", 40) / total_weight)
    )
    grammar_count = max(
        1, round(total_items * config.get("grammar_weight", 30) / total_weight)
    )
    kanji_count = max(
        1, round(total_items * config.get("kanji_weight", 30) / total_weight)
    )

    # Sample items (prefer recently learned items for reinforcement)
    selected_vocab = random.sample(vocab_list, min(vocab_count, len(vocab_list)))
    selected_grammar = random.sample(
        grammar_list, min(grammar_count, len(grammar_list))
    )
    selected_kanji = random.sample(kanji_list, min(kanji_count, len(kanji_list)))

    return {
        "vocab": selected_vocab,
        "grammar": selected_grammar,
        "kanji": selected_kanji,
        "vocab_ids": [v["id"] for v in selected_vocab],
        "grammar_ids": [g["id"] for g in selected_grammar],
        "kanji_ids": [k["id"] for k in selected_kanji],
    }


# ---------------------------------------------------------------------------
# Passage Generator Prompt
# ---------------------------------------------------------------------------

PASSAGE_GENERATION_PROMPT = """You are a Japanese language teacher creating reading practice materials.

## User Profile
- Current Level: {user_level}
- Vocabulary mastered: {vocab_count} words
- Grammar patterns mastered: {grammar_count} patterns
- Kanji mastered: {kanji_count} characters

## Featured Content to Include
### Vocabulary to use naturally:
{vocab_list}

### Grammar patterns to demonstrate:
{grammar_list}

### Kanji to include:
{kanji_list}

## Configuration
- Difficulty: {difficulty_level}
- Passage length: {passage_length} ({word_count_target} Japanese characters approx)
- Topic: {topic}
- Include furigana: {include_furigana}
- JLPT target: N{jlpt_target}

## Instructions
Create a natural, engaging Japanese reading passage that:
1. Naturally incorporates the featured vocabulary, grammar, and kanji
2. Matches the specified difficulty level
3. Is about the given topic
4. Feels authentic (not like a textbook exercise)
5. Has a clear narrative or informational structure

Then create {question_count} comprehension questions:
- Mix of multiple_choice (2-3 questions), true_false (1 question), and comprehension (1-2 questions)
- Questions should test understanding of the passage content
- Include questions that specifically test the featured vocabulary/grammar

## Output Format (JSON)
Return ONLY valid JSON in this exact format:
{{
  "passage_title": "Title in Japanese",
  "passage_ja": "Full Japanese passage text",
  "passage_furigana": "Passage with furigana in HTML ruby format (if requested)",
  "passage_en": "Full English translation",
  "topic": "{topic}",
  "difficulty_level": "{difficulty_level}",
  "jlpt_level": {jlpt_target},
  "word_count": 150,
  "questions": [
    {{
      "index": 0,
      "type": "multiple_choice",
      "question_ja": "Question in Japanese",
      "question_en": "Question in English",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": "Option A",
      "explanation": "Why this is correct"
    }},
    {{
      "index": 1,
      "type": "true_false",
      "question_ja": "Statement in Japanese",
      "question_en": "Statement in English",
      "options": ["True", "False"],
      "correct_answer": "True",
      "explanation": "Explanation"
    }},
    {{
      "index": 2,
      "type": "comprehension",
      "question_ja": "Open question in Japanese",
      "question_en": "Open question in English",
      "options": null,
      "correct_answer": "Expected answer",
      "explanation": "What to look for in the answer"
    }}
  ]
}}"""

TOPICS = [
    "daily_life",
    "culture",
    "nature",
    "food",
    "travel",
    "technology",
    "history",
    "sports",
    "music",
    "family",
    "work",
    "school",
    "seasons",
    "festivals",
    "animals",
]

TOPIC_LABELS = {
    "daily_life": "日常生活",
    "culture": "文化",
    "nature": "自然",
    "food": "食べ物",
    "travel": "旅行",
    "technology": "テクノロジー",
    "history": "歴史",
    "sports": "スポーツ",
    "music": "音楽",
    "family": "家族",
    "work": "仕事",
    "school": "学校",
    "seasons": "季節",
    "festivals": "祭り",
    "animals": "動物",
}

PASSAGE_LENGTH_CHARS = {
    "short": 150,
    "medium": 300,
    "long": 500,
}


# ---------------------------------------------------------------------------
# Main Generator
# ---------------------------------------------------------------------------


def generate_reading_exercise(
    user_id: str,
    config: ReadingConfig,
    topic: Optional[str] = None,
) -> ReadingExercise:
    """
    Generate a single reading exercise for the user based on their learning status.
    """
    # 1. Get user learning context
    context = get_user_learning_context(user_id, config)

    # 2. Select featured content
    featured = select_featured_content(context, config)

    # 3. Determine topic
    if not topic:
        prefs = config.get("topic_preferences", TOPICS)
        topic = random.choice(prefs) if prefs else random.choice(TOPICS)

    # 4. Determine difficulty
    difficulty = config.get("difficulty_level", "adaptive")
    if difficulty == "adaptive":
        level = context["user_level"]
        if level <= 10:
            difficulty = "N5"
        elif level <= 20:
            difficulty = "N4"
        elif level <= 35:
            difficulty = "N3"
        elif level <= 50:
            difficulty = "N2"
        else:
            difficulty = "N1"

    # 5. Determine JLPT target
    jlpt_target = config.get("jlpt_target") or _level_to_jlpt(context["user_level"])

    # 6. Build prompt context
    vocab_list_text = (
        "\n".join(
            [
                f"- {v.get('character', '')} ({v.get('reading', '')}) = {v.get('meaning', '')}"
                for v in featured["vocab"][:10]
            ]
        )
        or "No specific vocabulary (use N5 basics)"
    )

    grammar_list_text = (
        "\n".join(
            [
                f"- {g.get('character', '')} ({g.get('structure', '')}) = {g.get('meaning', '')}"
                for g in featured["grammar"][:5]
            ]
        )
        or "No specific grammar (use basic patterns)"
    )

    kanji_list_text = (
        "\n".join(
            [
                f"- {k.get('character', '')} = {k.get('meaning', '')}"
                for k in featured["kanji"][:10]
            ]
        )
        or "No specific kanji (use hiragana/katakana)"
    )

    passage_length = config.get("passage_length", "medium")
    word_count_target = PASSAGE_LENGTH_CHARS.get(passage_length, 300)
    question_count = min(5, max(3, config.get("exercises_per_session", 5) // 2 + 2))

    # 7. Call LLM
    llm = make_llm()
    prompt = PASSAGE_GENERATION_PROMPT.format(
        user_level=context["user_level"],
        vocab_count=context["vocab_count"],
        grammar_count=context["grammar_count"],
        kanji_count=context["kanji_count"],
        vocab_list=vocab_list_text,
        grammar_list=grammar_list_text,
        kanji_list=kanji_list_text,
        difficulty_level=difficulty,
        passage_length=passage_length,
        word_count_target=word_count_target,
        topic=TOPIC_LABELS.get(topic, topic),
        include_furigana=config.get("include_furigana", True),
        jlpt_target=jlpt_target,
        question_count=question_count,
    )

    messages = [
        SystemMessage(
            content="You are a Japanese language teacher. Always respond with valid JSON only."
        ),
        HumanMessage(content=prompt),
    ]

    response = llm.invoke(messages)
    content = response.content.strip()

    # Clean up JSON if wrapped in markdown
    if content.startswith("```"):
        lines = content.split("\n")
        content = "\n".join(lines[1:-1])

    # 8. Parse response
    try:
        data = json.loads(content)
    except json.JSONDecodeError as e:
        logger.error(
            f"Failed to parse LLM response as JSON: {e}\nContent: {content[:500]}"
        )
        # Return a fallback exercise
        data = _create_fallback_exercise(topic, difficulty, jlpt_target)

    # 9. Build exercise object
    exercise: ReadingExercise = {
        "passage_ja": data.get("passage_ja", ""),
        "passage_furigana": data.get("passage_furigana")
        if config.get("include_furigana")
        else None,
        "passage_en": data.get("passage_en", "")
        if config.get("include_translation")
        else "",
        "passage_title": data.get("passage_title", ""),
        "difficulty_level": difficulty,
        "jlpt_level": jlpt_target,
        "topic": topic,
        "word_count": data.get("word_count", len(data.get("passage_ja", ""))),
        "featured_vocab_ids": featured["vocab_ids"],
        "featured_grammar_ids": featured["grammar_ids"],
        "featured_kanji_ids": featured["kanji_ids"],
        "questions": data.get("questions", []),
    }

    return exercise


def generate_reading_session(
    user_id: str,
    config: ReadingConfig,
) -> List[ReadingExercise]:
    """
    Generate a full reading session with multiple exercises.
    """
    exercises = []
    num_exercises = config.get("exercises_per_session", 5)
    prefs = config.get("topic_preferences", TOPICS)

    # Distribute topics across exercises
    topics = []
    for i in range(num_exercises):
        if prefs:
            topics.append(prefs[i % len(prefs)])
        else:
            topics.append(random.choice(TOPICS))

    for i, topic in enumerate(topics):
        try:
            exercise = generate_reading_exercise(user_id, config, topic)
            exercises.append(exercise)
            logger.info(
                f"Generated exercise {i + 1}/{num_exercises} for user {user_id}"
            )
        except Exception as e:
            logger.error(f"Failed to generate exercise {i + 1}: {e}")
            # Add fallback
            jlpt = config.get("jlpt_target") or 5
            exercises.append(_create_fallback_exercise(topic, "N3", jlpt))

    return exercises


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _level_to_jlpt(level: int) -> int:
    """Convert curriculum level to approximate JLPT level."""
    if level <= 10:
        return 5
    elif level <= 20:
        return 4
    elif level <= 35:
        return 3
    elif level <= 50:
        return 2
    else:
        return 1


def _create_fallback_exercise(
    topic: str, difficulty: str, jlpt_level: int
) -> Dict[str, Any]:
    """Create a simple fallback exercise when LLM fails."""
    return {
        "passage_title": "日本語の練習",
        "passage_ja": "今日は良い天気です。空は青くて、太陽が輝いています。公園で散歩するのが好きです。",
        "passage_furigana": "<ruby>今日<rt>きょう</rt></ruby>は<ruby>良<rt>よ</rt></ruby>い<ruby>天気<rt>てんき</rt></ruby>です。",
        "passage_en": "Today is nice weather. The sky is blue and the sun is shining. I like to take walks in the park.",
        "topic": topic,
        "difficulty_level": difficulty,
        "jlpt_level": jlpt_level,
        "word_count": 30,
        "questions": [
            {
                "index": 0,
                "type": "multiple_choice",
                "question_ja": "今日の天気はどうですか？",
                "question_en": "What is the weather like today?",
                "options": ["良い天気", "悪い天気", "雨", "雪"],
                "correct_answer": "良い天気",
                "explanation": "The passage says 今日は良い天気です (Today is nice weather).",
            },
            {
                "index": 1,
                "type": "true_false",
                "question_ja": "空は青いです。",
                "question_en": "The sky is blue.",
                "options": ["True", "False"],
                "correct_answer": "True",
                "explanation": "The passage says 空は青くて (The sky is blue).",
            },
        ],
    }
