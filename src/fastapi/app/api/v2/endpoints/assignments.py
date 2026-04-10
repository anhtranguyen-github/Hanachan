from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from datetime import datetime

from app.api import core_deps as deps
from app.repositories.wanikani import WaniKaniRepository
from app.schemas.wanikani import AssignmentResource, BaseCollection, PagesInfo

router = APIRouter()

@router.get("/assignments", response_model=BaseCollection)
async def list_assignments(
    subject_ids: Optional[List[int]] = Query(None),
    available_before: Optional[datetime] = None,
    available_after: Optional[datetime] = None,
    srs_stages: Optional[List[int]] = Query(None),
    burned: Optional[bool] = None,
    started: Optional[bool] = None,
    hidden: bool = False,
    updated_after: Optional[datetime] = None,
    page: int = 1,
    per_page: int = 500,
    current_user: dict = Depends(deps.get_current_user),
    repo: WaniKaniRepository = Depends(deps.get_wanikani_repo)
):
    user_id = current_user["sub"]
    assignments, total = await repo.list_assignments(
        user_id=user_id,
        subject_ids=subject_ids,
        available_before=available_before,
        available_after=available_after,
        srs_stages=srs_stages,
        burned=burned,
        started=started,
        hidden=hidden,
        updated_after=updated_after,
        page=page,
        per_page=per_page
    )
    
    data = []
    for a in assignments:
        data.append(AssignmentResource(
            id=a["id"],
            object="assignment",
            url=f"/assignments/{a['id']}",
            data_updated_at=a["data_updated_at"],
            data=a
        ))
        
    return BaseCollection(
        object="collection",
        url="/assignments",
        pages=PagesInfo(per_page=per_page),
        total_count=total,
        data=data
    )

@router.get("/assignments/{id}", response_model=AssignmentResource)
async def get_assignment(
    id: int,
    current_user: dict = Depends(deps.get_current_user),
    repo: WaniKaniRepository = Depends(deps.get_wanikani_repo)
):
    user_id = current_user["sub"]
    assignment = await repo.get_assignment(user_id, id)
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
        
    return AssignmentResource(
        id=assignment["id"],
        object="assignment",
        url=f"/assignments/{assignment['id']}",
        data_updated_at=assignment["data_updated_at"],
        data=assignment
    )

@router.put("/assignments/{id}/start", response_model=AssignmentResource)
async def start_assignment(
    id: int,
    current_user: dict = Depends(deps.get_current_user),
    repo: WaniKaniRepository = Depends(deps.get_wanikani_repo)
):
    user_id = current_user["sub"]
    assignment = await repo.start_assignment(user_id, id)
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found or could not be started")
        
    return AssignmentResource(
        id=assignment["id"],
        object="assignment",
        url=f"/assignments/{assignment['id']}",
        data_updated_at=assignment["data_updated_at"],
        data=assignment
    )
