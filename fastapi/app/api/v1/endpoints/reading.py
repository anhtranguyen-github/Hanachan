"""
Reading Practice API Endpoints

Provides:
- GET  /reading/config          — Get user's reading config
- PUT  /reading/config          — Update user's reading config
- POST /reading/sessions        — Create a new reading session (auto-generates exercises)
- GET  /reading/sessions        — List user's reading sessions
- GET  /reading/sessions/{id}   — Get session details with exercises
- POST /reading/sessions/{id}/start   — Start a session
- POST /reading/sessions/{id}/complete — Complete a session
- POST /reading/exercises/{id}/answer  — Submit answer for an exercise question
- GET  /reading/metrics         — Get reading metrics/dashboard data
- GET  /reading/metrics/history — Get historical metrics
"""

import json
import logging
from datetime import datetime, timezone, date, timedelta
from typing import Any, List, Optional
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.concurrency import run_in_threadpool
from pydantic import BaseModel, Field

from ....core.database import execute_query
from ....core.security import require_auth
from ....agents.reading_creator import (
    ReadingConfig,
    generate_reading_session,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/reading", tags=["Reading"])


def get_user_id(token: dict = Depends(require_auth)) -> str:
    """Extract user_id from JWT token."""
    user_id = token.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token: missing sub")
    return user_id


# ---------------------------------------------------------------------------
# Pydantic Schemas
# ---------------------------------------------------------------------------


class ReadingConfigUpdate(BaseModel):
    exercises_per_session: Optional[int] = Field(None, ge=1, le=20)
    time_limit_minutes: Optional[int] = Field(None, ge=1, le=60)
    difficulty_level: Optional[str] = None
    jlpt_target: Optional[int] = Field(None, ge=1, le=5)
    vocab_weight: Optional[int] = Field(None, ge=0, le=100)
    grammar_weight: Optional[int] = Field(None, ge=0, le=100)
    kanji_weight: Optional[int] = Field(None, ge=0, le=100)
    include_furigana: Optional[bool] = None
    include_translation: Optional[bool] = None
    passage_length: Optional[str] = None
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
async def get_reading_config(user_id: str = Depends(get_user_id)):
    """Get user's reading practice configuration."""
    rows = execute_query(
        "SELECT * FROM public.reading_configs WHERE user_id = %s",
        (user_id,),
    )
    if not rows:
        # Return defaults
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
    return rows[0]


@router.put("/config")
async def update_reading_config(
    body: ReadingConfigUpdate,
    user_id: str = Depends(get_user_id),
):
    """Create or update user's reading practice configuration."""
    # Validate weights sum
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

    # Check if config exists
    existing = execute_query(
        "SELECT id FROM public.reading_configs WHERE user_id = %s",
        (user_id,),
    )

    update_data = {k: v for k, v in body.model_dump().items() if v is not None}

    if existing:
        # Update
        if not update_data:
            return {"message": "No changes"}
        set_clauses = ", ".join([f"{k} = %s" for k in update_data.keys()])
        values = list(update_data.values()) + [user_id]
        execute_query(
            f"UPDATE public.reading_configs SET {set_clauses}, updated_at = NOW() WHERE user_id = %s",
            values,
            fetch=False,
        )
    else:
        # Insert with defaults
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
        }
        defaults.update(update_data)
        defaults["user_id"] = user_id

        cols = ", ".join(defaults.keys())
        placeholders = ", ".join(["%s"] * len(defaults))
        execute_query(
            f"INSERT INTO public.reading_configs ({cols}) VALUES ({placeholders})",
            list(defaults.values()),
            fetch=False,
        )

    return await get_reading_config(user_id)


# ---------------------------------------------------------------------------
# Session Endpoints
# ---------------------------------------------------------------------------


