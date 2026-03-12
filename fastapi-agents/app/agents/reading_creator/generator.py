import json
import logging
import random
import secrets
from typing import Any

from langchain_core.messages import HumanMessage, SystemMessage

from app.agents.reading_creator.prompts import (
    PASSAGE_GENERATION_PROMPT,
    PASSAGE_LENGTH_CHARS,
    TOPIC_LABELS,
    TOPICS,
)
from app.agents.reading_creator.types import ReadingConfig, ReadingExercise
from app.core.core_client import CoreClient
from app.core.llm import make_llm

logger = logging.getLogger(__name__)


async def get_user_learning_context(jwt: str) -> dict[str, Any]:
    """
    Fetch user's current learning status to inform content generation.
    Returns vocabulary, grammar, and kanji the user has learned via Core Service.
    """
    try:
        client = CoreClient(jwt)
        return await client.get_user_learning_context()
    except Exception as e:
        logger.error(f"Failed to get user learning context from core service: {e}")
        return {
            "user_level": 1,
            "vocab": [],
            "grammar": [],
            "kanji": [],
            "vocab_count": 0,
            "grammar_count": 0,
            "kanji_count": 0,
        }


def select_featured_content(context: dict[str, Any], config: ReadingConfig) -> dict[str, Any]:
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
    vocab_count = max(1, round(total_items * config.get("vocab_weight", 40) / total_weight))
    grammar_count = max(1, round(total_items * config.get("grammar_weight", 30) / total_weight))
    kanji_count = max(1, round(total_items * config.get("kanji_weight", 30) / total_weight))

    # Sample items (prefer recently learned items for reinforcement)
    selected_vocab = random.sample(vocab_list, min(vocab_count, len(vocab_list)))  # nosec B311
    selected_grammar = random.sample(  # nosec B311
        grammar_list, min(grammar_count, len(grammar_list))
    )
    selected_kanji = random.sample(kanji_list, min(kanji_count, len(kanji_list)))  # nosec B311

    return {
        "vocab": selected_vocab,
        "grammar": selected_grammar,
        "kanji": selected_kanji,
        "vocab_ids": [v["id"] for v in selected_vocab],
        "grammar_ids": [g["id"] for g in selected_grammar],
        "kanji_ids": [k["id"] for k in selected_kanji],
    }


async def generate_reading_exercise(
    user_id: str,
    config: ReadingConfig,
    jwt: str,
    topic: str | None = None,
) -> ReadingExercise:
    """
    Generate a single reading exercise for the user based on their learning status.
    """
    # 1. Get user learning context (now via Core Service)
    context = await get_user_learning_context(jwt)

    # 2. Select featured content
    featured = select_featured_content(context, config)

    # 3. Determine topic
    if not topic:
        prefs = config.get("topic_preferences", TOPICS)
        topic = secrets.choice(prefs) if prefs else secrets.choice(TOPICS)

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
            [f"- {k.get('character', '')} = {k.get('meaning', '')}" for k in featured["kanji"][:10]]
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
        logger.error(f"Failed to parse LLM response as JSON: {e}\nContent: {content[:500]}")
        # Return a fallback exercise
        data = _create_fallback_exercise(topic, difficulty, jlpt_target)

    # 9. Build exercise object
    exercise: ReadingExercise = {
        "passage_ja": data.get("passage_ja", ""),
        "passage_furigana": data.get("passage_furigana")
        if config.get("include_furigana")
        else None,
        "passage_en": data.get("passage_en", "") if config.get("include_translation") else "",
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


async def generate_reading_session(
    user_id: str,
    config: ReadingConfig,
    jwt: str,
) -> list[ReadingExercise]:
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
            topics.append(secrets.choice(TOPICS))

    for i, topic in enumerate(topics):
        try:
            exercise = await generate_reading_exercise(user_id, config, jwt, topic)
            exercises.append(exercise)
            logger.info(f"Generated exercise {i + 1}/{num_exercises} for user {user_id}")
        except Exception as e:
            logger.error(f"Failed to generate exercise {i + 1}: {e}")
            # Add fallback
            jlpt = config.get("jlpt_target") or 5
            exercises.append(_create_fallback_exercise(topic, "N3", jlpt))

    return exercises


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


def _create_fallback_exercise(topic: str, difficulty: str, jlpt_level: int) -> dict[str, Any]:
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
