"""
Pytest configuration and shared fixtures for Hanachan FastAPI tests.

Uses httpx.AsyncClient with the FastAPI app in test mode.
All tests connect to real cloud services (Supabase, Qdrant, Neo4j).
"""

from __future__ import annotations

import os
from collections.abc import AsyncGenerator

import pytest
import pytest_asyncio

# ── Load environment variables from .env if present ──────────────────────────
from dotenv import load_dotenv
from faker import Faker
from httpx import ASGITransport, AsyncClient

load_dotenv()

fake = Faker()

# ── Set ONLY env defaults that are NOT in .env ───────────────────────────────
os.environ.setdefault("ALLOWED_ORIGINS", '["http://localhost:3000"]')


@pytest_asyncio.fixture(scope="session")
async def app():
    """Create the FastAPI application instance for testing."""
    import base64
    import json

    from fastapi import Depends, HTTPException
    from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

    from app.api.deps import get_current_user
    from app.main import app as fastapi_app

    security = HTTPBearer()

    # Use a real test user from the users table
    TEST_USER_ID = "3b2c4739-8b9f-4ad6-98e2-c27887f9b5b4"

    def mock_get_current_user(token: HTTPAuthorizationCredentials = Depends(security)):
        """Accept test tokens for HTTPX async test client (no real Supabase Auth in test)."""
        if "test-signature" not in token.credentials:
            raise HTTPException(status_code=401, detail="Invalid token signature")
        parts = token.credentials.split(".")
        if len(parts) >= 2:
            try:
                payload_b64 = parts[1]
                payload_b64 += "=" * ((4 - len(payload_b64) % 4) % 4)
                payload = json.loads(base64.urlsafe_b64decode(payload_b64))
                return {
                    "id": payload.get("sub", TEST_USER_ID),
                    "sub": payload.get("sub", TEST_USER_ID),
                    "email": "test@example.com",
                    "jwt": token.credentials,
                }
            except Exception:
                pass
        return {"id": TEST_USER_ID, "sub": TEST_USER_ID, "email": "test@example.com", "jwt": token.credentials}

    fastapi_app.dependency_overrides[get_current_user] = mock_get_current_user
    return fastapi_app


@pytest_asyncio.fixture
async def client(app) -> AsyncGenerator[AsyncClient, None]:
    """Async HTTP client for making test requests."""
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as ac:
        yield ac


# ── Auth helpers ─────────────────────────────────────────────────────────────

# Must match the TEST_USER_ID in the app fixture above
TEST_USER_ID = "3b2c4739-8b9f-4ad6-98e2-c27887f9b5b4"


def make_test_token(user_id: str | None = None, role: str = "authenticated") -> str:
    """Generate a test JWT token (not cryptographically valid, for header injection)."""
    import base64
    import json

    uid = user_id or TEST_USER_ID

    header = (
        base64.urlsafe_b64encode(json.dumps({"alg": "HS256", "typ": "JWT"}).encode())
        .rstrip(b"=")
        .decode()
    )

    payload = (
        base64.urlsafe_b64encode(
            json.dumps({"sub": uid, "role": role, "aud": "authenticated"}).encode()
        )
        .rstrip(b"=")
        .decode()
    )

    return f"{header}.{payload}.test-signature"


@pytest.fixture
def auth_headers() -> dict:
    """Authorization headers with a test JWT token."""
    return {"Authorization": f"Bearer {make_test_token()}"}


# ── Real Supabase fixtures ────────────────────────────────────────────────────


@pytest.fixture
def supabase_client():
    """Return the real Supabase service-role client."""
    from app.core.supabase import get_supabase_client
    return get_supabase_client()


@pytest.fixture
def chat_service(supabase_client):
    """Return a real ChatService backed by Supabase."""
    from app.domain.chat.services import ChatService
    return ChatService(supabase_client)


# ── Test data factories ───────────────────────────────────────────────────────


@pytest.fixture
def sample_user_id() -> str:
    """Return the real test user ID from Supabase users table."""
    return TEST_USER_ID


@pytest.fixture
def sample_user_id_short() -> str:
    """Generate a short test user ID."""
    return f"user-{fake.random_number(digits=6)}"


@pytest.fixture
def sample_session_id() -> str:
    """Generate a random session ID."""
    return f"session-{fake.uuid4()}"


@pytest.fixture
def auth_headers_for_user(sample_user_id: str) -> dict:
    """Authorization headers with the real test user ID."""
    return {"Authorization": f"Bearer {make_test_token(user_id=sample_user_id)}"}


# ── Async helpers ─────────────────────────────────────────────────────────────


@pytest.fixture
async def authenticated_client(
    app, auth_headers_for_user: dict
) -> AsyncGenerator[AsyncClient, None]:
    """An authenticated HTTP client with test user headers."""
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
        headers=auth_headers_for_user,
    ) as ac:
        yield ac


# ── Test assertion helpers ───────────────────────────────────────────────────


def assert_error_response(response, expected_status: int, expected_message: str | None = None):
    """Assert that a response is an error with the given status and optional message."""
    assert response.status_code == expected_status
    data = response.json()
    assert "detail" in data or "error" in data
    if expected_message:
        error_msg = data.get("detail") or data.get("error", "")
        assert expected_message.lower() in error_msg.lower()


def assert_success_response(response, expected_status: int = 200):
    """Assert that a response is successful."""
    assert response.status_code == expected_status
    # Should not be an error response
    data = response.json()
    assert "detail" not in data or response.status_code != 400
