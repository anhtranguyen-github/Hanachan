"""
Speaking Practice Service - Core logic for adaptive speaking practice.

This service handles:
1. Fetching learned words and their example sentences
2. Sentence selection based on learned words and difficulty
3. Progressive difficulty logic
4. Adaptive feedback based on pronunciation scores
"""

from __future__ import annotations

import logging
import random
import json
import uuid
from typing import Any, Dict, List, Optional
from dataclasses import dataclass, field

from ..core.database import execute_query, execute_single

logger = logging.getLogger(__name__)


# Difficulty thresholds
DIFFICULTY_N5 = "N5"
DIFFICULTY_N4 = "N4"
DIFFICULTY_N3 = "N3"
DIFFICULTY_N2 = "N2"
DIFFICULTY_N1 = "N1"

# Score thresholds for adaptive logic
SCORE_THRESHOLD_REPEAT = 50  # Below this, repeat the sentence
SCORE_THRESHOLD_SIMPLER = 60  # Below this, use simpler sentence
SCORE_THRESHOLD_ADVANCE = 70  # Above this, advance difficulty
SCORE_THRESHOLD_EXCELLENT = 90  # Above this, jump difficulty


@dataclass
class LearnedWord:
    """Represents a word the user has learned."""
    id: str
    character: str
    meaning: str
    reading: str
    level: int
    jlpt: Optional[int]
    state: str
    reps: int
    context_sentences: List[Dict[str, str]] = field(default_factory=list)


@dataclass
class PracticeSentence:
    """Represents a sentence for speaking practice."""
    japanese: str
    reading: str
    english: str
    source_word: str
    difficulty: str
    learned_words_count: int
    total_words: int
    audio_url: Optional[str] = None


@dataclass
class SpeakingPracticeSession:
    """Manages a speaking practice session."""
    session_id: str
    user_id: str
    sentences: List[PracticeSentence]
    current_index: int
    difficulty: str
    word_attempts: Dict[str, int] = field(default_factory=dict)
    word_scores: Dict[str, List[int]] = field(default_factory=dict)
    completed: bool = False


def get_learned_words(user_id: str, min_state: str = "learning") -> List[LearnedWord]:
    """
    Fetch all words the user has learned (learning, review, or burned).
    
    Args:
        user_id: The user's UUID
        min_state: Minimum learning state to consider (default: 'learning')
    
    Returns:
        List of LearnedWord objects with their context sentences
    """
    # Fetch vocabulary that user has started learning
    vocab_rows = execute_query(
        """
        SELECT ku.id, ku.character, ku.meaning, ku.jlpt, ku.level,
               vd.reading, vd.audio_url, vd.context_sentences,
               uls.state, uls.reps
        FROM public.user_learning_states uls
        JOIN public.knowledge_units ku ON ku.id = uls.ku_id
        LEFT JOIN public.vocabulary_details vd ON vd.ku_id = ku.id
        WHERE uls.user_id = %s
          AND ku.type = 'vocabulary'
          AND uls.facet = 'meaning'
          AND uls.state IN ('learning', 'review', 'burned')
        ORDER BY uls.reps DESC, ku.level ASC
        """,
        (user_id,),
    )
    
    words = []
    for row in vocab_rows:
        # Extract context sentences from JSONB
        context_sentences = []
        if row.get("context_sentences"):
            try:
                # context_sentences is JSONB, could be a list of {ja, en, audio_url}
                sentences_data = row["context_sentences"]
                if isinstance(sentences_data, list):
                    for s in sentences_data:
                        if isinstance(s, dict):
                            context_sentences.append({
                                "ja": s.get("ja", ""),
                                "en": s.get("en", ""),
                                "reading": s.get("reading", ""),
                                "audio_url": s.get("audio_url"),
                            })
            except Exception as e:
                logger.warning(f"Failed to parse context sentences: {e}")
        
        words.append(LearnedWord(
            id=str(row["id"]),
            character=row.get("character", ""),
            meaning=row.get("meaning", ""),
            reading=row.get("reading", ""),
            level=row.get("level", 1),
            jlpt=row.get("jlpt"),
            state=row.get("state", "new"),
            reps=row.get("reps", 0),
            context_sentences=context_sentences,
        ))
    
    return words


