import logging
import json
import random
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any

from app.core.supabase import supabase

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
    """
    # Fetch vocabulary that user has started learning
    # Using Supabase for complex join: get uls and join with ku and vd
    res = supabase.table("user_learning_states").select(
        "state, reps, ku:knowledge_units(id, character, meaning, jlpt, level, type), vd:vocabulary_details(reading, audio_url, context_sentences)"
    ).eq("user_id", user_id) \
     .eq("facet", "meaning") \
     .in_("state", ["learning", "review", "burned"]) \
     .execute()
    
    words = []
    for row in res.data or []:
        ku = row.get("ku")
        if not ku or ku.get("type") != "vocabulary":
            continue
        
        vd = row.get("vd") or {}
        context_sentences = []
        if vd.get("context_sentences"):
            sentences_data = vd["context_sentences"]
            if isinstance(sentences_data, list):
                for s in sentences_data:
                    if isinstance(s, dict):
                        context_sentences.append({
                            "ja": s.get("ja", ""),
                            "en": s.get("en", ""),
                            "reading": s.get("reading", ""),
                            "audio_url": s.get("audio_url"),
                        })
        
        words.append(LearnedWord(
            id=str(ku["id"]),
            character=ku.get("character", ""),
            meaning=ku.get("meaning", ""),
            reading=vd.get("reading", ""),
            level=ku.get("level", 1),
            jlpt=ku.get("jlpt"),
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
    """
    sentence_lower = sentence.lower()
    matched = []
    
    for word in learned_words:
        char = word.character.lower() if word.character else ""
        reading = word.reading.lower() if word.reading else ""
        
        if char and char in sentence_lower:
            matched.append(word.character)
        elif reading and reading in sentence_lower:
            matched.append(word.character)
    
    return len(matched), matched


def calculate_sentence_difficulty(sentence: str, learned_words: List[LearnedWord]) -> str:
    """
    Calculate the difficulty of a sentence.
    """
    total_chars = len(sentence)
    learned_count, _ = count_learned_words_in_sentence(sentence, learned_words)
    
    words = sentence.split()
    total_words = len(words) if words else 1
    known_ratio = learned_count / total_words if total_words > 0 else 0
    
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
    Select the best sentences for speaking practice.
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
                
            if len(japanese) > 50:
                continue
            
            learned_count, matched_words = count_learned_words_in_sentence(
                japanese, learned_words
            )
            
            if learned_count == 0:
                continue
            
            difficulty = calculate_sentence_difficulty(japanese, learned_words)
            
            difficulty_order = [DIFFICULTY_N5, DIFFICULTY_N4, DIFFICULTY_N3, DIFFICULTY_N2, DIFFICULTY_N1]
            target_idx = difficulty_order.index(target_difficulty) if target_difficulty in difficulty_order else 0
            sentence_idx = difficulty_order.index(difficulty) if difficulty in difficulty_order else 0
            
            if sentence_idx > target_idx + 1:
                continue
            
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
    
    candidate_sentences.sort(key=lambda x: (
        x.difficulty != target_difficulty,
        -(x.learned_words_count if x.learned_words_count <= 2 else 3),
        len(x.japanese),
    ))
    
    return candidate_sentences[:max_sentences]


def get_user_level(user_id: str) -> int:
    """Get the user's current curriculum level."""
    res = supabase.table("users").select("level").eq("id", user_id).execute()
    return res.data[0]["level"] if res.data else 1


def get_difficulty_from_level(level: int) -> str:
    """Convert user level (1-60) to JLPT difficulty string."""
    if level <= 10: return DIFFICULTY_N5
    elif level <= 20: return DIFFICULTY_N4
    elif level <= 35: return DIFFICULTY_N3
    elif level <= 50: return DIFFICULTY_N2
    else: return DIFFICULTY_N1


