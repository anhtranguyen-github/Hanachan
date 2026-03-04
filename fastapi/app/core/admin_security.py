"""
Admin Security Layer — DEPRECATED / ARCHITECTURE VIOLATION

⚠️  ADMIN AUTHENTICATION HAS BEEN REMOVED FROM FASTAPI PER ARCHITECTURE RULES ⚠️

Architecture Rule:
  FastAPI = Agents ONLY (stateless, no auth)
  Admin auth must be handled by Supabase/Next.js (BFF pattern)

Why:
  - FastAPI must be stateless agents with no auth per architecture
  - Admin auth must be handled by Supabase/Next.js (BFF pattern)
  - Removes auth duplication between layers
  - Security: Auth in wrong layer bypasses RLS enforcement
  - Complexity: Duplicate auth logic in multiple layers
  - Maintenance: JWT validation in FastAPI requires secret management

What to do instead:
  - Admin endpoints should be called through Next.js BFF
  - Next.js validates admin permissions via Supabase
  - FastAPI receives pre-validated requests with user_id

Migration Path:
  - All admin endpoints should move to Next.js or be proxied through it
  - FastAPI admin functions remain for internal use but without auth checks
"""

from __future__ import annotations

import logging
import warnings
from datetime import datetime, timezone
from enum import Enum
from functools import wraps
from typing import Optional, Callable

from fastapi import HTTPException, Request

from app.core.database import get_db_pool

logger = logging.getLogger(__name__)


class ArchitectureViolationError(HTTPException):
    """
    Raised when code attempts to use admin authentication in FastAPI.

    This is an architecture violation - admin auth must be handled by Next.js/Supabase.
    """

    def __init__(self, detail: Optional[str] = None):
        message = detail or (
            "Architecture Violation: Admin authentication is not allowed in FastAPI. "
            "Admin auth must be handled by Supabase/Next.js (BFF pattern). "
            "Admin endpoints should be called through Next.js BFF. "
            "See documentation/01_ARCHITECTURE_OVERVIEW.md for details."
        )
        super().__init__(status_code=500, detail=message)


class AdminRole(str, Enum):
    """Admin role hierarchy from least to most privileged."""
    VIEWER = "viewer"
    MODERATOR = "moderator"
    ADMIN = "admin"
    SUPER_ADMIN = "super_admin"


class AdminPermission(str, Enum):
    """Specific admin permissions."""
    VIEW_USERS = "view_users"
    EDIT_USERS = "edit_users"
    SUSPEND_USERS = "suspend_users"
    VIEW_COSTS = "view_costs"
    MANAGE_COST_LIMITS = "manage_cost_limits"
    VIEW_AUDIT_LOGS = "view_audit_logs"
    VIEW_SYSTEM_HEALTH = "view_system_health"
    MANAGE_RATE_LIMITS = "manage_rate_limits"
    VIEW_AI_TRACES = "view_ai_traces"
    MANAGE_AI_CONFIG = "manage_ai_config"
    VIEW_ABUSE_ALERTS = "view_abuse_alerts"
    MANAGE_ABUSE_ALERTS = "manage_abuse_alerts"
    MANAGE_ADMINS = "manage_admins"


def _emit_deprecation_warning(func_name: str) -> None:
    """Emit a deprecation warning for auth functions."""
    warnings.warn(
        f"{func_name}() is deprecated. "
        "Admin authentication has been removed from FastAPI per architecture rules. "
        "Admin auth must be handled by Supabase/Next.js (BFF pattern).",
        DeprecationWarning,
        stacklevel=3,
    )
    logger.warning(
        "admin_auth_deprecation_warning",
        extra={"function": func_name, "violation": "Admin auth in FastAPI"},
    )


async def is_admin(user_id: str) -> bool:
    """Check if a user has any admin role."""
    pool = get_db_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            SELECT 1 FROM admin_roles
            WHERE user_id = $1 AND is_active = true
            AND (revoked_at IS NULL OR revoked_at > now())
            """,
            user_id,
        )
        return row is not None


async def get_admin_role(user_id: str) -> Optional[AdminRole]:
    """Get the admin role for a user."""
    pool = get_db_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            SELECT role FROM admin_roles
            WHERE user_id = $1 AND is_active = true
            AND (revoked_at IS NULL OR revoked_at > now())
            """,
            user_id,
        )
        if row:
            return AdminRole(row["role"])
        return None


