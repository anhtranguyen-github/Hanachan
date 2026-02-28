"""
Tests for the security / authentication module.
"""
from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials


def test_service_role_key_bypasses_jwt():
    """The Supabase service role key should bypass JWT validation."""
    from app.core.security import require_auth
    from app.core.config import settings

    creds = HTTPAuthorizationCredentials(
        scheme="Bearer",
        credentials=settings.supabase_service_key,
    )
    result = require_auth(creds)
    assert result["role"] == "service_role"
    assert result["sub"] == "service_role"


def test_missing_bearer_token_raises_401(client):
    """Requests without Authorization header should get 401."""
    import asyncio

    async def _run():
        from httpx import AsyncClient, ASGITransport
        from app.main import app

        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as ac:
            response = await ac.post(
                "/api/v1/memory/episodic/search",
                json={"user_id": "u1", "query": "test"},
            )
        return response

    response = asyncio.get_event_loop().run_until_complete(_run())
    assert response.status_code == 401


def test_invalid_token_raises_401():
    """An invalid JWT token should raise 401."""
    from app.core.security import require_auth
    from jwt.exceptions import PyJWKClientError

    creds = HTTPAuthorizationCredentials(
        scheme="Bearer",
        credentials="invalid.token.here",
    )

    # Mock JWKS client to raise PyJWKClientError (what require_auth catches)
    with patch("app.core.security._get_jwks_client") as mock_jwks:
        mock_client = MagicMock()
        mock_client.get_signing_key_from_jwt.side_effect = PyJWKClientError("JWKS unavailable")
        mock_jwks.return_value = mock_client

        with pytest.raises(HTTPException) as exc_info:
            require_auth(creds)

        assert exc_info.value.status_code == 401


def test_require_own_user_allows_matching_user():
    """require_own_user should allow access when user_id matches token sub."""
    from app.core.security import require_own_user

    payload = {"sub": "user-123", "role": "authenticated"}
    result = require_own_user(user_id="user-123", payload=payload)
    assert result == "user-123"


def test_require_own_user_blocks_different_user():
    """require_own_user should block access when user_id doesn't match token sub."""
    from app.core.security import require_own_user

    payload = {"sub": "user-456", "role": "authenticated"}

    with pytest.raises(HTTPException) as exc_info:
        require_own_user(user_id="user-123", payload=payload)

    assert exc_info.value.status_code == 403


def test_require_own_user_allows_service_role():
    """require_own_user should allow service_role to access any user's data."""
    from app.core.security import require_own_user

    payload = {"sub": "service_role", "role": "service_role"}
    result = require_own_user(user_id="any-user-id", payload=payload)
    assert result == "any-user-id"
