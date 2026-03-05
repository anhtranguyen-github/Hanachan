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
