"""
JWT Authentication — DEPRECATED / ARCHITECTURE VIOLATION

⚠️  AUTHENTICATION HAS BEEN REMOVED FROM FASTAPI PER ARCHITECTURE RULES ⚠️

Architecture Rule:
  FastAPI = Agents ONLY (stateless, no auth)
  Auth must be handled by Supabase/Next.js (BFF pattern)

Why:
  - FastAPI must be stateless agents with no auth per architecture
  - Auth must be handled by Supabase/Next.js (BFF pattern)
  - Removes auth duplication between layers
  - Security: Auth in wrong layer bypasses RLS enforcement
  - Complexity: Duplicate auth logic in multiple layers
  - Maintenance: JWT validation in FastAPI requires secret management

What to do instead:
  - Pass user_id in request body/query params
  - Trust that Next.js has already validated auth via Supabase
  - FastAPI endpoints now accept user_id directly from trusted sources
"""

from __future__ import annotations

import logging
import warnings

from fastapi import HTTPException

logger = logging.getLogger(__name__)


class ArchitectureViolationError(HTTPException):
    """
    Raised when code attempts to use JWT authentication in FastAPI.

    This is an architecture violation - auth must be handled by Next.js/Supabase.
    """

    def __init__(self, detail: str | None = None):
        message = detail or (
            "Architecture Violation: JWT authentication is not allowed in FastAPI. "
            "Auth must be handled by Supabase/Next.js (BFF pattern). "
            "Pass user_id in request body instead of using JWT tokens. "
            "See documentation/01_ARCHITECTURE_OVERVIEW.md for details."
        )
        super().__init__(status_code=500, detail=message)


def _emit_deprecation_warning(func_name: str) -> None:
    """Emit a deprecation warning for auth functions."""
    warnings.warn(
        f"{func_name}() is deprecated. "
        "JWT authentication has been removed from FastAPI per architecture rules. "
        "Pass user_id directly in request body. "
        "Auth must be handled by Supabase/Next.js (BFF pattern).",
        DeprecationWarning,
        stacklevel=3,
    )
    logger.warning(
        "auth_deprecation_warning",
        extra={"function": func_name, "violation": "JWT auth in FastAPI"},
    )


def require_auth(
    *args,
    **kwargs,
) -> dict:
    """
    DEPRECATED: JWT authentication is no longer supported in FastAPI.

    This function now raises ArchitectureViolationError.

    Architecture Rule:
      FastAPI = Agents ONLY (stateless, no auth)
      Auth must be handled by Supabase/Next.js (BFF pattern)

    Instead:
      - Pass user_id in request body/query params
      - Trust that Next.js has already validated auth via Supabase

    Raises:
        ArchitectureViolationError: Always raised to prevent auth usage in FastAPI
    """
    _emit_deprecation_warning("require_auth")
    raise ArchitectureViolationError(
        "require_auth() is deprecated and removed. "
        "JWT authentication is not allowed in FastAPI per architecture rules. "
        "Auth must be handled by Supabase/Next.js (BFF pattern). "
        "Pass user_id in request body instead of using JWT tokens."
    )


def require_own_user(
    user_id: str,
    *args,
    **kwargs,
) -> str:
    """
    DEPRECATED: User ownership verification is no longer handled in FastAPI.

    This function now raises ArchitectureViolationError.

    Architecture Rule:
      FastAPI = Agents ONLY (stateless, no auth)
      Ownership checks must be handled by Supabase/Next.js or via RLS

    Instead:
      - Pass user_id in request body and trust Next.js validation
      - Use Supabase Row Level Security (RLS) for data access control

    Raises:
        ArchitectureViolationError: Always raised to prevent auth usage in FastAPI
    """
    _emit_deprecation_warning("require_own_user")
    raise ArchitectureViolationError(
        "require_own_user() is deprecated and removed. "
        "User ownership verification is not handled in FastAPI per architecture rules. "
        "Auth must be handled by Supabase/Next.js (BFF pattern). "
        "Pass user_id in request body and rely on Supabase RLS for access control."
    )


# Backward compatibility: keep exports but they now raise errors
__all__ = [
    "ArchitectureViolationError",
    "require_auth",
    "require_own_user",
]
