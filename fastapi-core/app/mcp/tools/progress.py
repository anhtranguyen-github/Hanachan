from __future__ import annotations

from typing import Any

import anyio
from supabase import Client


async def get_learning_progress(*, supabase: Client, user_id: str) -> list[dict[str, Any]]:
    """
    Fetch the authenticated user's learning progress.

    Table: learning_progress
    WHERE user_id = user_id
    """

    def _query():
        return supabase.table("learning_progress").select("*").eq("user_id", user_id).execute()

    resp = await anyio.to_thread.run_sync(_query)
    data = getattr(resp, "data", None)
    return list(data or [])

