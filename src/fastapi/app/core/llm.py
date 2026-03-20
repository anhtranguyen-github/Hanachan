"""
Centralised LLM factory — all clients get timeouts and retry config.
"""

from __future__ import annotations

from langchain_community.embeddings import JinaEmbeddings
from langchain_openai import ChatOpenAI, OpenAIEmbeddings

from app.core.config import settings


def make_llm(temperature: float = 0, streaming: bool = False) -> ChatOpenAI:
    """Return a ChatOpenAI instance with timeout and retry configured."""
    base_url = settings.openai_api_base or settings.llm_base_url or None
    return ChatOpenAI(
        model=settings.llm_model or settings.default_llm_model,
        temperature=temperature,
        openai_api_key=settings.openai_api_key,
        base_url=base_url,
        streaming=streaming,
        request_timeout=25,  # fail fast — don't block workers
        max_retries=2,  # built-in retry with exponential backoff
    )


def make_embedding_model() -> JinaEmbeddings | OpenAIEmbeddings:
    """Return a JinaEmbeddings or OpenAIEmbeddings instance."""
    if settings.jina_api_key:
        return JinaEmbeddings(
            jina_api_key=settings.jina_api_key,
            model_name=settings.jina_embedding_model or "jina-embeddings-v3",
        )

    base_url = settings.openai_api_base or settings.llm_base_url or None
    return OpenAIEmbeddings(
        model=settings.embedding_model,
        openai_api_key=settings.openai_api_key,
        base_url=base_url,
        request_timeout=10,
        max_retries=2,
    )
