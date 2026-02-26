"""
FastAPI Memory Modules Backend
==============================
Main entrypoint for the refactored modular backend.
"""
from __future__ import annotations

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .core.config import settings
from .api.v1.api import api_router
from .services.memory import episodic_memory as ep_mem
from .services.memory import semantic_memory as sem_mem


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("[startup] Initialising Qdrant collection …")
    try:
        ep_mem.init_qdrant()
        print("[startup] Qdrant ready ✓")
    except Exception as exc:
        print(f"[startup] Qdrant init failed (skipping): {exc}")

    print("[startup] Initialising Neo4j indexes …")
    try:
        sem_mem.init_neo4j()
        print("[startup] Neo4j ready ✓")
    except Exception as exc:
        print(f"[startup] Neo4j init failed (skipping): {exc}")
    
    print("[startup] Lifespan complete ✓")
    yield
    print("[shutdown] Done.")


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

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)
