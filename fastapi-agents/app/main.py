"""
FastAPI Memory Modules Backend
==============================
Main entrypoint for the refactored modular backend.
"""

from __future__ import annotations

import logging
import sys
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from starlette.middleware.base import BaseHTTPMiddleware

from app.api.v1.api import api_router
from app.core.config import settings, validate_config
from app.core.errors import AppError, app_error_handler, unhandled_exception_handler
from app.core.logging import RequestIdMiddleware, configure_logging
from app.core.rate_limit import limiter, rate_limit_exceeded_handler
from app.services.memory import episodic_memory as ep_mem
from app.services.memory import semantic_memory as sem_mem

# Configure structured JSON logging before anything else
configure_logging()
logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Request body size limit (Issue #15)
# ---------------------------------------------------------------------------


class MaxBodySizeMiddleware(BaseHTTPMiddleware):
    MAX_BODY_BYTES = 64 * 1024  # 64 KB

    async def dispatch(self, request: Request, call_next):
        # Check Content-Length header for body size
        # Note: We only check the header, not the actual body, because reading
        # the body would consume the stream and break downstream handlers.
        # For chunked transfer without Content-Length, rely on the client
        # sending a proper Content-Length or being limited by other means.
        content_length = request.headers.get("content-length")
        if content_length and int(content_length) > self.MAX_BODY_BYTES:
            return JSONResponse(
                status_code=413,
                content={"detail": "Request body too large"},
            )
        return await call_next(request)


# ---------------------------------------------------------------------------
# Lifespan (Issue #16)
# ---------------------------------------------------------------------------


@asynccontextmanager
async def lifespan(app: FastAPI):
    startup_errors: list[str] = []

    # Required: Validate config at startup
    try:
        validate_config()
    except ValueError as exc:
        logger.critical("startup_config_invalid", extra={"error": str(exc)})
        sys.exit(1)

    # NOTE: Direct PostgreSQL pool initialization removed (per architecture rules)
    # All DB access must go through Supabase client for RLS enforcement
    logger.info("startup_db_pool_skipped (direct access removed)")

    # Optional: degrade gracefully if Qdrant unavailable
    try:
        ep_mem.init_qdrant()
        logger.info("startup_qdrant_ok")
    except Exception as exc:
        startup_errors.append(f"qdrant: {exc}")
        logger.warning("startup_qdrant_degraded", extra={"error": str(exc)})

    # Optional: degrade gracefully if Neo4j unavailable
    try:
        sem_mem.init_neo4j()
        logger.info("startup_neo4j_ok")
    except Exception as exc:
        startup_errors.append(f"neo4j: {exc}")
        logger.warning("startup_neo4j_degraded", extra={"error": str(exc)})

    app.state.degraded_services = startup_errors
    logger.info("startup_complete", extra={"degraded": startup_errors})

    yield

    # Shutdown: close all pools and executors
    # NOTE: close_pool() removed - no direct DB connections to clean up
    logger.info("shutdown_complete")


# ---------------------------------------------------------------------------
# Application
# ---------------------------------------------------------------------------

app = FastAPI(
    title="Memory Modules API",
    description=(
        "Refactored: Episodic + Semantic + Session memory backend for AI chatbots.\n\n"
        "**Memory layers**\n"
        "- **Session (Working Memory)**: in-thread conversation context, auto-titled and summarised\n"
        "- **Episodic**: Qdrant vector store — past turn summaries, recalled by similarity\n"
        "- **Semantic**: Neo4j knowledge graph — extracted entities and facts\n\n"
        "**Chatbot integration**: call `/memory/context` to get a ready-to-inject system prompt block."
    ),
    version="2.0.0",
    lifespan=lifespan,
)

# ---------------------------------------------------------------------------
# Middleware (order matters — outermost first)
# ---------------------------------------------------------------------------

# 1. Request ID propagation (Issue #20)
app.add_middleware(RequestIdMiddleware)

# 2. Body size limit (Issue #15)
app.add_middleware(MaxBodySizeMiddleware)

# 3. Rate limiting (Issue #7)
app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)

# 4. CORS — explicit origins, never wildcard + credentials (Issue #1)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE"],
    allow_headers=["Authorization", "Content-Type", "X-Request-ID"],
)

# ---------------------------------------------------------------------------
# Exception handlers (Issue #14)
# ---------------------------------------------------------------------------

app.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler)
app.add_exception_handler(AppError, app_error_handler)
app.add_exception_handler(Exception, unhandled_exception_handler)

# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

import os

API_PREFIX = os.getenv("API_PREFIX", "/a" + "pi/v1")
app.include_router(api_router, prefix=API_PREFIX)
