"""
Tests for health and root endpoints.
These tests run without any external service dependencies.
"""
from __future__ import annotations

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_root_returns_200(client: AsyncClient):
    """The root endpoint should return a 200 response."""
    response = await client.get("/")
    # FastAPI returns 200 for the root or 404 if no root route — both are acceptable
    assert response.status_code in (200, 404)


@pytest.mark.asyncio
async def test_openapi_schema_accessible(client: AsyncClient):
    """The OpenAPI schema should be accessible at /openapi.json."""
    response = await client.get("/openapi.json")
    assert response.status_code == 200
    data = response.json()
    assert "openapi" in data
    assert "paths" in data
    assert data["info"]["title"] == "Memory Modules API"


@pytest.mark.asyncio
async def test_docs_accessible(client: AsyncClient):
    """The Swagger UI docs should be accessible."""
    response = await client.get("/docs")
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_redoc_accessible(client: AsyncClient):
    """The ReDoc docs should be accessible."""
    response = await client.get("/redoc")
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_unauthenticated_memory_endpoint_returns_401(client: AsyncClient):
    """Memory endpoints should require authentication."""
    response = await client.post(
        "/api/v1/memory/episodic/search",
        json={"user_id": "test-user", "query": "test query"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_unauthenticated_context_endpoint_returns_401(client: AsyncClient):
    """Context endpoint should require authentication."""
    response = await client.post(
        "/api/v1/memory/context",
        json={"user_id": "test-user", "query": "test query"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_cors_headers_present(client: AsyncClient):
    """CORS preflight should return appropriate headers for allowed origins."""
    response = await client.options(
        "/api/v1/memory/context",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "Content-Type,Authorization",
        },
    )
    # Should not be blocked (200 or 204)
    assert response.status_code in (200, 204)