@router.post("/sessions")
async def create_reading_session(
    body: CreateSessionRequest,
    user_id: str = Depends(get_user_id),
):
    """
    Create a new reading session with auto-generated exercises.
    Uses user's learning status to personalize content.
    """
    # Get user config
    config_rows = execute_query(
        "SELECT * FROM public.reading_configs WHERE user_id = %s",
        (user_id,),
    )

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

    if config_rows:
        row = config_rows[0]
        config.update(
            {
                k: v
                for k, v in row.items()
                if v is not None
                and k not in ("id", "user_id", "created_at", "updated_at")
            }
        )

    # Apply overrides
    if body.config_override:
        override = {
            k: v for k, v in body.config_override.model_dump().items() if v is not None
        }
        config.update(override)

    # Get user learning context for generation metadata
    from ....agents.reading_creator import get_user_learning_context

    context = get_user_learning_context(user_id, config)

    generation_context = {
        "user_level": context["user_level"],
        "vocab_count": context["vocab_count"],
        "grammar_count": context["grammar_count"],
        "kanji_count": context["kanji_count"],
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }

    # Create session record
    session_id = str(uuid4())
    execute_query(
        """
        INSERT INTO public.reading_sessions
          (id, user_id, config_snapshot, status, total_exercises, generated_by, generation_context)
        VALUES (%s, %s, %s, 'pending', %s, 'reading-creator', %s)
        """,
        (
            session_id,
            user_id,
            json.dumps(config),
            config["exercises_per_session"],
            json.dumps(generation_context),
        ),
        fetch=False,
    )

    # Generate exercises (run in thread pool since it's sync + LLM calls)
    logger.info(
        f"Generating {config['exercises_per_session']} exercises for user {user_id}"
    )
    exercises = await run_in_threadpool(generate_reading_session, user_id, config)

    # Save exercises to DB
    for i, exercise in enumerate(exercises):
        exercise_id = str(uuid4())
        execute_query(
            """
            INSERT INTO public.reading_exercises
              (id, session_id, passage_ja, passage_furigana, passage_en, passage_title,
               difficulty_level, jlpt_level, topic, word_count,
               featured_vocab_ids, featured_grammar_ids, featured_kanji_ids,
               questions, order_index)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (
                exercise_id,
                session_id,
                exercise["passage_ja"],
                exercise.get("passage_furigana"),
                exercise.get("passage_en", ""),
                exercise.get("passage_title", ""),
                exercise["difficulty_level"],
                exercise.get("jlpt_level"),
                exercise["topic"],
                exercise.get("word_count", 0),
                exercise.get("featured_vocab_ids", []),
                exercise.get("featured_grammar_ids", []),
                exercise.get("featured_kanji_ids", []),
                json.dumps(exercise.get("questions", [])),
                i,
            ),
            fetch=False,
        )

    # Return session with exercises
    return await get_session_detail(session_id, user_id)


@router.get("/sessions")
async def list_reading_sessions(
    status: Optional[str] = Query(None),
    limit: int = Query(10, ge=1, le=50),
    offset: int = Query(0, ge=0),
    user_id: str = Depends(get_user_id),
):
    """List user's reading sessions."""
    where_clauses = ["user_id = %s"]
    params: List[Any] = [user_id]

    if status:
        where_clauses.append("status = %s")
        params.append(status)

    where_sql = " AND ".join(where_clauses)
    count_params = list(params)
    params.extend([limit, offset])

    rows = execute_query(
        f"""
        SELECT id, status, total_exercises, completed_exercises, correct_answers,
               total_time_seconds, score, generated_by, generation_context,
               started_at, completed_at, created_at
        FROM public.reading_sessions
        WHERE {where_sql}
        ORDER BY created_at DESC
        LIMIT %s OFFSET %s
        """,
        params,
    )

    total = execute_query(
        f"SELECT COUNT(*) as count FROM public.reading_sessions WHERE {where_sql}",
        count_params,
    )

    return {
        "sessions": rows or [],
        "total": total[0]["count"] if total else 0,
        "limit": limit,
        "offset": offset,
    }


@router.get("/sessions/{session_id}")
async def get_session_detail(
    session_id: str,
    user_id: str = Depends(get_user_id),
):
    """Get session details with all exercises."""
    session_rows = execute_query(
        """
        SELECT id, status, total_exercises, completed_exercises, correct_answers,
               total_time_seconds, score, config_snapshot, generated_by, generation_context,
               started_at, completed_at, created_at
        FROM public.reading_sessions
        WHERE id = %s AND user_id = %s
        """,
        (session_id, user_id),
    )

    if not session_rows:
        raise HTTPException(status_code=404, detail="Session not found")

    session = session_rows[0]

    # Get exercises
    exercise_rows = execute_query(
        """
        SELECT id, passage_ja, passage_furigana, passage_en, passage_title,
               difficulty_level, jlpt_level, topic, word_count,
               featured_vocab_ids, featured_grammar_ids, featured_kanji_ids,
               questions, status, time_spent_seconds, order_index
        FROM public.reading_exercises
        WHERE session_id = %s
        ORDER BY order_index ASC
        """,
        (session_id,),
    )

    exercises = []
    for ex in exercise_rows or []:
        ex_dict = dict(ex)
        # Parse questions JSON if it's a string
        if isinstance(ex_dict.get("questions"), str):
            ex_dict["questions"] = json.loads(ex_dict["questions"])
        exercises.append(ex_dict)

    session_dict = dict(session)
    if isinstance(session_dict.get("config_snapshot"), str):
        session_dict["config_snapshot"] = json.loads(session_dict["config_snapshot"])
    if isinstance(session_dict.get("generation_context"), str):
        session_dict["generation_context"] = json.loads(
            session_dict["generation_context"]
        )

    session_dict["exercises"] = exercises
    return session_dict


@router.post("/sessions/{session_id}/start")
async def start_session(
    session_id: str,
    user_id: str = Depends(get_user_id),
):
    """Mark a session as active/started."""
    rows = execute_query(
        "SELECT id, status FROM public.reading_sessions WHERE id = %s AND user_id = %s",
        (session_id, user_id),
    )
    if not rows:
        raise HTTPException(status_code=404, detail="Session not found")

    if rows[0]["status"] not in ("pending",):
        raise HTTPException(
            status_code=400, detail=f"Session is already {rows[0]['status']}"
        )

    execute_query(
        "UPDATE public.reading_sessions SET status = 'active', started_at = NOW() WHERE id = %s",
        (session_id,),
        fetch=False,
    )

    # Mark first exercise as active
    execute_query(
        """
        UPDATE public.reading_exercises SET status = 'active'
        WHERE session_id = %s AND order_index = 0
        """,
        (session_id,),
        fetch=False,
    )

    return {"message": "Session started", "session_id": session_id}


@router.post("/sessions/{session_id}/complete")
async def complete_session(
    session_id: str,
    body: CompleteSessionRequest,
    user_id: str = Depends(get_user_id),
):
    """Complete a reading session and calculate final score."""
    rows = execute_query(
        """
        SELECT id, status, total_exercises, completed_exercises, correct_answers
        FROM public.reading_sessions
        WHERE id = %s AND user_id = %s
        """,
        (session_id, user_id),
    )
    if not rows:
        raise HTTPException(status_code=404, detail="Session not found")

    session = rows[0]

    # Calculate score
    total = session["total_exercises"] or 1
    correct = session["correct_answers"] or 0
    score = round((correct / total) * 100)

    execute_query(
        """
        UPDATE public.reading_sessions
        SET status = 'completed', completed_at = NOW(),
            total_time_seconds = %s, score = %s
        WHERE id = %s
        """,
        (body.total_time_seconds, score, session_id),
        fetch=False,
    )

    # Update daily metrics
    today = date.today().isoformat()
    execute_query(
        """
        INSERT INTO public.reading_metrics
          (user_id, date, sessions_completed, exercises_completed, total_time_seconds,
           correct_answers, total_answers, avg_score)
        VALUES (%s, %s, 1, %s, %s, %s, %s, %s)
        ON CONFLICT (user_id, date) DO UPDATE SET
          sessions_completed = reading_metrics.sessions_completed + 1,
          exercises_completed = reading_metrics.exercises_completed + EXCLUDED.exercises_completed,
          total_time_seconds = reading_metrics.total_time_seconds + EXCLUDED.total_time_seconds,
          correct_answers = reading_metrics.correct_answers + EXCLUDED.correct_answers,
          total_answers = reading_metrics.total_answers + EXCLUDED.total_answers,
          avg_score = (reading_metrics.avg_score + EXCLUDED.avg_score) / 2
        """,
        (
            user_id,
            today,
            session["completed_exercises"],
            body.total_time_seconds,
            correct,
            total,
            score,
        ),
        fetch=False,
    )

    return {
        "message": "Session completed",
        "session_id": session_id,
        "score": score,
        "correct_answers": correct,
        "total_exercises": total,
    }


# ---------------------------------------------------------------------------
# Exercise / Answer Endpoints
# ---------------------------------------------------------------------------


@router.post("/exercises/{exercise_id}/answer")
async def submit_answer(
    exercise_id: str,
    body: SubmitAnswerRequest,
    user_id: str = Depends(get_user_id),
):
    """Submit an answer for a reading exercise question."""
    # Get exercise
    ex_rows = execute_query(
        """
        SELECT re.id, re.session_id, re.questions, re.status
        FROM public.reading_exercises re
        JOIN public.reading_sessions rs ON rs.id = re.session_id
        WHERE re.id = %s AND rs.user_id = %s
        """,
        (exercise_id, user_id),
    )
    if not ex_rows:
        raise HTTPException(status_code=404, detail="Exercise not found")

    exercise = ex_rows[0]
    questions = exercise["questions"]
    if isinstance(questions, str):
        questions = json.loads(questions)

    if body.question_index >= len(questions):
        raise HTTPException(status_code=400, detail="Invalid question index")

    question = questions[body.question_index]
    correct_answer = question.get("correct_answer", "")

    # Check correctness (case-insensitive, trimmed)
    is_correct = body.user_answer.strip().lower() == correct_answer.strip().lower()

    # Save answer
    execute_query(
        """
        INSERT INTO public.reading_answers
          (exercise_id, session_id, user_id, question_index, question_type,
           user_answer, correct_answer, is_correct, time_spent_seconds)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """,
        (
            exercise_id,
            exercise["session_id"],
            user_id,
            body.question_index,
            question.get("type", "multiple_choice"),
            body.user_answer,
            correct_answer,
            is_correct,
            body.time_spent_seconds,
        ),
        fetch=False,
    )

    # Check if all questions answered
    answer_count = execute_query(
        "SELECT COUNT(*) as count FROM public.reading_answers WHERE exercise_id = %s AND user_id = %s",
        (exercise_id, user_id),
    )
    total_questions = len(questions)
    answered = answer_count[0]["count"] if answer_count else 0

    if answered >= total_questions:
        # Mark exercise as completed
        execute_query(
            """
            UPDATE public.reading_exercises
            SET status = 'completed', time_spent_seconds = %s
            WHERE id = %s
            """,
            (body.time_spent_seconds, exercise_id),
            fetch=False,
        )

        # Update session stats
        correct_in_exercise = execute_query(
            "SELECT COUNT(*) as count FROM public.reading_answers WHERE exercise_id = %s AND is_correct = true",
            (exercise_id,),
        )
        correct_count = correct_in_exercise[0]["count"] if correct_in_exercise else 0

        execute_query(
            """
            UPDATE public.reading_sessions
            SET completed_exercises = completed_exercises + 1,
                correct_answers = correct_answers + %s
            WHERE id = %s
            """,
            (correct_count, exercise["session_id"]),
            fetch=False,
        )

        # Activate next exercise
        execute_query(
            """
            UPDATE public.reading_exercises
            SET status = 'active'
            WHERE session_id = %s
              AND order_index = (
                SELECT order_index + 1
                FROM public.reading_exercises
                WHERE id = %s
              )
              AND status = 'pending'
            """,
            (exercise["session_id"], exercise_id),
            fetch=False,
        )

    return {
        "is_correct": is_correct,
        "correct_answer": correct_answer,
        "explanation": question.get("explanation", ""),
        "exercise_completed": answered >= total_questions,
    }


# ---------------------------------------------------------------------------
# Metrics Endpoints
# ---------------------------------------------------------------------------


@router.get("/metrics")
async def get_reading_metrics(user_id: str = Depends(get_user_id)):
    """Get reading practice dashboard metrics."""
    # Overall stats
    overall = execute_query(
        """
        SELECT
          COUNT(*) FILTER (WHERE status = 'completed') as total_sessions,
          COALESCE(SUM(completed_exercises) FILTER (WHERE status = 'completed'), 0) as total_exercises,
          COALESCE(SUM(total_time_seconds) FILTER (WHERE status = 'completed'), 0) as total_time_seconds,
          COALESCE(AVG(score) FILTER (WHERE status = 'completed'), 0) as avg_score,
          COALESCE(MAX(score) FILTER (WHERE status = 'completed'), 0) as best_score,
          COUNT(*) FILTER (WHERE status = 'pending' OR status = 'active') as pending_sessions
        FROM public.reading_sessions
        WHERE user_id = %s
        """,
        (user_id,),
    )

    # Recent sessions (last 7 days)
    recent = execute_query(
        """
        SELECT id, status, score, total_exercises, completed_exercises,
               total_time_seconds, created_at, completed_at
        FROM public.reading_sessions
        WHERE user_id = %s AND created_at >= NOW() - INTERVAL '7 days'
        ORDER BY created_at DESC
        LIMIT 10
        """,
        (user_id,),
    )

    # Daily metrics (last 30 days)
    daily = execute_query(
        """
        SELECT date, sessions_completed, exercises_completed,
               total_time_seconds, correct_answers, total_answers, avg_score
        FROM public.reading_metrics
        WHERE user_id = %s AND date >= CURRENT_DATE - INTERVAL '30 days'
        ORDER BY date ASC
        """,
        (user_id,),
    )

    # Streak calculation
    streak = _calculate_reading_streak(user_id)

    # Topic performance
    topic_perf = execute_query(
        """
        SELECT re.topic,
               COUNT(*) as exercises_count,
               AVG(CASE WHEN ra.is_correct THEN 1.0 ELSE 0.0 END) * 100 as accuracy
        FROM public.reading_exercises re
        JOIN public.reading_sessions rs ON rs.id = re.session_id
        LEFT JOIN public.reading_answers ra ON ra.exercise_id = re.id
        WHERE rs.user_id = %s AND re.status = 'completed'
        GROUP BY re.topic
        ORDER BY exercises_count DESC
        LIMIT 10
        """,
        (user_id,),
    )

    # Words read total
    words_read = execute_query(
        """
        SELECT COALESCE(SUM(re.word_count), 0) as total_words
        FROM public.reading_exercises re
        JOIN public.reading_sessions rs ON rs.id = re.session_id
        WHERE rs.user_id = %s AND re.status = 'completed'
        """,
        (user_id,),
    )

    stats = overall[0] if overall else {}

    return {
        "total_sessions": stats.get("total_sessions", 0),
        "total_exercises": stats.get("total_exercises", 0),
        "total_time_seconds": stats.get("total_time_seconds", 0),
        "avg_score": round(float(stats.get("avg_score", 0)), 1),
        "best_score": stats.get("best_score", 0),
        "pending_sessions": stats.get("pending_sessions", 0),
        "streak_days": streak,
        "total_words_read": words_read[0]["total_words"] if words_read else 0,
        "recent_sessions": recent or [],
        "daily_metrics": daily or [],
        "topic_performance": topic_perf or [],
    }


@router.get("/metrics/history")
async def get_metrics_history(
    days: int = Query(30, ge=7, le=365),
    user_id: str = Depends(get_user_id),
):
    """Get historical reading metrics."""
    rows = execute_query(
        f"""
        SELECT date, sessions_completed, exercises_completed,
               total_time_seconds, correct_answers, total_answers,
               avg_score, words_read
        FROM public.reading_metrics
        WHERE user_id = %s AND date >= CURRENT_DATE - INTERVAL '{days} days'
        ORDER BY date ASC
        """,
        (user_id,),
    )
    return {"history": rows or [], "days": days}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _calculate_reading_streak(user_id: str) -> int:
    """Calculate consecutive days with reading practice."""
    rows = execute_query(
        """
        SELECT DISTINCT DATE(completed_at) as practice_date
        FROM public.reading_sessions
        WHERE user_id = %s AND status = 'completed' AND completed_at IS NOT NULL
        ORDER BY practice_date DESC
        LIMIT 365
        """,
        (user_id,),
    )

    if not rows:
        return 0

    dates = [row["practice_date"] for row in rows]
    today = date.today()
    streak = 0

    for i, d in enumerate(dates):
        expected = today - timedelta(days=i)
        if d == expected:
            streak += 1
        else:
            break

    return streak
