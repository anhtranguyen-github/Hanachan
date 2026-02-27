"""
Tests for the application configuration module.
Validates that settings load correctly and validation logic works.
"""
from __future__ import annotations

import pytest


def test_settings_load_from_env():
    """Settings should load from environment variables."""
    from app.core.config import settings

    assert settings.openai_api_key == "sk-test-key"
    assert settings.supabase_url == "https://test.supabase.co"
    assert settings.db_host == "localhost"


def test_settings_allowed_origins_default():
    """allowed_origins should default to localhost:3000."""
    from app.core.config import settings

    assert isinstance(settings.allowed_origins, list)
    assert len(settings.allowed_origins) >= 1


def test_settings_allowed_origins_parse_json_string():
    """allowed_origins should parse JSON array strings."""
    from app.core.config import Settings

    s = Settings(
        openai_api_key="key",
        supabase_url="https://x.supabase.co",
        supabase_key="key",
        db_password="pw",
        allowed_origins='["http://localhost:3000","https://example.com"]',
    )
    assert "http://localhost:3000" in s.allowed_origins
    assert "https://example.com" in s.allowed_origins


def test_settings_validate_required_missing_fields():
    """validate_required should return missing field names."""
    from app.core.config import Settings

    s = Settings(
        openai_api_key="",
        supabase_url="",
        supabase_key="",
        db_password="",
    )
    missing = s.validate_required()
    assert "OPENAI_API_KEY" in missing
    assert "SUPABASE_URL" in missing
    assert "SUPABASE_KEY" in missing
    assert "DB_PASSWORD" in missing


def test_settings_validate_required_all_present():
    """validate_required should return empty list when all fields are set."""
    from app.core.config import Settings

    s = Settings(
        openai_api_key="sk-test",
        supabase_url="https://x.supabase.co",
        supabase_key="anon-key",
        db_password="password",
    )
    missing = s.validate_required()
    assert missing == []


def test_settings_trusted_proxies_parse_csv():
    """trusted_proxies should parse comma-separated IP strings."""
    from app.core.config import Settings

    s = Settings(
        openai_api_key="key",
        supabase_url="https://x.supabase.co",
        supabase_key="key",
        db_password="pw",
        trusted_proxies="10.0.0.1,10.0.0.2",
    )
    assert "10.0.0.1" in s.trusted_proxies
    assert "10.0.0.2" in s.trusted_proxies


def test_settings_rate_limit_default():
    """rate_limit_per_minute should have a sensible default."""
    from app.core.config import settings

    assert settings.rate_limit_per_minute > 0