async def has_permission(user_id: str, permission: AdminPermission) -> bool:
    """Check if an admin user has a specific permission."""
    role = await get_admin_role(user_id)
    if not role:
        return False

    # Check explicit permissions first
    pool = get_db_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            SELECT permissions FROM admin_roles
            WHERE user_id = $1 AND is_active = true
            """,
            user_id,
        )
        if row and row["permissions"]:
            explicit_perms = row["permissions"]
            if permission.value in explicit_perms:
                return True

    # Fall back to role-based permissions
    return permission in _get_default_role_permissions().get(role, [])


def _get_default_role_permissions() -> dict[AdminRole, list[AdminPermission]]:
    """Get default permissions per role."""
    return {
        AdminRole.VIEWER: [
            AdminPermission.VIEW_USERS,
            AdminPermission.VIEW_COSTS,
            AdminPermission.VIEW_AUDIT_LOGS,
            AdminPermission.VIEW_SYSTEM_HEALTH,
            AdminPermission.VIEW_AI_TRACES,
            AdminPermission.VIEW_ABUSE_ALERTS,
        ],
        AdminRole.MODERATOR: [
            AdminPermission.VIEW_USERS,
            AdminPermission.EDIT_USERS,
            AdminPermission.VIEW_COSTS,
            AdminPermission.VIEW_AUDIT_LOGS,
            AdminPermission.VIEW_SYSTEM_HEALTH,
            AdminPermission.VIEW_AI_TRACES,
            AdminPermission.VIEW_ABUSE_ALERTS,
            AdminPermission.MANAGE_ABUSE_ALERTS,
        ],
        AdminRole.ADMIN: [
            AdminPermission.VIEW_USERS,
            AdminPermission.EDIT_USERS,
            AdminPermission.SUSPEND_USERS,
            AdminPermission.VIEW_COSTS,
            AdminPermission.MANAGE_COST_LIMITS,
            AdminPermission.VIEW_AUDIT_LOGS,
            AdminPermission.VIEW_SYSTEM_HEALTH,
            AdminPermission.MANAGE_RATE_LIMITS,
            AdminPermission.VIEW_AI_TRACES,
            AdminPermission.MANAGE_AI_CONFIG,
            AdminPermission.VIEW_ABUSE_ALERTS,
            AdminPermission.MANAGE_ABUSE_ALERTS,
        ],
        AdminRole.SUPER_ADMIN: list(AdminPermission),  # All permissions
    }


async def check_suspension(user_id: str) -> Optional[dict]:
    """Check if a user is currently suspended. Returns suspension details if active."""
    pool = get_db_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            SELECT id, reason, suspended_until, suspension_type
            FROM user_suspensions
            WHERE user_id = $1 AND is_active = true
            AND (suspended_until IS NULL OR suspended_until > now())
            ORDER BY created_at DESC
            LIMIT 1
            """,
            user_id,
        )
        if row:
            return {
                "suspension_id": str(row["id"]),
                "reason": row["reason"],
                "suspended_until": row["suspended_until"],
                "type": row["suspension_type"],
            }
        return None


async def require_admin(*args, **kwargs) -> dict:
    """
    DEPRECATED: Admin authentication is no longer supported in FastAPI.

    This function now raises ArchitectureViolationError.

    Architecture Rule:
      FastAPI = Agents ONLY (stateless, no auth)
      Admin auth must be handled by Supabase/Next.js (BFF pattern)

    Instead:
      - Call admin endpoints through Next.js BFF
      - Next.js validates admin permissions via Supabase
      - FastAPI receives pre-validated requests

    Raises:
        ArchitectureViolationError: Always raised to prevent admin auth usage in FastAPI
    """
    _emit_deprecation_warning("require_admin")
    raise ArchitectureViolationError(
        "require_admin() is deprecated and removed. "
        "Admin authentication is not allowed in FastAPI per architecture rules. "
        "Admin auth must be handled by Supabase/Next.js (BFF pattern). "
        "Call admin endpoints through Next.js BFF which validates permissions."
    )


def require_permission(permission: AdminPermission):
    """
    DEPRECATED: Admin permission checking is no longer supported in FastAPI.

    This function now raises ArchitectureViolationError.

    Architecture Rule:
      FastAPI = Agents ONLY (stateless, no auth)
      Admin permissions must be handled by Supabase/Next.js (BFF pattern)

    Raises:
        ArchitectureViolationError: Always raised to prevent admin auth usage in FastAPI
    """
    _emit_deprecation_warning("require_permission")

    async def checker(*args, **kwargs) -> dict:
        raise ArchitectureViolationError(
            "require_permission() is deprecated and removed. "
            "Admin permission checking is not allowed in FastAPI per architecture rules. "
            "Admin auth must be handled by Supabase/Next.js (BFF pattern). "
            f"Permission '{permission.value}' should be checked by Next.js BFF."
        )

    return checker


