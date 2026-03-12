import os
import json
import asyncio
import httpx
from typing import Any, Optional
from uuid import UUID

class HanachanSimulationClient:
    def __init__(self, base_url: str = "http://localhost:6200/api/v1", token: str | None = None):
        self.base_url = base_url.rstrip("/")
        self.headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }

    async def _post(self, path: str, data: dict = None) -> dict:
        async with httpx.AsyncClient() as client:
            resp = await client.post(f"{self.base_url}{path}", json=data, headers=self.headers)
            resp.raise_for_status()
            return resp.json()

    async def _get(self, path: str, params: dict = None) -> dict:
        async with httpx.AsyncClient() as client:
            resp = await client.get(f"{self.base_url}{path}", params=params, headers=self.headers)
            resp.raise_for_status()
            return resp.json()

    # Learning Module
    async def get_dashboard(self) -> dict:
        return await self._get("/learning/dashboard")

    async def get_progress(self, identifier: str) -> dict:
        return await self._get("/learning/progress", params={"identifier": identifier})

    async def submit_review(self, ku_id: str, facet: str, rating: str, wrong_count: int = 0) -> dict:
        payload = {
            "ku_id": ku_id,
            "facet": facet,
            "rating": rating,
            "wrong_count": wrong_count
        }
        return await self._post("/learning/review", data=payload)

    # Reading Module
    async def submit_reading_answer(self, exercise_id: str, question_index: int, user_answer: str, time_spent: int = 0) -> dict:
        payload = {
            "exercise_id": exercise_id,
            "question_index": question_index,
            "user_answer": user_answer,
            "time_spent_seconds": time_spent
        }
        return await self._post("/reading/submit-answer", data=payload)

async def run_simulation():
    # Credentials from .env
    base_url = "http://127.0.0.1:6200/api/v1"
    # Using the service role JWT from .env for simulation
    jwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjcnJlcGtleGdoemNob2hic3JqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjE2ODU4MSwiZXhwIjoyMDg3NzQ0NTgxfQ.R633QmNLoK7CgAFSmctLHS_oB3bE5IyaRjS5vHJXtk4"
    
    client = HanachanSimulationClient(base_url, jwt)
    
    print("--- Starting Frontend Simulation ---")
    
    try:
        print("[Simulation] Fetching Dashboard Stats...")
        dashboard = await client.get_dashboard()
        print(f"[Simulation] Success: Total Learned = {dashboard['totalLearned']}, Reviews Due = {dashboard['reviewsDue']}")
        
        # Test Learning Progress
        # We need a valid KU ID or identifier. Let's try searching first.
        print("[Simulation] Searching for Knowledge Units...")
        search_results = await client._get("/learning/search", params={"q": "a", "limit": 1})
        if search_results:
            ku = search_results[0]
            ku_id = ku['id']
            print(f"[Simulation] Found KU: {ku['character']} ({ku_id})")
            
            print(f"[Simulation] Fetching progress for {ku_id}...")
            progress = await client.get_progress(ku_id)
            print(f"[Simulation] Progress state: {progress['state'] if progress else 'New'}")
            
            print(f"[Simulation] Submitting a review for {ku_id}...")
            review_resp = await client.submit_review(ku_id, "meaning", "pass")
            print(f"[Simulation] Review submitted. Next review: {review_resp['next_review']}")
        
    except httpx.HTTPStatusError as e:
        print(f"[Simulation] API Error: {e.response.status_code} - {e.response.text}")
    except Exception as e:
        print(f"[Simulation] Error: {e}")

if __name__ == "__main__":
    asyncio.run(run_simulation())
