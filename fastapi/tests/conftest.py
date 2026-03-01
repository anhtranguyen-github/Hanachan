"""
Pytest configuration and shared fixtures for Hanachan FastAPI tests.

Uses httpx.AsyncClient with the FastAPI app in test mode.
External services (Supabase, Qdrant, Neo4j, OpenAI) are mocked so tests
run without any real credentials or network access.
"""
from __future__ import annotations

import os
from typing import AsyncGenerator
from unittest.mock import patch

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from faker import Faker

fake = Faker()

# ── Set test environment variables BEFORE importing the app ──────────────────
os.environ.setdefault("OPENAI_API_KEY", "sk-test-key")
os.environ.setdefault("SUPABASE_URL", "https://test.supabase.co")
os.environ.setdefault("SUPABASE_KEY", "test-anon-key")
os.environ.setdefault("SUPABASE_SERVICE_KEY", "test-service-key-32-chars-at-least-wow")
os.environ.setdefault("SUPABASE_JWT_SECRET", "test-jwt-secret-32-chars-minimum!!")
os.environ.setdefault("DB_HOST", "localhost")
os.environ.setdefault("DB_PORT", "5432")
os.environ.setdefault("DB_NAME", "test_db")
os.environ.setdefault("DB_USER", "postgres")
os.environ.setdefault("DB_PASSWORD", "test-password")
os.environ.setdefault("QDRANT_URL", "http://localhost:6333")
os.environ.setdefault("NEO4J_URI", "bolt://localhost:7687")
os.environ.setdefault("NEO4J_USER", "neo4j")
os.environ.setdefault("NEO4J_PASSWORD", "test-password")
os.environ.setdefault("ALLOWED_ORIGINS", '["http://localhost:3000"]')


# ── Patch external services before app import ────────────────────────────────

@pytest.fixture(scope="session", autouse=True)
def mock_external_services():
    """Mock all external service connections for the entire test session."""
    with (
        patch("app.core.database.init_pool", return_value=None),
        patch("app.core.database.close_pool", return_value=None),
        patch("app.services.memory.episodic_memory.init_qdrant", return_value=None),
        patch("app.services.memory.semantic_memory.init_neo4j", return_value=None),
        patch("app.services.memory.session_memory.shutdown_bg_executor", return_value=None),
    ):
        yield


@pytest_asyncio.fixture(scope="session")
async def app():
    """Create the FastAPI application instance for testing."""
    # Import after env vars are set
    from app.main import app as fastapi_app
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

def make_test_token(user_id: str = "test-user-123", role: str = "authenticated") -> str:
    """Generate a test JWT token (not cryptographically valid, for header injection)."""
    import base64
    import json

    header = base64.urlsafe_b64encode(
        json.dumps({"alg": "HS256", "typ": "JWT"}).encode()
    ).rstrip(b"=").decode()

    payload = base64.urlsafe_b64encode(
        json.dumps({"sub": user_id, "role": role, "aud": "authenticated"}).encode()
    ).rstrip(b"=").decode()

    return f"{header}.{payload}.test-signature"


@pytest.fixture
def auth_headers() -> dict:
    """Authorization headers with a test JWT token."""
    return {"Authorization": f"Bearer {make_test_token()}"}


@pytest.fixture
def service_role_headers() -> dict:
    """Authorization headers with service_role JWT token."""
    return {"Authorization": f"Bearer {make_test_token(role='service_role')}"}


# ── Test data factories ───────────────────────────────────────────────────────

@pytest.fixture
def sample_user_id() -> str:
    """Generate a random test user ID."""
    return f"test-user-{fake.uuid4()[:8]}"


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
    """Authorization headers with a specific test user ID."""
    return {"Authorization": f"Bearer {make_test_token(user_id=sample_user_id)}"}


# ── Async helpers ─────────────────────────────────────────────────────────────

@pytest.fixture
async def authenticated_client(app, auth_headers_for_user: dict) -> AsyncGenerator[AsyncClient, None]:
    """An authenticated HTTP client with test user headers."""
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
        headers=auth_headers_for_user,
    ) as ac:
        yield ac


# ── Test database helpers ────────────────────────────────────────────────────

class MockDatabaseResponse:
    """Mock database response for testing."""
    
    def __init__(self, data: list | dict | None = None, error: str | None = None):
        self._data = data
        self._error = error
    
    @property
    def data(self):
        if self._error:
            raise Exception(self._error)
        return self._data
    
    @property
    def error(self):
        return self._error


@pytest.fixture
def mock_db_response():
    """Factory for creating mock database responses."""
    return lambda data=None, error=None: MockDatabaseResponse(data, error)


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