def extract_kana(text: str) -> str:
    """Extract kana from Japanese text (hiragana + katakana)."""
    kana_chars = []
    for char in text:
        # Check if character is in hiragana or katakana ranges
        if '\u3040' <= char <= '\u309F':  # Hiragana
            kana_chars.append(char)
        elif '\u30A0' <= char <= '\u30FF':  # Katakana
            kana_chars.append(char)
    return ''.join(kana_chars)


def count_learned_words_in_sentence(sentence: str, learned_words: List[LearnedWord]) -> tuple[int, List[str]]:
    """
    Count how many learned words are in a sentence.
    
    Returns:
        Tuple of (count, list of matched words)
    """
    sentence_lower = sentence.lower()
    matched = []
    
    for word in learned_words:
        # Check if the word's character or reading appears in the sentence
        char = word.character.lower() if word.character else ""
        reading = word.reading.lower() if word.reading else ""
        
        if char and char in sentence_lower:
            matched.append(word.character)
        elif reading and reading in sentence_lower:
            matched.append(word.character)
    
    return len(matched), matched


def calculate_sentence_difficulty(sentence: str, learned_words: List[LearnedWord]) -> str:
    """
    Calculate the difficulty of a sentence based on:
    - Length (character count)
    - Number of learned words
    - Grammar complexity (simplified: based on sentence length)
    """
    # Simple heuristics for Japanese
    total_chars = len(sentence)
    learned_count, _ = count_learned_words_in_sentence(sentence, learned_words)
    
    # Calculate ratio of known words
    words = sentence.split()
    total_words = len(words) if words else 1
    known_ratio = learned_count / total_words if total_words > 0 else 0
    
    # Determine difficulty
    if total_chars <= 8 or known_ratio >= 0.9:
        return DIFFICULTY_N5
    elif total_chars <= 15 or known_ratio >= 0.7:
        return DIFFICULTY_N4
    elif total_chars <= 25 or known_ratio >= 0.5:
        return DIFFICULTY_N3
    elif total_chars <= 40 or known_ratio >= 0.3:
        return DIFFICULTY_N2
    else:
        return DIFFICULTY_N1


