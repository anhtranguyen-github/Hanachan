"""
Video Dictation Service
Handles dictation practice sessions for video subtitles
"""

from __future__ import annotations

import uuid
import logging
from typing import Optional, List, Dict, Any
from datetime import datetime

from ..core.database import get_db_connection

logger = logging.getLogger(__name__)


# In-memory session storage for active dictation sessions
# In production, this would be Redis or database-backed
_dictation_sessions: Dict[str, Dict[str, Any]] = {}


def create_dictation_session(
    user_id: str,
    video_id: str,
    settings: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Create a new dictation session for a video.
    
    Returns session data including available subtitles for dictation.
    """
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            # Get subtitles for the video
            query = """
                SELECT id, start_time_ms, end_time_ms, text, tokens
                FROM video_subtitles
                WHERE video_id = %s
                ORDER BY start_time_ms
            """
            cur.execute(query, (video_id,))
            subtitles = cur.fetchall()
            
            if not subtitles:
                return {
                    "success": False,
                    "error": "No subtitles available for this video",
                }
            
            # Filter subtitles based on settings
            filtered_subtitles = _filter_subtitles(subtitles, settings)
            
            if not filtered_subtitles:
                return {
                    "success": False,
                    "error": "No subtitles match the filter criteria",
                }
            
            # Create session in database
            session_id = str(uuid.uuid4())
            settings_json = settings or {
                "show_reading": False,
                "playback_speed": 1.0,
            }
            
            insert_query = """
                INSERT INTO video_dictation_sessions 
                (id, user_id, video_id, total_subtitles, settings)
                VALUES (%s, %s, %s, %s, %s)
                ON CONFLICT (user_id, video_id, DATE(started_at)) 
                DO UPDATE SET started_at = NOW(), status = 'in_progress'
                RETURNING id
            """
            cur.execute(
                insert_query,
                (session_id, user_id, video_id, len(filtered_subtitles), settings_json),
            )
            
            # Format subtitles for response
            subtitle_items = []
            for sub in filtered_subtitles:
                tokens = sub.get("tokens", []) or []
                # Try to get reading from first token
                reading = None
                if tokens and len(tokens) > 0:
                    reading = tokens[0].get("reading")
                
                subtitle_items.append({
                    "id": str(sub["id"]),
                    "text": sub["text"],
                    "reading": reading,
                    "start_time_ms": sub["start_time_ms"],
                    "end_time_ms": sub["end_time_ms"],
                })
            
            # Store session in memory for quick access
            _dictation_sessions[session_id] = {
                "user_id": user_id,
                "video_id": video_id,
                "subtitles": subtitle_items,
                "completed_ids": set(),
                "correct_ids": set(),
                "current_index": 0,
                "started_at": datetime.utcnow(),
            }
            
            return {
                "success": True,
                "session_id": session_id,
                "video_id": video_id,
                "subtitles": subtitle_items,
                "total_subtitles": len(subtitle_items),
            }
    except Exception as e:
        logger.error(f"Error creating dictation session: {e}")
        return {
            "success": False,
            "error": str(e),
        }
    finally:
        conn.close()


def _filter_subtitles(
    subtitles: List[Dict[str, Any]], 
    settings: Optional[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """Filter subtitles based on settings."""
    if not settings:
        return subtitles
    
    min_length = settings.get("min_subtitle_length", 1)
    max_length = settings.get("max_subtitle_length", 100)
    jlpt_levels = settings.get("included_jlpt_levels", [5, 4, 3, 2, 1])
    
    filtered = []
    for sub in subtitles:
        text = sub.get("text", "")
        text_len = len(text)
        
        if text_len < min_length or text_len > max_length:
            continue
        
        # Check JLPT levels if tokens have JLPT info
        tokens = sub.get("tokens", []) or []
        if jlpt_levels and tokens:
            # If any token has JLPT level outside filter, skip
            has_valid_level = False
            for token in tokens:
                token_jlpt = token.get("jlpt")
                if token_jlpt is None:
                    has_valid_level = True
                    break
                if token_jlpt in jlpt_levels:
                    has_valid_level = True
                    break
            if not has_valid_level and tokens:
                continue
        
        filtered.append(sub)
    
    return filtered


def submit_dictation_attempt(
    user_id: str,
    session_id: str,
    subtitle_id: str,
    user_input: str,
    time_taken_ms: int = 0,
) -> Dict[str, Any]:
    """
    Submit a dictation attempt and calculate accuracy.
    """
    conn = get_db_connection()
    try:
        # Get session from memory or database
        session = _dictation_sessions.get(session_id)
        
        if not session:
            # Try to load from database
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT * FROM video_dictation_sessions WHERE id = %s AND user_id = %s",
                    (session_id, user_id),
                )
                db_session = cur.fetchone()
                if not db_session:
                    return {"success": False, "error": "Session not found"}
                
                # Load subtitles
                cur.execute(
                    """SELECT vs.id, vs.text, vs.tokens 
                       FROM video_subtitles vs
                       JOIN video_dictation_attempts vda ON vda.subtitle_id = vs.id
                       WHERE vda.session_id = %s""",
                    (session_id,),
                )
                attempted = cur.fetchall()
                
                session = {
                    "user_id": user_id,
                    "video_id": db_session["video_id"],
                    "subtitles": [],  # Would need to load all
                    "completed_ids": {str(s["id"]) for s in attempted},
                    "correct_ids": set(),
                }
        
        if session.get("user_id") != user_id:
            return {"success": False, "error": "Forbidden"}
        
        # Find the target subtitle
        target_text = None
        subtitle_start_time = None
        subtitle_end_time = None
        
        for sub in session.get("subtitles", []):
            if sub.get("id") == subtitle_id:
                target_text = sub.get("text")
                subtitle_start_time = sub.get("start_time_ms")
                subtitle_end_time = sub.get("end_time_ms")
                break
        
        if not target_text:
            return {"success": False, "error": "Subtitle not found in session"}
        
        # Calculate accuracy using simple character comparison
        is_correct = user_input.strip() == target_text.strip()
        accuracy_score = calculate_similarity(user_input, target_text)
        
        # Count correct characters
        correct_chars = 0
        target_chars = list(target_text)
        input_chars = list(user_input)
        
        for i, c in enumerate(input_chars):
            if i < len(target_chars) and c == target_chars[i]:
                correct_chars += 1
        
        total_chars = len(target_text)
        
        # Get existing attempt count for this subtitle
        with conn.cursor() as cur:
            cur.execute(
                """SELECT COUNT(*) as attempts 
                   FROM video_dictation_attempts 
                   WHERE session_id = %s AND subtitle_id = %s""",
                (session_id, subtitle_id),
            )
            result = cur.fetchone()
            attempts_count = (result["attempts"] if result else 0) + 1
            
            # Insert attempt record
            insert_query = """
                INSERT INTO video_dictation_attempts
                (id, session_id, subtitle_id, user_input, is_correct, accuracy_score, time_taken_ms, attempts_count)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """
            cur.execute(
                insert_query,
                (
                    str(uuid.uuid4()),
                    session_id,
                    subtitle_id,
                    user_input,
                    is_correct,
                    accuracy_score,
                    time_taken_ms,
                    attempts_count,
                ),
            )
            
            # Update session stats
            if session_id in _dictation_sessions:
                _dictation_sessions[session_id]["completed_ids"].add(subtitle_id)
                if is_correct:
                    _dictation_sessions[session_id]["correct_ids"].add(subtitle_id)
            
            # Check if session is complete (all subtitles attempted)
            total = len(_dictation_sessions.get(session_id, {}).get("subtitles", []))
            completed = len(_dictation_sessions.get(session_id, {}).get("completed_ids", set()))
            remaining = total - completed if total > 0 else 0
            is_complete = remaining == 0
            
            # Update session in database if complete
            if is_complete:
                correct_count = len(_dictation_sessions.get(session_id, {}).get("correct_ids", set()))
                accuracy_percent = int((correct_count / total) * 100) if total > 0 else 0
                
                cur.execute(
                    """UPDATE video_dictation_sessions 
                       SET completed_at = NOW(), status = 'completed',
                           correct_count = %s, accuracy_percent = %s
                       WHERE id = %s""",
                    (correct_count, accuracy_percent, session_id),
                )
        
        return {
            "success": True,
            "result": {
                "subtitle_id": subtitle_id,
                "target_text": target_text,
                "user_input": user_input,
                "is_correct": is_correct,
                "accuracy_score": accuracy_score,
                "correct_chars": correct_chars,
                "total_chars": total_chars,
                "subtitle_start_time_ms": subtitle_start_time,
                "subtitle_end_time_ms": subtitle_end_time,
            },
            "is_complete": is_complete,
            "remaining": remaining,
        }
    except Exception as e:
        logger.error(f"Error submitting dictation attempt: {e}")
        return {"success": False, "error": str(e)}
    finally:
        conn.close()


def calculate_similarity(input_text: str, target_text: str) -> int:
    """
    Calculate similarity score between input and target text.
    Returns a score from 0-100.
    """
    if not input_text and not target_text:
        return 100
    if not input_text or not target_text:
        return 0
    
    input_text = input_text.strip()
    target_text = target_text.strip()
    
    if input_text == target_text:
        return 100
    
    # Simple character-based similarity
    input_chars = list(input_text)
    target_chars = list(target_text)
    
    # Count matching characters at same position
    matches = sum(
        1 for i in range(min(len(input_chars), len(target_chars)))
        if input_chars[i] == target_chars[i]
    )
    
    # Use longer length as denominator
    max_len = max(len(input_chars), len(target_chars))
    
    return int((matches / max_len) * 100) if max_len > 0 else 0


def get_session_status(user_id: str, session_id: str) -> Optional[Dict[str, Any]]:
    """Get the current status of a dictation session."""
    session = _dictation_sessions.get(session_id)
    
    if not session or session.get("user_id") != user_id:
        return None
    
    total = len(session.get("subtitles", []))
    completed = len(session.get("completed_ids", set()))
    correct = len(session.get("correct_ids", set()))
    accuracy = int((correct / completed) * 100) if completed > 0 else 0
    
    return {
        "session_id": session_id,
        "video_id": session.get("video_id"),
        "total_subtitles": total,
        "completed_count": completed,
        "correct_count": correct,
        "accuracy_percent": accuracy,
        "status": "in_progress" if completed < total else "completed",
    }


def get_dictation_stats(user_id: str) -> Dict[str, Any]:
    """Get dictation statistics for a user."""
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            # Total sessions
            cur.execute(
                """SELECT COUNT(*) as total FROM video_dictation_sessions 
                   WHERE user_id = %s""",
                (user_id,),
            )
            result = cur.fetchone()
            total_sessions = result["total"] if result else 0
            
            # Total attempts
            cur.execute(
                """SELECT COUNT(*) as total FROM video_dictation_attempts va
                   JOIN video_dictation_sessions vs ON vs.id = va.session_id
                   WHERE vs.user_id = %s""",
                (user_id,),
            )
            result = cur.fetchone()
            total_attempts = result["total"] if result else 0
            
            # Average accuracy
            cur.execute(
                """SELECT AVG(accuracy_score) as avg FROM video_dictation_attempts va
                   JOIN video_dictation_sessions vs ON vs.id = va.session_id
                   WHERE vs.user_id = %s""",
                (user_id,),
            )
            result = cur.fetchone()
            average_accuracy = float(result["avg"]) if result and result["avg"] else 0.0
            
            # Videos practiced
            cur.execute(
                """SELECT COUNT(DISTINCT video_id) as total FROM video_dictation_sessions 
                   WHERE user_id = %s""",
                (user_id,),
            )
            result = cur.fetchone()
            videos_practiced = result["total"] if result else 0
            
            # Best accuracy
            cur.execute(
                """SELECT MAX(accuracy_percent) as best FROM video_dictation_sessions 
                   WHERE user_id = %s AND status = 'completed'""",
                (user_id,),
            )
            result = cur.fetchone()
            best_accuracy = result["best"] if result and result["best"] else 0
            
            return {
                "total_sessions": total_sessions,
                "total_attempts": total_attempts,
                "average_accuracy": round(average_accuracy, 1),
                "videos_practiced": videos_practiced,
                "current_streak": 0,  # Would need more complex logic
                "best_accuracy": best_accuracy,
            }
    except Exception as e:
        logger.error(f"Error getting dictation stats: {e}")
        return {
            "total_sessions": 0,
            "total_attempts": 0,
            "average_accuracy": 0.0,
            "videos_practiced": 0,
            "current_streak": 0,
            "best_accuracy": 0,
        }
    finally:
        conn.close()
