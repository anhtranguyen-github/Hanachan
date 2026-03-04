import logging
from datetime import datetime, timezone, date, timedelta
from typing import Any, List, Optional, Literal, Dict
from uuid import uuid4, UUID

from fastapi import APIRouter, HTTPException, Query, Request, Depends
from fastapi.concurrency import run_in_threadpool
from pydantic import BaseModel, Field
from supabase import Client

from app.api.deps import get_user_client, get_current_user
from app.agents.reading_creator import (
    ReadingConfig,
    generate_reading_session,
)
from app.core.rate_limit import limiter

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/reading", tags=["Reading"])

# ---------------------------------------------------------------------------
# Pydantic Schemas
# ---------------------------------------------------------------------------

class ReadingConfigUpdate(BaseModel):
    exercises_per_session: Optional[int] = Field(None, ge=1, le=20)
    time_limit_minutes: Optional[int] = Field(None, ge=1, le=60)
    difficulty_level: Optional[Literal["N1", "N2", "N3", "N4", "N5", "adaptive"]] = None
    jlpt_target: Optional[int] = Field(None, ge=1, le=5)
    vocab_weight: Optional[int] = Field(None, ge=0, le=100)
    grammar_weight: Optional[int] = Field(None, ge=0, le=100)
    kanji_weight: Optional[int] = Field(None, ge=0, le=100)
    include_furigana: Optional[bool] = None
    include_translation: Optional[bool] = None
    passage_length: Optional[Literal["short", "medium", "long"]] = None
    topic_preferences: Optional[List[str]] = None
    auto_generate: Optional[bool] = None

class CreateSessionRequest(BaseModel):
    config_override: Optional[ReadingConfigUpdate] = None
    topics: Optional[List[str]] = None

class SubmitAnswerRequest(BaseModel):
    question_index: int
    user_answer: str
    time_spent_seconds: int = 0

class CompleteSessionRequest(BaseModel):
    total_time_seconds: int = 0

# ---------------------------------------------------------------------------
# Config Endpoints
# ---------------------------------------------------------------------------

@router.get("/config")
async def get_reading_config(
    client: Client = Depends(get_user_client)
):
    """Get user's reading practice configuration."""
    res = client.table("reading_configs").select(
        "exercises_per_session, time_limit_minutes, difficulty_level, jlpt_target, "
        "vocab_weight, grammar_weight, kanji_weight, include_furigana, "
        "include_translation, passage_length, topic_preferences, auto_generate"
    ).execute()
    
    if not res.data:
        return {
            "exercises_per_session": 5,
            "time_limit_minutes": 15,
            "difficulty_level": "adaptive",
            "jlpt_target": None,
            "vocab_weight": 40,
            "grammar_weight": 30,
            "kanji_weight": 30,
            "include_furigana": True,
            "include_translation": False,
            "passage_length": "medium",
            "topic_preferences": ["daily_life", "culture", "nature"],
            "auto_generate": True,
        }
    return res.data[0]