def select_sentences_for_practice(
    learned_words: List[LearnedWord],
    target_difficulty: str = DIFFICULTY_N5,
    max_sentences: int = 20,
) -> List[PracticeSentence]:
    """
    Select the best sentences for speaking practice based on learned words.
    
    Selection criteria:
    1. Sentences containing learned words
    2. Match target difficulty
    3. Prioritize sentences with 1-2 learned words
    4. Prefer shorter, natural sentences
    5. Avoid sentences with too many unknown words
    """
    if not learned_words:
        return []
    
    candidate_sentences: List[PracticeSentence] = []
    
    for word in learned_words:
        if not word.context_sentences:
            continue
            
        for sentence_data in word.context_sentences:
            japanese = sentence_data.get("ja", "")
            if not japanese:
                continue
                
            # Skip if sentence is too long or complex
            if len(japanese) > 50:
                continue
            
            # Count learned words in this sentence
            learned_count, matched_words = count_learned_words_in_sentence(
                japanese, learned_words
            )
            
            # Skip sentences with no learned words
            if learned_count == 0:
                continue
            
            # Calculate difficulty
            difficulty = calculate_sentence_difficulty(japanese, learned_words)
            
            # Filter by target difficulty (allow one level variance)
            difficulty_order = [DIFFICULTY_N5, DIFFICULTY_N4, DIFFICULTY_N3, DIFFICULTY_N2, DIFFICULTY_N1]
            target_idx = difficulty_order.index(target_difficulty) if target_difficulty in difficulty_order else 0
            sentence_idx = difficulty_order.index(difficulty) if difficulty in difficulty_order else 0
            
            # Include if within one level of target
            if sentence_idx > target_idx + 1:
                continue
            
            # Calculate a score for ranking
            # Prefer: moderate length, 1-2 learned words, matches target difficulty
            length_score = max(0, 20 - abs(len(japanese) - 15))  # Prefer ~15 chars
            learned_score = 10 if 1 <= learned_count <= 2 else 5 if learned_count > 2 else 0
            difficulty_score = 10 if difficulty == target_difficulty else 5
            
            total_score = length_score + learned_score + difficulty_score
            
            candidate_sentences.append(PracticeSentence(
                japanese=japanese,
                reading=sentence_data.get("reading", ""),
                english=sentence_data.get("en", ""),
                source_word=word.character,
                difficulty=difficulty,
                learned_words_count=learned_count,
                total_words=len(japanese.split()),
                audio_url=sentence_data.get("audio_url"),
            ))
    
    # Sort by score (descending) and limit
    candidate_sentences.sort(key=lambda x: (
        # First: prefer target difficulty
        x.difficulty != target_difficulty,
        # Then: prefer sentences with some learned words but not too many
        -(x.learned_words_count if x.learned_words_count <= 2 else 3),
        # Then: prefer shorter sentences
        len(x.japanese),
    ))
    
    return candidate_sentences[:max_sentences]


def get_user_level(user_id: str) -> int:
    """Get the user's current curriculum level."""
    user_row = execute_single(
        "SELECT level FROM public.users WHERE id = %s",
        (user_id,),
    )
    return user_row["level"] if user_row else 1


def get_difficulty_from_level(level: int) -> str:
    """Convert user level (1-60) to JLPT difficulty string."""
    if level <= 10:
        return DIFFICULTY_N5
    elif level <= 20:
        return DIFFICULTY_N4
    elif level <= 35:
        return DIFFICULTY_N3
    elif level <= 50:
        return DIFFICULTY_N2
    else:
        return DIFFICULTY_N1





def calculate_adaptive_difficulty(
    current_difficulty: str,
    score: int,
    word_attempts: int,
) -> Dict[str, Any]:
    """
    Calculate the next difficulty and action based on pronunciation score.
    
    Adaptive logic:
    - If score < 50: Repeat same sentence (needs more practice)
    - If score 50-60: Stay at same difficulty, try simpler sentence
    - If score 60-70: Good progress, stay at current difficulty
    - If score 70-90: Excellent, can advance difficulty
    - If score > 90: Mastered, jump difficulty
    
    Returns:
        Dict with next_action, next_difficulty, and reason
    """
    difficulty_order = [DIFFICULTY_N5, DIFFICULTY_N4, DIFFICULTY_N3, DIFFICULTY_N2, DIFFICULTY_N1]
    current_idx = difficulty_order.index(current_difficulty) if current_difficulty in difficulty_order else 0
    
    if score < SCORE_THRESHOLD_REPEAT:
        # Needs significant improvement
        return {
            "next_action": "repeat",
            "next_difficulty": current_difficulty,
            "reason": "Score too low, need more practice",
            "should_repeat": True,
        }
    elif score < SCORE_THRESHOLD_SIMPLER:
        # Struggling slightly
        return {
            "next_action": "simpler",
            "next_difficulty": current_difficulty,
            "reason": "Try a simpler sentence",
            "should_repeat": True,
        }
    elif score < SCORE_THRESHOLD_ADVANCE:
        # Good progress, continue
        return {
            "next_action": "next",
            "next_difficulty": current_difficulty,
            "reason": "Good progress, continue practicing",
            "should_repeat": False,
        }
    elif score < SCORE_THRESHOLD_EXCELLENT:
        # Doing well, can advance
        next_idx = min(current_idx + 1, len(difficulty_order) - 1)
        return {
            "next_action": "advance",
            "next_difficulty": difficulty_order[next_idx],
            "reason": "Excellent! Ready for harder sentences",
            "should_repeat": False,
        }
    else:
        # Mastered, jump difficulty
        next_idx = min(current_idx + 2, len(difficulty_order) - 1)
        return {
            "next_action": "mastered",
            "next_difficulty": difficulty_order[next_idx],
            "reason": "Perfect! Moving to advanced practice",
            "should_repeat": False,
        }


