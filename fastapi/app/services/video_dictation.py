"""
Video Dictation Service
Handles dictation practice sessions for video subtitles

ARCHITECTURE NOTE: All session state is stored in Supabase (PostgreSQL).
No in-memory state is used as source of truth. Session progress is computed
from database queries to ensure consistency across server restarts.
"""

from __future__ import annotations

import uuid
import logging
from typing import Optional, List, Dict, Any
from datetime import datetime

from ..core.database import get_db_connection

logger = logging.getLogger(__name__)


def create_dictation_session(
    user_id: str,
    video_id: str,
    settings: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Create a new dictation session for a video.
    
    Returns session data including available subtitles for dictation.
    All state is persisted to the database; no in-memory storage.
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
    
    All progress is tracked in the database; no in-memory state is used.
    """
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            # Verify session exists and belongs to user
            cur.execute(
                "SELECT * FROM video_dictation_sessions WHERE id = %s AND user_id = %s",
                (session_id, user_id),
            )
            db_session = cur.fetchone()
            if not db_session:
                return {"success": False, "error": "Session not found"}
            
            # Get the target subtitle text
            cur.execute(
                "SELECT text, start_time_ms, end_time_ms FROM video_subtitles WHERE id = %s",
                (subtitle_id,),
            )
            subtitle_row = cur.fetchone()
            if not subtitle_row:
                return {"success": False, "error": "Subtitle not found"}
            
            target_text = subtitle_row["text"]
            subtitle_start_time = subtitle_row["start_time_ms"]
            subtitle_end_time = subtitle_row["end_time_ms"]
            
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
            
            # Calculate session progress from database
            cur.execute(
                """SELECT 
                    COUNT(DISTINCT subtitle_id) as completed_count,
                    SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) as correct_count
                   FROM video_dictation_attempts 
                   WHERE session_id = %s""",
                (session_id,),
            )
            progress = cur.fetchone()
            completed = progress["completed_count"] if progress else 0
            correct_count = progress["correct_count"] if progress else 0
            
            # Get total subtitles from session
            total = db_session.get("total_subtitles", 0)
            remaining = total - completed if total > 0 else 0
            is_complete = remaining == 0
            
            # Update session in database with current stats
            accuracy_percent = int((correct_count / completed) * 100) if completed > 0 else 0
            
            if is_complete:
                cur.execute(
                    """UPDATE video_dictation_sessions 
                       SET completed_at = NOW(), 
                           status = 'completed',
                           correct_count = %s, 
                           accuracy_percent = %s
                       WHERE id = %s""",
                    (correct_count, accuracy_percent, session_id),
                )
            else:
                # Update progress even if not complete
                cur.execute(
                    """UPDATE video_dictation_sessions 
                       SET correct_count = %s, 
                           accuracy_percent = %s
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
    """
    Get the current status of a dictation session.
    
    All data is computed from database queries; no in-memory state.
    """
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            # Get session info
            cur.execute(
                """SELECT * FROM video_dictation_sessions 
                   WHERE id = %s AND user_id = %s""",
                (session_id, user_id),
            )
            session = cur.fetchone()
            
            if not session:
                return None
            
            # Calculate progress from attempts
            cur.execute(
                """SELECT 
                    COUNT(DISTINCT subtitle_id) as completed_count,
                    SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) as correct_count
                   FROM video_dictation_attempts 
                   WHERE session_id = %s""",
                (session_id,),
            )
            progress = cur.fetchone()
            completed = progress["completed_count"] if progress else 0
            correct = progress["correct_count"] if progress else 0
            
            total = session.get("total_subtitles", 0)
            accuracy = int((correct / completed) * 100) if completed > 0 else 0
            
            return {
                "session_id": session_id,
                "video_id": session.get("video_id"),
                "total_subtitles": total,
                "completed_count": completed,
                "correct_count": correct,
                "accuracy_percent": accuracy,
                "status": "completed" if completed >= total and total > 0 else "in_progress",
            }
    except Exception as e:
        logger.error(f"Error getting session status: {e}")
        return None
    finally:
        conn.close()


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