async def log_admin_action(
    admin_user_id: str,
    action: str,
    target_type: str,
    target_id: Optional[str] = None,
    old_value: Optional[dict] = None,
    new_value: Optional[dict] = None,
    reason: Optional[str] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
) -> None:
    """Log an admin action to the audit log."""
    pool = get_db_pool()
    try:
        async with pool.acquire() as conn:
            await conn.execute(
                """
                INSERT INTO admin_audit_logs
                (admin_user_id, action, target_type, target_id, old_value, new_value, reason, ip_address, user_agent)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                """,
                admin_user_id,
                action,
                target_type,
                target_id,
                old_value,
                new_value,
                reason,
                ip_address,
                user_agent,
            )
        logger.info("admin_action_logged", extra={
            "admin_user_id": admin_user_id,
            "action": action,
            "target_type": target_type,
            "target_id": target_id,
        })
    except Exception as exc:
        logger.error("admin_audit_log_failed", extra={
            "error": str(exc),
            "admin_user_id": admin_user_id,
            "action": action,
        })
        # Don't raise - audit logging should not break operations


class AdminContext:
    """Context object for admin operations containing user info and audit trail."""

    def __init__(
        self,
        user_id: str,
        role: AdminRole,
        request: Optional[Request] = None,
    ):
        self.user_id = user_id
        self.role = role
        self.request = request
        self.action_logs: list[dict] = []

    async def has_permission(self, permission: AdminPermission) -> bool:
        """Check if this admin context has a specific permission."""
        # Service role has all permissions
        if self.role == AdminRole.SUPER_ADMIN:
            return True

        return permission in _get_default_role_permissions().get(self.role, [])

    async def log_action(
        self,
        action: str,
        target_type: str,
        target_id: Optional[str] = None,
        old_value: Optional[dict] = None,
        new_value: Optional[dict] = None,
        reason: Optional[str] = None,
    ) -> None:
        """Log an action within this context."""
        ip_address = None
        user_agent = None

        if self.request:
            # Get client IP, considering X-Forwarded-For
            forwarded_for = self.request.headers.get("x-forwarded-for")
            if forwarded_for:
                ip_address = forwarded_for.split(",")[0].strip()
            else:
                ip_address = self.request.client.host if self.request.client else None

            user_agent = self.request.headers.get("user-agent")

        await log_admin_action(
            admin_user_id=self.user_id,
            action=action,
            target_type=target_type,
            target_id=target_id,
            old_value=old_value,
            new_value=new_value,
            reason=reason,
            ip_address=ip_address,
            user_agent=user_agent,
        )

        self.action_logs.append({
            "action": action,
            "target_type": target_type,
            "target_id": target_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })


async def get_admin_context(*args, **kwargs) -> AdminContext:
    """
    DEPRECATED: Admin context creation is no longer supported in FastAPI.

    This function now raises ArchitectureViolationError.

    Raises:
        ArchitectureViolationError: Always raised to prevent admin auth usage in FastAPI
    """
    _emit_deprecation_warning("get_admin_context")
    raise ArchitectureViolationError(
        "get_admin_context() is deprecated and removed. "
        "Admin context management is not allowed in FastAPI per architecture rules. "
        "Admin auth must be handled by Supabase/Next.js (BFF pattern)."
    )


def admin_permission_required(permission: AdminPermission):
    """
    DEPRECATED: Admin permission decorator is no longer supported in FastAPI.

    This decorator now raises ArchitectureViolationError when the wrapped function is called.

    Raises:
        ArchitectureViolationError: Always raised to prevent admin auth usage in FastAPI
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs):
            _emit_deprecation_warning("admin_permission_required")
            raise ArchitectureViolationError(
                "admin_permission_required() is deprecated and removed. "
                "Admin permission checking is not allowed in FastAPI per architecture rules. "
                f"Permission '{permission.value}' should be checked by Next.js BFF."
            )
        return wrapper
    return decorator


# Backward compatibility: keep exports
__all__ = [
    "AdminRole",
    "AdminPermission",
    "AdminContext",
    "ArchitectureViolationError",
    "is_admin",
    "get_admin_role",
    "has_permission",
    "check_suspension",
    "require_admin",
    "require_permission",
    "log_admin_action",
    "get_admin_context",
    "admin_permission_required",
]
