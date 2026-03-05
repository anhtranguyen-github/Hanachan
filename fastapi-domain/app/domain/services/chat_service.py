import logging
from datetime import datetime
from typing import Any

logger = logging.getLogger(__name__)


class ChatService:
    def __init__(self, client):
        self.client = client

    async def upsert_chat_session(self, user_id: str, session_id: str) -> dict[str, Any]:
        """Ensures a chat session exists in the DB."""
        # Simple metadata like created_at handled by Supabase default or manual insert
        res = (
            self.client.table("chat_sessions")
            .upsert(
                {"id": session_id, "user_id": user_id, "updated_at": datetime.utcnow().isoformat()}
            )
            .execute()
        )
        return res.data[0] if res.data else {"session_id": session_id}

    async def add_chat_message(
        self, user_id: str, session_id: str, role: str, content: str
    ) -> dict[str, Any]:
        """Persists a message in the chat history."""
        # Verify ownership (RLS should handle this but service check is safer)
        sess = (
            self.client.table("chat_sessions")
            .select("user_id")
            .eq("id", session_id)
            .single()
            .execute()
        )
        if sess.data and sess.data["user_id"] != user_id:
            raise ValueError("Unauthorized: User does not own this session")

        res = (
            self.client.table("chat_messages")
            .insert(
                {
                    "session_id": session_id,
                    "user_id": user_id,
                    "role": role,
                    "content": content,
                    "created_at": datetime.utcnow().isoformat(),
                }
            )
            .execute()
        )

        # Update session touch time
        self.client.table("chat_sessions").update({"updated_at": datetime.utcnow().isoformat()}).eq(
            "id", session_id
        ).execute()

        return res.data[0] if res.data else {}

    async def get_chat_session(self, user_id: str, session_id: str) -> dict[str, Any] | None:
        res = (
            self.client.table("chat_sessions")
            .select("*")
            .eq("id", session_id)
            .eq("user_id", user_id)
            .execute()
        )
        return res.data[0] if res.data else None

    async def list_chat_sessions(self, user_id: str) -> list[dict[str, Any]]:
        res = (
            self.client.table("chat_sessions")
            .select("*")
            .eq("user_id", user_id)
            .order("updated_at", desc=True)
            .execute()
        )
        return res.data

    async def get_chat_messages(
        self, user_id: str, session_id: str, limit: int = 50
    ) -> list[dict[str, Any]]:
        res = (
            self.client.table("chat_messages")
            .select("*")
            .eq("session_id", session_id)
            .eq("user_id", user_id)
            .order("created_at", desc=False)
            .limit(limit)
            .execute()
        )
        return res.data

    async def update_chat_session(
        self, user_id: str, session_id: str, title: str | None = None, summary: str | None = None
    ) -> dict[str, Any]:
        update_data = {}
        if title:
            update_data["title"] = title
        if summary:
            update_data["summary"] = summary

        if not update_data:
            return {}

        res = (
            self.client.table("chat_sessions")
            .update(update_data)
            .eq("id", session_id)
            .eq("user_id", user_id)
            .execute()
        )
        return res.data[0] if res.data else {}

    async def delete_chat_session(self, user_id: str, session_id: str) -> dict[str, Any]:
        self.client.table("chat_sessions").delete().eq("id", session_id).eq(
            "user_id", user_id
        ).execute()
        return {"status": "deleted", "id": session_id}
