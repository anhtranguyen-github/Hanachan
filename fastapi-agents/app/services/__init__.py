"""
Services module for Hanachan.

⚠️  ARCHITECTURE NOTICE ⚠️
FastAPI is now a STATELESS AGENT HOST only.
All business logic services have been migrated to Next.js.
This module only exports agent-specific utilities.
"""

# All services with direct database access have been removed per architecture rules.
# Business logic now lives in Next.js features:
# - FSRS → nextjs/src/features/learning/services/fsrsService.ts
# - Sentence Library → nextjs/src/features/sentence/
# - Video Embeddings → nextjs/src/features/video/
# - Admin → nextjs/src/features/admin/
# - Decks → nextjs/src/features/decks/
# - Reading → nextjs/src/features/reading/
# - Speaking → nextjs/src/features/speaking/

# Only memory services remain (they are agent utilities, not business logic)
# from .memory import ... (if needed by agents)

__all__ = [
    # No direct DB services exported
    # FastAPI = Agents ONLY
]
