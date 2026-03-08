"""Chat service backed by Supabase."""

from datetime import datetime, timezone
from typing import Any

from supabase import Client


class ChatService:
    def __init__(self, client: Client):
        self.client = client

    async def upsert_chat_session(self, user_id: str, session_id: str) -> dict[str, Any]:
        res = (
            self.client.table("chat_sessions")
            .upsert(
                {
                    "id": session_id,
                    "user_id": user_id,
                    "updated_at": datetime.now(timezone.utc).isoformat(),
                }
            )
            .execute()
        )
        return res.data[0] if res.data else {"session_id": session_id}

    async def add_chat_message(
        self,
        user_id: str,
        session_id: str,
        role: str,
        content: str,
        metadata: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
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
                    "role": role,
                    "content": content,
                    "metadata": metadata or {},
                    "created_at": datetime.now(timezone.utc).isoformat(),
                }
            )
            .execute()
        )

        self.client.table("chat_sessions").update(
            {"updated_at": datetime.now(timezone.utc).isoformat()}
        ).eq("id", session_id).execute()

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
            .select("id, title, summary, updated_at, chat_messages(count)")
            .eq("user_id", user_id)
            .order("updated_at", desc=True)
            .execute()
        )

        data = res.data
        for doc in data:
            messages = doc.get("chat_messages", [])
            if isinstance(messages, list) and len(messages) > 0:
                # PostgREST with chat_messages(count) returns [{'count': N}]
                doc["message_count"] = messages[0].get("count", 0)
            elif isinstance(messages, dict):
                doc["message_count"] = messages.get("count", 0)
            else:
                doc["message_count"] = 0
        return data

    async def get_chat_messages(
        self, user_id: str, session_id: str, limit: int = 50
    ) -> list[dict[str, Any]]:
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
            .select("*")
            .eq("session_id", session_id)
            .order("created_at", desc=False)
            .limit(limit)
            .execute()
        )
        return res.data

    async def update_chat_session(
        self, user_id: str, session_id: str, title: str | None = None, summary: str | None = None
    ) -> dict[str, Any]:
        update_data: dict[str, str] = {}
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

    async def update_latest_assistant_message_metadata(
        self,
        user_id: str,
        session_id: str,
        metadata: dict[str, Any],
        *,
        content: str | None = None,
    ) -> dict[str, Any]:
        sess = (
            self.client.table("chat_sessions")
            .select("user_id")
            .eq("id", session_id)
            .single()
            .execute()
        )
        if sess.data and sess.data["user_id"] != user_id:
            raise ValueError("Unauthorized: User does not own this session")

        query = (
            self.client.table("chat_messages")
            .select("id, metadata, content")
            .eq("session_id", session_id)
            .eq("role", "assistant")
            .order("created_at", desc=True)
            .limit(5)
        )
        res = query.execute()
        candidates = res.data or []
        target = None

        if content is not None:
            target = next((msg for msg in candidates if msg.get("content") == content), None)
        if target is None and candidates:
            target = candidates[0]
        if target is None:
            return {}

        existing_metadata = target.get("metadata") or {}
        merged_metadata = {**existing_metadata, **metadata}

        updated = (
            self.client.table("chat_messages")
            .update({"metadata": merged_metadata})
            .eq("id", target["id"])
            .execute()
        )
        return updated.data[0] if updated.data else {}

    async def delete_chat_session(self, user_id: str, session_id: str) -> dict[str, Any]:
        self.client.table("chat_sessions").delete().eq("id", session_id).eq(
            "user_id", user_id
        ).execute()
        return {"status": "deleted", "id": session_id}
