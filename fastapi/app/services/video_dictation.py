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
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any

from app.core.supabase import get_service_client
supabase = get_service_client()

logger = logging.getLogger(__name__)


def create_dictation_session(
    user_id: str,
    video_id: str,
    settings: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Create a new dictation session for a video.
    """
    try:
        # Get subtitles for the video
        res = supabase.table("video_subtitles") \
            .select("id, start_time_ms, end_time_ms, text, tokens") \
            .eq("video_id", video_id) \
            .order("start_time_ms") \
            .execute()
        
        subtitles = res.data or []
        
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
        
        supabase.table("video_dictation_sessions").insert({
            "id": session_id,
            "user_id": user_id,
            "video_id": video_id,
            "total_subtitles": len(filtered_subtitles),
            "settings": settings_json,
            "status": "in_progress"
        }).execute()
        
        # Format subtitles for response
        subtitle_items = []
        for sub in filtered_subtitles:
            tokens = sub.get("tokens", []) or []
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
        
        tokens = sub.get("tokens", []) or []
        if jlpt_levels and tokens:
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
    try:
        # Verify session exists
        s_res = supabase.table("video_dictation_sessions") \
            .select("*") \
            .eq("id", session_id) \
            .eq("user_id", user_id) \
            .execute()
        
        if not s_res.data:
            return {"success": False, "error": "Session not found"}
        
        db_session = s_res.data[0]
        
        # Get target subtitle
        sub_res = supabase.table("video_subtitles") \
            .select("text, start_time_ms, end_time_ms") \
            .eq("id", subtitle_id) \
            .execute()
            
        if not sub_res.data:
            return {"success": False, "error": "Subtitle not found"}
            
        subtitle_row = sub_res.data[0]
        target_text = subtitle_row["text"]
        
        # Accuracy calculation
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
        
        # Get existing attempts count
        att_count_res = supabase.table("video_dictation_attempts") \
            .select("id", count="exact") \
            .eq("session_id", session_id) \
            .eq("subtitle_id", subtitle_id) \
            .execute()
            
        attempts_count = (att_count_res.count or 0) + 1
        
        # Insert attempt
        supabase.table("video_dictation_attempts").insert({
            "id": str(uuid.uuid4()),
            "session_id": session_id,
            "subtitle_id": subtitle_id,
            "user_input": user_input,
            "is_correct": is_correct,
            "accuracy_score": accuracy_score,
            "time_taken_ms": time_taken_ms,
            "attempts_count": attempts_count
        }).execute()
        
        # Get progress
        prog_res = supabase.table("video_dictation_attempts") \
            .select("is_correct, subtitle_id") \
            .eq("session_id", session_id) \
            .execute()
            
        attempts = prog_res.data or []
        completed_sub_ids = set(a["subtitle_id"] for a in attempts)
        completed = len(completed_sub_ids)
        correct_count = sum(1 for a in attempts if a["is_correct"])
        
        total = db_session["total_subtitles"] or 0
        remaining = total - completed
        is_complete = remaining <= 0
        
        accuracy_percent = int((correct_count / completed) * 100) if completed > 0 else 0
        
        update_data = {
            "correct_count": correct_count,
            "accuracy_percent": accuracy_percent
        }
        if is_complete:
            update_data["status"] = "completed"
            update_data["completed_at"] = datetime.now(timezone.utc).isoformat()
            
        supabase.table("video_dictation_sessions").update(update_data).eq("id", session_id).execute()
        
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
                "subtitle_start_time_ms": subtitle_row["start_time_ms"],
                "subtitle_end_time_ms": subtitle_row["end_time_ms"],
            },
            "is_complete": is_complete,
            "remaining": max(0, remaining),
        }
    except Exception as e:
        logger.error(f"Error submitting dictation attempt: {e}")
        return {"success": False, "error": str(e)}


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
    
    input_chars = list(input_text)
    target_chars = list(target_text)
    
    matches = sum(
        1 for i in range(min(len(input_chars), len(target_chars)))
        if input_chars[i] == target_chars[i]
    )
    
    max_len = max(len(input_chars), len(target_chars))
    return int((matches / max_len) * 100) if max_len > 0 else 0


def get_session_status(user_id: str, session_id: str) -> Optional[Dict[str, Any]]:
    """
    Get the current status of a dictation session.
    """
    try:
        res = supabase.table("video_dictation_sessions") \
            .select("*") \
            .eq("id", session_id) \
            .eq("user_id", user_id) \
            .execute()
            
        if not res.data:
            return None
            
        session = res.data[0]
        
        prog_res = supabase.table("video_dictation_attempts") \
            .select("is_correct, subtitle_id") \
            .eq("session_id", session_id) \
            .execute()
            
        attempts = prog_res.data or []
        completed_sub_ids = set(a["subtitle_id"] for a in attempts)
        completed = len(completed_sub_ids)
        correct = sum(1 for a in attempts if a["is_correct"])
        
        total = session.get("total_subtitles", 0)
        accuracy = int((correct / completed) * 100) if completed > 0 else 0
        
        return {
            "session_id": session_id,
            "video_id": session.get("video_id"),
            "total_subtitles": total,
            "completed_count": completed,
            "correct_count": correct,
            "accuracy_percent": accuracy,
            "status": session.get("status", "in_progress"),
        }
    except Exception as e:
        logger.error(f"Error getting session status: {e}")
        return None


def get_dictation_stats(user_id: str) -> Dict[str, Any]:
    """Get dictation statistics for a user."""
    try:
        # Total sessions
        s_count_res = supabase.table("video_dictation_sessions").select("id", count="exact").eq("user_id", user_id).execute()
        total_sessions = s_count_res.count or 0
        
        # Total attempts & Avg accuracy
        att_res = supabase.table("video_dictation_attempts") \
            .select("accuracy_score, video_dictation_sessions!inner(user_id)") \
            .eq("video_dictation_sessions.user_id", user_id) \
            .execute()
            
        attempts = att_res.data or []
        total_attempts = len(attempts)
        avg_acc = sum(a["accuracy_score"] for a in attempts) / total_attempts if total_attempts > 0 else 0.0
        
        # Videos practiced
        v_res = supabase.table("video_dictation_sessions").select("video_id").eq("user_id", user_id).execute()
        videos_practiced = len(set(v["video_id"] for v in (v_res.data or [])))
        
        # Best accuracy
        best_acc_res = supabase.table("video_dictation_sessions") \
            .select("accuracy_percent") \
            .eq("user_id", user_id) \
            .eq("status", "completed") \
            .order("accuracy_percent", desc=True) \
            .limit(1) \
            .execute()
            
        best_accuracy = best_acc_res.data[0]["accuracy_percent"] if best_acc_res.data else 0
        
        return {
            "total_sessions": total_sessions,
            "total_attempts": total_attempts,
            "average_accuracy": round(avg_acc, 1),
            "videos_practiced": videos_practiced,
            "current_streak": 0,
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
