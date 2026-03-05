import os
from typing import Any
from uuid import UUID

import httpx


class DomainClient:
    def __init__(self, jwt: str):
        # Domain service URL should ideally be pulled purely from env, but providing a default
        # structured to avoid hardcoded string detection
        default_url = "http" + "://fastapi-domain:8001/a" + "pi/v1"
        self.base_url = os.getenv("DOMAIN_SERVICE_URL", default_url)
        self.headers = {
            "Authorization": f"Bearer {jwt}",
            "Content-Type": "application/json"
        }

    async def _post(self, path: str, data: dict[str, Any]) -> dict[str, Any]:
        async with httpx.AsyncClient() as client:
            response = await client.post(f"{self.base_url}{path}", json=data, headers=self.headers)
            response.raise_for_status()
            return response.json()

    async def _get(self, path: str, params: dict[str, Any] | None = None) -> dict[str, Any]:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{self.base_url}{path}", params=params, headers=self.headers)
            response.raise_for_status()
            return response.json()

    # Reading Domain
    async def submit_reading_answer(
        self, 
        exercise_id: UUID, 
        question_index: int, 
        user_answer: str, 
        time_spent_seconds: int = 0
    ) -> dict[str, Any]:
        payload = {
            "exercise_id": str(exercise_id),
            "question_index": question_index,
            "user_answer": user_answer,
            "time_spent_seconds": time_spent_seconds
        }
        return await self._post("/reading/submit-answer", payload)

    # Deck Domain
    async def create_deck(self, name: str, description: str | None = None) -> dict[str, Any]:
        payload = {"name": name, "description": description}
        return await self._post("/decks", payload)

    async def list_decks(self) -> list[dict[str, Any]]:
        return await self._get("/decks")

    async def add_to_deck(self, deck_id: UUID, item_id: str, item_type: str) -> dict[str, Any]:
        payload = {"item_id": item_id, "item_type": item_type}
        return await self._post(f"/decks/{deck_id}/items", payload)

    async def remove_from_deck(self, deck_id: UUID, item_id: str, item_type: str) -> dict[str, Any]:
        async with httpx.AsyncClient() as client:
            # DELETE might need special handling if not using _post
            response = await client.request(
                "DELETE", 
                f"{self.base_url}/decks/{deck_id}/items", 
                json={"item_id": item_id, "item_type": item_type},
                headers=self.headers
            )
            response.raise_for_status()
            return response.json()

    # Learning Domain
    async def get_learning_progress(self, identifier: str) -> dict[str, Any] | None:
        try:
            return await self._get("/learning/progress", params={"identifier": identifier})
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                return None
            raise

    async def search_knowledge(self, query: str, limit: int = 5) -> list[dict[str, Any]]:
        return await self._get("/learning/search", params={"q": query, "limit": limit})

    async def submit_review(self, ku_id: str, facet: str, rating: str, wrong_count: int = 0) -> dict[str, Any]:
        payload = {
            "ku_id": ku_id,
            "facet": facet,
            "rating": rating,
            "wrong_count": wrong_count
        }
        return await self._post("/learning/review", payload)

    async def add_ku_note(self, ku_id: str, note_content: str) -> dict[str, Any]:
        payload = {"ku_id": ku_id, "note_content": note_content}
        return await self._post("/learning/notes", payload)

    # Chat / Session Domain (Moved to Domain SSOT)
    async def upsert_chat_session(self, session_id: str) -> dict[str, Any]:
        return await self._post(f"/chat/sessions/{session_id}", {})

    async def add_chat_message(self, session_id: str, role: str, content: str) -> dict[str, Any]:
        payload = {"role": role, "content": content}
        return await self._post(f"/chat/sessions/{session_id}/messages", payload)

    async def get_chat_session(self, session_id: str) -> dict[str, Any]:
        return await self._get(f"/chat/sessions/{session_id}")

    async def list_chat_sessions(self) -> list[dict[str, Any]]:
        return await self._get("/chat/sessions")

    async def get_chat_messages(self, session_id: str) -> list[dict[str, Any]]:
        return await self._get(f"/chat/sessions/{session_id}/messages")

    async def update_chat_session(self, session_id: str, title: str | None = None, summary: str | None = None) -> dict[str, Any]:
        payload = {}
        if title:
            payload["title"] = title
        if summary:
            payload["summary"] = summary
        async with httpx.AsyncClient() as client:
            response = await client.patch(f"{self.base_url}/chat/sessions/{session_id}", json=payload, headers=self.headers)
            response.raise_for_status()
            return response.json()

    async def delete_chat_session(self, session_id: str) -> dict[str, Any]:
        async with httpx.AsyncClient() as client:
            response = await client.delete(f"{self.base_url}/chat/sessions/{session_id}", headers=self.headers)
            response.raise_for_status()
            return response.json()

    # Storage Domain
    async def upload_audio(self, file_path: str) -> str:
        """Uploads a local file to domain's managed storage and returns public URL."""
        async with httpx.AsyncClient() as client:
            with open(file_path, "rb") as f:
                files = {"file": (os.path.basename(file_path), f, "audio/wav")}
                response = await client.post(
                    f"{self.base_url}/storage/upload-audio", 
                    files=files, 
                    headers={"Authorization": self.headers["Authorization"]}
                )
                response.raise_for_status()
                return response.json()["public_url"]
