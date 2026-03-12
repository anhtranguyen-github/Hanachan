from __future__ import annotations

from typing import Any

import anyio
from supabase import Client


async def get_my_profile(*, supabase: Client, user_id: str) -> dict[str, Any] | None:
    """
    Fetch the authenticated user's profile.

    Table: profiles
    WHERE id = user_id
    """

    def _query():
        return (
            supabase.table("profiles")
            .select("*")
            .eq("id", user_id)
            .maybe_single()
            .execute()
        )

    resp = await anyio.to_thread.run_sync(_query)
    data = getattr(resp, "data", None)
    return data

