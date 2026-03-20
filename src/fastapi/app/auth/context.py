"""Context variable for current user_id — used by MCP tools and services."""

from contextvars import ContextVar
from typing import Optional

user_id_ctx: ContextVar[Optional[str]] = ContextVar("user_id", default=None)


def get_current_user_id() -> Optional[str]:
    return user_id_ctx.get()


def set_current_user_id(user_id: str) -> None:
    user_id_ctx.set(user_id)
