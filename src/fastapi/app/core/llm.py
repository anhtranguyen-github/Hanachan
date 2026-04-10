"""
Centralised LLM factory — all clients get timeouts and retry config.
"""

from __future__ import annotations

from urllib.parse import urlsplit, urlunsplit

from langchain_community.embeddings import JinaEmbeddings
from langchain_openai import ChatOpenAI, OpenAIEmbeddings

from app.core.config import settings


def _resolve_llm_base_url() -> str | None:
    """Return the LLM base URL expected by the client."""
    base_url = settings.llm_base_url or settings.llm_api_base or None
    if not base_url and settings.llm_api_base:
        base_url = settings.llm_api_base

    if not base_url:
        return None

    normalized = base_url.rstrip("/")
    if normalized.endswith("/api/v1"):
        normalized = normalized[: -len("/api/v1")] + "/v1"

    parsed = urlsplit(normalized)
    if parsed.hostname == "localhost":
        port = f":{parsed.port}" if parsed.port else ""
        normalized = urlunsplit(
            (parsed.scheme, f"127.0.0.1{port}", parsed.path, parsed.query, parsed.fragment)
        )

    return normalized


def make_llm(temperature: float = 0, streaming: bool = False) -> ChatOpenAI:
    """Return a ChatOpenAI instance with timeout and retry configured."""
    return ChatOpenAI(
        model=settings.llm_model or settings.default_llm_model,
        temperature=temperature,
        openai_api_key=settings.llm_api_key,
        base_url=_resolve_llm_base_url(),
        streaming=streaming,
        request_timeout=25,
        max_retries=2,
    )


def make_embedding_model() -> JinaEmbeddings | OpenAIEmbeddings:
    """Return a JinaEmbeddings or OpenAIEmbeddings instance."""
    if settings.jina_api_key:
        return JinaEmbeddings(
            jina_api_key=settings.jina_api_key,
            model_name=settings.jina_embedding_model or "jina-embeddings-v3",
        )

    return OpenAIEmbeddings(
        model=settings.embedding_model,
        openai_api_key=settings.llm_api_key,
        base_url=_resolve_llm_base_url(),
        request_timeout=10,
        max_retries=2,
    )
