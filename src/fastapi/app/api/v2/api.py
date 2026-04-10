"""V2 API router — WaniKani-style endpoints."""

from fastapi import APIRouter

from app.api.v2.endpoints import (
    assignments,
    custom_decks,
    reviews,
    subjects,
    summary,
    srs_systems,
)

api_v2_router = APIRouter()

api_v2_router.include_router(subjects.router, tags=["Subjects"])
api_v2_router.include_router(assignments.router, tags=["Assignments"])
api_v2_router.include_router(reviews.router, tags=["Reviews"])
api_v2_router.include_router(srs_systems.router, tags=["SRS Systems"])
api_v2_router.include_router(summary.router, tags=["Summary"])
api_v2_router.include_router(custom_decks.router, tags=["Custom Decks"])