def get_next_practice_item(
    session_data: Dict[str, Any],
    current_index: int,
    last_score: Optional[int] = None,
    last_word: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Get the next practice item based on adaptive logic.
    
    Args:
        session_data: The current session data
        current_index: Current position in sentences
        last_score: Score from last pronunciation attempt
        last_word: The word that was practiced
    
    Returns:
        Dict with next sentence, updated index, and adaptive feedback
    """
    sentences = session_data.get("sentences", [])
    current_difficulty = session_data.get("difficulty", DIFFICULTY_N5)
    
    if not sentences:
        return {
            "success": False,
            "error": "No sentences in session",
        }
    
    # If no score yet, just return current item
    if last_score is None:
        return {
            "success": True,
            "sentence": sentences[current_index] if current_index < len(sentences) else sentences[0],
            "index": current_index,
            "is_complete": current_index >= len(sentences),
            "feedback": None,
        }
    
    # Calculate adaptive response
    word_attempts = session_data.get("word_attempts", {}).get(last_word, 0) if last_word else 0
    adaptive = calculate_adaptive_difficulty(current_difficulty, last_score, word_attempts)
    
    # Determine next index
    next_index = current_index
    next_sentence = None
    
    if adaptive["should_repeat"] and current_index < len(sentences):
        # Repeat current sentence
        next_sentence = sentences[current_index]
        next_index = current_index  # Stay on same sentence
    else:
        # Move to next
        next_index = current_index + 1
        if next_index < len(sentences):
            next_sentence = sentences[next_index]
        else:
            # Session complete
            return {
                "success": True,
                "sentence": None,
                "index": next_index,
                "is_complete": True,
                "feedback": adaptive,
            }
    
    return {
        "success": True,
        "sentence": next_sentence,
        "index": next_index,
        "is_complete": False,
        "feedback": adaptive,
    }





def get_session(session_id: str) -> Optional[Dict[str, Any]]:
    """Fetch speaking session from database."""
    row = execute_single(
        "SELECT * FROM public.speaking_sessions WHERE id = %s",
        (session_id,),
    )
    if not row:
        return None
        
    # Parse sentences from JSONB
    if isinstance(row.get("sentences"), str):
        row["sentences"] = json.loads(row["sentences"])
    return row


def update_session_state(session_id: str, current_index: int, difficulty: str) -> bool:
    """Update session progress in database."""
    execute_query(
        """
        UPDATE public.speaking_sessions 
        SET current_index = %s, difficulty = %s, updated_at = NOW()
        WHERE id = %s
        """,
        (current_index, difficulty, session_id),
        fetch=False,
    )
    return True


def record_practice_attempt(
    user_id: str,
    session_id: str,
    sentence: str,
    score: int,
    word: str,
) -> Dict[str, Any]:
    """
    Record a practice attempt for analytics and adaptive learning in the database.
    """
    execute_query(
        """
        INSERT INTO public.speaking_attempts (user_id, session_id, sentence, score, word)
        VALUES (%s, %s, %s, %s, %s)
        """,
        (user_id, session_id, sentence, score, word),
        fetch=False,
    )
    
    logger.info(
        f"Practice attempt recorded: user={user_id}, session={session_id}, "
        f"word={word}, score={score}"
    )
    
    return {
        "success": True,
        "recorded": True,
    }


def end_session_db(session_id: str, status: str = "completed") -> bool:
    """Mark session as ended in database."""
    execute_query(
        "UPDATE public.speaking_sessions SET status = %s, updated_at = NOW() WHERE id = %s",
        (status, session_id),
        fetch=False,
    )
    return True


def create_practice_session(
    user_id: str,
    target_difficulty: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Create a new speaking practice session for a user in the database.
    """
    # Get user's curriculum level
    user_level = get_user_level(user_id)
    
    # Determine difficulty
    if target_difficulty is None:
        target_difficulty = get_difficulty_from_level(user_level)
    
    # Get learned words
    learned_words = get_learned_words(user_id)
    
    if not learned_words:
        return {
            "success": False,
            "error": "No learned words found. Start learning vocabulary first!",
            "sentences": [],
            "difficulty": target_difficulty,
            "user_level": user_level,
        }
    
    # Select sentences
    sentences = select_sentences_for_practice(
        learned_words,
        target_difficulty=target_difficulty,
        max_sentences=15,
    )
    
    if not sentences:
        # Fallback
        sentences = [
            PracticeSentence(
                japanese=word.character,
                reading=word.reading,
                english=word.meaning,
                source_word=word.character,
                difficulty=DIFFICULTY_BEGINNER,
                learned_words_count=1,
                total_words=1,
            )
            for word in learned_words[:10]
        ]
    
    # Shuffle for variety
    random.shuffle(sentences)
    
    # Prepare sentences for JSON storage
    sentences_data = [
        {
            "japanese": s.japanese,
            "reading": s.reading,
            "english": s.english,
            "source_word": s.source_word,
            "difficulty": s.difficulty,
            "learned_words_count": s.learned_words_count,
            "audio_url": s.audio_url,
        }
        for s in sentences
    ]
    
    # Insert into database


    session_id = str(uuid.uuid4())
    
    execute_query(
        """
        INSERT INTO public.speaking_sessions (id, user_id, sentences, difficulty, total_sentences)
        VALUES (%s, %s, %s, %s, %s)
        """,
        (session_id, user_id, json.dumps(sentences_data), target_difficulty, len(sentences_data)),
        fetch=False,
    )
    
    return {
        "success": True,
        "session_id": session_id,
        "sentences": sentences_data,
        "difficulty": target_difficulty,
        "user_level": user_level,
        "total_sentences": len(sentences_data),
    }

def get_speaking_stats(user_id: str) -> Dict[str, Any]:
    """Calculate aggregate speaking stats from the database."""
    stats = execute_single(
        """
        SELECT 
            COUNT(DISTINCT session_id) as total_sessions,
            COUNT(*) as total_attempts,
            AVG(score) as average_score,
            COUNT(DISTINCT word) as words_practiced
        FROM public.speaking_attempts
        WHERE user_id = %s
        """,
        (user_id,),
    )
    
    if not stats or stats["total_sessions"] == 0:
        return {
            "total_sessions": 0,
            "total_attempts": 0,
            "average_score": 0.0,
            "words_practiced": 0,
            "current_streak": 0,
        }
    
    # Simple streak calculation
    streak_row = execute_single(
        """
        WITH daily_practice AS (
            SELECT DISTINCT date_trunc('day', created_at) as day
            FROM public.speaking_attempts
            WHERE user_id = %s
            ORDER BY day DESC
        )
        SELECT COUNT(*) as streak FROM daily_practice
        """,
        (user_id,),
    )
    
    return {
        "total_sessions": stats["total_sessions"],
        "total_attempts": stats["total_attempts"],
        "average_score": round(float(stats["average_score"]), 1) if stats["average_score"] else 0.0,
        "words_practiced": stats["words_practiced"],
        "current_streak": streak_row["streak"] if streak_row else 0,
    }
