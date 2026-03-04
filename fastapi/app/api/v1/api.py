"""
FastAPI API Router - Phase 2 Remediation

CRITICAL: FastAPI is now a STATELESS AGENT HOST only.
All CRUD operations have been removed. Only agent-related endpoints remain.

Architecture:
- Next.js → Supabase (for data access)
- Next.js → FastAPI (for AI agent processing ONLY)
- FastAPI NEVER touches the database directly

Removed endpoints (migrated to Next.js + Supabase):
- /reading/* → Next.js reading feature
- /practice/speaking/* → Next.js speaking feature  
- /dictation/* → Next.js video feature
- /sentences/* → Next.js sentence feature
- /videos/* → Next.js video feature
- /fsrs/* → Next.js learning feature
- /admin/* → Next.js admin feature
"""

from fastapi import APIRouter
from app.api.v1.endpoints import chat, session, memory, maintenance, reading

api_router = APIRouter()

# Agent-only endpoints (stateless AI processing)
api_router.include_router(chat.router, tags=["Chat"])
api_router.include_router(session.router, prefix="/memory", tags=["Session"])
api_router.include_router(memory.router, prefix="/memory", tags=["Memory"])
api_router.include_router(reading.router, tags=["Reading"])

# Maintenance endpoints (health checks, not data access)
api_router.include_router(maintenance.router, tags=["Maintenance"])

# NOTE: All CRUD endpoints have been removed as part of Phase 2 architectural remediation.
# Business logic now lives in Next.js, data access goes through Supabase.
# FastAPI is strictly an AI agent host (stateless, no database access).
