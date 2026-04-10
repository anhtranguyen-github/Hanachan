from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from datetime import datetime

from app.api import deps
from app.repositories.wanikani import WaniKaniRepository
from app.schemas.wanikani import SubjectResource, BaseCollection, PagesInfo

router = APIRouter()

@router.get("/subjects", response_model=BaseCollection)
async def list_subjects(
    types: Optional[List[str]] = Query(None),
    levels: Optional[List[int]] = Query(None),
    slugs: Optional[List[str]] = Query(None),
    ids: Optional[List[int]] = Query(None),
    hidden: bool = False,
    updated_after: Optional[datetime] = None,
    page: int = 1,
    per_page: int = 500,
    repo: WaniKaniRepository = Depends(deps.get_wanikani_repo)
):
    subjects, total = await repo.list_subjects(
        types=types,
        levels=levels,
        slugs=slugs,
        ids=ids,
        hidden=hidden,
        updated_after=updated_after,
        page=page,
        per_page=per_page
    )
    
    # Map to WaniKani format
    data = []
    for s in subjects:
        details = s.get("subject_details") or {}
        # Merge details into data field for the schema
        subject_data = {**s, **details}
        data.append(SubjectResource(
            id=s["id"],
            object="subject",
            url=f"/subjects/{s['id']}",
            data_updated_at=s["data_updated_at"],
            data=subject_data
        ))
        
    return BaseCollection(
        object="collection",
        url="/subjects",
        pages=PagesInfo(per_page=per_page),
        total_count=total,
        data=data
    )

@router.get("/subjects/{id}", response_model=SubjectResource)
async def get_subject(
    id: int,
    repo: WaniKaniRepository = Depends(deps.get_wanikani_repo)
):
    subject = await repo.get_subject(id)
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    
    details = subject.get("subject_details") or {}
    subject_data = {**subject, **details}
    
    return SubjectResource(
        id=subject["id"],
        object="subject",
        url=f"/subjects/{subject['id']}",
        data_updated_at=subject["data_updated_at"],
        data=subject_data
    )
