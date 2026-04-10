from fastapi import APIRouter, Depends, Query
from typing import List, Optional

from app.api import core_deps as deps
from app.repositories.wanikani import WaniKaniRepository
from app.schemas.wanikani import SRSSystemData, BaseCollection, PagesInfo, BaseResource

router = APIRouter()

@router.get("/spaced_repetition_systems", response_model=BaseCollection)
async def list_srs_systems(
    repo: WaniKaniRepository = Depends(deps.get_wanikani_repo)
):
    systems = await repo.list_srs_systems()
    
    data = []
    for s in systems:
        data.append(BaseResource(
            id=s["id"],
            object="spaced_repetition_system",
            url=f"/spaced_repetition_systems/{s['id']}",
            data_updated_at=s["data_updated_at"],
            data=s
        ))
        
    return BaseCollection(
        object="collection",
        url="/spaced_repetition_systems",
        total_count=len(data),
        data=data
    )

@router.get("/spaced_repetition_systems/{id}", response_model=BaseResource)
async def get_srs_system(
    id: int,
    repo: WaniKaniRepository = Depends(deps.get_wanikani_repo)
):
    from fastapi import HTTPException
    system = await repo.get_srs_system(id)
    if not system:
        raise HTTPException(status_code=404, detail="SRS system not found")
        
    return BaseResource(
        id=system["id"],
        object="spaced_repetition_system",
        url=f"/spaced_repetition_systems/{system['id']}",
        data_updated_at=system["data_updated_at"],
        data=system
    )
