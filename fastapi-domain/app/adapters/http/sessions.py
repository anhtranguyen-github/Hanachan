import os
from datetime import datetime
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from supabase import Client, create_client

from app.auth.jwt import get_current_user_id
from app.domain.learning.models import Rating, SRSStage, SRSState
from app.domain.learning.services import FSRSEngine

router = APIRouter(prefix="/sessions", tags=["sessions"])


class ReviewStartRequest(BaseModel):
    limit: int = 20
    content_type: str = "all"  # radical, kanji, vocabulary, grammar or all


class ReviewSubmitRequest(BaseModel):
    ku_id: str
    facet: str
    rating: str  # pass, again
    attempt_count: int
    wrong_count: int


class LessonStartRequest(BaseModel):
    unit_ids: list[str]


def get_db_client() -> Client:
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_KEY")
    return create_client(url, key)


@router.post("/review/start", response_model=dict[str, Any])
async def start_review(
    payload: ReviewStartRequest,
    user_id: str = Depends(get_current_user_id),
    client: Client = Depends(get_db_client),
):
    # This query might belong to SQL / View, but for now we query due items.
    query = (
        client.table("user_fsrs_states")
        .select(
            "*, knowledge_units!inner(*, kanji_details(*), vocabulary_details(*), grammar_details(*))"
        )
        .eq("user_id", user_id)
        .eq("item_type", "ku")
        .neq("state", "burned")
        .lte("next_review", datetime.utcnow().isoformat())
        .order("next_review", desc=False)
    )

    if payload.content_type != "all":
        query = query.eq("knowledge_units.type", payload.content_type)

    res = query.limit(payload.limit).execute()
    items = res.data

    # Insert session header
    session_res = (
        client.table("review_sessions")
        .insert({"user_id": user_id, "status": "in_progress", "total_items": len(items)})
        .execute()
    )
    session_id = session_res.data[0]["id"]

    return {"session_id": session_id, "items": items}


@router.post("/review/{session_id}/submit", response_model=dict[str, Any])
async def submit_review(
    session_id: str,
    payload: ReviewSubmitRequest,
    user_id: str = Depends(get_current_user_id),
    client: Client = Depends(get_db_client),
):
    rating_enum = Rating.PASS if payload.rating == "pass" else Rating.AGAIN

    # Verify session ownership
    sess_res = client.table("review_sessions").select("user_id").eq("id", session_id).execute()
    if not sess_res.data or sess_res.data[0]["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Session access denied")

    # Get current state
    state_res = (
        client.table("user_fsrs_states")
        .select("*")
        .eq("user_id", user_id)
        .eq("item_id", payload.ku_id)
        .eq("facet", payload.facet)
        .execute()
    )

    is_learn_mode = not bool(state_res.data)

    # In learn mode, wrong answers do not affect FSRS but wait do they?
    # Actually if it's new, we initialize. If wrong, we do not initialize FSRS unless corrected.
    if is_learn_mode and rating_enum == Rating.AGAIN:
        return {"correct": False, "rating": "again", "next_review": None}

    current_state = SRSState()
    if state_res.data:
        data = state_res.data[0]
        current_state = SRSState(
            stage=SRSStage(data.get("state", "new")),
            stability=data.get("stability", 0.1),
            difficulty=data.get("difficulty", 3.0),
            reps=data.get("reps", 0),
            lapses=data.get("lapses", 0),
        )

    next_review, next_state = FSRSEngine.calculate_next_review(
        current_state, rating_enum, payload.wrong_count
    )

    # UPSERT state
    client.table("user_fsrs_states").upsert(
        {
            "user_id": user_id,
            "item_id": payload.ku_id,
            "item_type": "ku",
            "facet": payload.facet,
            "state": next_state.stage,
            "stability": next_state.stability,
            "difficulty": next_state.difficulty,
            "reps": next_state.reps,
            "lapses": next_state.lapses,
            "last_review": datetime.utcnow().isoformat(),
            "next_review": next_review.isoformat(),
        },
        on_conflict="user_id,item_id,item_type,facet",
    ).execute()

    # Log attempt
    num_rating = 1 if payload.rating == "again" else 3
    client.table("fsrs_review_logs").insert(
        {
            "user_id": user_id,
            "item_id": payload.ku_id,
            "item_type": "ku",
            "facet": payload.facet,
            "rating": num_rating,
            "state": next_state.stage,
            "stability": next_state.stability,
            "difficulty": next_state.difficulty,
            "interval_days": next_state.stability,
        }
    ).execute()

    # Update Session Item
    client.table("review_session_items").upsert(
        {
            "session_id": session_id,
            "ku_id": payload.ku_id,
            "facet": payload.facet,
            "status": "completed",
            "updated_at": datetime.utcnow().isoformat(),
        },
        on_conflict="session_id,ku_id,facet",
    ).execute()

    return {
        "correct": payload.rating == "pass",
        "rating": payload.rating,
        "next_review": next_review.isoformat(),
        "new_stability": next_state.stability,
    }


@router.post("/lesson/start", response_model=dict[str, Any])
async def start_lesson(
    payload: LessonStartRequest,
    user_id: str = Depends(get_current_user_id),
    client: Client = Depends(get_db_client),
):
    try:
        batch_res = (
            client.table("lesson_batches")
            .insert(
                {
                    "user_id": user_id,
                    "status": "in_progress",
                    "started_at": datetime.utcnow().isoformat(),
                }
            )
            .execute()
        )
        batch_id = batch_res.data[0]["id"]

        items = [
            {"batch_id": batch_id, "ku_id": unit_id, "status": "unseen"}
            for unit_id in payload.unit_ids
        ]

        if items:
            client.table("lesson_items").insert(items).execute()

        return {"batch_id": batch_id}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/lesson/{batch_id}/complete", response_model=dict[str, Any])
async def complete_lesson(
    batch_id: str,
    user_id: str = Depends(get_current_user_id),
    client: Client = Depends(get_db_client),
):
    # Enforce authority: check ownership
    batch_res = client.table("lesson_batches").select("user_id").eq("id", batch_id).execute()
    if not batch_res.data or batch_res.data[0]["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Access denied")

    try:
        # Mark batch complete
        client.table("lesson_batches").update(
            {"status": "completed", "completed_at": datetime.utcnow().isoformat()}
        ).eq("id", batch_id).execute()

        # Mark all items learned
        client.table("lesson_items").update({"status": "learned"}).eq(
            "batch_id", batch_id
        ).execute()

        return {"status": "success", "batch_id": batch_id}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
