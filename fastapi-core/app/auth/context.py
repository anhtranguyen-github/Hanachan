from contextvars import ContextVar
from typing import Optional

# Context variable to store the current user_id for the request/call
user_id_ctx: ContextVar[Optional[str]] = ContextVar("user_id", default=None)

def get_current_user_id() -> Optional[str]:
    return user_id_ctx.get()

def set_current_user_id(user_id: str) -> None:
    user_id_ctx.set(user_id)