def calculate_adaptive_difficulty(
    current_difficulty: str,
    score: int,
    word_attempts: int,
) -> Dict[str, Any]:
    """
    Calculate the next difficulty and action based on pronunciation score.
    """
    difficulty_order = [DIFFICULTY_N5, DIFFICULTY_N4, DIFFICULTY_N3, DIFFICULTY_N2, DIFFICULTY_N1]
    current_idx = difficulty_order.index(current_difficulty) if current_difficulty in difficulty_order else 0
    
    if score < SCORE_THRESHOLD_REPEAT:
        return {
            "next_action": "repeat",
            "next_difficulty": current_difficulty,
            "reason": "Score too low, need more practice",
            "should_repeat": True,
        }
    elif score < SCORE_THRESHOLD_SIMPLER:
        return {
            "next_action": "simpler",
            "next_difficulty": current_difficulty,
            "reason": "Try a simpler sentence",
            "should_repeat": True,
        }
    elif score < SCORE_THRESHOLD_ADVANCE:
        return {
            "next_action": "next",
            "next_difficulty": current_difficulty,
            "reason": "Good progress, continue practicing",
            "should_repeat": False,
        }
    elif score < SCORE_THRESHOLD_EXCELLENT:
        next_idx = min(current_idx + 1, len(difficulty_order) - 1)
        return {
            "next_action": "advance",
            "next_difficulty": difficulty_order[next_idx],
            "reason": "Excellent! Ready for harder sentences",
            "should_repeat": False,
        }
    else:
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
    """
    sentences = session_data.get("sentences", [])
    current_difficulty = session_data.get("difficulty", DIFFICULTY_N5)
    
    if not sentences:
        return {"success": False, "error": "No sentences in session"}
    
    if last_score is None:
        return {
            "success": True,
            "sentence": sentences[current_index] if current_index < len(sentences) else sentences[0],
            "index": current_index,
            "is_complete": current_index >= len(sentences),
            "feedback": None,
        }
    
    word_attempts = session_data.get("word_attempts", {}).get(last_word, 0) if last_word else 0
    adaptive = calculate_adaptive_difficulty(current_difficulty, last_score, word_attempts)
    
    next_index = current_index
    next_sentence = None
    
    if adaptive["should_repeat"] and current_index < len(sentences):
        next_sentence = sentences[current_index]
    else:
        next_index = current_index + 1
        if next_index < len(sentences):
            next_sentence = sentences[next_index]
        else:
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
    res = supabase.table("speaking_sessions").select("*").eq("id", session_id).execute()
    if not res.data:
        return None
        
    row = res.data[0]
    if isinstance(row.get("sentences"), str):
        row["sentences"] = json.loads(row["sentences"])
    return row


def update_session_state(session_id: str, current_index: int, difficulty: str) -> bool:
    """Update session progress in database."""
    supabase.table("speaking_sessions").update({
        "current_index": current_index,
        "difficulty": difficulty,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }).eq("id", session_id).execute()
    return True


def record_practice_attempt(
    user_id: str,
    session_id: str,
    sentence: str,
    score: int,
    word: str,
) -> Dict[str, Any]:
    """
    Record a practice attempt in the database.
    """
    supabase.table("speaking_attempts").insert({
        "user_id": user_id,
        "session_id": session_id,
        "sentence": sentence,
        "score": score,
        "word": word
    }).execute()
    
    logger.info(f"Practice attempt recorded: user={user_id}, session={session_id}, word={word}, score={score}")
    
    return {"success": True, "recorded": True}


def end_session_db(session_id: str, status: str = "completed") -> bool:
    """Mark session as ended in database."""
    supabase.table("speaking_sessions").update({
        "status": status,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }).eq("id", session_id).execute()
    return True


def create_practice_session(
    user_id: str,
    target_difficulty: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Create a new speaking practice session for a user.
    """
    user_level = get_user_level(user_id)
    if target_difficulty is None:
        target_difficulty = get_difficulty_from_level(user_level)
    
    learned_words = get_learned_words(user_id)
    
    if not learned_words:
        return {
            "success": False,
            "error": "No learned words found. Start learning vocabulary first!",
            "sentences": [],
            "difficulty": target_difficulty,
            "user_level": user_level,
        }
    
    sentences = select_sentences_for_practice(
        learned_words,
        target_difficulty=target_difficulty,
        max_sentences=15,
    )
    
    if not sentences:
        sentences = [
            PracticeSentence(
                japanese=word.character,
                reading=word.reading,
                english=word.meaning,
                source_word=word.character,
                difficulty=DIFFICULTY_N5,
                learned_words_count=1,
                total_words=1,
            )
            for word in learned_words[:10]
        ]
    
    random.shuffle(sentences)
    
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
    
    session_id = str(uuid.uuid4())
    
    supabase.table("speaking_sessions").insert({
        "id": session_id,
        "user_id": user_id,
        "sentences": sentences_data,
        "difficulty": target_difficulty,
        "total_sentences": len(sentences_data)
    }).execute()
    
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
    # Since Supabase SDK doesn't support complex aggregations like COUNT(DISTINCT ...) well,
    # we'll use a simple query and handle it or use an RPC if needed.
    # For now, let's try to get enough data.
    res = supabase.table("speaking_attempts").select("session_id, score, word, created_at").eq("user_id", user_id).execute()
    data = res.data or []
    
    if not data:
        return {
            "total_sessions": 0,
            "total_attempts": 0,
            "average_score": 0.0,
            "words_practiced": 0,
            "current_streak": 0,
        }
    
    sessions = set(d["session_id"] for d in data)
    words = set(d["word"] for d in data)
    avg_score = sum(d["score"] for d in data) / len(data)
    
    # Simple streak calculation from the fetched data
    days = sorted(list(set(datetime.fromisoformat(d["created_at"].replace("Z", "+00:00")).date() for d in data)), reverse=True)
    streak = 0
    if days:
        streak = 1
        for i in range(len(days) - 1):
            if (days[i] - days[i+1]).days == 1:
                streak += 1
            else:
                break
                
    return {
        "total_sessions": len(sessions),
        "total_attempts": len(data),
        "average_score": round(avg_score, 1),
        "words_practiced": len(words),
        "current_streak": streak,
    }