@router.put("/config")
async def update_reading_config(
    body: ReadingConfigUpdate,
    client: Client = Depends(get_user_client),
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """Create or update user's reading practice configuration."""
    if (
        body.vocab_weight is not None
        and body.grammar_weight is not None
        and body.kanji_weight is not None
    ):
        total = body.vocab_weight + body.grammar_weight + body.kanji_weight
        if total != 100:
            raise HTTPException(
                status_code=400,
                detail=f"vocab_weight + grammar_weight + kanji_weight must equal 100, got {total}",
            )

    ALLOWED_CONFIG_COLUMNS = {
        "exercises_per_session", "time_limit_minutes", "difficulty_level",
        "jlpt_target", "vocab_weight", "grammar_weight", "kanji_weight",
        "include_furigana", "include_translation", "passage_length",
        "topic_preferences", "auto_generate"
    }
    
    update_data = {
        k: v for k, v in body.model_dump().items() 
        if v is not None and k in ALLOWED_CONFIG_COLUMNS
    }

    res = client.table("reading_configs").select("id").execute()
    
    if res.data:
        if update_data:
            client.table("reading_configs").update({
                **update_data,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }).eq("id", res.data[0]["id"]).execute()
    else:
        defaults = {
            "exercises_per_session": 5,
            "time_limit_minutes": 15,
            "difficulty_level": "adaptive",
            "vocab_weight": 40,
            "grammar_weight": 30,
            "kanji_weight": 30,
            "include_furigana": True,
            "include_translation": False,
            "passage_length": "medium",
            "topic_preferences": ["daily_life", "culture", "nature"],
            "auto_generate": True,
            "user_id": current_user["id"]
        }
        defaults.update(update_data)
        client.table("reading_configs").insert(defaults).execute()

    return await get_reading_config(client)

# ---------------------------------------------------------------------------
# Session Endpoints
# ---------------------------------------------------------------------------

@router.post("/sessions")
@limiter.limit("5/minute")
async def create_reading_session(
    request: Request,
    body: CreateSessionRequest,
    client: Client = Depends(get_user_client),
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """Create a new reading session."""
    res = client.table("reading_configs").select(
        "exercises_per_session, time_limit_minutes, difficulty_level, jlpt_target, "
        "vocab_weight, grammar_weight, kanji_weight, include_furigana, "
        "include_translation, passage_length, topic_preferences, auto_generate"
    ).execute()
    
    config: ReadingConfig = {
        "exercises_per_session": 5,
        "time_limit_minutes": 15,
        "difficulty_level": "adaptive",
        "jlpt_target": None,
        "vocab_weight": 40,
        "grammar_weight": 30,
        "kanji_weight": 30,
        "include_furigana": True,
        "include_translation": False,
        "passage_length": "medium",
        "topic_preferences": ["daily_life", "culture", "nature"],
        "auto_generate": True,
    }

    if res.data:
        config.update({k: v for k, v in res.data[0].items() if v is not None})

    if body.config_override:
        override = {k: v for k, v in body.config_override.model_dump().items() if v is not None}
        config.update(override)

    from app.agents.reading_creator import get_user_learning_context
    user_id = current_user["id"]
    context = get_user_learning_context(user_id, config)

    generation_context = {
        "user_level": context["user_level"],
        "vocab_count": context["vocab_count"],
        "grammar_count": context["grammar_count"],
        "kanji_count": context["kanji_count"],
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }

    session_id = str(uuid4())
    client.table("reading_sessions").insert({
        "id": session_id,
        "user_id": user_id,
        "config_snapshot": config,
        "status": "pending",
        "total_exercises": config["exercises_per_session"],
        "generated_by": "reading-creator",
        "generation_context": generation_context
    }).execute()

    logger.info(f"Generating {config['exercises_per_session']} exercises for user {user_id}")
    exercises = await run_in_threadpool(generate_reading_session, user_id, config)

    for i, exercise in enumerate(exercises):
        exercise_id = str(uuid4())
        client.table("reading_exercises").insert({
            "id": exercise_id,
            "session_id": session_id,
            "passage_ja": exercise["passage_ja"],
            "passage_furigana": exercise.get("passage_furigana"),
            "passage_en": exercise.get("passage_en", ""),
            "passage_title": exercise.get("passage_title", ""),
            "difficulty_level": exercise["difficulty_level"],
            "jlpt_level": exercise.get("jlpt_level"),
            "topic": exercise["topic"],
            "word_count": exercise.get("word_count", 0),
            "featured_vocab_ids": exercise.get("featured_vocab_ids", []),
            "featured_grammar_ids": exercise.get("featured_grammar_ids", []),
            "featured_kanji_ids": exercise.get("featured_kanji_ids", []),
            "questions": exercise.get("questions", []),
            "order_index": i,
        }).execute()

    return await get_session_detail(UUID(session_id), client)

@router.get("/sessions")
async def list_reading_sessions(
    status: Optional[str] = Query(None),
    limit: int = Query(10, ge=1, le=50),
    offset: int = Query(0, ge=0),
    client: Client = Depends(get_user_client),
):
    """List user's reading sessions."""
    query = client.table("reading_sessions") \
        .select("id, status, total_exercises, completed_exercises, correct_answers, total_time_seconds, score, generated_by, generation_context, started_at, completed_at, created_at", count="exact") \
        .order("created_at", desc=True) \
        .range(offset, offset + limit - 1)
        
    if status:
        query = query.eq("status", status)
        
    res = query.execute()

    return {
        "sessions": res.data or [],
        "total": res.count or 0,
        "limit": limit,
        "offset": offset,
    }

@router.get("/sessions/{session_id}")
async def get_session_detail(
    session_id: UUID,
    client: Client = Depends(get_user_client),
):
    """Get session details with all exercises."""
    res = client.table("reading_sessions").select(
        "id, status, total_exercises, completed_exercises, correct_answers, total_time_seconds, score, config_snapshot, created_at"
    ).eq("id", str(session_id)).execute()
    
    if not res.data:
        raise HTTPException(status_code=404, detail="Session not found")

    session = res.data[0]
    ex_res = client.table("reading_exercises").select(
        "id, passage_ja, passage_furigana, passage_en, passage_title, difficulty_level, "
        "jlpt_level, topic, word_count, questions, order_index, status"
    ).eq("session_id", str(session_id)).order("order_index").execute()
    
    session["exercises"] = ex_res.data or []
    return session

@router.post("/sessions/{session_id}/start")
async def start_session(
    session_id: UUID,
    client: Client = Depends(get_user_client),
):
    """Mark a session as active/started."""
    res = client.table("reading_sessions").select("status").eq("id", str(session_id)).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Session not found")

    if res.data[0]["status"] != "pending":
        raise HTTPException(status_code=400, detail=f"Session is already {res.data[0]['status']}")

    client.table("reading_sessions").update({
        "status": "active",
        "started_at": datetime.now(timezone.utc).isoformat()
    }).eq("id", str(session_id)).execute()

    client.table("reading_exercises").update({"status": "active"}).eq("session_id", str(session_id)).eq("order_index", 0).execute()

    return {"message": "Session started", "session_id": session_id}

@router.post("/sessions/{session_id}/complete")
@limiter.limit("10/minute")
async def complete_session(
    request: Request,
    session_id: UUID,
    body: CompleteSessionRequest,
    client: Client = Depends(get_user_client),
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """Complete a reading session."""
    res = client.table("reading_sessions").select(
        "id, total_exercises, correct_answers, completed_exercises"
    ).eq("id", str(session_id)).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Session not found")

    session = res.data[0]
    total = session.get("total_exercises") or 1
    correct = session.get("correct_answers") or 0
    score = round((correct / total) * 100)

    client.table("reading_sessions").update({
        "status": "completed",
        "completed_at": datetime.now(timezone.utc).isoformat(),
        "total_time_seconds": body.total_time_seconds,
        "score": score
    }).eq("id", str(session_id)).execute()

    user_id = current_user["id"]
    today = date.today().isoformat()
    m_res = client.table("reading_metrics").select(
        "id, sessions_completed, exercises_completed, total_time_seconds, correct_answers, total_answers, avg_score"
    ).eq("date", today).execute()
    
    if m_res.data:
        m = m_res.data[0]
        client.table("reading_metrics").update({
            "sessions_completed": m["sessions_completed"] + 1,
            "exercises_completed": m["exercises_completed"] + session.get("completed_exercises", 0),
            "total_time_seconds": m["total_time_seconds"] + body.total_time_seconds,
            "correct_answers": m["correct_answers"] + correct,
            "total_answers": m["total_answers"] + total,
            "avg_score": (m["avg_score"] + score) / 2
        }).eq("id", m["id"]).execute()
    else:
        client.table("reading_metrics").insert({
            "user_id": user_id,
            "date": today,
            "sessions_completed": 1,
            "exercises_completed": session.get("completed_exercises", 0),
            "total_time_seconds": body.total_time_seconds,
            "correct_answers": correct,
            "total_answers": total,
            "avg_score": score
        }).execute()

    return {
        "message": "Session completed",
        "session_id": session_id,
        "score": score,
        "correct_answers": correct,
        "total_exercises": total,
    }

@router.post("/exercises/{exercise_id}/answer")
async def submit_answer(
    exercise_id: UUID,
    body: SubmitAnswerRequest,
    client: Client = Depends(get_user_client),
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """Submit an answer for a reading exercise question."""
    ex_res = client.table("reading_exercises").select(
        "session_id, questions, order_index"
    ).eq("id", str(exercise_id)).execute()
    if not ex_res.data:
        raise HTTPException(status_code=404, detail="Exercise not found")
    
    exercise = ex_res.data[0]
    
    # We don't check `user_id` on the session manually because RLS prevents reading 
    # reading_exercises that do not belong to the user's sessions.
    questions = exercise.get("questions") or []
    if body.question_index >= len(questions) or body.question_index < 0:
        raise HTTPException(status_code=400, detail="Invalid question index")

    question = questions[body.question_index]
    correct_answer = question.get("correct_answer", "")
    is_correct = body.user_answer.strip().lower() == correct_answer.strip().lower()

    client.table("reading_answers").insert({
        "exercise_id": str(exercise_id),
        "session_id": exercise.get("session_id"),
        "user_id": current_user["id"],
        "question_index": body.question_index,
        "question_type": question.get("type", "multiple_choice"),
        "user_answer": body.user_answer,
        "correct_answer": correct_answer,
        "is_correct": is_correct,
        "time_spent_seconds": body.time_spent_seconds
    }).execute()

    ans_res = client.table("reading_answers").select("id", count="exact").eq("exercise_id", str(exercise_id)).execute()
    total_questions = len(questions)
    answered = ans_res.count or 0

    if answered >= total_questions:
        client.table("reading_exercises").update({
            "status": "completed",
            "time_spent_seconds": body.time_spent_seconds
        }).eq("id", str(exercise_id)).execute()

        correct_ans_res = client.table("reading_answers").select("id", count="exact").eq("exercise_id", str(exercise_id)).eq("is_correct", True).execute()
        correct_count = correct_ans_res.count or 0

        s_res = client.table("reading_sessions").select("id, completed_exercises, correct_answers").eq("id", exercise["session_id"]).execute()
        if s_res.data:
            s_curr = s_res.data[0]
            client.table("reading_sessions").update({
                "completed_exercises": (s_curr.get("completed_exercises") or 0) + 1,
                "correct_answers": (s_curr.get("correct_answers") or 0) + correct_count
            }).eq("id", exercise["session_id"]).execute()

        client.table("reading_exercises").update({"status": "active"}).eq("session_id", exercise["session_id"]).eq("order_index", exercise["order_index"] + 1).eq("status", "pending").execute()

    return {
        "is_correct": is_correct,
        "correct_answer": correct_answer,
        "explanation": question.get("explanation", ""),
        "exercise_completed": answered >= total_questions,
    }

@router.get("/metrics")
async def get_reading_metrics(client: Client = Depends(get_user_client)):
    """Get reading practice dashboard metrics."""
    overall_res = client.table("reading_sessions").select(
        "completed_exercises, total_time_seconds, score"
    ).eq("status", "completed").execute()
    overall_data = overall_res.data or []
    
    total_sessions = len(overall_data)
    total_exercises = sum(d.get("completed_exercises", 0) for d in overall_data)
    total_time = sum(d.get("total_time_seconds", 0) for d in overall_data)
    avg_score = sum(d.get("score", 0) for d in overall_data) / total_sessions if total_sessions > 0 else 0
    best_score = max((d.get("score", 0) for d in overall_data), default=0)
    
    pending_res = client.table("reading_sessions").select("id").in_("status", ["pending", "active"]).execute()
    pending_sessions = len(pending_res.data or [])

    recent_res = client.table("reading_sessions") \
        .select("id, status, score, "
                "total_exercises, completed_exercises, "
                "created_at, completed_at") \
        .order("created_at", desc=True) \
        .limit(10) \
        .execute()

    daily_res = client.table("reading_metrics") \
        .select("date, exercises_completed, avg_score, total_time_seconds") \
        .order("date") \
        .limit(30) \
        .execute()

    history_res = client.table("reading_metrics") \
        .select("date") \
        .order("date", desc=True) \
        .execute()
    
    history_dates = [datetime.fromisoformat(d["date"]).date() for d in history_res.data or []]
    streak = 0
    if history_dates:
        today = date.today()
        if history_dates[0] == today or history_dates[0] == today - timedelta(days=1):
            streak = 1
            for i in range(len(history_dates) - 1):
                if (history_dates[i] - history_dates[i+1]).days == 1:
                    streak += 1
                else:
                    break

    words_res = client.table("reading_exercises") \
        .select("word_count") \
        .eq("status", "completed") \
        .execute()
    total_words_read = sum(d.get("word_count", 0) for d in words_res.data or [])

    return {
        "total_sessions": total_sessions,
        "total_exercises": total_exercises,
        "total_time_seconds": total_time,
        "avg_score": round(avg_score, 1),
        "best_score": best_score,
        "pending_sessions": pending_sessions,
        "streak_days": streak,
        "total_words_read": total_words_read,
        "recent_sessions": recent_res.data or [],
        "daily_metrics": daily_res.data or [],
        "topic_performance": []
    }

@router.get("/metrics/history")
async def get_metrics_history(
    days: int = Query(30, ge=7, le=365),
    client: Client = Depends(get_user_client)
):
    """Get historical reading metrics."""
    res = client.table("reading_metrics") \
        .select("date, sessions_completed, exercises_completed, avg_score, total_time_seconds") \
        .order("date") \
        .limit(days) \
        .execute()
    return {"history": res.data or [], "days": days}
