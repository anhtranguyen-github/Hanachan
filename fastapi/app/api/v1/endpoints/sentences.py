"""
Sentence endpoints — annotation + CRUD.
"""

from __future__ import annotations

import logging
from typing import Optional, List

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from ...services.sentence_annotator import annotate_sentence, get_sentence_annotations

logger = logging.getLogger(__name__)

router = APIRouter()


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class AnnotateRequest(BaseModel):
    sentence_id: str = Field(..., description="UUID of the sentence to annotate")
    japanese_raw: str = Field(..., description="The raw Japanese text to annotate")


class AnnotationResponse(BaseModel):
    ku_id: str
    ku_type: str
    character: str
    position_start: int
    position_end: int
    slug: Optional[str] = None


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/annotate", response_model=List[AnnotationResponse], tags=["Sentences"])
async def annotate(req: AnnotateRequest):
    """Annotate a sentence: match vocab + kanji and save to sentence_knowledge."""
    try:
        from fastapi.concurrency import run_in_threadpool
        annotations = await run_in_threadpool(
            annotate_sentence, req.sentence_id, req.japanese_raw
        )
        return annotations
    except Exception as exc:
        logger.error(f"Annotation failed for {req.sentence_id}: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail="Annotation failed")


@router.get("/{sentence_id}/annotations", response_model=List[AnnotationResponse], tags=["Sentences"])
async def get_annotations(sentence_id: str):
    """Get existing annotations for a sentence."""
    try:
        from fastapi.concurrency import run_in_threadpool
        annotations = await run_in_threadpool(get_sentence_annotations, sentence_id)
        return annotations
    except Exception as exc:
        logger.error(f"Failed to fetch annotations for {sentence_id}: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to fetch annotations")
