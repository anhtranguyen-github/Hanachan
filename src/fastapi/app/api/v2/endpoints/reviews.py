from fastapi import APIRouter, Depends, Query
from typing import List, Optional
from datetime import datetime, timezone

from app.api import core_deps as deps
from app.repositories.wanikani import WaniKaniRepository
from app.schemas.wanikani import ReviewResource, ReviewCreateRequest, ReviewCreateResponse, BaseCollection, PagesInfo
from app.domain.srs.engine import SRSEngine
from app.domain.srs.models import SRSState

router = APIRouter()

@router.get("/reviews", response_model=BaseCollection)
async def list_reviews(
    assignment_ids: Optional[List[int]] = Query(None),
    subject_ids: Optional[List[int]] = Query(None),
    updated_after: Optional[datetime] = None,
    page: int = 1,
    per_page: int = 500,
    current_user: dict = Depends(deps.get_current_user),
    repo: WaniKaniRepository = Depends(deps.get_wanikani_repo)
):
    user_id = current_user["sub"]
    reviews, total = await repo.list_reviews(
        user_id=user_id,
        assignment_ids=assignment_ids,
        subject_ids=subject_ids,
        updated_after=updated_after,
        page=page,
        per_page=per_page
    )
    
    data = []
    for r in reviews:
        data.append(ReviewResource(
            id=r["id"],
            object="review",
            url=f"/reviews/{r['id']}",
            data_updated_at=r["created_at"],
            data=r
        ))
        
    return BaseCollection(
        object="collection",
        url="/reviews",
        pages=PagesInfo(per_page=per_page),
        total_count=total,
        data=data
    )

@router.post("/reviews", response_model=ReviewCreateResponse)
async def create_review(
    payload: ReviewCreateRequest,
    current_user: dict = Depends(deps.get_current_user),
    repo: WaniKaniRepository = Depends(deps.get_wanikani_repo)
):
    user_id = current_user["sub"]
    
    # 1. Get assignment
    assignment = await repo.get_assignment(user_id, payload.assignment_id)
    if not assignment:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Assignment not found")
        
    # 2. Calculate next SRS state
    # WaniKani rating: we map incorrect answers to ratings
    # 0 incorrect = Good (3)
    # >0 incorrect = Again (1)
    rating = 3 if (payload.incorrect_meaning_answers + payload.incorrect_reading_answers) == 0 else 1
    
    current_srs = SRSState(
        stage=assignment["srs_stage"],
        stability=assignment.get("stability", 0.0),
        difficulty=assignment.get("difficulty", 5.0),
        reps=assignment.get("reps", 0),
        lapses=assignment.get("lapses", 0)
    )
    
    next_srs = SRSEngine.calculate_review(
        current=current_srs,
        rating=rating,
        wrong_count=payload.incorrect_meaning_answers + payload.incorrect_reading_answers
    )
    
    # 3. Create review record
    now = datetime.now(timezone.utc)
    review_data = {
        "user_id": user_id,
        "assignment_id": payload.assignment_id,
        "subject_id": assignment["subject_id"],
        "starting_srs_stage": assignment["srs_stage"],
        "ending_srs_stage": next_srs.new_stage,
        "incorrect_meaning_answers": payload.incorrect_meaning_answers,
        "incorrect_reading_answers": payload.incorrect_reading_answers,
        "created_at": now.isoformat()
    }
    review = await repo.create_review(review_data)
    
    # 4. Update assignment
    update_data = {
        "user_id": user_id,
        "subject_id": assignment["subject_id"],
        "srs_stage": next_srs.new_stage,
        "stability": next_srs.new_stability,
        "difficulty": next_srs.new_difficulty,
        "reps": next_srs.new_reps,
        "lapses": next_srs.new_lapses,
        "available_at": next_srs.next_review_at.isoformat(),
        "data_updated_at": now.isoformat()
    }
    if next_srs.new_stage >= 5 and not assignment.get("passed_at"):
        update_data["passed_at"] = now.isoformat()
    if next_srs.new_stage == 9:
        update_data["burned_at"] = now.isoformat()
        
    updated_assignment = await repo.upsert_assignment(update_data)
    
    # 5. Update review statistics
    stats = await repo.get_review_statistics(user_id, assignment["subject_id"])
    if not stats:
        stats = {
            "user_id": user_id,
            "subject_id": assignment["subject_id"],
            "subject_type": assignment["subject_type"],
            "meaning_correct": 0,
            "meaning_incorrect": 0,
            "reading_correct": 0,
            "reading_incorrect": 0
        }
        
    if payload.incorrect_meaning_answers == 0:
        stats["meaning_correct"] += 1
        stats["meaning_current_streak"] = stats.get("meaning_current_streak", 0) + 1
    else:
        stats["meaning_incorrect"] += payload.incorrect_meaning_answers
        stats["meaning_current_streak"] = 0
        
    if payload.incorrect_reading_answers == 0:
        stats["reading_correct"] += 1
        stats["reading_current_streak"] = stats.get("reading_current_streak", 0) + 1
    else:
        stats["reading_incorrect"] += payload.incorrect_reading_answers
        stats["reading_current_streak"] = 0
        
    stats["meaning_max_streak"] = max(stats.get("meaning_max_streak", 0), stats.get("meaning_current_streak", 0))
    stats["reading_max_streak"] = max(stats.get("reading_max_streak", 0), stats.get("reading_current_streak", 0))
    
    total_correct = stats["meaning_correct"] + stats["reading_correct"]
    total_incorrect = stats["meaning_incorrect"] + stats["reading_incorrect"]
    if (total_correct + total_incorrect) > 0:
        stats["percentage_correct"] = int((total_correct / (total_correct + total_incorrect)) * 100)
    
    await repo.upsert_review_statistics(stats)
    
    return ReviewCreateResponse(
        id=review["id"],
        object="review",
        url=f"/reviews/{review['id']}",
        data_updated_at=now,
        data=review,
        resources_updated={"assignment": updated_assignment}
    )
