from fastapi import APIRouter, Depends
from datetime import datetime, timezone
from collections import defaultdict

from app.api import core_deps as deps
from app.repositories.wanikani import WaniKaniRepository
from app.schemas.wanikani import SummaryData, SummaryLesson, SummaryReview, BaseResource

router = APIRouter()

@router.get("/summary", response_model=BaseResource)
async def get_summary(
    current_user: dict = Depends(deps.get_current_user),
    repo: WaniKaniRepository = Depends(deps.get_wanikani_repo)
):
    user_id = current_user["sub"]
    summary_data = await repo.get_review_summary(user_id)
    
    # Group lessons by available_at (for now all lessons are available immediately)
    now = datetime.now(timezone.utc)
    
    lesson_subject_ids = [l["subject_id"] for l in summary_data["lessons"]]
    review_by_date = defaultdict(list)
    for r in summary_data["reviews"]:
        # Standard WaniKani summary groups by hour or day, but here we just return immediate and future
        # For this simplified implementation, we'll put all currently available in one bucket
        review_by_date[r["available_at"]].append(r["subject_id"])
        
    lessons = [SummaryLesson(available_at=now, subject_ids=lesson_subject_ids)] if lesson_subject_ids else []
    reviews = []
    for dt_str, ids in review_by_date.items():
        dt = datetime.fromisoformat(dt_str)
        reviews.append(SummaryReview(available_at=dt, subject_ids=ids))
        
    next_review_at = None
    if summary_data["reviews"]:
        # Find next review (excluding currently available)
        future_reviews = [datetime.fromisoformat(r["available_at"]) for r in summary_data["reviews"] if datetime.fromisoformat(r["available_at"]) > now]
        if future_reviews:
            next_review_at = min(future_reviews)
            
    data = SummaryData(
        lessons=lessons,
        reviews=reviews,
        next_reviews_at=next_review_at
    )
    
    return BaseResource(
        id=0, # Summary doesn't have a stable ID in WaniKani usually
        object="report",
        url="/summary",
        data_updated_at=now,
        data=data
    )
