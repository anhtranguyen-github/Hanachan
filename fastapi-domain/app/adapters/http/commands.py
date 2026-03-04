import os
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException
from supabase import Client, create_client
from pydantic import BaseModel
from app.auth.jwt import get_current_user_id

router = APIRouter(prefix="/commands", tags=["commands"])

def get_supabase_service_client() -> Client:
    url = os.getenv("SUPABASE_URL", "")
    key = os.getenv("SUPABASE_SERVICE_KEY", "")
    if not url or not key:
        raise HTTPException(status_code=500, detail="Missing Supabase service configuration")
    return create_client(url, key)

class CreateLessonBatchReq(BaseModel):
    level: int

@router.post("/create-lesson-batch")
async def create_lesson_batch(
    req: CreateLessonBatchReq,
    user_id: str = Depends(get_current_user_id),
    client: Client = Depends(get_supabase_service_client)
):
    try:
        res = client.table("lesson_batches").insert({
            "user_id": user_id,
            "level": req.level,
            "status": "in_progress"
        }).execute()
        return res.data[0]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

class CompleteLessonBatchReq(BaseModel):
    batch_id: str

@router.post("/complete-lesson-batch")
async def complete_lesson_batch(
    req: CompleteLessonBatchReq,
    user_id: str = Depends(get_current_user_id),
    client: Client = Depends(get_supabase_service_client)
):
    client.table("lesson_batches").update({
        "status": "completed",
    }).eq("id", req.batch_id).eq("user_id", user_id).execute()
    return {"status": "success"}

class CreateReviewSessionReq(BaseModel):
    item_ids: List[str]

@router.post("/create-review-session")
async def create_review_session(
    req: CreateReviewSessionReq,
    user_id: str = Depends(get_current_user_id),
    client: Client = Depends(get_supabase_service_client)
):
    res = client.table("review_sessions").insert({
        "user_id": user_id,
        "status": "in_progress"
    }).execute()
    
    session_id = res.data[0]["id"]
    client.table("review_session_items").insert(
        [{"session_id": session_id, "item_id": iid, "status": "pending"} for iid in req.item_ids]
    ).execute()
    
    return {"session_id": session_id}

class SubmitSrsReviewReq(BaseModel):
    item_id: str
    rating: int

@router.post("/submit-srs-review")
async def submit_srs_review(
    req: SubmitSrsReviewReq,
    user_id: str = Depends(get_current_user_id),
    client: Client = Depends(get_supabase_service_client)
):
    # Enforce invariant, use service role
    client.table("fsrs_review_logs").insert({
        "user_id": user_id,
        "item_id": req.item_id,
        "rating": req.rating
    }).execute()
    return {"status": "success"}

class CreateDeckReq(BaseModel):
    name: str
    description: Optional[str] = None

@router.post("/create-deck")
async def create_deck(
    req: CreateDeckReq,
    user_id: str = Depends(get_current_user_id),
    client: Client = Depends(get_supabase_service_client)
):
    res = client.table("decks").insert({
        "user_id": user_id,
        "name": req.name,
        "description": req.description
    }).execute()
    return res.data[0]

class ScheduleAgentJobReq(BaseModel):
    job_type: str
    payload: Dict[str, Any]

@router.post("/schedule-agent-job")
async def schedule_agent_job(
    req: ScheduleAgentJobReq,
    user_id: str = Depends(get_current_user_id),
    client: Client = Depends(get_supabase_service_client)
):
    res = client.table("agent_jobs").insert({
        "user_id": user_id,
        "job_type": req.job_type,
        "payload": req.payload,
        "status": "pending"
    }).execute()
    return res.data[0]
