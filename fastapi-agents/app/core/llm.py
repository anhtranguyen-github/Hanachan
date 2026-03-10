"""
Centralised LLM factory — all clients get timeouts and retry config.
"""

from __future__ import annotations

from langchain.chat_models import ChatOpenAI


def _resolve_openai_embeddings_class():
    """Dynamically resolve the OpenAIEmbeddings class from installed packages."""
    try:
        from langchain.embeddings import OpenAIEmbeddings

        return OpenAIEmbeddings
    except Exception:
        try:
            from langchain.embeddings.openai import OpenAIEmbeddings

            return OpenAIEmbeddings
        except Exception:
            try:
                from langchain_openai import OpenAIEmbeddings as _AltOpenAIEmbeddings

                return _AltOpenAIEmbeddings
            except Exception:
                raise

from app.core.config import settings


def make_llm(temperature: float = 0, streaming: bool = False) -> ChatOpenAI:
    """Return a ChatOpenAI instance with timeout and retry configured."""
    return ChatOpenAI(
        model=settings.llm_model,
        temperature=temperature,
        openai_api_key=settings.openai_api_key,
        streaming=streaming,
        request_timeout=25,  # fail fast — don't block workers
        max_retries=2,  # built-in retry with exponential backoff
    )


def make_embedding_model() -> OpenAIEmbeddings:
    """Return an OpenAIEmbeddings instance with timeout and retry configured."""
    EmbeddingsCls = _resolve_openai_embeddings_class()
    return EmbeddingsCls(
        model=settings.embedding_model,
        openai_api_key=settings.openai_api_key,
        request_timeout=10,
        max_retries=2,
    )
