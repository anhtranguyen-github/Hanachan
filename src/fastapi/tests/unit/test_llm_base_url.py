from __future__ import annotations

from app.core import llm


def test_resolve_openai_base_url_prefers_llm_base_url(monkeypatch):
    monkeypatch.setattr(llm.settings, "llm_base_url", "http://localhost:20128/v1")
    monkeypatch.setattr(llm.settings, "openai_api_base", "http://localhost:20128/api/v1")

    assert llm._resolve_openai_base_url() == "http://127.0.0.1:20128/v1"


def test_resolve_openai_base_url_normalizes_api_v1(monkeypatch):
    monkeypatch.setattr(llm.settings, "llm_base_url", "")
    monkeypatch.setattr(llm.settings, "openai_api_base", "http://localhost:20128/api/v1")

    assert llm._resolve_openai_base_url() == "http://127.0.0.1:20128/v1"


def test_resolve_openai_base_url_rewrites_localhost(monkeypatch):
    monkeypatch.setattr(llm.settings, "llm_base_url", "http://localhost:20128/v1")
    monkeypatch.setattr(llm.settings, "openai_api_base", "")

    assert llm._resolve_openai_base_url() == "http://127.0.0.1:20128/v1"
