from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from supabase import Client

from app.api.core_deps import get_client
from app.api.deps import get_current_user
from app.domain.learning.models import Rating
from app.domain.learning.services import FSRSEngine

router = APIRouter(prefix="/sessions", tags=["Review Sessions"])


class ReviewStartRequest(BaseModel):
    limit: int = 20
    content_type: str = "all"
    deck_id: str | None = None


class ReviewSubmitRequest(BaseModel):
    ku_id: str
    facet: str
    rating: str
    attempt_count: int
    wrong_count: int


class LessonStartRequest(BaseModel):
    unit_ids: list[str] = []
    level: int | None = None
    deck_id: str | None = None


@router.post("/review/start", response_model=dict[str, Any])
async def start_review(
    payload: ReviewStartRequest,
    current_user: dict[str, Any] = Depends(get_current_user),
    client: Client = Depends(get_client),
):
    user_id = current_user["id"]
    query = (
        client.table("user_fsrs_states")
        .select("*, knowledge_units!inner(*, kanji_details(*), vocabulary_details(*), grammar_details(*))")
        .eq("user_id", user_id)
        .eq("item_type", "ku")
        .neq("state", "burned")
        .lte("next_review", datetime.now(timezone.utc).isoformat())
        .order("next_review", desc=False)
    )

    if payload.content_type != "all":
        query = query.eq("knowledge_units.type", payload.content_type)

    if payload.deck_id:
        deck_items_res = client.table("deck_items").select("item_id").eq("deck_id", payload.deck_id).execute()
        item_ids = [item["item_id"] for item in deck_items_res.data]
        if item_ids:
            query = query.in_("item_id", item_ids)
        else:
            return {"session_id": None, "items": [], "error": "No items found in selected deck"}

    res = query.limit(payload.limit).execute()
    items = res.data
    session_res = client.table("review_sessions").insert(
        {"user_id": user_id, "status": "in_progress", "total_items": len(items)}
    ).execute()
    session_id = session_res.data[0]["id"]
    return {"session_id": session_id, "items": items}


@router.post("/review/{session_id}/submit", response_model=dict[str, Any])
async def submit_review(
    session_id: str,
    payload: ReviewSubmitRequest,
    current_user: dict[str, Any] = Depends(get_current_user),
    client: Client = Depends(get_client),
):
    user_id = current_user["id"]
    rating_enum = Rating.PASS if payload.rating == "pass" else Rating.AGAIN

    sess_res = client.table("review_sessions").select("user_id").eq("id", session_id).execute()
    if not sess_res.data or sess_res.data[0]["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Session access denied")

    state_res = (
        client.table("user_fsrs_states")
        .select("*")
        .eq("user_id", user_id)
        .eq("item_id", payload.ku_id)
        .eq("facet", payload.facet)
        .execute()
    )

    if not state_res.data and rating_enum == Rating.AGAIN:
        return {"correct": False, "rating": "again", "next_review": None}

    from app.domain.learning.models import SRSStage, SRSState

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

    weights = [0.4, 0.6, 2.4, 5.8, 4.93, 0.94, 0.86, 1.01, 1.05, 0.94, 0.74, 0.46, 0.27, 0.29, 0.42, 0.36, 0.29, 1.2, 0.25]
    rating_map = {Rating.AGAIN: 1, Rating.HARD: 2, Rating.GOOD: 3, Rating.PASS: 3, Rating.EASY: 4}
    next_review, next_state = FSRSEngine.calculate_next_review(current_state, rating_map[rating_enum], weights)

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
            "last_review": datetime.now(timezone.utc).isoformat(),
            "next_review": next_review.isoformat(),
        },
        on_conflict="user_id,item_id,item_type,facet",
    ).execute()

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

    client.table("review_session_items").upsert(
        {
            "session_id": session_id,
            "ku_id": payload.ku_id,
            "facet": payload.facet,
            "status": "completed",
            "updated_at": datetime.now(timezone.utc).isoformat(),
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
    current_user: dict[str, Any] = Depends(get_current_user),
    client: Client = Depends(get_client),
):
    user_id = current_user["id"]
    batch_res = client.table("lesson_batches").insert(
        {
            "user_id": user_id,
            "level": payload.level,
            "status": "in_progress",
            "started_at": datetime.now(timezone.utc).isoformat(),
        }
    ).execute()
    batch_id = batch_res.data[0]["id"]

    unit_ids = payload.unit_ids
    if not unit_ids and payload.deck_id:
        learned_res = client.table("user_fsrs_states").select("item_id").eq("user_id", user_id).execute()
        learned_ids = [item["item_id"] for item in learned_res.data]
        deck_q = client.table("deck_items").select("item_id").eq("deck_id", payload.deck_id)
        if learned_ids:
            deck_q = deck_q.not_("item_id", "in", f"({','.join(learned_ids)})")
        deck_res = deck_q.limit(10).execute()
        unit_ids = [item["item_id"] for item in deck_res.data]

    items = [{"batch_id": batch_id, "ku_id": unit_id, "status": "unseen"} for unit_id in unit_ids]
    if items:
        client.table("lesson_items").insert(items).execute()

    return {"batch_id": batch_id}


@router.post("/lesson/{batch_id}/complete", response_model=dict[str, Any])
async def complete_lesson(
    batch_id: str,
    current_user: dict[str, Any] = Depends(get_current_user),
    client: Client = Depends(get_client),
):
    user_id = current_user["id"]
    batch_res = client.table("lesson_batches").select("user_id").eq("id", batch_id).execute()
    if not batch_res.data or batch_res.data[0]["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Access denied")

    client.table("lesson_batches").update(
        {"status": "completed", "completed_at": datetime.now(timezone.utc).isoformat()}
    ).eq("id", batch_id).execute()
    client.table("lesson_items").update({"status": "learned"}).eq("batch_id", batch_id).execute()
    return {"status": "success", "batch_id": batch_id}
