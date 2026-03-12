import pytest
import httpx
import os
from uuid import UUID

BASE_URL = "http://127.0.0.1:6200/api/v1"
# JWT from .env (Service Role)
JWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjcnJlcGtleGdoemNob2hic3JqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjE2ODU4MSwiZXhwIjoyMDg3NzQ0NTgxfQ.R633QmNLoK7CgAFSmctLHS_oB3bE5IyaRjS5vHJXtk4"

@pytest.fixture
def auth_headers():
    return {
        "Authorization": f"Bearer {JWT}",
        "Content-Type": "application/json"
    }

@pytest.mark.asyncio
async def test_learning_dashboard(auth_headers):
    async with httpx.AsyncClient() as client:
        resp = await client.get(f"{BASE_URL}/learning/dashboard", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert "reviewsDue" in data
        assert "totalLearned" in data
        assert "srsSpread" in data

@pytest.mark.asyncio
async def test_learning_search(auth_headers):
    async with httpx.AsyncClient() as client:
        resp = await client.get(f"{BASE_URL}/learning/search", params={"q": "a", "limit": 5}, headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)

@pytest.mark.asyncio
async def test_reading_submit_invalid_id(auth_headers):
    # Test submission with a dummy UUID to check error handling/auth
    payload = {
        "exercise_id": "00000000-0000-0000-0000-000000000000",
        "question_index": 0,
        "user_answer": "test",
        "time_spent_seconds": 10
    }
    async with httpx.AsyncClient() as client:
        resp = await client.post(f"{BASE_URL}/reading/submit-answer", json=payload, headers=auth_headers)
        # Should return 404 since exercise doesn't exist
        assert resp.status_code == 404
        assert "not found" in resp.text.lower()

@pytest.mark.asyncio
async def test_unauthorized_access():
    async with httpx.AsyncClient() as client:
        resp = await client.get(f"{BASE_URL}/learning/dashboard")
        assert resp.status_code == 401
