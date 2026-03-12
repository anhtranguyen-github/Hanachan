from __future__ import annotations

from typing import Any

import anyio
from supabase import Client


async def get_homework(*, supabase: Client, user_id: str) -> list[dict[str, Any]]:
    """
    Fetch the authenticated user's homework items.

    Table: homework
    WHERE user_id = user_id

    NOTE: If your SSOT uses a different table name/schema, adjust accordingly.
    """

    def _query():
        return supabase.table("homework").select("*").eq("user_id", user_id).execute()

    resp = await anyio.to_thread.run_sync(_query)
    data = getattr(resp, "data", None)
    return list(data or [])

